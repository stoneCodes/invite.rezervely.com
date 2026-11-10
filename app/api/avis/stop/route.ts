import { NextResponse } from "next/server";
import { db, getByToken } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Désabonnement des e-mails de suivi (demande d'avis, relance « nouvel événement »). POST seulement : les robots
    qui ouvrent les liens des e-mails ne désabonnent personne. */
export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "bad" }, { status: 400 }); }
  const inv = typeof b.token === "string" ? await getByToken(b.token) : null;
  if (!inv) return NextResponse.json({ error: "notfound" }, { status: 404 });
  // Toutes les invitations de la même adresse : la personne ne veut plus de ces e-mails, quelle que soit l'invitation.
  const q = db().from("invitations").update({ marketing_optout: true });
  const { error } = inv.owner_email ? await q.eq("owner_email", inv.owner_email) : await q.eq("id", inv.id);
  if (error) { console.error("aftercare.stop", error.message); return NextResponse.json({ error: "fail" }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
