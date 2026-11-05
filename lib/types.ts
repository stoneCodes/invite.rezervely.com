export const TEMPLATES = [
  { id: "cygnes", name: "Lac aux cygnes", tagline: "Enveloppe en relief, la carte s'envole dans une pluie de pétales", cover: "/img/1b-scene.webp" },
  { id: "nuit-doree", name: "Nuit dorée", tagline: "Deux portes s'ouvrent dans un éclat de lumière et de poussière d'or", cover: "/img/2b-scene.webp" },
  { id: "jardin-nuit", name: "Jardin de nuit", tagline: "Des lucioles s'échappent de l'enveloppe et écrivent vos prénoms", cover: "/img/5b-scene.webp" },
  { id: "appel", name: "Appel entrant", tagline: "Vos invités reçoivent votre appel, décrochent, et la conversation commence", cover: "/img/appel-fond-defaut.webp" },
  { id: "boule-neige", name: "Le monde miniature", tagline: "Une boule à neige à secouer, puis une plongée dans votre mariage en miniature", cover: "/img/boule-domaine.webp" },
  { id: "origami", name: "Origami", tagline: "Une grue en papier se déplie, chaque section est un pliage, la réponse part en avion", cover: "/img/origami-grues.webp" },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];
export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id) as TemplateId[];

export type DressColor = { name: string; hex: string; men?: string; women?: string };

export type InvitationData = {
  partner1: string;
  partner2: string;
  intro: string;
  /** Date et heure de la cérémonie, ISO avec fuseau (ex. 2027-06-13T15:00:00+02:00) */
  dateISO: string;
  venue: { name: string; address: string };
  programme: { t: string; title: string; note: string }[];
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
  created_at: string;
  updated_at: string;
  published_at: string | null;
};
