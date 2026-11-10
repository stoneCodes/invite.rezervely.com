import "server-only";
import { db } from "./supabase";
import { getAdminSetting } from "./admin/settings";
import { followupEmail, reviewRequestEmail, sendEmail } from "./email";
import { RETENTION } from "./legal";
import { TEMPLATES, type CategoryId, type InvitationData } from "./types";
import type { Lang } from "./i18n";

/* E-mails « après l'événement » (service après-vente, demandé par Glad le 10 nov. 2026), envoyés par la tâche quotidienne :
   1. demande d'avis N jours après la date de l'événement (7 par défaut) ;
   2. relance « un nouvel événement en vue ? » N jours après (90 par défaut, désactivée au départ), avec un code promo facultatif.
   Réglages dans /admin/avis (settings.aftercare). Une seule fois par invitation publiée, jamais si le client a refusé
   ces e-mails (marketing_optout). Fenêtre de rattrapage de 14 jours : une invitation dont la date est plus ancienne
   n'est pas relancée (premier déploiement, changement de réglage). La relance doit partir avant la suppression
   automatique de l'invitation (RETENTION.afterEventDays), d'où le plafond FOLLOWUP_MAX. */

export type Aftercare = {
  review: { enabled: boolean; days: number };
  followup: { enabled: boolean; days: number; code: string };
};
export const AFTERCARE_KEY = "aftercare";
export const REVIEW_DAYS = { min: 1, max: 60 };
export const FOLLOWUP_MAX = RETENTION.afterEventDays - 2;
export const FOLLOWUP_DAYS = { min: 14, max: FOLLOWUP_MAX };
const WINDOW_DAYS = 14;
export const AFTERCARE_DEFAULT: Aftercare = { review: { enabled: true, days: 7 }, followup: { enabled: false, days: Math.min(90, FOLLOWUP_MAX), code: "" } };

const int = (v: unknown, min: number, max: number, dflt: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
};
/** Nettoie des réglages venant de la base ou de l'admin. */
export function cleanAftercare(v: unknown): Aftercare {
  const o = (v && typeof v === "object" ? v : {}) as Partial<Record<keyof Aftercare, Record<string, unknown>>>;
  const r = o.review ?? {}, f = o.followup ?? {};
  return {
    review: { enabled: r.enabled === undefined ? AFTERCARE_DEFAULT.review.enabled : r.enabled === true, days: int(r.days, REVIEW_DAYS.min, REVIEW_DAYS.max, AFTERCARE_DEFAULT.review.days) },
    followup: {
      enabled: f.enabled === true,
      days: int(f.days, FOLLOWUP_DAYS.min, FOLLOWUP_DAYS.max, AFTERCARE_DEFAULT.followup.days),
      code: typeof f.code === "string" ? f.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30) : "",
    },
  };
}
export const getAftercare = async () => cleanAftercare(await getAdminSetting<Aftercare>(AFTERCARE_KEY).catch(() => null));

/** Catégorie d'une invitation (catégorie principale de son modèle). */
export const kindOf = (template: string): CategoryId => TEMPLATES.find((t) => t.id === template)?.categories[0] ?? "mariage";

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 16);

type Row = { id: string; template: string; edit_token: string; owner_email: string; owner_lang: Lang | null; data: InvitationData };

async function due(column: "aftercare_review_at" | "aftercare_followup_at", days: number) {
  const { data, error } = await db()
    .from("invitations")
    .select("id, template, edit_token, owner_email, owner_lang, data")
    .eq("status", "published")
    .not("owner_email", "is", null)
    .eq("marketing_optout", false)
    .is(column, null)
    .gte("data->>dateISO", daysAgo(days + WINDOW_DAYS))
    .lt("data->>dateISO", daysAgo(days))
    .limit(150);
  if (error) throw error;
  return (data ?? []) as Row[];
}

export async function sendAftercare() {
  const s = await getAftercare();
  const out = { reviews: 0, followups: 0, failed: 0, error: null as string | null };
  try {
    if (s.review.enabled) for (const r of await due("aftercare_review_at", s.review.days)) {
      const res = await sendEmail({ to: r.owner_email, ...reviewRequestEmail(r.owner_lang, r.data, r.edit_token, kindOf(r.template)) });
      if (!res.ok) { out.failed++; continue; } // réessayé demain
      await db().from("invitations").update({ aftercare_review_at: new Date().toISOString() }).eq("id", r.id);
      out.reviews++;
    }
    if (s.followup.enabled) for (const r of await due("aftercare_followup_at", s.followup.days)) {
      const res = await sendEmail({ to: r.owner_email, ...followupEmail(r.owner_lang, r.data, r.edit_token, kindOf(r.template), s.followup.code || null) });
      if (!res.ok) { out.failed++; continue; }
      await db().from("invitations").update({ aftercare_followup_at: new Date().toISOString() }).eq("id", r.id);
      out.followups++;
    }
  } catch (e) {
    // Migration 013 pas encore appliquée, par exemple : le récapitulatif et la purge continuent.
    out.error = (e as { message?: string })?.message ?? String(e);
    console.error("aftercare", out.error);
  }
  return out;
}
