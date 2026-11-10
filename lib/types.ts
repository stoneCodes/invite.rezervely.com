import type { Lang } from "./i18n";

export const CATEGORIES = [
  { id: "mariage" },
  { id: "anniversaire" },
  { id: "baby-shower" },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];

type PhoneSpec = {
  screen: string;
  names: { top: number; size: number };
  hint: { top: number; ink?: string };
  /** Initiales gravées sur le sceau de l'image (centre et diamètre en % de l'écran, couleur de la gravure) ; null = pas de sceau ou sceau à motif. */
  seal: { top: number; left: number; d: number; ink: string } | null;
  ink: string;
  font: "script" | "serif";
  /** Voile sombre derrière le texte quand l'écran est trop clair pour un texte clair. */
  scrim?: boolean;
};

/** Noms et accroches affichés : voir lib/i18n (site-fr / site-en). */
export const TEMPLATES = [
  { id: "cygnes", name: "Lac aux cygnes", tagline: "Enveloppe en relief, la carte s'envole dans une pluie de pétales", cover: "/img/1b-scene.webp", categories: ["mariage"], featured: true, phone: { screen: "/img/phone-cygnes.webp", names: { top: 75, size: 12 }, hint: { top: 83 }, seal: { top: 47.4, left: 49.6, d: 21, ink: "#f6dcae" }, ink: "#6e1a30", font: "script" } },
  { id: "nuit-doree", name: "Nuit dorée", tagline: "Deux portes s'ouvrent dans un éclat de lumière et de poussière d'or", cover: "/img/2b-scene.webp", categories: ["mariage"], featured: true, phone: { screen: "/img/phone-nuit-doree.webp", names: { top: 64, size: 12 }, hint: { top: 70.5 }, seal: { top: 45.8, left: 49, d: 21, ink: "#8a6534" }, ink: "#ffe9bf", font: "script" } },
  { id: "jardin-nuit", name: "Le jardin secret", tagline: "Un portail fleuri s'ouvre dans la lumière du jour, oiseaux et papillons vous font entrer au jardin", cover: "/img/jardin-portail.webp", categories: ["mariage"], featured: true, phone: { screen: "/img/phone-jardin-nuit.webp", names: { top: 83.3, size: 12 }, hint: { top: 89 }, seal: { top: 46.3, left: 48.5, d: 15, ink: "#8a6534" }, ink: "#2E3B26", font: "script" } },
  { id: "appel", name: "Appel entrant", tagline: "Vos invités reçoivent votre appel, décrochent, et la conversation commence", cover: "/img/appel-fond-defaut.webp", categories: ["mariage"], featured: false, phone: { screen: "/img/phone-appel.webp", names: { top: 48.6, size: 11 }, hint: { top: 12.5 }, seal: { top: 38, left: 50, d: 23, ink: "#3A2410" }, ink: "#fff8ef", font: "serif" } },
  { id: "boule-neige", name: "Le domaine", tagline: "Une clé ancienne ouvre le portail, puis une promenade en plein jour dans un domaine de charme", cover: "/img/domaine-portail.webp", categories: ["mariage"], featured: true, phone: { screen: "/img/phone-boule-neige.webp", names: { top: 82, size: 12 }, hint: { top: 89 }, seal: null, ink: "#5a4630", font: "script" } },
  { id: "origami", name: "Origami", tagline: "Une enveloppe de papier scellée de cire dorée s'ouvre dans la lumière, chaque section est un pliage, la réponse part en avion", cover: "/img/origami-grues.webp", categories: ["mariage"], featured: false, phone: { screen: "/img/phone-origami.webp", names: { top: 66, size: 12 }, hint: { top: 74 }, seal: null, ink: "#5a3d26", font: "script" } },
  { id: "velours", name: "Éclat de velours", tagline: "Un sceau s'illumine, l'enveloppe s'ouvre et la soirée se dévoile", cover: "/img/velours-enveloppe.webp", categories: ["mariage"], featured: false, phone: { screen: "/img/phone-velours.webp", names: { top: 82, size: 12 }, hint: { top: 89 }, seal: null, ink: "#f3dcb4", font: "script" } },
  // Anniversaires (docs/anniversaires.md) : un seul prénom + âge, données propres dans data.bday.
  { id: "vinyle", name: "Face A", tagline: "On pose le diamant sur le disque : l'invitation est un album, chaque section une piste", cover: "/img/phone-vinyle.webp", categories: ["anniversaire"], featured: true, kids: false, phone: { screen: "/img/phone-vinyle.webp", names: { top: 12, size: 13 }, hint: { top: 91.5 }, seal: null, ink: "#F3E6CC", font: "serif" } },
  { id: "toast", name: "Le toast", tagline: "On sabre le champagne, la mousse jaillit et chaque section arrive dans une bulle", cover: "/img/phone-toast.webp", categories: ["anniversaire"], featured: true, kids: false, phone: { screen: "/img/phone-toast.webp", names: { top: 69.5, size: 12 }, hint: { top: 90, ink: "#F3E6CC" }, seal: null, ink: "#3b2a0b", font: "serif" } },
  { id: "gateau", name: "Le gâteau magique", tagline: "On souffle les bougies, puis on descend le gâteau étage par étage", cover: "/img/phone-gateau.webp", categories: ["anniversaire"], featured: true, kids: true, phone: { screen: "/img/phone-gateau.webp", names: { top: 13, size: 13 }, hint: { top: 85.5 }, seal: null, ink: "#1f3f63", font: "serif" } },
  { id: "pinata", name: "La piñata", tagline: "Trois coups sur la piñata, et chaque section tombe dans un bonbon à déballer", cover: "/img/phone-pinata.webp", categories: ["anniversaire"], featured: true, kids: true, phone: { screen: "/img/phone-pinata.webp", names: { top: 78, size: 13 }, hint: { top: 88.5 }, seal: null, ink: "#5a2140", font: "serif" } },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];
