import type { TemplateId } from "@/lib/types";

export type PdfTheme = {
  background: string;
  text: string;
  muted: string;
  accent: string;
  rule: string;
  titleFont: string;
  bodyFont: string;
  scriptFont: string;
  ornament: string;
};

/** Le Record force l'ajout d'un thème PDF quand un modèle rejoint TEMPLATES. */
export const PDF_THEMES: Record<TemplateId, PdfTheme> = {
  cygnes: {
    background: "#FFFAF8", text: "#4A2E35", muted: "#8C6B71", accent: "#B0606F", rule: "#E9D0D2",
    titleFont: "/fonts/pdf/CormorantGaramond-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/PinyonScript-Regular.ttf", ornament: "/pdf/ornaments/cygnes.svg",
  },
  "nuit-doree": {
    background: "#FFFCF5", text: "#3A2815", muted: "#806B4F", accent: "#A9772A", rule: "#E8D9B9",
    titleFont: "/fonts/pdf/Cinzel-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/GreatVibes-Regular.ttf", ornament: "/pdf/ornaments/nuit-doree.svg",
  },
  "jardin-nuit": {
    background: "#FFFAF9", text: "#29283A", muted: "#77748A", accent: "#C9708A", rule: "#E8D2DA",
    titleFont: "/fonts/pdf/CormorantGaramond-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/Parisienne-Regular.ttf", ornament: "/pdf/ornaments/jardin-nuit.svg",
  },
  appel: {
    background: "#FFFAF5", text: "#3B2630", muted: "#8A747C", accent: "#B98A45", rule: "#E8D9C9",
    titleFont: "/fonts/pdf/CormorantGaramond-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/PinyonScript-Regular.ttf", ornament: "/pdf/ornaments/appel.svg",
  },
  "boule-neige": {
    background: "#FCFBFF", text: "#272638", muted: "#77768A", accent: "#B18A4D", rule: "#DDDCEB",
    titleFont: "/fonts/pdf/CormorantGaramond-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/PinyonScript-Regular.ttf", ornament: "/pdf/ornaments/boule-neige.svg",
  },
  origami: {
    background: "#FBF6EE", text: "#4B3A30", muted: "#8A7566", accent: "#A9823F", rule: "#E2D1B8",
    titleFont: "/fonts/pdf/CormorantGaramond-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/PinyonScript-Regular.ttf", ornament: "/pdf/ornaments/origami.svg",
  },
};
