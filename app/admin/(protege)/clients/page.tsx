import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/supabase";
import adminFr from "@/lib/i18n/admin-fr";
import DeleteInvitationButton from "../invitations/DeleteInvitationButton";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;
type ClientInvitation = {
  id: string; partner1: string | null; partner2: string | null; event_date: string | null;
  status: string; paid_at: string | null; paid_amount_cents: number | null; comped_at: string | null;
  template: string; reply_count: number; created_at: string;
};
type Client = {
  client_key: string; email: string | null; invitation_count: number; published_count: number;
  paid_count: number; offered_count: number; reply_count: number; last_activity: string | null;
  invitations: ClientInvitation[];
};
type Result = { total: number; clients: Client[] };
const date = (value: string | null) => value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)) : "—";
const money = (cents: number | null) => typeof cents === "number" ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100) : "—";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  if (!await requireAdmin()) notFound();
  const params = await searchParams;
  const query = (params.q || "").trim().replace(/[^\p{L}\p{N}@._ -]/gu, "").slice(0, 100);
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page || "1", 10) || 1));
  const { data, error } = await db().rpc("admin_clients", { p_search: query || null, p_limit: PAGE_SIZE, p_offset: (page - 1) * PAGE_SIZE });
  if (error) return <main className="ad-main"><h1>{adminFr.clientManagementTitle}</h1><p role="alert">{adminFr.pageError}</p></main>;
  const result = data as Result;
  const clients = Array.isArray(result?.clients) ? result.clients : [];
  const total = Number(result?.total) || 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (target: number) => `/admin/clients?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(target) })}`;
  return <main className="ad-main ad-clients-page">
    <div className="ad-title"><div><h1>{adminFr.clientManagementTitle}</h1><p className="ad-page-intro">{adminFr.clientManagementIntro}</p></div></div>
    <form method="get" className="ad-filters ad-client-search"><label>{adminFr.searchClients}<input name="q" defaultValue={query} placeholder={adminFr.searchPlaceholder} maxLength={100}/></label><button type="submit">{adminFr.apply}</button></form>
    <section className="ad-panel ad-client-list"><div className="ad-client-list-title"><h2>{adminFr.clientManagement}</h2><span>{total} {adminFr.clientCount}</span></div>
      {clients.length === 0 ? <p>{adminFr.noClients}</p> : <div className="ad-table-wrap"><table><thead><tr><th>{adminFr.emailColumn}</th><th>{adminFr.clientInvitations}</th><th>{adminFr.clientPublished}</th><th>{adminFr.clientPaid}</th><th>{adminFr.clientOffered}</th><th>{adminFr.clientReplies}</th><th>{adminFr.lastActivity}</th></tr></thead><tbody>{clients.map(client => <tr key={client.client_key}>
        <td>{client.email || <span className="ad-muted">{adminFr.emailMissing}</span>}</td>
        <td><details className="ad-client-expand"><summary>{client.invitation_count}</summary><div><p className="ad-client-expand-count">{adminFr.recentOfTotal(client.invitations.length, client.invitation_count)}</p><ul>{client.invitations.map(invite => <li key={invite.id}><div><Link href={`/admin/invitations/${invite.id}`}>{[invite.partner1, invite.partner2].filter(Boolean).join(" & ") || adminFr.unknown}</Link><small>{invite.status === "published" ? adminFr.publishedStatus : adminFr.draft} · {invite.paid_at ? money(invite.paid_amount_cents) : invite.comped_at ? adminFr.offeredPayment : adminFr.unpaid} · {date(invite.event_date)}</small></div><DeleteInvitationButton id={invite.id}/></li>)}</ul></div></details></td>
        <td>{client.published_count}</td><td>{client.paid_count}</td><td>{client.offered_count}</td><td>{client.reply_count}</td><td>{date(client.last_activity)}</td>
      </tr>)}</tbody></table></div>}
      <nav className="ad-pagination" aria-label={adminFr.clientManagement}><span>{adminFr.pageOf(page, pages)} · {total}</span><div>{page > 1 && <Link href={pageHref(page - 1)}>{adminFr.previous}</Link>}{page < pages && <Link href={pageHref(page + 1)}>{adminFr.next}</Link>}</div></nav>
    </section>
    <section className="ad-panel ad-client-suggestions"><h2>{adminFr.clientSuggestionsTitle}</h2><p>{adminFr.clientSuggestions}</p></section>
  </main>;
}
