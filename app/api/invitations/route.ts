import { NextResponse } from "next/server";
import { db, newEditToken, newSlug } from "@/lib/supabase";
import { isTemplate, sanitizeData } from "@/lib/validate";

const email = (v: unknown) => (typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? v.trim().slice(0, 200) : null);

/** Crée un brouillon d'invitation. Renvoie le slug public et le jeton secret d'édition. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !isTemplate(body.template)) return NextResponse.json({ error: "Template inconnu" }, { status: 400 });
  const row = { slug: newSlug(), edit_token: newEditToken(), template: body.template, data: sanitizeData(body.data), owner_email: email(body.email) };
  const { error } = await db().from("invitations").insert(row);
  if (error) return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  return NextResponse.json({ slug: row.slug, editToken: row.edit_token, status: "draft" });
}
