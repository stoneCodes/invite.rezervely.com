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
    background: "#FFFDF7", text: "#33402B", muted: "#6E795F", accent: "#C2788A", rule: "#E4E2D0",
    titleFont: "/fonts/pdf/CormorantGaramond-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/Parisienne-Regular.ttf", ornament: "/pdf/ornaments/jardin-nuit.svg",
  },
  appel: {
    background: "#FFFAF5", text: "#3B2630", muted: "#8A747C", accent: "#B98A45", rule: "#E8D9C9",
    titleFont: "/fonts/pdf/CormorantGaramond-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/PinyonScript-Regular.ttf", ornament: "/pdf/ornaments/appel.svg",
  },
  "boule-neige": {
    background: "#FBF7EF", text: "#3B3128", muted: "#76685A", accent: "#A8844F", rule: "#E5D9C4",
    titleFont: "/fonts/pdf/CormorantGaramond-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/PinyonScript-Regular.ttf", ornament: "/pdf/ornaments/boule-neige.svg",
  },
  origami: {
    background: "#FBF6EE", text: "#4B3A30", muted: "#8A7566", accent: "#A9823F", rule: "#E2D1B8",
    titleFont: "/fonts/pdf/CormorantGaramond-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/PinyonScript-Regular.ttf", ornament: "/pdf/ornaments/origami.svg",
  },
  velours: {
    background: "#FFF9F3", text: "#40252A", muted: "#80646A", accent: "#A87843", rule: "#E8D3C2",
    titleFont: "/fonts/pdf/CormorantGaramond-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/PinyonScript-Regular.ttf", ornament: "/pdf/ornaments/velours.svg",
  },
  vinyle: {
    background: "#FBF7F0", text: "#2A1F17", muted: "#7A6A58", accent: "#A9822F", rule: "#E6D9C2",
    titleFont: "/fonts/pdf/Cinzel-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/GreatVibes-Regular.ttf", ornament: "/pdf/ornaments/vinyle.svg",
  },
  toast: {
    background: "#FCF9F1", text: "#18213A", muted: "#6B7088", accent: "#B8913B", rule: "#E9DFC4",
    titleFont: "/fonts/pdf/Cinzel-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/GreatVibes-Regular.ttf", ornament: "/pdf/ornaments/toast.svg",
  },
  gateau: {
    background: "#FFF9FB", text: "#5A2A3E", muted: "#8E6A7A", accent: "#D0668C", rule: "#F2D6E0",
    titleFont: "/fonts/pdf/CormorantGaramond-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/Parisienne-Regular.ttf", ornament: "/pdf/ornaments/gateau.svg",
  },
  pinata: {
    background: "#FFFBEF", text: "#5A3200", muted: "#8C6A3E", accent: "#E8577C", rule: "#F3E1B6",
    titleFont: "/fonts/pdf/CormorantGaramond-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/Parisienne-Regular.ttf", ornament: "/pdf/ornaments/pinata.svg",
  },
  livre: {
    background: "#FCF9F3", text: "#4A3B2A", muted: "#857563", accent: "#A8884F", rule: "#E8DCC6",
    titleFont: "/fonts/pdf/CormorantGaramond-VF.ttf", bodyFont: "/fonts/pdf/Jost-VF.ttf", scriptFont: "/fonts/pdf/PinyonScript-Regular.ttf", ornament: "/pdf/ornaments/livre.svg",
  },
};
