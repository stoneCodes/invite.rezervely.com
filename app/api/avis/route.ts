import { NextResponse } from "next/server";
import { db, getByToken } from "@/lib/supabase";
import { cleanEmail, newReviewEmail, sendEmail } from "@/lib/email";
import { cleanBody, cleanName, cleanRating, REVIEW_LIMITS, reviewOf } from "@/lib/reviews";
import { kindOf } from "@/lib/aftercare";
import { getLang } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** Avis d'un client : un par invitation publiée, enregistré « à valider », puis alerte e-mail aux administrateurs. */
export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "bad" }, { status: 400 }); }
  if (b.website) return NextResponse.json({ ok: true }); // piège à robots
  const inv = typeof b.token === "string" ? await getByToken(b.token) : null;
  if (!inv || inv.status !== "published") return NextResponse.json({ error: "notfound" }, { status: 404 });
  const rating = cleanRating(b.rating), body = cleanBody(b.body), name = cleanName(b.name);
  if (!rating) return NextResponse.json({ error: "rating" }, { status: 400 });
  if (body.length < REVIEW_LIMITS.body.min) return NextResponse.json({ error: "body" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "name" }, { status: 400 });
  if (b.consent !== true) return NextResponse.json({ error: "consent" }, { status: 400 });
  if (await reviewOf(inv.id)) return NextResponse.json({ error: "already" }, { status: 409 });

  const kind = kindOf(inv.template);
  const date = new Date(inv.data.dateISO);
  const row = {
    invitation_id: inv.id, rating, body, display_name: name, kind,
    event_date: isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10),
    lang: await getLang(),
  };
  const { error } = await db().from("reviews").insert(row);
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "already" }, { status: 409 });
    console.error("reviews.insert", error.message);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((x) => cleanEmail(x)).filter(Boolean) as string[];
  const mail = newReviewEmail({ rating, display_name: name, body, kind });
  await Promise.all(admins.map((to) => sendEmail({ to, ...mail })));
  return NextResponse.json({ ok: true });
}
