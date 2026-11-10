import "server-only";
import { db } from "./supabase";

/* Avis des clients (migration 013_avis.sql). Laissés depuis /avis/<jeton de l'espace>, validés dans /admin/avis,
   affichés sur l'accueil une fois publiés. Un avis par invitation. */

export type ReviewStatus = "pending" | "published" | "rejected";
export type Review = {
  id: string;
  invitation_id: string | null;
  rating: number;
  body: string;
  display_name: string;
  kind: string;
  event_date: string | null;
  lang: string;
  status: ReviewStatus;
  created_at: string;
  published_at: string | null;
};
/** Ce que l'accueil reçoit (pas d'identifiant d'invitation). */
export type PublicReview = Pick<Review, "id" | "rating" | "body" | "display_name" | "kind" | "event_date" | "created_at">;

export const REVIEW_LIMITS = { body: { min: 10, max: 1500 }, name: 60 };

const oneLine = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
/** Texte de l'avis : retours à la ligne gardés (2 au plus d'affilée), espaces superflus retirés. */
export const cleanBody = (v: unknown) =>
  typeof v === "string" ? v.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, REVIEW_LIMITS.body.max) : "";
export const cleanName = (v: unknown) => oneLine(v, REVIEW_LIMITS.name);
export const cleanRating = (v: unknown) => { const n = Math.round(Number(v)); return n >= 1 && n <= 5 ? n : 0; };

/** Avis publiés, du plus récent au plus ancien. Liste vide si la migration n'est pas appliquée ou en cas d'erreur. */
export async function getPublishedReviews(limit = 12): Promise<PublicReview[]> {
  try {
    const { data, error } = await db().from("reviews").select("id, rating, body, display_name, kind, event_date, created_at").eq("status", "published").order("published_at", { ascending: false }).limit(limit);
    if (error) return [];
    return (data ?? []) as PublicReview[];
  } catch { return []; }
}

/** Nombre et moyenne de tous les avis publiés (pour la note moyenne de l'accueil). */
export async function getReviewStats(): Promise<{ count: number; avg: number }> {
  try {
    const { data, error } = await db().from("reviews").select("rating").eq("status", "published").limit(5000);
    if (error || !data?.length) return { count: 0, avg: 0 };
    return { count: data.length, avg: data.reduce((n, r) => n + (r.rating as number), 0) / data.length };
  } catch { return { count: 0, avg: 0 }; }
}

/** Avis déjà laissé pour une invitation (null sinon, ou si la table n'existe pas encore). */
export async function reviewOf(invitationId: string): Promise<Pick<Review, "id" | "status"> | null> {
  const { data, error } = await db().from("reviews").select("id, status").eq("invitation_id", invitationId).maybeSingle();
  if (error) return null;
  return (data as Pick<Review, "id" | "status">) ?? null;
}
