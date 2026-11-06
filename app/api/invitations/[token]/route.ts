import { getT } from "@/lib/i18n/server";
import { NextResponse } from "next/server";
import { db, getByToken } from "@/lib/supabase";
import { isTemplate, sanitizeData } from "@/lib/validate";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const t = await getT();
  const inv = await getByToken((await params).token);
  if (!inv) return NextResponse.json({ error: t.api.notFound }, { status: 404 });
  return NextResponse.json({ slug: inv.slug, template: inv.template, data: inv.data, status: inv.status, email: inv.owner_email });
}

export async function PUT(req: Request, { params }: Ctx) {
  const t = await getT();
  const inv = await getByToken((await params).token);
  if (!inv) return NextResponse.json({ error: t.api.notFound }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body || !isTemplate(body.template)) return NextResponse.json({ error: t.api.unknownTemplate }, { status: 400 });
  const email = typeof body.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ? body.email.trim().slice(0, 200) : inv.owner_email;
  const { error } = await db()
    .from("invitations")
    .update({ template: body.template, data: sanitizeData(body.data), owner_email: email, updated_at: new Date().toISOString() })
    .eq("id", inv.id);
  if (error) return NextResponse.json({ error: t.api.saveFail }, { status: 500 });
  return NextResponse.json({ slug: inv.slug, status: inv.status });
}
