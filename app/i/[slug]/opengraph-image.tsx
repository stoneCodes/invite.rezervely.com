import { getBySlug } from "@/lib/supabase";
import { dateParts } from "@/components/invitation/engine";
import { inviteDict } from "@/lib/i18n/invite";
import { displayNames, isBirthday } from "@/lib/types";
import { OG_SIZE, renderEnvelope } from "@/lib/og/envelope";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "E-carte Studio";

/** Image d'aperçu des liens (WhatsApp, iMessage…) et de l'e-mail « invitation en ligne » : enveloppe de marque personnalisée. */
export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const inv = await getBySlug((await params).slug);
  const published = !!inv && inv.status === "published";
  const og = inviteDict(inv?.data.lang).og;
  const when = published ? dateParts(inv.data.dateISO, inv.data.lang) : null;
  return renderEnvelope({
    kicker: isBirthday(inv?.template) ? og.birthday : og.married,
    names: published ? displayNames(inv.data) : og.fallback,
    date: when ? when.label : "",
    photo: published ? inv.data.photoUrl : null,
    brand: og.brand,
  });
}
