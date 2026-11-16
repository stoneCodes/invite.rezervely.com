import "server-only";
import { db } from "./supabase";
import { formatOf, type InvitationRow } from "./types";


/* Pack save the date + invitation : le 1er article publié paie le pack (plan = "pack"),
   le 2e est créé depuis l'espace du 1er (/creer?pack=<jeton>) et se publie sans payer. */

/** 2e article déjà créé pour ce pack (ou null). */
export async function packPartner(src: Pick<InvitationRow, "id">): Promise<Pick<InvitationRow, "id" | "edit_token" | "template" | "status"> | null> {
  const { data } = await db().from("invitations").select("id, edit_token, template, status").eq("pack_from", src.id).maybeSingle();
  return (data as Pick<InvitationRow, "id" | "edit_token" | "template" | "status"> | null) ?? null;
}

/** Ce pack peut-il encore couvrir un article de ce modèle ? (payé en pack, autre format, pas encore utilisé) */
export async function packClaimable(src: InvitationRow, template: string): Promise<boolean> {
  if (src.plan !== "pack" || !src.paid_at || formatOf(src.template) === formatOf(template)) return false;
  return !(await packPartner(src));
}

