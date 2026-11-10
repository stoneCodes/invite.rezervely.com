import { NextResponse } from "next/server";
import { requireAdmin, originAllowed } from "@/lib/admin/auth";
import { recordAdminEvent, updateAdminEvent } from "@/lib/admin/audit";
import { setAdminSetting } from "@/lib/admin/settings";
import { AFTERCARE_KEY, cleanAftercare } from "@/lib/aftercare";
import { db } from "@/lib/supabase";
import adminFr from "@/lib/i18n/admin-fr";

export const dynamic = "force-dynamic";

const STATUS: Record<string, "pending" | "published" | "rejected"> = { publish: "published", reject: "rejected", pending: "pending" };

/** Avis et e-mails après l'événement : réglages (action « settings »), publication, refus, suppression d'un avis. */
export async function POST(req: Request) {
  const actor = await requireAdmin();
  if (!actor || !originAllowed(req)) return new NextResponse(null, { status: 404 });
  let b: { action?: unknown; id?: unknown; settings?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ error: adminFr.formError }, { status: 400 }); }
  const action = typeof b.action === "string" ? b.action : "";

  if (action === "settings") {
    const value = cleanAftercare(b.settings);
    const eventId = await recordAdminEvent({ actor, action: adminFr.aftercareAction, details: { stage: "started", value } }).catch(() => null);
    try {
      await setAdminSetting(AFTERCARE_KEY, value);
      if (eventId) await updateAdminEvent(eventId, { stage: "completed", value });
      return NextResponse.json({ ok: true, settings: value });
    } catch (error) {
      console.error("admin.aftercare", (error as { message?: string })?.message ?? error);
      return NextResponse.json({ error: adminFr.actionFailed }, { status: 500 });
    }
  }

  const id = typeof b.id === "string" && /^[0-9a-f-]{36}$/i.test(b.id) ? b.id : null;
  if (!id || !(action in STATUS || action === "delete")) return NextResponse.json({ error: adminFr.formError }, { status: 400 });
  const { data: before } = await db().from("reviews").select("invitation_id, display_name, rating, status").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: adminFr.actionFailed }, { status: 404 });
  const details = { review: id, name: before.display_name, rating: before.rating, from: before.status, to: action === "delete" ? "deleted" : STATUS[action] };
  const eventId = await recordAdminEvent({ actor, action: adminFr.reviewAction, invitationId: before.invitation_id, details: { stage: "started", ...details } }).catch(() => null);
  const { error } = action === "delete"
    ? await db().from("reviews").delete().eq("id", id)
    : await db().from("reviews").update({ status: STATUS[action], published_at: action === "publish" ? new Date().toISOString() : null }).eq("id", id);
  if (error) {
    if (eventId) await updateAdminEvent(eventId, { stage: "failed", ...details }).catch(() => {});
    console.error("admin.reviews", error.message);
    return NextResponse.json({ error: adminFr.actionFailed }, { status: 500 });
  }
  if (eventId) await updateAdminEvent(eventId, { stage: "completed", ...details }).catch(() => {});
  return NextResponse.json({ ok: true });
}
