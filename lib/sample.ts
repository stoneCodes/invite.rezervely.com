import type { InvitationData } from "./types";
import type { Lang } from "./i18n";

/** Données d'exemple : démo publique et point de départ de l'éditeur, dans la langue demandée. */
export function sampleData(lang: Lang = "fr"): InvitationData {
  return lang === "en" ? sampleEn() : sampleFr();
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
