import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin/auth";
import adminFr from "@/lib/i18n/admin-fr";
import Link from "next/link";
import DashboardDetails from "./DashboardDetails";
export const dynamic = "force-dynamic";
type Summary = { activity: { created: number; published: number; paid: number; offered: number; revenue_cents: number }; rsvps: { total: number; yes: number; no: number; people: number }; templates: Record<string, number>; languages: { fr: number; en: number }; upcoming: { id:string; slug:string; data:{partner1:string;partner2:string;dateISO:string};template:string }[] };
type RecentInvitation = { id:string; slug:string|null; data:{partner1?:string;partner2?:string;dateISO?:string}; status:string; template:string; created_at:string; paid_at:string|null; paid_amount_cents:number|null; comped_at:string|null; rsvps:{count:number}[] };
const money = (cents: number) => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(cents/100);
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  if (!await requireAdmin()) notFound();
  const period = (await searchParams).periode || "30";
  const from = period === "all" ? null : new Date(Date.now() - (period === "today" ? 1 : Number(period)) * 864e5).toISOString();
  const { data, error } = await db().rpc("admin_dashboard", { p_from: from });
  if (error || !data) return <main className="ad-main"><h1>{adminFr.dashboard}</h1><p role="alert">{adminFr.loadError}</p><pre>{error?.message}</pre></main>;
  const s=data as Summary, a=s.activity;
  let recentQuery = db().from("invitations").select("id,slug,data,status,template,created_at,paid_at,paid_amount_cents,comped_at,rsvps(count)").order("created_at",{ascending:false}).limit(50);
  if(from) recentQuery=recentQuery.gte("created_at",from);
  const {data:recentData}=await recentQuery;
  const recent=(recentData||[]) as unknown as RecentInvitation[];
  return <main className="ad-main"><div className="ad-title"><h1>{adminFr.dashboard}</h1><form method="get"><label>{adminFr.period}<select name="periode" defaultValue={period}><option value="today">{adminFr.today}</option><option value="7">{adminFr.days7}</option><option value="30">{adminFr.days30}</option><option value="all">{adminFr.all}</option></select></label><button type="submit">{adminFr.apply}</button></form></div>
    <DashboardDetails summary={{...s,recent}}>
      <section className="ad-grid"><button type="button" data-detail="revenue" className="ad-stat ad-stat-button"><span>{adminFr.revenue}</span><strong>{money(a.revenue_cents)}</strong><small>{a.paid} {adminFr.payments.toLowerCase()}</small></button><button type="button" data-detail="created" className="ad-stat ad-stat-button"><span>{adminFr.created}</span><strong>{a.created}</strong></button><button type="button" data-detail="published" className="ad-stat ad-stat-button"><span>{adminFr.published}</span><strong>{a.published}</strong></button><button type="button" data-detail="paid" className="ad-stat ad-stat-button"><span>{adminFr.paid}</span><strong>{a.paid}</strong></button><button type="button" data-detail="offered" className="ad-stat ad-stat-button"><span>{adminFr.offered}</span><strong>{a.offered}</strong></button><button type="button" data-detail="conversion" className="ad-stat ad-stat-button"><span>{adminFr.conversion}</span><strong>{a.created?Math.round(a.published/a.created*100):0}%</strong><small>{adminFr.conversionDetail(a.created?Math.round(a.published/a.created*100):0,a.created?Math.round(a.paid/a.created*100):0)}</small></button></section>
      <section className="ad-grid ad-lower"><button type="button" data-detail="rsvps" className="ad-panel ad-detail-button"><h2>{adminFr.rsvps}</h2><p><strong>{s.rsvps.total}</strong> {adminFr.total} · {s.rsvps.yes} {adminFr.yesCount} · {s.rsvps.no} {adminFr.noCount}</p><p>{adminFr.people} : <strong>{s.rsvps.people}</strong></p></button><button type="button" data-detail="templates" className="ad-panel ad-detail-button"><h2>{adminFr.templates}</h2>{Object.entries(s.templates).map(([k,v])=><p key={k}>{k} <strong>{v}</strong></p>)}</button><button type="button" data-detail="languages" className="ad-panel ad-detail-button"><h2>{adminFr.languages}</h2><p>{adminFr.french} <strong>{s.languages.fr}</strong></p><p>{adminFr.english} <strong>{s.languages.en}</strong></p></button></section>
      <section className="ad-panel"><h2>{adminFr.upcoming}</h2>{s.upcoming.length===0?<p>{adminFr.emptyUpcoming}</p>:<div className="ad-table-wrap"><table><thead><tr><th>{adminFr.couple}</th><th>{adminFr.templates}</th><th>{adminFr.date}</th></tr></thead><tbody>{s.upcoming.map(i=><tr key={i.id}><td><Link href={`/admin/invitations/${i.id}`}>{i.data.partner1} &amp; {i.data.partner2}</Link></td><td>{i.template}</td><td>{i.data.dateISO}</td></tr>)}</tbody></table></div>}</section>
    </DashboardDetails>
  </main>;
}
