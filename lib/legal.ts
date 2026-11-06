/* Informations légales de l'éditeur, communes aux pages juridiques (FR/EN), au pied de page et aux règles de conservation.
   À mettre à jour ici seulement (adresse, médiateur, régime de TVA…). */

export const LEGAL = {
  brand: "joyeuxevent",
  owner: "Attisso Ngouegne Tovor", // entrepreneur individuel (mention « EI » obligatoire)
  siren: "990 116 683",
  address: "78 avenue des Champs-Élysées, 75008 Paris, France",
  domiciliation: "Source (société de domiciliation)",
  email: "hello@joyeuxevent.com",
  site: "joyeuxevent.com",
  vatFranchise: true, // franchise en base de TVA : « TVA non applicable, art. 293 B du CGI »
  /** Médiateur de la consommation : à renseigner dès l'adhésion (nom + site). */
  mediator: null as null | { name: string; url: string },
  updated: "2026-11-06",
} as const;

/** Durées de conservation (appliquées par la tâche quotidienne, lib/purge.ts). */
export const RETENTION = {
  /** Invitation, photo et réponses supprimées N jours après la date de l'événement (~3 mois). */
  afterEventDays: 92,
  /** Brouillon jamais publié supprimé N jours après sa dernière modification. */
  draftDays: 365,
} as const;
