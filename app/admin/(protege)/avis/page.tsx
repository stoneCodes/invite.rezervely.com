import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { FOLLOWUP_DAYS, getAftercare, REVIEW_DAYS } from "@/lib/aftercare";
import { db } from "@/lib/supabase";
import type { Review } from "@/lib/reviews";
import adminFr from "@/lib/i18n/admin-fr";
import ReviewsAdmin from "./ReviewsAdmin";

export const dynamic = "force-dynamic";

/** Service après-vente : réglages des e-mails après l'événement + avis à valider / publiés / refusés. */
export default async function ReviewsPage() {
  if (!await requireAdmin()) notFound();
  const [settings, res] = await Promise.all([
    getAftercare(),
    db().from("reviews").select("*, invitations(edit_token)").order("created_at", { ascending: false }).limit(300),
  ]);
  const ready = !res.error;
  const reviews = ((res.data ?? []) as (Review & { invitations: { edit_token: string } | null })[]).map(({ invitations, ...r }) => ({ ...r, token: invitations?.edit_token ?? null }));
  return <main className="ad-main ad-rv-page">
    <div className="ad-price-intro"><div><span className="ad-price-kicker">{adminFr.reviewsKicker}</span><h1>{adminFr.reviewsTitle}</h1><p>{adminFr.reviewsDescription}</p></div></div>
    {!ready && <p className="ad-panel ad-music-warn" role="alert">{adminFr.reviewsMigration}</p>}
    <ReviewsAdmin settings={settings} reviews={reviews} limits={{ review: REVIEW_DAYS, followup: FOLLOWUP_DAYS }} ready={ready} dev={process.env.NODE_ENV !== "production"} />
  </main>;
}
