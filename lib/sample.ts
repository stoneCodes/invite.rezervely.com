import { isBaby, isBirthday, isKids, type InvitationData, type TemplateId, type Wishlist } from "./types";
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

/** Exemple « La dot » : mariage coutumier, deux familles, pagne de démonstration. */
export function dotSampleData(lang: Lang = "fr"): InvitationData {
  const en = lang === "en";
  const data = sampleData(lang);
  return {
    ...data,
    partner1: "Merveille",
    partner2: "Christian",
    intro: en ? "With the blessing of their elders, they invite you to share this day of joy." : "Avec la bénédiction de leurs aînés, ils vous invitent à partager ce jour de joie.",
    programme: en ? [
      { t: "2:00 pm", title: "Arrival of the families", note: "Welcome and introductions" },
      { t: "3:00 pm", title: "Presentation of the dowry", note: "Gifts and words of the elders" },
      { t: "5:00 pm", title: "Blessings", note: "The families give their consent" },
      { t: "7:00 pm", title: "Dinner and dancing", note: "Sharing, music and joy" },
    ] : [
      { t: "14h00", title: "Arrivée des familles", note: "Accueil et présentations" },
      { t: "15h00", title: "Remise de la dot", note: "Présents et paroles des aînés" },
      { t: "17h00", title: "Bénédictions", note: "Les familles donnent leur accord" },
      { t: "19h00", title: "Repas et danse", note: "Partage, musique et joie" },
    ],
    venue: en ? { name: "The family courtyard", address: "Brazzaville, Congo" } : { name: "La cour familiale", address: "Brazzaville, Congo" },
    dressCode: {
      ...data.dressCode,
      title: "",
      note: "",
      men: { label: en ? "Gentlemen" : "Messieurs", text: en ? "Shirt in the family cloth, plain trousers" : "Chemise dans le pagne de la famille, pantalon uni" },
      women: { label: en ? "Ladies" : "Mesdames", text: en ? "Dress or kaba in the family cloth, head wrap welcome" : "Robe ou kaba dans le pagne de la famille, foulard bienvenu" },
      colors: [
        { name: en ? "Ivory" : "Ivoire", hex: "#F3E7D3" },
        { name: en ? "Gold" : "Or", hex: "#C9A24A" },
      ],
    },
    verse: null,
    story: [],
    rsvpBy: en ? "Please reply before 1 May 2027" : "Merci de répondre avant le 1er mai 2027",
    dot: { families: en ? "The Mabiala and Okemba families" : "Les familles Mabiala et Okemba", fabric: null, fabric2: null, scale: 100 },
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
  if (template === "dot") return dotSampleData(lang);
  if (isBirthday(template)) return birthdaySample(template, lang);
  if (isBaby(template)) return babySample(lang);
  return sampleData(lang);
}

/** Exemple de baby shower (« Il était une fois ») : deux parents, bébé surprise, pronostics activés. */
export function babySample(lang: Lang = "fr"): InvitationData {
  const en = lang === "en";
  const base = sampleData(lang);
  return {
    ...base,
    partner1: "Chloé",
    partner2: "Malik",
    intro: en ? "Join us for a gentle afternoon to celebrate our baby before the big arrival." : "Venez partager un après-midi tout en douceur pour fêter bébé avant sa grande arrivée.",
    dateISO: "2027-02-20T15:00:00+01:00",
    venue: en ? { name: "Lilac House", address: "4 allée des Lilas, 31000 Toulouse, France" } : { name: "La Maison des Lilas", address: "4 allée des Lilas, 31000 Toulouse" },
    programme: en ? [
      { t: "3:00 pm", title: "Welcome and tea", note: "Cakes and lemonade" },
      { t: "4:00 pm", title: "Games and guesses", note: "Who will guess right?" },
      { t: "5:00 pm", title: "Opening the gifts", note: "With a lot of emotion" },
    ] : [
      { t: "15h00", title: "Accueil et goûter", note: "Gâteaux et citronnade" },
      { t: "16h00", title: "Jeux et pronostics", note: "Qui verra juste ?" },
      { t: "17h00", title: "Ouverture des cadeaux", note: "Avec beaucoup d'émotion" },
    ],
    dressCode: {
      enabled: true,
      title: en ? "Soft pastels" : "Douceur pastel",
      note: en ? "Gentle tones if you like: linen, sage, dusty pink." : "Des tons doux si vous le souhaitez : lin, sauge, rose poudré.",
      men: { label: "", text: "" }, women: { label: "", text: "" },
      colors: [
        { name: en ? "Linen" : "Lin", hex: "#E6D7BF" },
        { name: en ? "Sage" : "Sauge", hex: "#A9B8A0" },
        { name: en ? "Dusty pink" : "Rose poudré", hex: "#DDB3AA" },
      ],
    },
    verse: null,
    story: [],
    rsvpBy: en ? "Please reply before 1 February 2027" : "Merci de répondre avant le 1er février 2027",
    photoUrl: null,
    baby: { sex: "surprise", due: "2027-04", guesses: true, palette: "ivoire" },
  };
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
  const names = isBaby(template)
    ? (en ? ["Organic cotton sleeping bag", "Wooden baby mobile", "First picture books"] : ["Gigoteuse en coton bio", "Mobile en bois", "Premiers livres d'éveil"])
    : isKids(template)
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
