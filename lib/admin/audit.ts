import "server-only";
import { db } from "@/lib/supabase";

export async function recordAdminEvent(input: {
  actor: string;
  action: string;
  invitationId?: string | null;
  details?: Record<string, unknown>;
}) {
  const { data, error } = await db().from("admin_events").insert({
    actor: input.actor,
    action: input.action,
    invitation_id: input.invitationId ?? null,
    details: input.details ?? {},
  }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function updateAdminEvent(id: string, details: Record<string, unknown>) {
  const { error } = await db().from("admin_events").update({ details }).eq("id", id);
  if (error) throw error;
}
