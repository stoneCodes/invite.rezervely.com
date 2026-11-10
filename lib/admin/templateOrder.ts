import "server-only";
import { getAdminSetting } from "@/lib/admin/settings";
import { sortTemplateIds, TEMPLATE_ORDER_KEY } from "@/lib/templateOrder";
import type { TemplateId } from "@/lib/types";

/** Ordre des modèles choisi dans l'admin (ordre du catalogue si rien n'est enregistré ou si la base ne répond pas). */
export async function getTemplateOrder(): Promise<TemplateId[]> {
  const saved = await getAdminSetting<unknown>(TEMPLATE_ORDER_KEY).catch(() => null);
  return sortTemplateIds(saved);
}
