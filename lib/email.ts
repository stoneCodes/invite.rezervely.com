import "server-only";
import { emailDict } from "./i18n/email";
import type { Lang } from "./i18n";
import { siteUrl } from "./supabase";
import { invitePath } from "./slug";

/* Envoi des e-mails aux mariés, par l'API transactionnelle de Brevo.
   Sans BREVO_API_KEY (en local par exemple), rien ne part : l'e-mail est affiché dans le terminal (mode test).
   Changer de service = réécrire seulement sendEmail(). */

type Mail = { to: string; subject: string; html: string; text: string };

const clean = (v?: string) => v?.trim().replace(/^["']|["']$/g, "").trim() || "";

/** "E-carte Studio <hello@joyeuxevent.com>" → { name, email } */
function parseFrom(v: string) {
  const m = v.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1] || "E-carte Studio", email: m[2] } : { name: "E-carte Studio", email: v };
}

export async function sendEmail(mail: Mail): Promise<{ ok: boolean; test?: boolean }> {
  const key = clean(process.env.BREVO_API_KEY);
  const from = parseFrom(clean(process.env.EMAIL_FROM) || "E-carte Studio <hello@joyeuxevent.com>");
  const replyTo = clean(process.env.EMAIL_REPLY_TO);
  if (!key) {
    console.info(`\n[e-mail · mode test] à ${mail.to} · « ${mail.subject} »\n${mail.text}\n`);
    return { ok: true, test: true };
  }
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: from,
        to: [{ email: mail.to }],
        subject: mail.subject,
        htmlContent: mail.html,
        textContent: mail.text,
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      }),
    });
    if (!res.ok) { console.error("brevo", res.status, (await res.text()).slice(0, 300)); return { ok: false }; }
    return { ok: true };
  } catch (e) {
    console.error("brevo", e instanceof Error ? e.message : e);
    return { ok: false };
  }
}

/* ---------- Mise en page commune (tableaux + styles en ligne : compatible Gmail, Outlook, Apple Mail) ---------- */

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const FONT = "font-family:Helvetica,Arial,sans-serif";

const button = (href: string, label: string, ghost = false) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:6px 8px 6px 0;padding:13px 22px;border-radius:999px;${FONT};font-size:15px;text-decoration:none;${
    ghost ? "color:#7A5A22;border:1px solid #C9A86A;background:#ffffff" : "color:#1A1208;background:#D9B76E;border:1px solid #C9A86A;font-weight:bold"
  }">${esc(label)}</a>`;

type Block = string;
const p = (t: string, muted = false) => `<p style="margin:0 0 16px;${FONT};font-size:15px;line-height:1.6;color:${muted ? "#7B6F75" : "#2B2128"}">${esc(t)}</p>`;
const h1 = (t: string) => `<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;line-height:1.2;color:#1D1418">${esc(t)}</h1>`;
const linkBox = (label: string, url: string) =>
  `<div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:#F7F1E6;border:1px solid #EADBBE"><div style="${FONT};font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9A7B3F;margin-bottom:6px">${esc(label)}</div><a href="${esc(url)}" style="${FONT};font-size:15px;color:#5E3B4F;word-break:break-all">${esc(url)}</a></div>`;

function layout(lang: Lang | null | undefined, blocks: Block[]) {
  const c = emailDict(lang).common;
  // Logo en texte (pas d'image) : beaucoup d'applis mail bloquent les images par défaut et affichaient un grand cadre vide.
  const home = siteUrl();
  return `<!doctype html><html lang="${lang === "en" ? "en" : "fr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#F3ECE3">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3ECE3"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-radius:18px;overflow:hidden;background:#ffffff">
<tr><td align="center" style="background:#0D0911;padding:22px 24px"><a href="${esc(home)}" style="text-decoration:none;${FONT};font-size:28px;letter-spacing:.02em;line-height:1"><span style="color:#F4EADB">E-carte</span> <span style="color:#D9B76E">Studio</span></a></td></tr>
<tr><td style="padding:30px 28px 14px">${blocks.join("")}</td></tr>
<tr><td style="padding:0 28px 26px">${p(c.footer, true)}</td></tr>
</table></td></tr></table></body></html>`;
}

/** Version texte (clients sans HTML, aperçu dans les notifications, mode test). */
const text = (lines: (string | false | null | undefined)[]) => lines.filter(Boolean).join("\n\n");

