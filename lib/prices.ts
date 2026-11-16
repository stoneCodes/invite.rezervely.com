/* Prix des formules (utilisable côté navigateur comme côté serveur).
   Réglés dans l'admin (/admin/prix, réglage settings.prices) ; ces valeurs servent par défaut.
   - std : save the date seul
   - invitation : invitation seule
   - pack : save the date + invitation achetés ensemble (moins cher que les deux séparés) */
import type { Lang } from "./i18n";
import { TEMPLATES, formatOf, type TemplateId } from "./types";

export type Prices = { std: number; invitation: number; pack: number };
export type Plan = "single" | "pack";
export const DEFAULT_PRICES: Prices = { std: 1190, invitation: 2490, pack: 3490 };
export const MIN_PRICE_CENTS = 50;
export const MAX_PRICE_CENTS = 1_000_000;

const okCents = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= MIN_PRICE_CENTS && v <= MAX_PRICE_CENTS;
/** Réglage enregistré → prix complets (une valeur absente ou invalide reprend la valeur par défaut). */
export function readPrices(v: unknown): Prices {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return { std: okCents(o.std) ? o.std : DEFAULT_PRICES.std, invitation: okCents(o.invitation) ? o.invitation : DEFAULT_PRICES.invitation, pack: okCents(o.pack) ? o.pack : DEFAULT_PRICES.pack };
}
export const validPrices = (v: unknown): v is Prices => !!v && typeof v === "object" && ["std", "invitation", "pack"].every((k) => okCents((v as Record<string, unknown>)[k]));

/** Prix du modèle acheté seul. */
export const singlePrice = (p: Prices, template: TemplateId | string) => (formatOf(template) === "std" ? p.std : p.invitation);
/** Total des deux achetés séparément (prix barré à côté du pack). */
export const separateTotal = (p: Prices) => p.std + p.invitation;

/** Le pack est proposé quand l'autre format existe dans la même catégorie (aujourd'hui : mariage). */
export function packAvailable(template: TemplateId | string): boolean {
  const me = TEMPLATES.find((t) => t.id === template);
  if (!me) return false;
  const f = formatOf(template);
  return TEMPLATES.some((t) => formatOf(t.id) !== f && t.categories.some((c) => (me.categories as readonly string[]).includes(c)));
}
/** Premier modèle de l'autre format dans la même catégorie (repli quand le modèle n'a pas de modèle assorti). */
export function otherFormatDefault(template: TemplateId | string): TemplateId | null {
  const me = TEMPLATES.find((t) => t.id === template);
  if (!me) return null;
  const f = formatOf(template);
  const t = TEMPLATES.find((x) => formatOf(x.id) !== f && x.categories.some((c) => (me.categories as readonly string[]).includes(c)));
  return t ? (t.id as TemplateId) : null;
}

export function money(lang: Lang, cents: number) {
  return new Intl.NumberFormat(lang === "en" ? "en-IE" : "fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}
