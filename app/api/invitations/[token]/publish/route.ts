import { NextResponse } from "next/server";
import { db, getByToken, siteUrl } from "@/lib/supabase";

/** Publie l'invitation. Quand PAYMENTS_ENABLED=true, cette route devra d'abord vérifier le paiement Stripe. */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const inv = await getByToken((await params).token);
  if (!inv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (process.env.PAYMENTS_ENABLED === "true") {
    // TODO Stripe : créer une session Checkout et ne publier qu'après le webhook checkout.session.completed.
    return NextResponse.json({ error: "Le paiement n'est pas encore branché." }, { status: 402 });
  }
  const { error } = await db().from("invitations").update({ status: "published", published_at: inv.published_at ?? new Date().toISOString() }).eq("id", inv.id);
  if (error) return NextResponse.json({ error: "Publication impossible" }, { status: 500 });
  return NextResponse.json({ status: "published", url: `${siteUrl()}/i/${inv.slug}` });
}
