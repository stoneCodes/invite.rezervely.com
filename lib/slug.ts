import { customAlphabet } from "nanoid";

/* Lien public lisible : ecartestudio.com/lea-et-samuel-k7m2
   - prénoms simplifiés (accents retirés, « & » remplacé par « et » / « and » : « & » casse les liens dans WhatsApp et les SMS) ;
   - un seul prénom (anniversaire, baptême…) : ecartestudio.com/lea-k7m2 ;
   - code de 4 caractères toujours ajouté : le lien ne se devine pas (invitation privée) et deux couples homonymes n'ont jamais le même lien.
   Les anciens liens courts (/i/3kvv57mz) continuent de fonctionner. */

const CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"; // sans 0/o, 1/l/i : se recopie sans erreur
const code = customAlphabet(CODE_ALPHABET, 4);

/** Prénom → morceau d'adresse : « Jean-Noël » → « jean-noel », « Zoë » → « zoe ». */
export function slugPart(s: string | undefined | null, max = 24): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");
}

/** Nouveau lien lisible pour une invitation (le code change à chaque appel). */
export function prettySlug(d: { partner1?: string; partner2?: string; lang?: string }): string {
  const a = slugPart(d.partner1), b = slugPart(d.partner2);
  const base = a && b ? `${a}-${d.lang === "en" ? "and" : "et"}-${b}` : a || b || "invitation"; // prénoms en écriture non latine : « invitation-k7m2 »
  return `${base}-${code()}`;
}

/** Forme d'un lien lisible (servi à la racine du site). */
export const PRETTY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*-[2-9a-hjkmnp-z]{4}$/;
export const isPrettySlug = (s: string) => s.length <= 64 && PRETTY_SLUG.test(s);

/** Chemin public d'une invitation : /lea-et-samuel-k7m2, ou /i/<code> pour les anciens liens. */
export const invitePath = (slug: string) => (isPrettySlug(slug) ? `/${slug}` : `/i/${slug}`);
