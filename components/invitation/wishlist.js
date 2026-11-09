// Liste de souhaits + cagnotte, commune à tous les modèles.
// Pas d'image : une ligne par article (nom, site en petit, flèche), le lien s'ouvre dans un nouvel onglet.
// Les couleurs suivent le texte du modèle (currentColor) ; un modèle peut poser --wl-accent sur son conteneur.
import { inviteDict } from "../../lib/i18n/invite";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Lien sûr (http/https) ou "" : on revérifie ici car l'aperçu de l'éditeur reçoit des données non nettoyées. */
function safe(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : "";
  } catch { return ""; }
}
const site = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };

const ARROW = `<svg class="wl-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16 16 8M9.5 8H16v6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const GIFT = `<svg class="wl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1.5-3-5-3.5-5-1.2C7 7 9.5 7 12 7Zm0 0c1.5-3 5-3.5 5-1.2C17 7 14.5 7 12 7Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

/** Données de la liste prêtes à afficher, ou null si rien à montrer. */
export function wishData(data) {
  const w = data && data.wishlist;
  if (!w) return null;
  const items = (w.items || [])
    .map((x) => { const url = safe(x && x.url); return { name: String((x && x.name) || "").trim() || site(url), url }; })
    .filter((x) => x.name);
  const fund = safe(w.fund);
  const note = String(w.note || "").trim();
  return items.length || fund ? { items, fund, note } : null;
}

/** Contenu (sans titre) : note, articles, bouton de cagnotte. "" si la liste est vide. */
export function wishHtml(data, cls = "") {
  const w = wishData(data);
  if (!w) return "";
  const W = inviteDict(data.lang).wish;
  const row = (x) => x.url
    ? `<li><a class="wl-item" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer nofollow" aria-label="${esc(x.name)} (${esc(W.newTab)})"><span class="wl-name">${esc(x.name)}</span><span class="wl-site">${esc(site(x.url))}</span>${ARROW}</a></li>`
    : `<li><span class="wl-item is-plain"><span class="wl-name">${esc(x.name)}</span></span></li>`;
  return `<div class="wl ${cls}">`
    + (w.note ? `<p class="wl-note">${esc(w.note)}</p>` : "")
    + (w.items.length ? `<ul class="wl-list">${w.items.map(row).join("")}</ul>` : "")
    + (w.fund ? `<a class="wl-fund" href="${esc(w.fund)}" target="_blank" rel="noopener noreferrer nofollow" aria-label="${esc(W.fund)} (${esc(W.newTab)})">${GIFT}<span><b>${esc(W.fund)}</b><small>${esc(site(w.fund))}</small></span>${ARROW}</a>` : "")
    + `</div>`;
}
