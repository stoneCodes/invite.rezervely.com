/* Dernière invitation enregistrée sur cet appareil : permet d'afficher « Reprendre l'invitation de … » au retour.
   Simple confort (stockage du navigateur) : si c'est vide ou bloqué, on propose « Retrouver mon espace » par e-mail. */

export type LastInvite = { token: string; names: string };
const KEY = "je-last-invite";

export function getLastInvite(): LastInvite | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return v && typeof v.token === "string" && /^[0-9A-Za-z]{32}$/.test(v.token) ? { token: v.token, names: String(v.names ?? "") } : null;
  } catch { return null; }
}

export function setLastInvite(v: LastInvite) {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* stockage indisponible : sans conséquence */ }
}

/** Lien de l'espace : la dernière invitation de cet appareil si on la connaît, sinon la page « Retrouver mon espace ». */
export const spaceHref = (last: LastInvite | null) => (last ? `/espace/${last.token}` : "/espace");
