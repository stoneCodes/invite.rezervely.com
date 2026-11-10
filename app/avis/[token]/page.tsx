import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LegalLinks from "@/components/LegalLinks";
import Logo from "@/components/Logo";
import { LangSwitch } from "@/components/I18n";
import { getByToken } from "@/lib/supabase";
import { getT } from "@/lib/i18n/server";
import { reviewOf } from "@/lib/reviews";
import { displayNames } from "@/lib/types";
import ReviewForm, { StopForm } from "./ReviewForm";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).review.title, robots: { index: false } };
}

/** Avis du client (lien de l'e-mail « Comment s'est passé votre événement ? », ou de l'espace), et désabonnement (?stop=1). */
export default async function Avis({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ stop?: string }> }) {
  const { token } = await params;
  const { stop } = await searchParams;
  const t = await getT();
  const r = t.review;
  const inv = await getByToken(token);
  if (!inv) notFound();
  const existing = stop ? null : await reviewOf(inv.id);
  const names = displayNames(inv.data);

  return (
    <main className="site">
      <div className="wrap-site" style={{ paddingBlock: "40px 64px", maxWidth: 600, display: "grid", gap: 22 }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Link href="/" className="ed-home" aria-label={t.common.backHome}><span aria-hidden="true">←</span> <Logo height={28} /></Link>
          <LangSwitch />
        </nav>
        <header>
          <h1 style={{ fontSize: "2.4rem", margin: ".2em 0" }}>{stop ? r.stopTitle : r.title}</h1>
          <p className="muted" style={{ margin: 0 }}>{stop ? r.stopLead : r.lead}</p>
        </header>
        {stop ? <StopForm token={token} /> :
          inv.status !== "published" ? <p className="card-s" style={{ padding: 20, margin: 0 }}>{r.notYet}</p> :
          existing ? <p className="card-s" role="status" style={{ padding: 20, margin: 0 }}>{r.already}</p> :
          <ReviewForm token={token} defaultName={names} />}
        <LegalLinks />
      </div>
    </main>
  );
}
