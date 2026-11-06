import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getLang } from "@/lib/i18n/server";
import { cleanEmail, linksEmail, sendEmail } from "@/lib/email";
import type { InvitationData } from "@/lib/types";

/* « Retrouver mon espace » : renvoie par e-mail les liens des invitations créées avec cette adresse.
   Répond toujours pareil, que l'adresse soit connue ou non (on ne révèle pas qui a un compte). */

const recent = new Map<string, number>(); // anti-rafale simple : 1 envoi par adresse toutes les 2 minutes (par instance)

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = cleanEmail(body?.email);
  if (!email) return NextResponse.json({ error: "email" }, { status: 400 });
  if (typeof body?.website === "string" && body.website) return NextResponse.json({ ok: true }); // piège à robots
  const now = Date.now();
  if ((recent.get(email) ?? 0) > now - 120_000) return NextResponse.json({ ok: true });
  recent.set(email, now);

  const { data } = await db()
    .from("invitations")
    .select("edit_token, data")
    .ilike("owner_email", email.replace(/[%_\\]/g, "\\$&"))
    .order("created_at", { ascending: false })
    .limit(20);
  const invites = (data ?? []).map((r) => ({ token: r.edit_token as string, ...(r.data as InvitationData) }));
  if (invites.length) await sendEmail({ to: email, ...linksEmail(await getLang(), invites) });
  return NextResponse.json({ ok: true });
}
