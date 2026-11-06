import "server-only";
import { db } from "./supabase";
import { prettySlug } from "./slug";
import type { InvitationRow } from "./types";

/** Met à jour l'invitation au moment de la publication et lui donne, la première fois, son lien lisible définitif.
    Le lien ne change plus ensuite (les invités l'ont déjà reçu), même si les prénoms sont corrigés.
    `slug` est unique en base : si le lien tiré existe déjà (homonymes, même code), on en tire un autre. */
export async function updateOnPublish(
  inv: InvitationRow,
  patch: Record<string, unknown>,
  opts: { onlyIfUnpaid?: boolean } = {},
): Promise<{ slug: string; updated: boolean; error: boolean }> {
  const attempt = (slug: string) => {
    let q = db().from("invitations").update({ ...patch, slug }).eq("id", inv.id);
    if (opts.onlyIfUnpaid) q = q.is("paid_at", null);
    return q.select("id");
  };
  const done = (slug: string, r: Awaited<ReturnType<typeof attempt>>) => ({ slug, updated: !!r.data?.length, error: !!r.error });

  if (inv.published_at) return done(inv.slug, await attempt(inv.slug));
  for (let i = 0; i < 6; i++) {
    const slug = prettySlug(inv.data);
    const r = await attempt(slug);
    if (r.error?.code === "23505") continue; // lien déjà pris : on retire un code
    return done(slug, r);
  }
  return done(inv.slug, await attempt(inv.slug)); // ne devrait jamais arriver : on garde l'ancien lien court
}
