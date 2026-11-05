import type { InvitationData } from "./types";

/** Données d'exemple : démo publique et point de départ de l'éditeur. */
export function sampleData(): InvitationData {
  return {
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
