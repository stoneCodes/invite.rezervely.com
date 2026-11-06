import { getLang, getT } from "@/lib/i18n/server";
import { NextResponse, after } from "next/server";
import { db, newEditToken, newSlug } from "@/lib/supabase";
import { isTemplate, sanitizeData } from "@/lib/validate";
import { cleanEmail, sendEmail, welcomeEmail } from "@/lib/email";

/** Crée un brouillon d'invitation. Renvoie le slug public et le jeton secret d'édition. */
export async function POST(req: Request) {
  const t = await getT();
  const lang = await getLang();
  const body = await req.json().catch(() => null);
  if (!body || !isTemplate(body.template)) return NextResponse.json({ error: t.api.unknownTemplate }, { status: 400 });
  const data = sanitizeData(body.data);
  const row = { slug: newSlug(), edit_token: newEditToken(), template: body.template, data, owner_email: cleanEmail(body.email), owner_lang: lang };
  const { error } = await db().from("invitations").insert(row);
  if (error) { console.error("invitations.insert", error.code, error.message); return NextResponse.json({ error: t.api.saveFail }, { status: 500 }); }
  // L'e-mail part après la réponse : l'enregistrement n'attend pas Brevo.
  if (row.owner_email) { const to = row.owner_email; after(() => sendEmail({ to, ...welcomeEmail(lang, data, row.edit_token) })); }
  return NextResponse.json({ slug: row.slug, editToken: row.edit_token, status: "draft" });
}
