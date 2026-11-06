import "server-only";
import { after } from "next/server";
import type { Lang } from "./i18n";
import type { InvitationRow } from "./types";
import { db, siteUrl } from "./supabase";
import { publishedEmail, sendEmail } from "./email";
import { siteDict } from "./i18n/site";

/* Paiement Stripe Checkout, appelé directement par l'API REST (pas de SDK : le site reste léger sur Cloudflare).
   Prix unique par invitation, payé à la première publication ; modifications et republications gratuites ensuite. */

export const PRICE_CENTS = 990;
export const CURRENCY = "eur";

const clean = (v?: string) => v?.trim().replace(/^["']|["']$/g, "").trim() || "";
export const paymentsOn = () => clean(process.env.PAYMENTS_ENABLED) === "true";

/** Le paiement est-il exigé avant de publier cette invitation ? (déjà publiée avant le paiement = gratuite) */
export const needsPayment = (inv: Pick<InvitationRow, "paid_at" | "published_at">) => paymentsOn() && !inv.paid_at && !inv.published_at;

export function formatPrice(lang: Lang) {
  return new Intl.NumberFormat(lang === "en" ? "en-IE" : "fr-FR", { style: "currency", currency: CURRENCY }).format(PRICE_CENTS / 100);
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

type Session = { id: string; url: string | null; payment_status: string; amount_total: number | null; metadata: Record<string, string> | null };

/** Crée la page de paiement Stripe pour cette invitation et renvoie son adresse. */
export async function createCheckout(inv: InvitationRow, lang: Lang): Promise<string> {
  const p = siteDict(lang).pay;
  const base = siteUrl();
  const names = [inv.data.partner1, inv.data.partner2].filter(Boolean).join(" & ");
  const s = await stripe<Session>("checkout/sessions", {
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": CURRENCY,
    "line_items[0][price_data][unit_amount]": String(PRICE_CENTS),
    "line_items[0][price_data][product_data][name]": p.product(names),
    "line_items[0][price_data][product_data][description]": p.productDesc,
    ...(inv.owner_email ? { customer_email: inv.owner_email } : {}),
    client_reference_id: inv.id,
    "metadata[token]": inv.edit_token,
    "metadata[invitation_id]": inv.id,
    "payment_intent_data[description]": p.product(names),
    locale: lang,
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
  if (s.payment_status !== "paid" || !token) return null;
  const { data: inv } = await db().from("invitations").select("*").eq("edit_token", token).maybeSingle<InvitationRow>();
  if (!inv) return null;
  const now = new Date().toISOString();
  // Condition « paid_at is null » : une seule des deux arrivées (retour, webhook) fait la mise à jour et envoie l'e-mail.
  const { data: updated } = await db()
    .from("invitations")
    .update({ paid_at: now, paid_amount_cents: s.amount_total, stripe_session_id: s.id, status: "published", published_at: inv.published_at ?? now })
    .eq("id", inv.id)
    .is("paid_at", null)
    .select("id");
  if (updated?.length && !inv.published_at && inv.owner_email) {
    const to = inv.owner_email;
    after(() => sendEmail({ to, ...publishedEmail(inv.owner_lang, inv.data, inv.edit_token, inv.slug) }));
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
