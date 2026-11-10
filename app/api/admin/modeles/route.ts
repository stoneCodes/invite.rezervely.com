import { NextResponse } from "next/server";
import { requireAdmin, originAllowed } from "@/lib/admin/auth";
import { recordAdminEvent, updateAdminEvent } from "@/lib/admin/audit";
import { setAdminSetting } from "@/lib/admin/settings";
import { sortTemplateIds, TEMPLATE_ORDER_KEY } from "@/lib/templateOrder";
import { TEMPLATE_IDS } from "@/lib/types";
import adminFr from "@/lib/i18n/admin-fr";

export const dynamic = "force-dynamic";

/** Enregistre l'ordre des modèles de la galerie (accueil + éditeur). Liste complète des identifiants, sans doublon. */
export async function POST(req: Request) {
  const actor = await requireAdmin();
  if (!actor || !originAllowed(req)) return new NextResponse(null, { status: 404 });
  let body: { order?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: adminFr.formError }, { status: 400 }); }
  const raw = body.order;
  if (!Array.isArray(raw) || raw.length !== TEMPLATE_IDS.length) return NextResponse.json({ error: adminFr.formError }, { status: 400 });
  const order = sortTemplateIds(raw);
  if (order.some((id, i) => id !== raw[i])) return NextResponse.json({ error: adminFr.formError }, { status: 400 });
  const eventId = await recordAdminEvent({ actor, action: adminFr.templateOrderAction, details: { stage: "started", order } });
  try {
    await setAdminSetting(TEMPLATE_ORDER_KEY, order);
    await updateAdminEvent(eventId, { stage: "completed", order });
  } catch (error) {
    await updateAdminEvent(eventId, { stage: "failed", order });
    console.error("admin.templates.order", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: adminFr.actionFailed }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
