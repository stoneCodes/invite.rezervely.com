import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/supabase";
import { invitePath } from "@/lib/slug";
import adminFr from "@/lib/i18n/admin-fr";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 50;
type Params = { page?: string; q?: string; filtre?: string };
type Row = { id: string; slug: string; data: { partner1: string; partner2: string; dateISO: string }; template: string; status: "draft"|"published"; owner_email: string|null; created_at: string; published_at: string|null; paid_at: string|null; paid_amount_cents: number|null; comped_at: string|null; rsvps: { count: number }[] };
const fmtDate = (value: string|null|undefined) => value ? new Intl.DateTimeFormat("fr-FR",{dateStyle:"medium"}).format(new Date(value)) : "—";
const amount = (cents: number|null) => typeof cents === "number" ? new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(cents/100) : "—";

export default async function InvitationsPage({ searchParams }: { searchParams: Promise<Params> }) {
  if (!await requireAdmin()) notFound();
  const params = await searchParams;
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page || "1", 10) || 1));
  const filter = ["brouillon","publiee","payee","offerte","passee"].includes(params.filtre || "") ? params.filtre! : "toutes";
  const search = (params.q || "").trim().replace(/[^\p{L}\p{N}@._ -]/gu, "").slice(0, 100);
  let query = db().from("invitations").select("id,slug,data,template,status,owner_email,created_at,published_at,paid_at,paid_amount_cents,comped_at,rsvps(count)",{count:"exact"}).order("created_at",{ascending:false});
  if (filter === "brouillon") query = query.eq("status","draft");
  if (filter === "publiee") query = query.eq("status","published");
  if (filter === "payee") query = query.not("paid_at","is",null);
  if (filter === "offerte") query = query.not("comped_at","is",null);
  if (filter === "passee") query = query.gte("data->>dateISO","2000").lt("data->>dateISO",new Date().toISOString());
  if (search) query = query.or(`slug.ilike.*${search}*,owner_email.ilike.*${search}*,data->>partner1.ilike.*${search}*,data->>partner2.ilike.*${search}*`);
  const { data, count, error } = await query.range((page-1)*PAGE_SIZE,page*PAGE_SIZE-1);
  if (error) return <main className="ad-main"><h1>{adminFr.invitations}</h1><p role="alert">{adminFr.pageError}</p></main>;
  const rows = (data || []) as unknown as Row[];
  const pages = Math.max(1,Math.ceil((count||0)/PAGE_SIZE));
  const hrefFor = (nextPage: number) => { const q = new URLSearchParams(); if(search)q.set("q",search); if(filter!=="toutes")q.set("filtre",filter); q.set("page",String(nextPage)); return `/admin/invitations?${q}`; };
  return <main className="ad-main">
    <div className="ad-title"><h1>{adminFr.invitationsTitle}</h1></div>
    <form method="get" className="ad-filters"><label>{adminFr.search}<input name="q" defaultValue={search} placeholder={adminFr.searchPlaceholder} maxLength={100}/></label><label>{adminFr.filter}<select name="filtre" defaultValue={filter}><option value="toutes">{adminFr.allStatuses}</option><option value="brouillon">{adminFr.draft}</option><option value="publiee">{adminFr.publishedStatus}</option><option value="payee">{adminFr.paidStatus}</option><option value="offerte">{adminFr.offeredStatus}</option><option value="passee">{adminFr.pastEvent}</option></select></label><button type="submit">{adminFr.apply}</button></form>
    {rows.length===0?<section className="ad-panel"><p>{adminFr.noInvitations}</p></section>:<div className="ad-panel ad-table-wrap"><table><thead><tr><th>{adminFr.coupleName}</th><th>{adminFr.emailColumn}</th><th>{adminFr.template}</th><th>{adminFr.status}</th><th>{adminFr.payment}</th><th>{adminFr.eventDate}</th><th>{adminFr.replyCount}</th><th>{adminFr.createdAt}</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><Link href={`/admin/invitations/${row.id}`}>{row.data.partner1} &amp; {row.data.partner2}</Link></td><td>{row.owner_email||"—"}</td><td>{row.template}</td><td>{row.status==="published"?adminFr.publishedStatus:adminFr.draft}</td><td>{row.comped_at?adminFr.offeredPayment:row.paid_at?amount(row.paid_amount_cents):adminFr.unpaid}</td><td>{fmtDate(row.data.dateISO)}</td><td>{row.rsvps?.[0]?.count??0}</td><td>{fmtDate(row.created_at)}</td></tr>)}</tbody></table></div>}
    <nav className="ad-pagination" aria-label={adminFr.invitations}><span>{adminFr.pageOf(page,pages)} · {count||0}</span><div>{page>1&&<Link href={hrefFor(page-1)}>{adminFr.previous}</Link>}{page<pages&&<Link href={hrefFor(page+1)}>{adminFr.next}</Link>}</div></nav>
  </main>;
}
