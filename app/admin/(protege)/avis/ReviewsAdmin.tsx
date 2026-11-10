"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import adminFr from "@/lib/i18n/admin-fr";
import { fr as siteFr } from "@/lib/i18n/site-fr";
import type { Aftercare } from "@/lib/aftercare";
import type { Review } from "@/lib/reviews";

const A = adminFr;
type Row = Review & { token: string | null };
type Range = { min: number; max: number };
type Msg = { ok: boolean; text: string } | null;

async function post(body: unknown) {
  const res = await fetch("/api/admin/avis", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || A.actionFailed);
  return data;
}
const fmtDate = (iso: string | null, opts: Intl.DateTimeFormatOptions = { dateStyle: "long" }) => (iso ? new Intl.DateTimeFormat("fr-FR", { ...opts, timeZone: "Europe/Paris" }).format(new Date(iso)) : "—");

export default function ReviewsAdmin({ settings: initial, reviews, limits, ready, dev }: { settings: Aftercare; reviews: Row[]; limits: { review: Range; followup: Range }; ready: boolean; dev: boolean }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(s) !== JSON.stringify(initial);

  async function save() {
    setBusy(true); setMsg(null);
    try { const d = await post({ action: "settings", settings: s }); setS(d.settings); setMsg({ ok: true, text: A.aftercareSaved }); router.refresh(); }
    catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : A.actionFailed }); }
    finally { setBusy(false); }
  }

  const counts = { pending: 0, published: 0, rejected: 0 } as Record<string, number>;
  reviews.forEach((r) => counts[r.status]++);
  const [tab, setTab] = useState<string>(counts.pending || !counts.published ? "pending" : "published");
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [rowErr, setRowErr] = useState<string | null>(null);
  async function act(r: Row, action: string) {
    if (action === "delete" && !confirm(A.reviewConfirmDelete(r.display_name))) return;
    setRowBusy(r.id); setRowErr(null);
    try { await post({ action, id: r.id }); router.refresh(); }
    catch (e) { setRowErr(e instanceof Error ? e.message : A.actionFailed); }
    finally { setRowBusy(null); }
  }

  const days = (key: "review" | "followup", range: Range) => <label className="ad-rv-days">
    <span>{A.daysAfter}</span>
    <input type="number" inputMode="numeric" min={range.min} max={range.max} value={s[key].days} disabled={!ready}
      onChange={(e) => setS((v) => ({ ...v, [key]: { ...v[key], days: Number(e.target.value) } }))}
      onBlur={() => setS((v) => ({ ...v, [key]: { ...v[key], days: Math.min(range.max, Math.max(range.min, Math.round(v[key].days) || range.min)) } }))} />
  </label>;
  const toggle = (key: "review" | "followup") => <label className="ad-rv-switch">
    <input type="checkbox" checked={s[key].enabled} disabled={!ready} onChange={(e) => setS((v) => ({ ...v, [key]: { ...v[key], enabled: e.target.checked } }))} />
    <span>{s[key].enabled ? A.enabled : A.disabled}</span>
  </label>;
  const preview = (type: string) => dev && <a className="ad-rv-preview" href={`/api/dev/email?type=${type}${type === "followup" && s.followup.code ? `&code=${encodeURIComponent(s.followup.code)}` : ""}`} target="_blank" rel="noreferrer">{A.emailPreview} ↗</a>;

  const list = reviews.filter((r) => r.status === tab);
  return <>
    <section className="ad-panel ad-rv-settings">
      <h2>{A.aftercareTitle}</h2>
      <p>{A.aftercareHelp}</p>
      <div className="ad-rv-mails">
        <div className="ad-rv-mail">
          <div className="ad-rv-mail-head"><h3>{A.reviewToggle}</h3>{toggle("review")}</div>
          <p>{A.reviewToggleHelp}</p>
          {days("review", limits.review)}
          <small>{A.daysRange(limits.review.min, limits.review.max)}</small>
          {preview("review")}
        </div>
        <div className="ad-rv-mail">
          <div className="ad-rv-mail-head"><h3>{A.followupToggle}</h3>{toggle("followup")}</div>
          <p>{A.followupToggleHelp}</p>
          {days("followup", limits.followup)}
          <small>{A.followupMax(limits.followup.max)}</small>
          <label className="ad-rv-days ad-rv-code"><span>{A.followupCode}</span>
            <input value={s.followup.code} maxLength={30} disabled={!ready} placeholder="AMI10" onChange={(e) => setS((v) => ({ ...v, followup: { ...v.followup, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") } }))} />
          </label>
          <small>{A.followupCodeHelp}</small>
          {preview("followup")}
        </div>
      </div>
      <div className="ad-tpl-bar ad-rv-bar">
        <button type="button" className="ad-tpl-save" disabled={busy || !dirty || !ready} onClick={() => void save()}>{A.aftercareSave}</button>
        {msg && <small role={msg.ok ? "status" : "alert"} className={msg.ok ? "ok" : "err"}>{msg.text}</small>}
      </div>
    </section>

    <section className="ad-panel ad-rv-list">
      <div className="ad-rv-tabs" role="tablist">
        {Object.entries(A.reviewTabs).map(([k, label]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "active" : undefined} onClick={() => setTab(k)}>{label}<b>{counts[k]}</b></button>)}
      </div>
      <p className="ad-rv-rule">{A.reviewRule}</p>
      {rowErr && <p role="alert" className="ad-rv-err">{rowErr}</p>}
      {list.length === 0 ? <p className="ad-rv-empty">{A.reviewEmpty}</p> : <ul className="ad-rv-items">
        {list.map((r) => <li key={r.id} className="ad-rv-item">
          <div className="ad-rv-top">
            <span className="ad-rv-stars" aria-label={siteFr.home.reviewStars(r.rating)}>{"★".repeat(r.rating)}<i>{"★".repeat(5 - r.rating)}</i></span>
            <strong>{r.display_name}</strong>
            <small>{A.reviewEvent(siteFr.home.reviewKind[r.kind] ?? r.kind, fmtDate(r.event_date))} · {A.reviewReceived(fmtDate(r.created_at, { dateStyle: "medium", timeStyle: "short" }))}</small>
          </div>
          <p className="ad-rv-body">{r.body}</p>
          <div className="ad-rv-actions">
            {r.status !== "published" && <button type="button" className="ad-rv-pub" disabled={rowBusy === r.id} onClick={() => void act(r, "publish")}>{A.reviewPublish}</button>}
            {r.status === "published" && <button type="button" disabled={rowBusy === r.id} onClick={() => void act(r, "pending")}>{A.reviewUnpublish}</button>}
            {r.status === "pending" && <button type="button" disabled={rowBusy === r.id} onClick={() => void act(r, "reject")}>{A.reviewReject}</button>}
            {r.status === "rejected" && <button type="button" disabled={rowBusy === r.id} onClick={() => void act(r, "pending")}>{A.reviewRestore}</button>}
            {r.token && <a href={`/espace/${r.token}/voir`} target="_blank" rel="noreferrer">{A.reviewOpenInvitation} ↗</a>}
            <button type="button" className="ad-rv-del" disabled={rowBusy === r.id} onClick={() => void act(r, "delete")}>{A.reviewDelete}</button>
          </div>
        </li>)}
      </ul>}
    </section>
  </>;
}
