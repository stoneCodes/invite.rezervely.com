import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin/auth";
import adminFr from "@/lib/i18n/admin-fr";
export const dynamic = "force-dynamic";
type Summary = { activity: { created: number; published: number; paid: number; offered: number; revenue_cents: number }; rsvps: { total: number; yes: number; no: number; people: number }; templates: Record<string, number>; languages: { fr: number; en: number }; upcoming: { id:string; slug:string; data:{partner1:string;partner2:string;dateISO:string};template:string }[] };
const money = (cents: number) => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(cents/100);
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  if (!await requireAdmin()) notFound();
  const period = (await searchParams).periode || "30";
  const from = period === "all" ? null : new Date(Date.now() - (period === "today" ? 1 : Number(period)) * 864e5).toISOString();
  const { data, error } = await db().rpc("admin_dashboard", { p_from: from });
  if (error || !data) return <main className="ad-main"><h1>{adminFr.dashboard}</h1><p role="alert">{adminFr.loadError}</p><pre>{error?.message}</pre></main>;
  const s=data as Summary, a=s.activity;
  return <main className="ad-main"><div className="ad-title"><h1>{adminFr.dashboard}</h1><form method="get"><label>{adminFr.period}<select name="periode" defaultValue={period}><option value="today">{adminFr.today}</option><option value="7">{adminFr.days7}</option><option value="30">{adminFr.days30}</option><option value="all">{adminFr.all}</option></select></label><button type="submit">{adminFr.apply}</button></form></div>
    <section className="ad-grid"><article className="ad-stat"><span>{adminFr.revenue}</span><strong>{money(a.revenue_cents)}</strong><small>{a.paid} {adminFr.payments.toLowerCase()}</small></article><article className="ad-stat"><span>{adminFr.created}</span><strong>{a.created}</strong></article><article className="ad-stat"><span>{adminFr.published}</span><strong>{a.published}</strong></article><article className="ad-stat"><span>{adminFr.paid}</span><strong>{a.paid}</strong></article><article className="ad-stat"><span>{adminFr.offered}</span><strong>{a.offered}</strong></article><article className="ad-stat"><span>{adminFr.conversion}</span><strong>{a.created?Math.round(a.published/a.created*100):0}%</strong><small>{adminFr.conversionDetail(a.created?Math.round(a.published/a.created*100):0,a.created?Math.round(a.paid/a.created*100):0)}</small></article></section>
    <section className="ad-grid ad-lower"><article className="ad-panel"><h2>{adminFr.rsvps}</h2><p><strong>{s.rsvps.total}</strong> {adminFr.total} · {s.rsvps.yes} {adminFr.yes.toLowerCase()} · {s.rsvps.no} {adminFr.no.toLowerCase()}</p><p>{adminFr.yes} : <strong>{s.rsvps.people}</strong></p></article><article className="ad-panel"><h2>{adminFr.templates}</h2>{Object.entries(s.templates).map(([k,v])=><p key={k}>{k} <strong>{v}</strong></p>)}</article><article className="ad-panel"><h2>{adminFr.languages}</h2><p>{adminFr.french} <strong>{s.languages.fr}</strong></p><p>{adminFr.english} <strong>{s.languages.en}</strong></p></article></section>
    <section className="ad-panel"><h2>{adminFr.upcoming}</h2>{s.upcoming.length===0?<p>{adminFr.emptyUpcoming}</p>:<div className="ad-table-wrap"><table><thead><tr><th>{adminFr.couple}</th><th>{adminFr.templates}</th><th>{adminFr.date}</th></tr></thead><tbody>{s.upcoming.map(i=><tr key={i.id}><td>{i.data.partner1} & {i.data.partner2}</td><td>{i.template}</td><td>{i.data.dateISO}</td></tr>)}</tbody></table></div>}</section>
  </main>;
}
