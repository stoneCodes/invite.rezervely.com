import "server-only";
import { after } from "next/server";
import type { Lang } from "./i18n";
import type { InvitationRow } from "./types";
import { db, siteUrl } from "./supabase";
import { updateOnPublish } from "./publish";
import { publishedEmail, sendEmail } from "./email";
import { siteDict } from "./i18n/site";
import { getAdminSetting } from "./admin/settings";
import { DEFAULT_PRICES, money, packAvailable, readPrices, singlePrice, type Plan, type Prices } from "./prices";
import { formatOf } from "./types";

/* Paiement Stripe Checkout, appelé directement par l'API REST (pas de SDK : le site reste léger sur Cloudflare).
   Payé à la première publication ; modifications et republications gratuites ensuite.
   Formules (lib/prices.ts) : save the date seul, invitation seule, ou pack save the date + invitation :
   le pack est payé sur le 1er article publié (plan = "pack"), le 2e (pack_from) se publie ensuite sans payer. */

export const CURRENCY = "eur";

const clean = (v?: string) => v?.trim().replace(/^["']|["']$/g, "").trim() || "";
export async function paymentsOn(): Promise<boolean> {
  const saved = await getAdminSetting<unknown>("payments_enabled");
  return typeof saved === "boolean" ? saved : clean(process.env.PAYMENTS_ENABLED) === "true";
}

/** Prix des trois formules en centimes, réglables depuis l'administration (settings.prices). */
export async function getPrices(): Promise<Prices> {
  return readPrices(await getAdminSetting<unknown>("prices"));
}

/** 2e article d'un pack : l'article qui a payé le pack existe, a bien été payé en pack, et il est de l'autre format. */
export async function packCovers(inv: Pick<InvitationRow, "template"> & { pack_from?: string | null }): Promise<boolean> {
  if (!inv.pack_from) return false;
  const { data } = await db().from("invitations").select("template, plan, paid_at").eq("id", inv.pack_from).maybeSingle<{ template: string; plan: string | null; paid_at: string | null }>();
  return !!data && data.plan === "pack" && !!data.paid_at && formatOf(data.template) !== formatOf(inv.template);
}

/** Le paiement est-il exigé avant de publier cette invitation ? (déjà publiée avant le paiement, ou couverte par un pack = gratuite) */
export async function needsPayment(inv: Pick<InvitationRow, "paid_at" | "published_at" | "template"> & { pack_from?: string | null }) {
  return await paymentsOn() && !inv.paid_at && !inv.published_at && !(await packCovers(inv));
}

/** Liste des invités en PDF : payée, offerte, accordée depuis l'admin, ou publiée tant que les paiements sont désactivés
   (la publication est alors gratuite, le PDF ne doit pas rester verrouillé). */
export async function pdfAllowed(inv: Pick<InvitationRow, "paid_at" | "status"> & { comped_at?: string | null; pdf_granted_at?: string | null }) {
  if (inv.paid_at || inv.comped_at || inv.pdf_granted_at) return true;
  return inv.status === "published" && !(await paymentsOn());
}

export function formatPrice(lang: Lang, cents = DEFAULT_PRICES.invitation) {
  return money(lang, cents);
}

/** Appel de l'API Stripe (formulaire encodé, comme l'attend Stripe). */
async function stripe<T>(path: string, params?: Record<string, string>, method = params ? "POST" : "GET"): Promise<T> {
  const key = clean(process.env.STRIPE_SECRET_KEY);
  if (!key) throw new Error("STRIPE_SECRET_KEY manquante");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { authorization: `Bearer ${key}`, ...(params ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
    body: params ? new URLSearchParams(params).toString() : undefined,
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${j?.error?.message ?? "erreur"}`);
  return j as T;
}

type Session = { id: string; url: string | null; status?: string; payment_status: string; amount_total: number | null; metadata: Record<string, string> | null };

export type PromotionCode = {
  id: string; code: string; active: boolean; times_redeemed: number; max_redemptions: number | null; expires_at: number | null;
  coupon: { id: string; name: string | null; percent_off: number | null; amount_off: number | null; currency: string | null; valid: boolean; times_redeemed: number; max_redemptions: number | null; redeem_by: number | null };
};
type StripeList<T> = { data: T[]; has_more: boolean };

export const stripeKeyStatus = () => {
  const key = clean(process.env.STRIPE_SECRET_KEY);
  return { configured: !!key, mode: key.startsWith("sk_test_") ? "test" : key.startsWith("sk_live_") ? "live" : key ? "unknown" : "missing" } as const;
};

export async function listPromotionCodes(): Promise<PromotionCode[]> {
  const page = await stripe<StripeList<PromotionCode>>("promotion_codes?limit=100&expand[]=data.coupon");
  return page.data;
}

export async function createPromotionCode(input: {
  code: string; kind: "percent" | "amount"; value: number; expiresAt?: number; maxRedemptions?: number;
}): Promise<PromotionCode> {
  const coupon = await stripe<{ id: string }>("coupons", {
    duration: "once",
    name: input.code,
    ...(input.kind === "percent" ? { percent_off: String(input.value) } : { amount_off: String(input.value), currency: CURRENCY }),
    ...(input.expiresAt ? { redeem_by: String(input.expiresAt) } : {}),
    ...(input.maxRedemptions ? { max_redemptions: String(input.maxRedemptions) } : {}),
  });
  return stripe<PromotionCode>("promotion_codes", {
    coupon: coupon.id,
    code: input.code,
    ...(input.expiresAt ? { expires_at: String(input.expiresAt) } : {}),
    ...(input.maxRedemptions ? { max_redemptions: String(input.maxRedemptions) } : {}),
  });
}

/** Crée la page de paiement Stripe pour cette invitation et renvoie son adresse. */
export async function createCheckout(inv: InvitationRow, lang: Lang, wanted: Plan = "single"): Promise<string> {
  const p = siteDict(lang).pay;
  const base = siteUrl();
  const prices = await getPrices();
  const plan: Plan = wanted === "pack" && packAvailable(inv.template) ? "pack" : "single";
  const priceCents = plan === "pack" ? prices.pack : singlePrice(prices, inv.template);
  const names = [inv.data.partner1, inv.data.partner2].filter(Boolean).join(" & ");
  const product = plan === "pack" ? p.productPack(names) : formatOf(inv.template) === "std" ? p.productStd(names) : p.product(names);
  const s = await stripe<Session>("checkout/sessions", {
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": CURRENCY,
    "line_items[0][price_data][unit_amount]": String(priceCents),
    "line_items[0][price_data][product_data][name]": product,
    "line_items[0][price_data][product_data][description]": plan === "pack" ? p.productPackDesc : p.productDesc,
    ...(inv.owner_email ? { customer_email: inv.owner_email } : {}),
    client_reference_id: inv.id,
    "metadata[token]": inv.edit_token,
    "metadata[invitation_id]": inv.id,
    "metadata[plan]": plan,
    // Preuve de l'acceptation des CGV et de la renonciation au droit de rétractation (case cochée dans l'éditeur).
    "metadata[terms_accepted_at]": new Date().toISOString(),
    "payment_intent_data[description]": product,
    locale: lang,
    allow_promotion_codes: "true",
    success_url: `${base}/api/stripe/retour?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/creer?edit=${inv.edit_token}&paiement=annule`,
  });
  if (!s.url) throw new Error("Stripe : pas d'adresse de paiement");
  return s.url;
}

export const getSession = (id: string) => stripe<Session>(`checkout/sessions/${encodeURIComponent(id)}`);

/** Session payée → invitation marquée payée et publiée (sans effet si c'est déjà fait : retour + webhook peuvent arriver tous les deux). */
export async function applyPaidSession(s: Session): Promise<{ token: string } | null> {
  const token = s.metadata?.token;
  // Code promo à 100 % : Stripe termine la session sans paiement (« no_payment_required ») ; elle doit quand même publier.
  const settled = s.payment_status === "paid" || (s.payment_status === "no_payment_required" && s.status === "complete");
  if (!settled || !token) return null;
  const { data: inv } = await db().from("invitations").select("*").eq("edit_token", token).maybeSingle<InvitationRow>();
  if (!inv) return null;
  const now = new Date().toISOString();
  // Condition « paid_at is null » : une seule des deux arrivées (retour, webhook) fait la mise à jour et envoie l'e-mail.
  // Publication + lien lisible définitif, une seule fois même si le retour et le webhook arrivent ensemble.
  const { slug, updated } = await updateOnPublish(
    inv,
    { paid_at: now, paid_amount_cents: s.amount_total, stripe_session_id: s.id, status: "published", published_at: inv.published_at ?? now, ...(s.metadata?.plan === "pack" ? { plan: "pack" } : {}) },
    { onlyIfUnpaid: true },
  );
  if (updated && !inv.published_at && inv.owner_email) {
    const to = inv.owner_email;
    after(() => sendEmail({ to, ...publishedEmail(inv.owner_lang, inv.data, inv.edit_token, slug) }));
  }
  return { token };
}

/** Vérifie la signature d'un webhook Stripe (en-tête Stripe-Signature, HMAC SHA-256, 5 min de tolérance). */
export async function verifyWebhook(raw: string, header: string | null): Promise<boolean> {
  const secret = clean(process.env.STRIPE_WEBHOOK_SECRET);
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]).filter((kv) => kv.length === 2 && kv[0] === "t"));
  const t = parts.t;
  const sigs = header.split(",").filter((kv) => kv.startsWith("v1=")).map((kv) => kv.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`${t}.${raw}`)));
  const hex = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => s.length === hex.length && timingSafeEqual(s, hex));
}

function timingSafeEqual(a: string, b: string) {
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
