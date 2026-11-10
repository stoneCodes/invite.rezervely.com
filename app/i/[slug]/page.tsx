import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBySlug } from "@/lib/supabase";
import { dateParts } from "@/components/invitation/engine";
import InviteClient from "./InviteClient";
import { siteDict } from "@/lib/i18n/site";
import { displayNames, isBaby, isBirthday } from "@/lib/types";

type P = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const inv = await getBySlug((await params).slug);
  const t = siteDict(inv?.data.lang ?? "fr");
  if (!inv || inv.status !== "published") return { title: t.meta.invitation, robots: { index: false } };
  const d = inv.data;
  const when = dateParts(d.dateISO, d.lang);
  const baby = isBaby(inv.template);
  const title = isBirthday(inv.template) ? t.meta.birthday(d.partner1) : baby ? t.meta.baby(displayNames(d)) : t.meta.invites(d.partner1, d.partner2);
  const description = when ? (isBirthday(inv.template) ? t.meta.partyOn : baby ? t.meta.babyOn : t.meta.weddingOn)(`${when.day} ${when.month} ${when.year}`) : t.meta.openInvite;
  return {
    title: { absolute: title },
    description,
    // Aperçu WhatsApp / iMessage : titre, texte et enveloppe de marque (opengraph-image).
    openGraph: { title, description, siteName: "E-carte Studio", type: "website", locale: d.lang === "en" ? "en_US" : "fr_FR" },
    robots: { index: false, follow: false },
  };
}

export default async function InvitePage({ params }: P) {
  const inv = await getBySlug((await params).slug);
  if (!inv || inv.status !== "published") notFound();
  return <InviteClient data={inv.data} template={inv.template} slug={inv.slug} />;
}
