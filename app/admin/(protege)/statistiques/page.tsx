import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getVisitStats } from "@/lib/admin/stats";
import { db } from "@/lib/supabase";
import adminFr from "@/lib/i18n/admin-fr";

export const dynamic="force-dynamic";
type Activity={created:number;published:number;paid:number};
type Summary={activity:Activity};
const number=(n:number)=>new Intl.NumberFormat("fr-FR").format(n);
const percentage=(part:number,total:number)=>total?Math.min(100,Math.round(part/total*100)):0;
const startFor=(days:number)=>{const now=new Date();return new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-(days-1))).toISOString();};
export default async function StatisticsPage({searchParams}:{searchParams:Promise<{jours?:string}>}){
  if(!await requireAdmin())notFound();
  const days=(await searchParams).jours==="7"?7:30;
  const start=startFor(days);
  const [{data:analytics,reason},{data:summary,error:dbError}]=await Promise.all([
    getVisitStats(days),
    db().rpc("admin_dashboard",{p_from:start}),
  ]);
  const activity=(summary as Summary|null)?.activity;
  const maxViews=Math.max(1,...(analytics?.daily||[]).map(day=>Math.max(day.pageViews,day.visits)));
  const maxFunnel=Math.max(1,activity?.created||0,analytics?.createPageViews||0);
  const formatDate=(iso:string)=>new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"short"}).format(new Date(`${iso}T12:00:00Z`));
  const breakdown=(title:string,items:{name:string;visits:number;pageViews:number}[],metric:"visits"|"pageViews")=><section className="ad-panel ad-breakdown"><h2>{title}</h2>{items.length===0?<p>{adminFr.noBreakdown}</p>:<ol>{items.map((item,index)=><li key={`${item.name}-${index}`}><span>{item.name||adminFr.unknown}</span><strong>{number(item[metric])}</strong></li>)}</ol>}</section>;
  return <main className="ad-main">
    <div className="ad-title"><h1>{adminFr.statistics}</h1><nav className="ad-period-links"><a aria-current={days===7?"page":undefined} href="/admin/statistiques?jours=7">{adminFr.last7Days}</a><a aria-current={days===30?"page":undefined} href="/admin/statistiques?jours=30">{adminFr.last30Days}</a></nav></div>
    {reason==="config"&&<section className="ad-panel" role="status"><h2>{adminFr.trafficStats}</h2><p>{adminFr.analyticsConfig}</p></section>}
    {reason==="query"&&<section className="ad-panel" role="alert"><h2>{adminFr.trafficStats}</h2><p>{adminFr.analyticsUnavailable}</p></section>}
    {analytics&&<>
      <section className="ad-grid"><article className="ad-stat"><span>{adminFr.visits}</span><strong>{number(analytics.daily.reduce((n,day)=>n+day.visits,0))}</strong></article><article className="ad-stat"><span>{adminFr.pageViews}</span><strong>{number(analytics.daily.reduce((n,day)=>n+day.pageViews,0))}</strong></article><article className="ad-stat"><span>{adminFr.creatorViews}</span><strong>{number(analytics.createPageViews)}</strong></article></section>
      <section className="ad-panel"><h2>{adminFr.trafficChart}</h2>{analytics.daily.every(day=>day.pageViews===0)?<p>{adminFr.analyticsEmpty}</p>:<div className="ad-chart" role="img" aria-label={adminFr.trafficChart}>{analytics.daily.map(day=><div className="ad-chart-day" key={day.date} title={`${formatDate(day.date)} · ${number(day.pageViews)} ${adminFr.pageViews} · ${number(day.visits)} ${adminFr.visits}`}><div className="ad-chart-bars"><i className="ad-bar-views" style={{height:`${Math.max(day.pageViews?3:0,day.pageViews/maxViews*100)}%`}}/><i className="ad-bar-visits" style={{height:`${Math.max(day.visits?3:0,day.visits/maxViews*100)}%`}}/></div><small>{formatDate(day.date)}</small></div>)}</div>}<p className="ad-sample">{adminFr.sampleLevel} : ×{number(Math.max(1,...analytics.daily.map(day=>day.sampleInterval)))}</p></section>
      <section className="ad-grid ad-traffic-breakdowns">{breakdown(adminFr.topPages,analytics.topPages,"pageViews")}{breakdown(adminFr.referers,analytics.referers,"visits")}{breakdown(adminFr.countries,analytics.countries,"visits")}{breakdown(adminFr.devices,analytics.devices,"visits")}{breakdown(adminFr.browsers,analytics.browsers,"visits")}</section>
    </>}
    <section className="ad-panel"><h2>{adminFr.funnel}</h2>{dbError||!activity?<p role="alert">{adminFr.loadError}</p>:<div className="ad-funnel">{[
      {label:adminFr.creatorViews,value:analytics?.createPageViews??null,rate:null as number|null,color:"#E7A6B6"},
      {label:adminFr.invitationsCreated,value:activity.created,rate:percentage(activity.created,analytics?.createPageViews||0),color:"#D9B76E"},
      {label:adminFr.invitationsPublished,value:activity.published,rate:percentage(activity.published,activity.created),color:"#c6a7da"},
      {label:adminFr.invitationsPaid,value:activity.paid,rate:percentage(activity.paid,activity.published),color:"#9dc6ad"},
    ].map(step=><div className="ad-funnel-step" key={step.label}><span>{step.label}</span><strong>{step.value===null?"—":number(step.value)}</strong><div className="ad-funnel-track"><i style={{width:`${step.value===null?0:Math.min(100,step.value/maxFunnel*100)}%`,background:step.color}}/></div>{step.rate!==null&&<small>{step.rate}%</small>}</div>)}</div>}</section>
  </main>;
}
