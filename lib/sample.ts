import { isBirthday, isKids, type InvitationData, type TemplateId, type Wishlist } from "./types";
import type { Lang } from "./i18n";

/** Données d'exemple : démo publique et point de départ de l'éditeur, dans la langue demandée. */
export function sampleData(lang: Lang = "fr"): InvitationData {
  return lang === "en" ? sampleEn() : sampleFr();
}

/** Jeu de données de la démo musulmane « Éclat de velours » ; toutes les valeurs restent éditables. */
export function veloursSampleData(lang: Lang = "fr"): InvitationData {
  const en = lang === "en";
  const data = sampleData(lang);
  return {
    ...data,
    partner1: "Ahmed",
    partner2: "Fatima",
    intro: en ? "Together with their families, Ahmed and Fatima invite you to celebrate their union." : "Avec leurs familles, Ahmed et Fatima vous invitent à célébrer leur union.",
    programme: en ? [
      { t: "3:00 pm", title: "Nikah ceremony", note: "A moment of prayer and blessing" },
      { t: "5:00 pm", title: "Family gathering", note: "A warm welcome for everyone" },
      { t: "7:00 pm", title: "Dinner", note: "An evening shared around the table" },
      { t: "9:00 pm", title: "Celebration", note: "Music, joy and family traditions" },
    ] : [
      { t: "15h00", title: "Cérémonie du nikah", note: "Un moment de prière et de bénédiction" },
      { t: "17h00", title: "Retrouvailles en famille", note: "Un accueil chaleureux pour tous" },
      { t: "19h00", title: "Dîner", note: "Une soirée partagée autour de la table" },
      { t: "21h00", title: "Célébration", note: "Musique, joie et traditions familiales" },
    ],
    venue: en ? { name: "The Orange Grove", address: "Toulouse, France" } : { name: "Le Jardin des Orangers", address: "Toulouse, France" },
    verse: {
      kind: "coran",
      orig: "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً إِنَّ فِي ذَٰلِكَ لَآيَاتٍ لِّقَوْمٍ يَتَفَكَّرُونَ",
      text: en ? "He created spouses so they may find comfort with one another, and placed affection and mercy between them." : "Il a créé les époux afin qu’ils trouvent la quiétude l’un auprès de l’autre, et a placé entre eux affection et miséricorde.",
      ref: en ? "Qur’an, Ar-Rum, 30:21" : "Coran, Ar-Rûm, 30:21",
    },
    rsvpBy: en ? "Please reply before 1 May 2027" : "Merci de répondre avant le 1er mai 2027",
  };
}

function sampleFr(): InvitationData {
  return {
    lang: "fr",
    partner1: "Léa",
    partner2: "Samuel",
    intro: "Avec leurs familles, ont la joie de vous inviter à leur mariage",
    dateISO: "2027-06-13T15:00:00+02:00",
    venue: { name: "Domaine des Tilleuls", address: "Chemin des Tilleuls, 31000 Toulouse" },
    programme: [
      { t: "14h30", title: "Cérémonie civile", note: "Mairie, salle des mariages" },
      { t: "16h00", title: "Bénédiction", note: "Dans le jardin du domaine" },
      { t: "18h00", title: "Vin d'honneur", note: "Terrasse et orangerie" },
      { t: "20h30", title: "Dîner & soirée", note: "Jusqu'au bout de la nuit" },
    ],
    dressCode: {
      enabled: true,
      title: "Tenue de soirée",
      note: "Habillez-vous dans nos couleurs. Merci de laisser le blanc à la mariée.",
      men: { label: "Messieurs", text: "Costume ou veste unie, cravate ou nœud papillon assortis" },
      women: { label: "Mesdames", text: "Robe longue ou midi, tissu fluide" },
      colors: [
        { name: "Rose poudré", hex: "#D8A3AD" },
        { name: "Vert sauge", hex: "#93A684" },
        { name: "Champagne", hex: "#D6BE8E" },
        { name: "Bleu nuit & rose", hex: "#2E3C5C", men: "#2E3C5C", women: "#D8A3AD" },
      ],
    },
    verse: {
      kind: "bible",
      text: "L'amour excuse tout, il croit tout, il espère tout, il supporte tout. L'amour ne périt jamais.",
      ref: "1 Corinthiens 13:7-8",
    },
    story: [
      { y: "2019", text: "Une rencontre par hasard, un samedi de pluie, dans une librairie de Toulouse." },
      { y: "2024", text: "Il a fait sa demande au bord de l'océan, à Biarritz. Elle a dit oui avant la fin de la phrase." },
      { y: "2027", text: "Et maintenant, on aimerait vous avoir à nos côtés." },
    ],
    rsvpBy: "Merci de répondre avant le 1er mai 2027",
    photoUrl: null,
  };
}

