import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InvitePage, { generateMetadata as inviteMetadata } from "../i/[slug]/page";
import { isPrettySlug } from "@/lib/slug";

/* Lien lisible à la racine : ecartestudio.com/lea-et-samuel-k7m2 (même page que /i/<slug>).
   Les pages du site (/creer, /espace, /demo…) passent avant cette route ; tout ce qui n'a pas la forme d'un lien d'invitation donne une 404. */

type P = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata(p: P): Promise<Metadata> {
  if (!isPrettySlug((await p.params).slug)) return { robots: { index: false } };
  return inviteMetadata(p);
}

export default async function PrettyInvitePage(p: P) {
  if (!isPrettySlug((await p.params).slug)) notFound();
  return InvitePage(p);
}
