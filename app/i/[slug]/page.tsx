import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBySlug } from "@/lib/supabase";
import { dateParts } from "@/components/invitation/engine";
import InviteClient from "./InviteClient";

type P = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const inv = await getBySlug((await params).slug);
  if (!inv || inv.status !== "published") return { title: "Invitation", robots: { index: false } };
  const d = inv.data;
  const when = dateParts(d.dateISO);
  return {
    title: `${d.partner1} & ${d.partner2} vous invitent`,
    description: when ? `Mariage le ${when.day} ${when.month} ${when.year}. Ouvrez votre invitation.` : "Ouvrez votre invitation.",
    robots: { index: false, follow: false },
  };
}

export default async function InvitePage({ params }: P) {
  const inv = await getBySlug((await params).slug);
  if (!inv || inv.status !== "published") notFound();
  return <InviteClient data={inv.data} template={inv.template} slug={inv.slug} />;
}