function sampleEn(): InvitationData {
  return {
    lang: "en",
    partner1: "Lea",
    partner2: "Samuel",
    intro: "Together with their families, joyfully invite you to their wedding",
    dateISO: "2027-06-13T15:00:00+02:00",
    venue: { name: "Linden Manor", address: "Chemin des Tilleuls, 31000 Toulouse, France" },
    programme: [
      { t: "2:30 pm", title: "Civil ceremony", note: "Town hall, wedding room" },
      { t: "4:00 pm", title: "Blessing", note: "In the manor garden" },
      { t: "6:00 pm", title: "Drinks reception", note: "Terrace and orangery" },
      { t: "8:30 pm", title: "Dinner & party", note: "Until the very end of the night" },
    ],
    dressCode: {
      enabled: true,
      title: "Evening wear",
      note: "Dress in our colours. Please leave white to the bride.",
      men: { label: "Gentlemen", text: "Suit or plain jacket, matching tie or bow tie" },
      women: { label: "Ladies", text: "Long or midi dress, flowing fabric" },
      colors: [
        { name: "Dusty pink", hex: "#D8A3AD" },
        { name: "Sage green", hex: "#93A684" },
        { name: "Champagne", hex: "#D6BE8E" },
        { name: "Navy & pink", hex: "#2E3C5C", men: "#2E3C5C", women: "#D8A3AD" },
      ],
    },
    verse: {
      kind: "bible",
      text: "Love bears all things, believes all things, hopes all things, endures all things. Love never fails.",
      ref: "1 Corinthians 13:7-8",
    },
    story: [
      { y: "2019", text: "A chance meeting on a rainy Saturday, in a Toulouse bookshop." },
      { y: "2024", text: "He proposed by the ocean in Biarritz. She said yes before he finished the sentence." },
      { y: "2027", text: "And now, we'd love to have you by our side." },
    ],
    rsvpBy: "Please reply before 1 May 2027",
    photoUrl: null,
  };
}

/** Exemple de départ d'un modèle : mariage, mariage musulman (velours) ou anniversaire. */
export function sampleFor(template: TemplateId, lang: Lang = "fr"): InvitationData {
  if (template === "velours") return veloursSampleData(lang);
  if (isBirthday(template)) return birthdaySample(template, lang);
  return sampleData(lang);
}

