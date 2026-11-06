import { getT } from "@/lib/i18n/server";
import { NextResponse, after } from "next/server";
import { publishedEmail, sendEmail } from "@/lib/email";
import { db, getByToken, siteUrl } from "@/lib/supabase";

/** Publie l'invitation. Quand PAYMENTS_ENABLED=true, cette route devra d'abord vérifier le paiement Stripe. */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const t = await getT();
  const inv = await getByToken((await params).token);
  if (!inv) return NextResponse.json({ error: t.api.notFound }, { status: 404 });
  if (process.env.PAYMENTS_ENABLED === "true") {
    // TODO Stripe : créer une session Checkout et ne publier qu'après le webhook checkout.session.completed.
    return NextResponse.json({ error: t.api.payment }, { status: 402 });
  }
  const { error } = await db().from("invitations").update({ status: "published", published_at: inv.published_at ?? new Date().toISOString() }).eq("id", inv.id);
  if (error) return NextResponse.json({ error: t.api.publishFail }, { status: 500 });
  // Première publication seulement (pas à chaque mise à jour).
  if (!inv.published_at && inv.owner_email) { const to = inv.owner_email; after(() => sendEmail({ to, ...publishedEmail(inv.owner_lang, inv.data, inv.edit_token, inv.slug) })); }
  return NextResponse.json({ status: "published", url: `${siteUrl()}/i/${inv.slug}` });
}
