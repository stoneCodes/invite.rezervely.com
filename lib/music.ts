import { CATEGORIES, TEMPLATES, type CategoryId } from "@/lib/types";

/** Bibliothèque de musiques (10 nov. 2026) : morceaux choisis par Glad, que les mariés sélectionnent dans l'éditeur. */
export type Track = { id: string; title: string; src: string; start: number };
export type MusicDefaults = Partial<Record<CategoryId, string>>;
export type MusicLibrary = { tracks: Track[]; defaults: MusicDefaults };

/** Valeur de `data.music` pour une invitation sans musique. */
export const NO_MUSIC = "none";
export const MUSIC_DEFAULTS_KEY = "music_defaults";

/**
 * Morceaux intégrés au site (public/musique, convertis en MP3 96 kb/s ; originaux dans images-source/musique).
 * Déjà coupés dans le fichier : A Beautiful Life commence à 24 s, Ma reference à 16 s.
 * Servent de secours si la table `tracks` (migration 012) n'existe pas encore ou ne répond pas.
 */
export const BUILTIN_TRACKS: Track[] = [
  { id: "a-beautiful-life", title: "A Beautiful Life", src: "/musique/a-beautiful-life.mp3", start: 0 },
  { id: "ma-reference", title: "Ma reference", src: "/musique/ma-reference.mp3", start: 0 },
  { id: "je-parlerai-de-ta-bonte", title: "Je parlerai de Ta bonté", src: "/musique/je-parlerai-de-ta-bonte.mp3", start: 0 },
  { id: "maintenant-je-sais", title: "Maintenant je sais", src: "/musique/maintenant-je-sais.mp3", start: 0 },
];
export const BUILTIN_DEFAULTS: MusicDefaults = { mariage: "a-beautiful-life", anniversaire: "ma-reference", "baby-shower": "a-beautiful-life" };

export function categoryOf(template: string): CategoryId {
  const tpl = TEMPLATES.find((t) => t.id === template);
  return (tpl?.categories[0] as CategoryId | undefined) ?? CATEGORIES[0].id;
}

/** Morceau par défaut d'un modèle (selon sa catégorie), ou le premier de la liste. */
export function defaultTrack(lib: MusicLibrary, template: string): Track | null {
  const id = lib.defaults[categoryOf(template)];
  return lib.tracks.find((t) => t.id === id) ?? lib.tracks[0] ?? null;
}

/** Morceau à jouer : choix des mariés, sinon défaut de la catégorie ; null = sans musique. Un morceau retiré retombe sur le défaut. */
export function resolveTrack(lib: MusicLibrary, choice: string | undefined, template: string): Track | null {
  if (choice === NO_MUSIC) return null;
  return (choice && lib.tracks.find((t) => t.id === choice)) || defaultTrack(lib, template);
}