export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id) as TemplateId[];

/** Modèle d'anniversaire (un seul prénom, âge, data.bday) plutôt que de mariage (deux prénoms). */
export const isBirthday = (id: string | null | undefined) => TEMPLATES.some((t) => t.id === id && (t.categories as readonly string[]).includes("anniversaire"));
/** Anniversaire d'enfant : palette au choix, heure de fin, téléphone d'un parent, allergies dans la réponse. */
export const isKids = (id: string | null | undefined) => TEMPLATES.some((t) => t.id === id && "kids" in t && t.kids);
/** Prénoms affichés : « Léa & Samuel », ou un seul prénom pour un anniversaire. */
export const displayNames = (d: { partner1?: string; partner2?: string }) => [d.partner1, d.partner2].map((x) => (x ?? "").trim()).filter(Boolean).join(" & ");

/** Palettes des modèles enfant (choix des parents, sans étiquette fille / garçon). */
export const PALETTES = ["rose", "bleu"] as const;
export type PaletteId = (typeof PALETTES)[number];

/** Données propres aux anniversaires. */
export type BirthdayData = {
  /** Âge fêté (1 à 120), null = non précisé */
  age: number | null;
  /** Fête surprise : avertissement aux invités */
  surprise: boolean;
  /** Idées de cadeaux, cagnotte… (facultatif) */
  gifts: string;
  /** Heure de fin (enfants : heure où l'on vient les chercher) */
  endTime: string;
  /** Téléphone d'un parent (enfants) */
  parentPhone: string;
  palette: PaletteId;
};

/** Types de lieu d'une étape du programme (parcours du modèle « Le domaine »). */
export const PLACES = ["mairie", "eglise", "mosquee", "temple", "ceremonie", "cocktail", "reception", "soiree"] as const;
export type PlaceId = (typeof PLACES)[number];

export type DressColor = { name: string; hex: string; men?: string; women?: string };

export type InvitationData = {
  /** Langue des textes fixes de l'invitation (titres, boutons, réponse). Absent = français (anciennes invitations). */
  lang?: Lang;
  partner1: string;
  partner2: string;
  intro: string;
  /** Date et heure de la cérémonie, ISO avec fuseau (ex. 2027-06-13T15:00:00+02:00) */
  dateISO: string;
  venue: { name: string; address: string };
  /** place : type de lieu de l'étape (modèle « Le domaine »), absent = deviné d'après le titre. */
  programme: { t: string; title: string; note: string; place?: PlaceId }[];
  dressCode: {
    enabled: boolean;
    title: string;
    note: string;
    men: { label: string; text: string };
    women: { label: string; text: string };
    /** 1 à 4 couleurs ; men/women = couleur différente par tenue */
    colors: DressColor[];
  };
  /** Verset libre (Bible, Coran, autre) ; null = pas de verset */
  verse: { kind: "bible" | "coran" | "autre"; orig?: string; text: string; ref: string } | null;
  story: { y: string; text: string }[];
  rsvpBy: string;
  photoUrl: string | null;
  /** Anniversaires seulement (partner1 = personne fêtée, partner2 vide). */
  bday?: BirthdayData;
  /** Liste de souhaits facultative (tous les modèles) : articles nom + lien, et lien de cagnotte. */
  wishlist?: Wishlist;
  /** Musique de fond : id d'un morceau de la bibliothèque (/api/musiques), "none" = sans musique, absent = musique par défaut de la catégorie. */
  music?: string;
};

/** Un souhait : nom affiché, lien facultatif (https) vers la page de l'article. */
export type WishItem = { name: string; url: string };
export type Wishlist = { note: string; items: WishItem[]; fund: string };

export type InvitationRow = {
  id: string;
  slug: string;
  edit_token: string;
  template: TemplateId;
  data: InvitationData;
  status: "draft" | "published";
  owner_email: string | null;
  /** Langue des e-mails envoyés aux mariés (langue du site quand ils ont enregistré). */
  owner_lang: Lang | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  /** Paiement Stripe (migration 006) : absent tant que la migration n'est pas appliquée. */
  paid_at?: string | null;
  paid_amount_cents?: number | null;
  stripe_session_id?: string | null;
  comped_at?: string | null;
  pdf_granted_at?: string | null;
};
