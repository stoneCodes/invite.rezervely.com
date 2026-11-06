import { db, getByToken } from "@/lib/supabase";
import { getLang } from "@/lib/i18n/server";
import { siteDict } from "@/lib/i18n/site";
import { LOCALE } from "@/lib/i18n";

// Une apostrophe devant = + - @ empêche Excel d'exécuter une formule tapée par un invité (injection CSV).
const cell = (v: unknown) => {
  const s = String(v ?? "");
  return `"${(/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replace(/"/g, '""')}"`;
};

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const inv = await getByToken((await params).token);
  const lang = await getLang();
  const t = siteDict(lang);
  const fmt = new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });
  if (!inv) return new Response(t.api.notFound, { status: 404 });
  const { data } = await db().from("rsvps").select("name,attending,guests,message,created_at").eq("invitation_id", inv.id).order("created_at");
  const rows = [t.space.csvCols, ...(data ?? []).map((r) => [r.name, r.attending ? t.space.csvYes : t.space.csvNo, r.guests, r.message, fmt.format(new Date(r.created_at))])];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${t.space.csvFile}-${inv.slug}.csv"` } });
}
