import { TEMPLATE_IDS, type TemplateId } from "@/lib/types";

/** Clé du réglage (table `settings`) qui garde l'ordre des modèles choisi dans l'admin (/admin/modeles). */
export const TEMPLATE_ORDER_KEY = "template_order";

/**
 * Ordre d'affichage des modèles (galerie de l'accueil et de l'éditeur, flèches des démos).
 * Garde les identifiants connus dans l'ordre enregistré, ignore les inconnus,
 * puis ajoute à la fin les modèles absents (nouveau modèle pas encore classé) dans l'ordre du catalogue.
 */
export function sortTemplateIds(saved: unknown): TemplateId[] {
  const known = new Set<string>(TEMPLATE_IDS);
  const seen = new Set<string>();
  const out: TemplateId[] = [];
  if (Array.isArray(saved)) {
    for (const id of saved) {
      if (typeof id === "string" && known.has(id) && !seen.has(id)) { seen.add(id); out.push(id as TemplateId); }
    }
  }
  for (const id of TEMPLATE_IDS) if (!seen.has(id)) out.push(id);
  return out;
}

/** Modèle suivant / précédent dans l'ordre donné (en boucle). */
export function cycleTemplate(order: TemplateId[], id: TemplateId, step: number): TemplateId {
  const i = Math.max(0, order.indexOf(id));
  return order[(i + step + order.length) % order.length];
}
