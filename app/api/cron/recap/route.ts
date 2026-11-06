import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { recapEmail, sendEmail, type RecapLine } from "@/lib/email";
import type { InvitationData } from "@/lib/types";
import type { Lang } from "@/lib/i18n";

/* Récapitulatif quotidien des nouvelles réponses, un e-mail par couple (pas un par invité : quotas gratuits).
   Appelé une fois par jour par Vercel (vercel.json > crons), avec l'en-tête Authorization: Bearer <CRON_SECRET>. */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Row = RecapLine & { id: string; invitation_id: string; invitations: { edit_token: string; owner_email: string; owner_lang: Lang | null; data: InvitationData } };

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "CRON_SECRET manquant" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await db()
    .from("rsvps")
    .select("id, invitation_id, name, attending, guests, message, created_at, invitations!inner(edit_token, owner_email, owner_lang, data)")
    .is("notified_at", null)
    .not("invitations.owner_email", "is", null)
    .order("created_at", { ascending: true })
    .limit(3000);
  if (error) { console.error("recap.select", error.message); return NextResponse.json({ error: error.message }, { status: 500 }); }

  const byInvite = new Map<string, Row[]>();
  for (const r of (data ?? []) as unknown as Row[]) byInvite.set(r.invitation_id, [...(byInvite.get(r.invitation_id) ?? []), r]);

  let sent = 0, failed = 0;
  for (const [invitationId, rows] of byInvite) {
    const inv = rows[0].invitations;
    // Totaux depuis le début (toutes les réponses, pas seulement les nouvelles).
    const { data: all } = await db().from("rsvps").select("attending, guests").eq("invitation_id", invitationId);
    const totals = { yes: (all ?? []).filter((r) => r.attending).reduce((n, r) => n + r.guests, 0), no: (all ?? []).filter((r) => !r.attending).length };
    const res = await sendEmail({ to: inv.owner_email, ...recapEmail(inv.owner_lang, inv.data, inv.edit_token, rows, totals) });
    if (!res.ok) { failed++; continue; } // réessayé au prochain passage
    await db().from("rsvps").update({ notified_at: new Date().toISOString() }).in("id", rows.map((r) => r.id));
    sent++;
  }
  return NextResponse.json({ couples: byInvite.size, sent, failed });
}
