/**
 * Langues du site et des invitations.
 * Règle : tout texte visible passe par un dictionnaire (site : lib/i18n/site-*.ts, invitations : lib/i18n/invite.ts).
 * Le dictionnaire anglais est typé sur le français : une clé ajoutée en français sans sa traduction anglaise
 * fait échouer `npm run typecheck` (et donc le déploiement).
 */
export const LANGS = ["fr", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "fr";
export const LANG_COOKIE = "lang";
export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as readonly string[]).includes(v);
export const LOCALE: Record<Lang, string> = { fr: "fr-FR", en: "en-GB" };

/** Langue préférée d'après l'en-tête Accept-Language (1re visite, avant tout choix). */
export function fromAcceptLanguage(h: string | null | undefined): Lang {
  const first = (h ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("en") ? "en" : DEFAULT_LANG;
}
