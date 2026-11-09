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
  hint: { top: number };
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
  { id: "appel", name: "Appel entrant", tagline: "Vos invités reçoivent votre appel, décrochent, et la conversation commence", cover: "/img/appel-fond-defaut.webp", categories: ["mariage"], featured: false, phone: { screen: "/img/phone-appel.webp", names: { top: 46.6, size: 11 }, hint: { top: 8.4 }, seal: { top: 36, left: 50, d: 23, ink: "#3A2410" }, ink: "#fff8ef", font: "serif" } },
  { id: "boule-neige", name: "Le domaine", tagline: "Une clé ancienne ouvre le portail, puis une promenade en plein jour dans un domaine de charme", cover: "/img/domaine-portail.webp", categories: ["mariage"], featured: true, phone: { screen: "/img/phone-boule-neige.webp", names: { top: 82, size: 12 }, hint: { top: 89 }, seal: null, ink: "#5a4630", font: "script" } },
  { id: "origami", name: "Origami", tagline: "Une enveloppe de papier scellée de cire dorée s'ouvre dans la lumière, chaque section est un pliage, la réponse part en avion", cover: "/img/origami-grues.webp", categories: ["mariage"], featured: false, phone: { screen: "/img/phone-origami.webp", names: { top: 66, size: 12 }, hint: { top: 74 }, seal: null, ink: "#5a3d26", font: "script" } },
  { id: "velours", name: "Éclat de velours", tagline: "Un sceau s'illumine, l'enveloppe s'ouvre et la soirée se dévoile", cover: "/img/velours-enveloppe.webp", categories: ["mariage"], featured: false, phone: { screen: "/img/phone-velours.webp", names: { top: 82, size: 12 }, hint: { top: 89 }, seal: null, ink: "#f3dcb4", font: "script" } },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];
export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id) as TemplateId[];

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
};

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
