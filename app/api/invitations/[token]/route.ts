import { getLang, getT } from "@/lib/i18n/server";
import { NextResponse, after } from "next/server";
import { db, getByToken } from "@/lib/supabase";
import { isTemplate, sanitizeData } from "@/lib/validate";
import { cleanEmail, sendEmail, welcomeEmail } from "@/lib/email";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const t = await getT();
  const inv = await getByToken((await params).token);
  if (!inv) return NextResponse.json({ error: t.api.notFound }, { status: 404 });
  return NextResponse.json({ slug: inv.slug, template: inv.template, data: inv.data, status: inv.status, email: inv.owner_email, paid: !!inv.paid_at });
}

export async function PUT(req: Request, { params }: Ctx) {
  const t = await getT();
  const lang = await getLang();
  const inv = await getByToken((await params).token);
  if (!inv) return NextResponse.json({ error: t.api.notFound }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body || !isTemplate(body.template)) return NextResponse.json({ error: t.api.unknownTemplate }, { status: 400 });
  const email = cleanEmail(body.email) ?? inv.owner_email;
  if (!email) return NextResponse.json({ error: t.api.emailRequired }, { status: 400 });
  const data = sanitizeData(body.data);
  const { error } = await db()
    .from("invitations")
    .update({ template: body.template, data, owner_email: email, owner_lang: lang, updated_at: new Date().toISOString() })
    .eq("id", inv.id);
  if (error) return NextResponse.json({ error: t.api.saveFail }, { status: 500 });
  // Adresse ajoutée ou changée : on y envoie le lien de l'espace.
  if (email && email !== inv.owner_email?.toLowerCase()) after(() => sendEmail({ to: email, ...welcomeEmail(lang, data, inv.edit_token) }));
  return NextResponse.json({ slug: inv.slug, status: inv.status });
}