/** Exemples d'anniversaire : adulte (vinyle, toast) ou enfant (gâteau, piñata). */
export function birthdaySample(template: TemplateId, lang: Lang = "fr"): InvitationData {
  const en = lang === "en";
  const kids = isKids(template);
  const base = sampleData(lang);
  const who = { vinyle: ["Nadia", 40], toast: ["Karim", 30], gateau: ["Léo", 6], pinata: ["Inès", 5] }[template as "vinyle"] ?? ["Nadia", 40];
  const [name, age] = who as [string, number];
  return {
    ...base,
    partner1: name,
    partner2: "",
    intro: kids
      ? (en ? `Come and celebrate with ${name}: games, cake and surprises!` : `Viens faire la fête avec ${name} : jeux, gâteau et surprises !`)
      : (en ? "A night of music, laughter and good food with the people I love." : "Une soirée de musique, de rires et de bonne cuisine avec ceux que j'aime."),
    dateISO: kids ? "2027-04-17T14:00:00+02:00" : "2027-06-12T19:30:00+02:00",
    venue: kids
      ? (en ? { name: "Fun Park", address: "12 rue des Lilas, 31000 Toulouse" } : { name: "La Cabane des Loisirs", address: "12 rue des Lilas, 31000 Toulouse" })
      : (en ? { name: "The Velvet Lounge", address: "8 place du Capitole, 31000 Toulouse" } : { name: "Le Salon de Velours", address: "8 place du Capitole, 31000 Toulouse" }),
    programme: kids
      ? (en ? [
          { t: "2:00 pm", title: "Welcome", note: "Face painting and balloons" },
          { t: "2:30 pm", title: "Magic show", note: "With the Great Zigoto" },
          { t: "4:00 pm", title: "Cake time", note: "And the candles!" },
        ] : [
          { t: "14h00", title: "Accueil", note: "Maquillage et ballons" },
          { t: "14h30", title: "Spectacle de magie", note: "Avec le Grand Zigoto" },
          { t: "16h00", title: "Le goûter", note: "Et les bougies !" },
        ])
      : (en ? [
          { t: "7:30 pm", title: "Welcome drinks", note: "On the terrace" },
          { t: "9:00 pm", title: "Dinner", note: "Seated dinner" },
          { t: "11:00 pm", title: "Dance floor", note: "Until late" },
        ] : [
          { t: "19h30", title: "Apéritif", note: "Sur la terrasse" },
          { t: "21h00", title: "Dîner", note: "Dîner assis" },
          { t: "23h00", title: "Piste de danse", note: "Jusqu'au bout de la nuit" },
        ]),
    dressCode: kids
      ? { enabled: true, title: en ? "Superheroes" : "Super-héros", note: en ? "Come dressed as your favourite hero!" : "Viens déguisé en ton héros préféré !", men: { label: "", text: "" }, women: { label: "", text: "" }, colors: [] }
      : { enabled: true, title: en ? "Chic and gold" : "Chic et doré", note: en ? "Black and gold, with a touch of shine." : "Du noir et de l'or, avec une touche de brillant.", men: { label: "", text: "" }, women: { label: "", text: "" },
          colors: [{ name: en ? "Black" : "Noir", hex: "#1C1A1A" }, { name: en ? "Gold" : "Or", hex: "#C9A24A" }, { name: en ? "Burgundy" : "Bordeaux", hex: "#6E1F2E" }] },
    verse: null,
    story: [],
    rsvpBy: en ? "Please reply before 1 April 2027" : "Merci de répondre avant le 1er avril 2027",
    photoUrl: null,
    bday: {
      age,
      surprise: template === "toast",
      gifts: kids ? "" : (en ? "Your presence is the best gift!" : "Votre présence est le plus beau des cadeaux !"),
      endTime: kids ? (en ? "6:00 pm" : "18h00") : "",
      parentPhone: kids ? "06 12 34 56 78" : "",
      palette: template === "gateau" ? "bleu" : "rose",
    },
  };
}

/** Liste de souhaits d'exemple, montrée seulement dans les démos (jamais pré-remplie dans l'éditeur). Liens example.com. */
export function demoWishlist(template: TemplateId, lang: Lang = "fr"): Wishlist {
  const en = lang === "en";
  const names = isKids(template)
    ? (en ? ["Illustrated story book", "Wooden building blocks", "Watercolour paint set"] : ["Livre d'histoires illustré", "Jeu de construction en bois", "Coffret de peinture"])
    : isBirthday(template)
      ? (en ? ["Signed vinyl record", "Cooking class for two", "Linen throw"] : ["Vinyle dédicacé", "Cours de cuisine pour deux", "Plaid en lin"])
      : (en ? ["Porcelain tea set", "Weekend getaway for two", "Linen bedding set"] : ["Service à thé en porcelaine", "Week-end en amoureux", "Parure de lit en lin"]);
  return {
    note: en ? "Your presence is the best gift. If you would like to spoil us, here are a few ideas." : "Votre présence est notre plus beau cadeau. Si vous souhaitez nous gâter, voici quelques idées.",
    items: names.map((name, i) => ({ name, url: `https://example.com/${en ? "gift" : "cadeau"}-${i + 1}` })),
    fund: "https://example.com/cagnotte",
  };
}
