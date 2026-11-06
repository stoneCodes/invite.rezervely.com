"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import adminFr from "@/lib/i18n/admin-fr";

type Invitation = {
  id: string; slug: string | null; data: { partner1?: string; partner2?: string; dateISO?: string };
  status: string; template: string; created_at: string; paid_at: string | null;
  paid_amount_cents: number | null; comped_at: string | null; rsvps: { count: number }[];
};
type Summary = {
  activity: { created: number; published: number; paid: number; offered: number; revenue_cents: number };
  rsvps: { total: number; yes: number; no: number; people: number };
  templates: Record<string, number>; languages: { fr: number; en: number };
  recent: Invitation[];
};
type Detail = { title: string; stats: [string, string][]; invitations: Invitation[] };

const amount = (cents: number | null) => typeof cents === "number" ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100) : "—";
const date = (value?: string) => value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)) : "—";
const name = (item: Invitation) => [item.data?.partner1, item.data?.partner2].filter(Boolean).join(" & ") || adminFr.unknown;

export default function DashboardDetails({ summary, children }: { summary: Summary; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const open = (value: Detail) => { setDetail(value); dialog.current?.showModal(); };
  const close = () => dialog.current?.close();
  async function deleteInvitation(item: Invitation) {
    if (!window.confirm(adminFr.confirmDelete)) return;
    if (window.prompt(adminFr.deleteWord) !== "SUPPRIMER") { setActionError(adminFr.deleteMustType); return; }
    setDeleting(item.id); setActionError("");
    try {
      const response = await fetch(`/api/admin/invitations/${item.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", confirmation: "SUPPRIMER" }) });
      const result = await response.json();
      if (!response.ok || !result.deleted) throw new Error(result.error || adminFr.actionFailed);
      close(); router.refresh();
    } catch (error) { setActionError(error instanceof Error ? error.message : adminFr.actionFailed); }
    finally { setDeleting(null); }
  }
  const stats = summary.activity;
  const groups: Record<string, Detail> = {
    revenue: { title: adminFr.revenue, stats: [[adminFr.revenue, amount(stats.revenue_cents)], [adminFr.payments, String(stats.paid)], [adminFr.averagePayment, stats.paid ? amount(Math.round(stats.revenue_cents / stats.paid)) : "—"]], invitations: summary.recent.filter(x => x.paid_at && !x.comped_at) },
    created: { title: adminFr.created, stats: [[adminFr.created, String(stats.created)], [adminFr.published, String(stats.published)], [adminFr.draft, String(Math.max(0, stats.created - stats.published))]], invitations: summary.recent },
    published: { title: adminFr.published, stats: [[adminFr.published, String(stats.published)], [adminFr.paid, String(stats.paid)], [adminFr.offered, String(stats.offered)]], invitations: summary.recent.filter(x => x.status === "published") },
    paid: { title: adminFr.paid, stats: [[adminFr.paid, String(stats.paid)], [adminFr.revenue, amount(stats.revenue_cents)]], invitations: summary.recent.filter(x => x.paid_at) },
    offered: { title: adminFr.offered, stats: [[adminFr.offered, String(stats.offered)]], invitations: summary.recent.filter(x => x.comped_at) },
    conversion: { title: adminFr.conversion, stats: [[adminFr.conversionDetail(stats.created ? Math.round(stats.published / stats.created * 100) : 0, stats.created ? Math.round(stats.paid / stats.created * 100) : 0), ""], [adminFr.created, String(stats.created)], [adminFr.published, String(stats.published)], [adminFr.paid, String(stats.paid)]], invitations: summary.recent },
    rsvps: { title: adminFr.rsvps, stats: [[adminFr.total, String(summary.rsvps.total)], [adminFr.yesCount, String(summary.rsvps.yes)], [adminFr.noCount, String(summary.rsvps.no)], [adminFr.people, String(summary.rsvps.people)]], invitations: [] },
    templates: { title: adminFr.templates, stats: Object.entries(summary.templates).map(([key, value]) => [key, String(value)]), invitations: [] },
    languages: { title: adminFr.languages, stats: [[adminFr.french, String(summary.languages.fr)], [adminFr.english, String(summary.languages.en)]], invitations: [] },
  };
  const show = (key: keyof typeof groups) => open(groups[key]);
  return <>
    <div className="ad-dashboard-stats" onClick={event => { const key = (event.target as HTMLElement).closest<HTMLElement>("[data-detail]")?.dataset.detail as keyof typeof groups | undefined; if (key) show(key); }}>{children}</div>
    <dialog ref={dialog} className="ad-detail-dialog" aria-labelledby="ad-detail-title" onClick={event => { if (event.target === dialog.current) close(); }} onClose={() => setDetail(null)}>
      {detail && <div className="ad-detail-content"><header><div><span>{adminFr.details}</span><h2 id="ad-detail-title">{detail.title}</h2></div><button type="button" aria-label={adminFr.close} onClick={close}>×</button></header>
        <dl>{detail.stats.map(([label, value], index) => <div key={`${label}-${index}`}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl>
        {detail.invitations.length > 0 && <section><h3>{adminFr.recentInvitations}</h3><ul>{detail.invitations.map(item => <li key={item.id} className="ad-detail-invitation"><Link href={`/admin/invitations/${item.id}`} onClick={close}><span>{name(item)}</span><span>{item.paid_at ? amount(item.paid_amount_cents) : item.status === "published" ? adminFr.publishedStatus : adminFr.draft} · {date(item.created_at)}</span></Link><button type="button" className="ad-mini-danger" disabled={deleting===item.id} onClick={()=>void deleteInvitation(item)}>{deleting===item.id?adminFr.actionWorking:adminFr.deleteFromDashboard}</button></li>)}</ul><Link className="ad-detail-all" href="/admin/invitations" onClick={close}>{adminFr.allInvitations} →</Link></section>}
        {actionError&&<p className="ad-danger-message" role="alert">{actionError}</p>}
        {detail.invitations.length === 0 && <p className="ad-detail-empty">{adminFr.noDetailsList}</p>}
      </div>}
    </dialog>
  </>;
}
