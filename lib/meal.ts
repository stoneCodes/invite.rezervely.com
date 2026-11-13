// Choix du repas et des boissons (demandé par Glad le 13 nov. 2026, tous les modèles).
// Les organisateurs posent des questions (plat, boisson…) avec leurs choix ; chaque personne présente répond.
// Fichier sans dépendance serveur : utilisé par l'éditeur, les moteurs (meal.js), l'API et l'espace.
import type { InvitationData } from "./types";

export type MealQuestion = { title: string; options: string[]; multi: boolean; required: boolean };
export type Meal = { enabled: boolean; note: string; questions: MealQuestion[]; remarks: boolean };
/** Réponse enregistrée : pour chaque question (par son titre), les choix de chaque personne (a[personne] = libellés). */
export type MealChoice = { q: string; a: string[][] };

export const MEAL_MAX = { questions: 8, options: 12, title: 60, option: 60, note: 200, remarks: 500 };

/** Questions à poser aux invités, ou null si le choix du repas n'est pas activé (ou vide). */
export function activeMeal(data: Pick<InvitationData, "meal"> | null | undefined): Meal | null {
  const m = data?.meal;
  if (!m || !m.enabled || !Array.isArray(m.questions)) return null;
  const questions = m.questions
    .map((q) => ({ ...q, title: String(q?.title ?? "").trim(), options: (q?.options ?? []).map((o) => String(o ?? "").trim()).filter(Boolean) }))
    .filter((q) => q.title && q.options.length);
  return questions.length ? { ...m, note: String(m.note ?? "").trim(), questions } : null;
}

/** Vérifie les choix envoyés par un invité présent (côté serveur).
 *  Garde seulement les libellés proposés ; renvoie null si une question obligatoire est sans réponse. */
export function checkChoices(meal: Meal, raw: unknown, guests: number): MealChoice[] | null {
  const list = Array.isArray(raw) ? raw : [];
  const out: MealChoice[] = [];
  for (const q of meal.questions) {
    const sent = list.find((x) => x && typeof x === "object" && (x as MealChoice).q === q.title) as MealChoice | undefined;
    const a: string[][] = [];
    for (let p = 0; p < guests; p++) {
      const picked = Array.isArray(sent?.a?.[p]) ? sent!.a[p].filter((v) => typeof v === "string" && q.options.includes(v)) : [];
      const uniq = [...new Set(picked)];
      const keep = q.multi ? uniq : uniq.slice(0, 1);
      if (q.required && !keep.length) return null;
      a.push(keep);
    }
    out.push({ q: q.title, a });
  }
  return out;
}

export type MealTotal = { q: string; rows: { label: string; n: number }[] };

/** Totaux par question et par choix (une personne = une voix), dans l'ordre des questions de l'invitation.
 *  Les choix d'une ancienne version des questions (renommées ou retirées) sont ajoutés à la fin. */
export function mealTotals(meal: Meal | null, replies: { attending: boolean; choices?: MealChoice[] | null }[]): MealTotal[] {
  const map = new Map<string, Map<string, number>>();
  for (const q of meal?.questions ?? []) map.set(q.title, new Map(q.options.map((o) => [o, 0])));
  for (const r of replies) {
    if (!r.attending || !Array.isArray(r.choices)) continue;
    for (const c of r.choices) {
      if (!c || typeof c.q !== "string" || !Array.isArray(c.a)) continue;
      if (!map.has(c.q)) map.set(c.q, new Map());
      const m = map.get(c.q)!;
      for (const person of c.a) for (const v of Array.isArray(person) ? person : []) if (typeof v === "string") m.set(v, (m.get(v) ?? 0) + 1);
    }
  }
  return [...map].map(([q, m]) => ({ q, rows: [...m].map(([label, n]) => ({ label, n })) })).filter((t) => t.rows.some((r) => r.n > 0) || meal?.questions.some((x) => x.title === t.q));
}

/** Choix d'une réponse en texte court : « Plat : Poulet, Poisson · Boisson : Jus » (une valeur par personne). */
export function choicesText(choices: MealChoice[] | null | undefined): string {
  if (!Array.isArray(choices)) return "";
  return choices
    .map((c) => {
      const v = (c?.a ?? []).map((p) => (Array.isArray(p) ? p.join(" + ") : "")).filter(Boolean);
      return v.length ? `${c.q} : ${v.join(", ")}` : "";
    })
    .filter(Boolean)
    .join(" · ");
}
