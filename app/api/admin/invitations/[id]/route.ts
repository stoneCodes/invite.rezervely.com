import { NextResponse } from "next/server";
import { requireAdmin, originAllowed } from "@/lib/admin/auth";
import { recordAdminEvent, updateAdminEvent } from "@/lib/admin/audit";
import { db } from "@/lib/supabase";
import { updateOnPublish } from "@/lib/publish";
import { publishedEmail, sendEmail, welcomeEmail } from "@/lib/email";
import type { InvitationRow } from "@/lib/types";
import adminFr from "@/lib/i18n/admin-fr";

export const dynamic = "force-dynamic";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Context = { params: Promise<{ id: string }> };
type AdminInvitation = InvitationRow & { comped_at?: string | null; keep_until?: string | null; pdf_granted_at?: string | null };
type ActionBody = { action?: unknown; date?: unknown; confirmation?: unknown };
const jsonError = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function POST(req: Request, { params }: Context) {
  const actor = await requireAdmin();
  if (!actor) return jsonError(adminFr.notFound, 404);
  if (!originAllowed(req)) return jsonError(adminFr.notFound, 404);
  const { id } = await params;
  if (!uuid.test(id)) return jsonError(adminFr.notFound, 404);
  let body: ActionBody;
  try { body = await req.json(); } catch { return jsonError(adminFr.invalidAction, 400); }
  const { data: invitation, error: loadError } = await db().from("invitations").select("*").eq("id", id).maybeSingle<AdminInvitation>();
  if (loadError) { console.error("admin.invitation.load", loadError.message); return jsonError(adminFr.actionFailed, 500); }
  if (!invitation) return jsonError(adminFr.notFound, 404);

  try {
    if (body.action === "offer") {
      if (invitation.paid_at) return jsonError(adminFr.invalidAction, 409);
      const now = new Date().toISOString();
      const result = await updateOnPublish(invitation, { status: "published", published_at: invitation.published_at ?? now, comped_at: now, updated_at: now }, { onlyIfUnpaid: true });
      if (result.error) return jsonError(adminFr.actionFailed, 500);
      if (!result.updated) return jsonError(adminFr.invalidAction, 409);
      const mail = invitation.owner_email ? await sendEmail({ to: invitation.owner_email, ...publishedEmail(invitation.owner_lang, invitation.data, invitation.edit_token, result.slug) }) : null;
      await recordAdminEvent({ actor, action: adminFr.offerAction, invitationId: id, details: { slug: result.slug, emailSent: !!mail?.ok } });
      return NextResponse.json({ ok: true, emailSent: !!mail?.ok });
    }

    if (body.action === "resend") {
      if (!invitation.owner_email) return jsonError(adminFr.missingEmail, 400);
      const mail = await sendEmail({ to: invitation.owner_email, ...welcomeEmail(invitation.owner_lang, invitation.data, invitation.edit_token) });
      await recordAdminEvent({ actor, action: adminFr.resendAction, invitationId: id, details: { emailSent: mail.ok } });
      return mail.ok ? NextResponse.json({ ok: true }) : jsonError(adminFr.actionFailed, 502);
    }

    if (body.action === "unpublish") {
      const { error } = await db().from("invitations").update({ status: "draft", updated_at: new Date().toISOString() }).eq("id", id);
      if (error) { console.error("admin.invitation.unpublish", error.message); return jsonError(adminFr.actionFailed, 500); }
      await recordAdminEvent({ actor, action: adminFr.unpublishAction, invitationId: id, details: { previousStatus: invitation.status } });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "extend") {
      if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return jsonError(adminFr.dateRequired, 400);
      const end = new Date(`${body.date}T23:59:59.999Z`);
      if (!Number.isFinite(end.getTime()) || end.toISOString().slice(0, 10) !== body.date || end.getTime() < Date.now()) return jsonError(adminFr.dateRequired, 400);
      const { error } = await db().from("invitations").update({ keep_until: end.toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
      if (error) { console.error("admin.invitation.extend", error.message); return jsonError(adminFr.actionFailed, 500); }
      await recordAdminEvent({ actor, action: adminFr.extendAction, invitationId: id, details: { keepUntil: end.toISOString() } });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "pdf-grant" || body.action === "pdf-revoke") {
      const grantedAt = body.action === "pdf-grant" ? new Date().toISOString() : null;
      const { error } = await db().from("invitations").update({ pdf_granted_at: grantedAt }).eq("id", id);
      if (error) { console.error("admin.invitation.pdf_access", error.message); return jsonError(adminFr.actionFailed, 500); }
      await recordAdminEvent({ actor, action: body.action === "pdf-grant" ? adminFr.grantPdfAction : adminFr.revokePdfAction, invitationId: id, details: { pdfGrantedAt: grantedAt } });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "delete") {
      if (body.confirmation !== "SUPPRIMER") return jsonError(adminFr.deleteMustType, 400);
      const eventId = await recordAdminEvent({ actor, action: adminFr.deleteAction, invitationId: id, details: { stage: "started", slug: invitation.slug } });
      const bucket = db().storage.from("photos");
      const { data: files, error: listError } = await bucket.list(id, { limit: 100 });
      if (listError) return jsonError(adminFr.actionFailed, 500);
      if (files?.length) {
        const { error } = await bucket.remove(files.map((file) => `${id}/${file.name}`));
        if (error) return jsonError(adminFr.actionFailed, 500);
      }
      const { error } = await db().from("invitations").delete().eq("id", id);
      if (error) { console.error("admin.invitation.delete", error.message); return jsonError(adminFr.actionFailed, 500); }
      await updateAdminEvent(eventId, { stage: "completed", slug: invitation.slug, responsesDeleted: true, photosDeleted: files?.length ?? 0 });
      return NextResponse.json({ ok: true, deleted: true });
    }
  } catch (error) {
    console.error("admin.invitation.action", error instanceof Error ? error.message : error);
    return jsonError(adminFr.actionFailed, 500);
  }
  return jsonError(adminFr.invalidAction, 400);
}

export async function GET() {
  if (!await requireAdmin()) return new NextResponse(null, { status: 404 });
  return jsonError(adminFr.invalidAction, 405);
}
