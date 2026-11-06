import "server-only";
import { db } from "./supabase";
import { RETENTION } from "./legal";

/* Suppression automatique (RGPD, durées annoncées dans la politique de confidentialité et les CGV) :
   - invitation dont l'événement est passé depuis RETENTION.afterEventDays jours ;
   - brouillon jamais publié, non modifié depuis RETENTION.draftDays jours.
   Les réponses partent avec l'invitation (on delete cascade) ; les photos sont retirées du bucket. Lancé par la tâche quotidienne. */

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 16);

export async function purgeExpired(): Promise<{ deleted: number; errors: number }> {
  const [past, drafts] = await Promise.all([
    // dateISO >= "2000" écarte les invitations sans date (chaîne vide), qui ne doivent pas être supprimées par ce critère.
    db().from("invitations").select("id").gte("data->>dateISO", "2000").lt("data->>dateISO", daysAgo(RETENTION.afterEventDays)).limit(200),
    db().from("invitations").select("id").eq("status", "draft").lt("updated_at", daysAgo(RETENTION.draftDays)).limit(200),
  ]);
  if (past.error || drafts.error) {
    console.error("purge.select", past.error?.message ?? drafts.error?.message);
    return { deleted: 0, errors: 1 };
  }
  const ids = [...new Set([...(past.data ?? []), ...(drafts.data ?? [])].map((r) => r.id as string))];
  let deleted = 0, errors = 0;
  for (const id of ids) {
    const bucket = db().storage.from("photos");
    const { data: files } = await bucket.list(id, { limit: 100 });
    if (files?.length) await bucket.remove(files.map((f) => `${id}/${f.name}`));
    const { error } = await db().from("invitations").delete().eq("id", id);
    if (error) { errors++; console.error("purge.delete", id, error.message); } else deleted++;
  }
  return { deleted, errors };
}
