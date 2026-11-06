import { getLang, getT } from "@/lib/i18n/server";
import { NextResponse, after } from "next/server";
import { publishedEmail, sendEmail } from "@/lib/email";
import { createCheckout, needsPayment } from "@/lib/payment";
import { getByToken, siteUrl } from "@/lib/supabase";
import { updateOnPublish } from "@/lib/publish";
import { invitePath } from "@/lib/slug";

/** Publie l'invitation. Paiement activé et pas encore payée : renvoie l'adresse de paiement Stripe ; la publication se fait au retour du paiement. */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const t = await getT();
  const inv = await getByToken((await params).token);
  if (!inv) return NextResponse.json({ error: t.api.notFound }, { status: 404 });
  if (!inv.owner_email) return NextResponse.json({ error: t.api.emailRequired }, { status: 400 });
  if (needsPayment(inv)) {
    try {
      return NextResponse.json({ checkoutUrl: await createCheckout(inv, await getLang()) });
    } catch (e) {
      console.error("stripe.checkout", e instanceof Error ? e.message : e);
      return NextResponse.json({ error: t.pay.unavailable }, { status: 502 });
    }
  }
  // Première publication : l'invitation reçoit son lien lisible définitif (lea-et-samuel-k7m2).
  const { slug, error } = await updateOnPublish(inv, { status: "published", published_at: inv.published_at ?? new Date().toISOString() });
  if (error) return NextResponse.json({ error: t.api.publishFail }, { status: 500 });
  // Première publication seulement (pas à chaque mise à jour).
  if (!inv.published_at && inv.owner_email) { const to = inv.owner_email; after(() => sendEmail({ to, ...publishedEmail(inv.owner_lang, inv.data, inv.edit_token, slug) })); }
  return NextResponse.json({ status: "published", slug, url: `${siteUrl()}${invitePath(slug)}` });
}
