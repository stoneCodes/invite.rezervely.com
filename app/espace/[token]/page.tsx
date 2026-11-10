import type { Metadata } from "next";
import LegalLinks from "@/components/LegalLinks";
import Link from "next/link";
import Logo from "@/components/Logo";
import { notFound } from "next/navigation";
import { db, getByToken, siteUrl } from "@/lib/supabase";
import CopyLink from "./CopyLink";
import { invitePath } from "@/lib/slug";
import { getLang } from "@/lib/i18n/server";
import { siteDict } from "@/lib/i18n/site";
import { LOCALE } from "@/lib/i18n";
import { LangSwitch } from "@/components/I18n";
import PdfDownloadButton from "./PdfDownloadButton";
import PublishButton from "./PublishButton";
import { displayNames } from "@/lib/types";
import { reviewOf } from "@/lib/reviews";
import { formatPrice, getPriceCents, needsPayment, paymentsOn, pdfAllowed as canPdf } from "@/lib/payment";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  return { title: siteDict(await getLang()).meta.space, robots: { index: false } };
}

type Rsvp = { id: string; name: string; attending: boolean; guests: number; message: string | null; created_at: string };

export default async function Espace({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ paiement?: string; enregistre?: string }> }) {
  const { token } = await params;
  const { paiement, enregistre } = await searchParams;
  const lang = await getLang();
  const t = siteDict(lang);
  const s = t.space;
  const inv = await getByToken(token);
  if (!inv) notFound();
  const pdfAllowed = await canPdf(inv);
  const payOn = await paymentsOn();
  const needPay = inv.status !== "published" && await needsPayment(inv);
  const price = needPay ? formatPrice(lang, await getPriceCents()) : null;
  const { data } = await db().from("rsvps").select("*").eq("invitation_id", inv.id).order("created_at", { ascending: false });
  const rsvps = (data ?? []) as Rsvp[];
  const yes = rsvps.filter((r) => r.attending);
  const guests = yes.reduce((n, r) => n + r.guests, 0);
  const link = `${siteUrl()}${invitePath(inv.slug)}`;
  // Après l'événement : invitation à laisser un avis (tant qu'il n'y en a pas).
  const ev = new Date(inv.data.dateISO).getTime();
  const askReview = inv.status === "published" && ev < Date.now() && !(await reviewOf(inv.id));
  const fmt = new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });
  return (
    <main className="site">
      <div className="wrap-site" style={{ paddingBlock: "40px 64px", maxWidth: 860, display: "grid", gap: 22 }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><Link href="/" className="ed-home" aria-label={t.common.backHome}><span aria-hidden="true">←</span> <Logo height={28} /></Link><LangSwitch /></nav>
        <header>
          <p className="muted" style={{ letterSpacing: ".3em", textTransform: "uppercase", fontSize: ".72rem", margin: 0 }}>{s.kicker}</p>
          <h1 style={{ fontSize: "2.6rem", margin: ".2em 0" }}>{displayNames(inv.data)}</h1>
          <p className="muted" style={{ margin: 0 }}>{s.keep}</p>
        </header>

        {enregistre && !paiement && <p className="ed-msg ok" role="status" style={{ margin: 0 }}>{s.saved}</p>}
        {paiement && (
          <p className={`ed-msg ${inv.status === "published" ? "ok" : "err"}`} role="status" style={{ margin: 0 }}>{inv.status === "published" ? t.pay.paid : t.pay.pending}</p>
        )}

        <section className="card-s" style={{ padding: 20, display: "grid", gap: 12 }}>
          <strong>{s.linkTitle}</strong>
          {inv.status === "published" ? (
            <CopyLink url={link} />
          ) : (
            <p className="muted" style={{ margin: 0 }}>{s.notPublished}</p>
          )}
          {inv.status !== "published" ? (
            <PublishButton token={token} needPay={needPay} label={price ? t.pay.publish(price) : t.editor.publish}
              copy={{ accept: t.legal.accept, cgv: t.legal.cgv, acceptRequired: t.legal.acceptRequired, fail: t.editor.msgPublishFail, redirect: t.pay.redirect, done: s.publishedNow }}
              extra={<><Link className="btn-s ghost" href={`/creer?edit=${token}`}>{s.edit}</Link><Link className="btn-s ghost" href={`/espace/${token}/voir`}>{s.see}</Link></>} />
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn-s" href={`/creer?edit=${token}`}>{s.edit}</Link>
              <Link className="btn-s ghost" href={`/espace/${token}/voir`}>{s.see}</Link>
            </div>
          )}
        </section>

        {askReview && (
          <section className="card-s" style={{ padding: 20, display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <p style={{ margin: 0, flex: "1 1 260px" }}><span aria-hidden="true" style={{ color: "#C29B52", letterSpacing: 2 }}>★★★★★ </span>{t.review.spaceAsk}</p>
            <Link className="btn-s" href={`/avis/${token}`}>{t.review.spaceCta}</Link>
          </section>
        )}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {([[s.stats.replies, rsvps.length], [s.stats.yes, guests], [s.stats.no, rsvps.length - yes.length]] as [string, number][]).map(([l, n]) => (
            <div key={l} className="card-s" style={{ padding: 16, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--f-serif)", fontSize: "2.2rem", fontVariantNumeric: "tabular-nums" }}>{n}</div>
              <div className="muted" style={{ fontSize: ".75rem", letterSpacing: ".15em", textTransform: "uppercase" }}>{l}</div>
            </div>
          ))}
        </section>

        <section className="card-s" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <strong>{s.repliesTitle}</strong>
            <div className="space-export-actions">
              <PdfDownloadButton token={token} allowed={pdfAllowed} partner1={inv.data.partner1} partner2={inv.data.partner2} dateISO={inv.data.dateISO} copy={{ download: s.pdfDownload, reserved: payOn ? s.pdfReserved : s.pdfAfterPublish, preparing: s.pdfPreparing, error: s.pdfError }} />
              {rsvps.length > 0 && <a className="btn-s ghost" href={`/espace/${token}/csv`}>{s.export}</a>}
            </div>
          </div>
          {rsvps.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>{s.empty}</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".92rem" }}>
                <thead><tr style={{ textAlign: "left" }}>{s.cols.map((h) => <th key={h} style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontWeight: 500 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {rsvps.map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{r.name}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", color: r.attending ? "var(--ok)" : "var(--err)" }}>{r.attending ? s.present : s.absent}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontVariantNumeric: "tabular-nums" }}>{r.guests}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", minWidth: 180 }}>{r.message}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>{fmt.format(new Date(r.created_at))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <LegalLinks />
      </div>
    </main>
  );
}
