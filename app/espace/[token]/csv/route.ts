import { db, getByToken } from "@/lib/supabase";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const inv = await getByToken((await params).token);
  if (!inv) return new Response("Introuvable", { status: 404 });
  const { data } = await db().from("rsvps").select("name,attending,guests,message,created_at").eq("invitation_id", inv.id).order("created_at");
  const rows = [["Nom", "Présent", "Personnes", "Message", "Date"], ...(data ?? []).map((r) => [r.name, r.attending ? "oui" : "non", r.guests, r.message, r.created_at])];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="reponses-${inv.slug}.csv"` } });
}
