import { NextResponse } from "next/server";
import { db, getBySlug } from "@/lib/supabase";
import { activeMeal, checkChoices, MEAL_MAX } from "@/lib/meal";

/** Enregistre la réponse d'un invité (uniquement pour une invitation publiée). */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b.slug !== "string" || typeof b.name !== "string" || !b.name.trim()) return NextResponse.json({ error: "Réponse incomplète" }, { status: 400 });
  const inv = await getBySlug(b.slug);
  if (!inv || inv.status !== "published") return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  const attending = b.attending === true;
  const guests = attending ? Math.min(20, Math.max(1, parseInt(b.guests, 10) || 1)) : 0;
  // Choix du repas : seulement pour une personne présente, et seulement parmi les choix proposés.
  const meal = attending ? activeMeal(inv.data) : null;
  const choices = meal ? checkChoices(meal, b.choices, guests) : null;
  if (meal && !choices) return NextResponse.json({ error: "Choix du repas manquant" }, { status: 400 });
  const remarks = meal?.remarks && typeof b.remarks === "string" ? b.remarks.trim().slice(0, MEAL_MAX.remarks) || null : null;
  const { error } = await db().from("rsvps").insert({
    invitation_id: inv.id,
    name: b.name.trim().slice(0, 120),
    attending,
    guests,
    message: typeof b.message === "string" ? b.message.trim().slice(0, 1000) : null,
    ...(choices ? { choices } : {}),
    ...(remarks ? { remarks } : {}),
  });
  if (error) return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
