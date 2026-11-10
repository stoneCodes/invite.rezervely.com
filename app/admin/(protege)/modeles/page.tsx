import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getTemplateOrder } from "@/lib/admin/templateOrder";
import { CATEGORIES, TEMPLATES } from "@/lib/types";
import { fr as siteFr } from "@/lib/i18n/site-fr";
import adminFr from "@/lib/i18n/admin-fr";
import TemplateOrder from "./TemplateOrder";

export const dynamic = "force-dynamic";

/** Ordre des modèles dans la galerie : une liste par catégorie (catégorie principale de chaque modèle). */
export default async function TemplatesPage() {
  if (!await requireAdmin()) notFound();
  const order = await getTemplateOrder();
  const groups = CATEGORIES.map(({ id }) => ({
    id,
    label: siteFr.gallery.rows[id],
    items: order
      .filter((tid) => TEMPLATES.find((tpl) => tpl.id === tid)?.categories[0] === id)
      .map((tid) => ({ id: tid, name: siteFr.templates[tid].name, screen: TEMPLATES.find((tpl) => tpl.id === tid)!.phone.screen })),
  })).filter((g) => g.items.length > 0);
  return <main className="ad-main ad-tpl-page">
    <div className="ad-price-intro"><div><span className="ad-price-kicker">{adminFr.templatesKicker}</span><h1>{adminFr.templatesTitle}</h1><p>{adminFr.templatesDescription}</p></div></div>
    <TemplateOrder groups={groups} />
  </main>;
}
