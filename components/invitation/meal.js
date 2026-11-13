// Choix du repas et des boissons, commun à tous les modèles (13 nov. 2026, lib/meal.ts).
// Affiché dans le formulaire de réponse seulement quand l'invité coche « présent » :
// une série de questions par personne (selon le nombre de personnes), choix en pastilles.
// Les couleurs suivent le texte du modèle ; un modèle peut poser --ml-accent (pastille choisie) et --ml-on (texte dessus).
import { inviteDict } from "../../lib/i18n/invite";
import { activeMeal } from "../../lib/meal";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
let uid = 0;

/** Vrai si l'invitation demande un choix de repas. */
export const hasMeal = (data) => !!activeMeal(data);

/** Monte le bloc dans el. update(nombre, présent) le recompose ; collect() renvoie
 *  { ok, choices, remarks } (ok=false si une question obligatoire est vide : elle est signalée et reçoit le focus). */
export function mountMeal(el, data) {
  const M = activeMeal(data);
  if (!el || !M) {
    if (el) el.hidden = true;
    return { update() {}, collect: () => ({ ok: true, choices: null, remarks: "" }) };
  }
  const T = inviteDict(data.lang).meal;
  const id = `ml${++uid}`;
  const state = []; // state[personne][question] = Set des libellés choisis
  let count = 1, yes = true, remarks = "", drawn = false;
  el.classList.add("ml");

  const pick = (p, q) => ((state[p] ||= [])[q] ||= new Set());

  function render() {
    drawn = true;
    el.hidden = !yes;
    if (!yes) { el.innerHTML = ""; return; }
    const people = Array.from({ length: count }, (_, p) => {
      const qs = M.questions.map((q, qi) => {
        const name = `${id}-${p}-${qi}`;
        const sel = pick(p, qi);
        const opts = q.options.map((o) => `<label class="ml-opt"><input type="${q.multi ? "checkbox" : "radio"}" name="${name}" value="${esc(o)}" data-p="${p}" data-q="${qi}"${sel.has(o) ? " checked" : ""}><span>${esc(o)}</span></label>`).join("");
        const req = q.required ? `<span class="ml-req" aria-label="${esc(T.required)}">*</span>` : "";
        const multi = q.multi ? `<small>${esc(T.several)}</small>` : "";
        return `<div class="ml-q" role="group" aria-labelledby="${name}-t"><p class="ml-qt" id="${name}-t">${esc(q.title)}${req}${multi}</p><div class="ml-opts">${opts}</div><p class="ml-miss" role="alert">${esc(T.missing)}</p></div>`;
      }).join("");
      return count > 1
        ? `<fieldset class="ml-person"><legend class="ml-who">${esc(T.person(p + 1))}</legend>${qs}</fieldset>`
        : `<div class="ml-person is-solo">${qs}</div>`;
    }).join("");
    const note = M.note ? `<p class="ml-note">${esc(M.note)}</p>` : "";
    const rem = M.remarks ? `<label class="ml-rem"><span>${esc(T.remarks)}</span><textarea class="ml-remarks" rows="2" maxlength="500" placeholder="${esc(T.remarksPh)}">${esc(remarks)}</textarea></label>` : "";
    el.innerHTML = `<div class="ml-head"><span class="ml-k">${esc(T.kicker)}</span>${note}</div>${people}${rem}`;
  }

  el.addEventListener("change", (e) => {
    const t = e.target;
    if (!t || !t.dataset || t.dataset.p == null) return;
    const p = +t.dataset.p, qi = +t.dataset.q, s = pick(p, qi);
    if (M.questions[qi].multi) { if (t.checked) s.add(t.value); else s.delete(t.value); }
    else { s.clear(); s.add(t.value); }
    const box = t.closest(".ml-q");
    if (box) box.classList.remove("is-missing");
  });
  el.addEventListener("input", (e) => { if (e.target.classList.contains("ml-remarks")) remarks = e.target.value; });

  function update(n, y) {
    const c = Math.max(1, Math.min(20, parseInt(n, 10) || 1));
    if (drawn && c === count && !!y === yes) return;
    count = c; yes = !!y; render();
  }

  function collect() {
    if (!yes) return { ok: true, choices: null, remarks: "" };
    let first = null;
    el.querySelectorAll(".ml-q").forEach((box) => box.classList.remove("is-missing"));
    for (let p = 0; p < count; p++) M.questions.forEach((q, qi) => {
      if (q.required && !pick(p, qi).size) {
        const input = el.querySelector(`input[name="${id}-${p}-${qi}"]`);
        const box = input && input.closest(".ml-q");
        if (box) box.classList.add("is-missing");
        if (!first) first = input;
      }
    });
    if (first) {
      first.closest(".ml-q").scrollIntoView({ block: "center", behavior: "smooth" });
      first.focus({ preventScroll: true });
      return { ok: false };
    }
    const choices = M.questions.map((q, qi) => ({ q: q.title, a: Array.from({ length: count }, (_, p) => q.options.filter((o) => pick(p, qi).has(o))) }));
    return { ok: true, choices, remarks: remarks.trim() };
  }

  render();
  return { update, collect };
}