/* ---------- Les e-mails ---------- */

type Who = { partner1: string; partner2: string };
// Anniversaire : un seul prénom (partner2 vide).
const names = (lang: Lang | null | undefined, d: Who) => (d.partner2 ? emailDict(lang).common.couple(d.partner1 || "…", d.partner2) : d.partner1 || "…");

export function welcomeEmail(lang: Lang | null | undefined, d: Who, token: string): Omit<Mail, "to"> {
  const t = emailDict(lang), n = names(lang, d);
  const space = `${siteUrl()}/espace/${token}`, edit = `${siteUrl()}/creer?edit=${token}`;
  return {
    subject: t.welcome.subject,
    html: layout(lang, [h1(t.welcome.title), p(t.common.hello(n)), p(t.welcome.body), `<div style="margin:0 0 18px">${button(space, t.common.openSpace)}${button(edit, t.common.edit, true)}</div>`, p(t.common.keep, true)]),
    text: text([t.common.hello(n), t.welcome.body, `${t.common.openSpace} : ${space}`, `${t.common.edit} : ${edit}`, t.common.keep]),
  };
}

export function publishedEmail(lang: Lang | null | undefined, d: Who, token: string, slug: string): Omit<Mail, "to"> {
  const t = emailDict(lang), n = names(lang, d);
  const pub = `${siteUrl()}${invitePath(slug)}`, space = `${siteUrl()}/espace/${token}`;
  return {
    subject: t.published.subject(n),
    html: layout(lang, [h1(t.published.title), p(t.common.hello(n)), p(t.published.body), linkBox(t.published.share, pub), `<div style="margin:0 0 18px">${button(pub, t.published.open)}${button(space, t.common.openSpace, true)}</div>`, p(t.published.after), p(t.common.keep, true)]),
    text: text([t.common.hello(n), t.published.body, `${t.published.share} : ${pub}`, t.published.after, `${t.common.openSpace} : ${space}`, t.common.keep]),
  };
}

export type RecapLine = { name: string; attending: boolean; guests: number; message: string | null };

export function recapEmail(lang: Lang | null | undefined, d: Who, token: string, lines: RecapLine[], totals: { yes: number; no: number }): Omit<Mail, "to"> {
  const t = emailDict(lang), n = names(lang, d);
  const space = `${siteUrl()}/espace/${token}`;
  const status = (r: RecapLine) => (r.attending ? t.recap.yes(r.guests) : t.recap.no);
  const rows = lines
    .map((r) => `<tr><td style="padding:12px 0;border-bottom:1px solid #EFE6DA;${FONT}"><div style="font-size:15px;color:#1D1418;font-weight:bold">${esc(r.name)}</div><div style="font-size:13px;color:${r.attending ? "#3F7A4E" : "#9A5A62"};margin-top:2px">${esc(status(r))}</div>${r.message ? `<div style="font-size:14px;color:#5B4F55;margin-top:6px;font-style:italic">« ${esc(r.message)} »</div>` : ""}</td></tr>`)
    .join("");
  return {
    subject: t.recap.subject(lines.length, n),
    html: layout(lang, [h1(t.recap.title(lines.length)), p(t.common.hello(n)), `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px">${rows}</table>`, p(t.recap.totals(totals.yes, totals.no)), `<div style="margin:0 0 18px">${button(space, t.common.openSpace)}</div>`]),
    text: text([t.common.hello(n), ...lines.map((r) => `• ${r.name} : ${status(r)}${r.message ? ` « ${r.message} »` : ""}`), t.recap.totals(totals.yes, totals.no), `${t.common.openSpace} : ${space}`]),
  };
}

export function linksEmail(lang: Lang | null | undefined, invites: (Who & { token: string })[]): Omit<Mail, "to"> {
  const t = emailDict(lang);
  const items = invites.map((i) => ({ n: names(lang, i), url: `${siteUrl()}/espace/${i.token}` }));
  return {
    subject: t.links.subject,
    html: layout(lang, [h1(t.links.title), p(t.links.body), ...items.map((i) => linkBox(i.n, i.url)), p(t.links.ignore, true)]),
    text: text([t.links.body, ...items.map((i) => `${i.n} : ${i.url}`), t.links.ignore]),
  };
}

/** Adresse e-mail valide (forme simple) ou null. */
export const cleanEmail = (v: unknown) => (typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? v.trim().toLowerCase().slice(0, 200) : null);
