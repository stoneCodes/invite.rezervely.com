import { db, getByToken } from "@/lib/supabase";

// Une apostrophe devant = + - @ empêche Excel d'exécuter une formule tapée par un invité (injection CSV).
const cell = (v: unknown) => {
  const s = String(v ?? "");
  return `"${(/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replace(/"/g, '""')}"`;
};
const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const inv = await getByToken((await params).token);
  if (!inv) return new Response("Introuvable", { status: 404 });
  const { data } = await db().from("rsvps").select("name,attending,guests,message,created_at").eq("invitation_id", inv.id).order("created_at");
  const rows = [["Nom", "Présent", "Personnes", "Message", "Date"], ...(data ?? []).map((r) => [r.name, r.attending ? "oui" : "non", r.guests, r.message, fmt.format(new Date(r.created_at))])];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="reponses-${inv.slug}.csv"` } });
}
