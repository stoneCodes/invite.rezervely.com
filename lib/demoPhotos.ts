import type { TemplateId } from "./types";

/** Photo de couple montrée dans les démos seulement (jamais dans une invitation publiée sans photo).
 *  Record sur tous les modèles : un nouveau modèle sans photo de démo fait échouer le typecheck.
 *  En réserve pour le prochain modèle : /img/demo-couple-reserve-prochain-modele.webp */
export const DEMO_PHOTOS: Record<TemplateId, string | null> = {
  cygnes: "/img/demo-couple-cygnes.webp",
  "nuit-doree": "/img/demo-couple-nuit-doree.webp",
  "jardin-nuit": "/img/demo-couple-jardin-nuit.webp",
  appel: "/img/demo-couple-appel.webp",
  "boule-neige": "/img/demo-couple-boule-neige.webp",
  origami: "/img/demo-couple-origami.webp",
  velours: "/img/demo-couple-velours.webp",
  // Anniversaires : pas encore de photo de démo (dessin à la place).
  vinyle: null,
  toast: null,
  gateau: null,
  pinata: null,
  // Baby shower : couple attendant un bébé (démos seulement).
  livre: "/img/demo-couple-livre.webp",
};
