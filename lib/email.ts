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

/** "E-carte Studio <hello@ecartestudio.com>" → { name, email } */
function parseFrom(v: string) {
  const m = v.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1] || "E-carte Studio", email: m[2] } : { name: "E-carte Studio", email: v };
}

export async function sendEmail(mail: Mail): Promise<{ ok: boolean; test?: boolean }> {
  const key = clean(process.env.BREVO_API_KEY);
  const from = parseFrom(clean(process.env.EMAIL_FROM) || "E-carte Studio <hello@ecartestudio.com>");
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
const p = (t: string, muted = false) => `<p style="margin:0 0 16px;${FONT};font-size:15px;line-height:1.6;color:${muted ? "#857867" : "#2B2419"}">${esc(t)}</p>`;
const h1 = (t: string) => `<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;line-height:1.25;color:#1E1812">${esc(t)}</h1>`;
const linkBox = (label: string, url: string) =>
  `<div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:#F7F1E6;border:1px solid #EADBBE"><div style="${FONT};font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9A7B3F;margin-bottom:6px">${esc(label)}</div><div style="${FONT};font-size:15px;color:#5A4524;word-break:break-all;-webkit-user-select:all;user-select:all">${esc(url)}</div></div>`;
/* Lien d'envoi WhatsApp : Brevo réécrit le bouton pour suivre le clic, mais il redirige vers wa.me
   avec le message déjà écrit, qui contient le lien propre de l'invitation (pas l'adresse de suivi). */
const waLink = (msg: string) => `https://wa.me/?text=${encodeURIComponent(msg)}`;

function layout(lang: Lang | null | undefined, blocks: Block[]) {
  const c = emailDict(lang).common;
  const home = siteUrl(), domain = home.replace(/^https?:\/\//, "").replace(/\/$/, "");
  // En-tête : monogramme ES en image (PNG 2x, taille fixe : si les images sont bloquées, il ne reste qu'un petit cadre
  // avec le texte de remplacement) + nom de la marque en texte, toujours lisible.
  const logo = `${home}/brand/es-email-clair.png`;
  const SERIF = "font-family:Georgia,'Times New Roman',serif";
  const rule = (w: number) => `<td style="width:${w}px;height:1px;font-size:0;line-height:0;border-top:1px solid #8A7448">&nbsp;</td>`;
  return `<!doctype html><html lang="${lang === "en" ? "en" : "fr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#F3ECE3">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3ECE3"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-radius:18px;overflow:hidden;background:#FFFDF9;border:1px solid #E6D9C2">
<tr><td align="center" style="background:#1E1812;padding:34px 24px 26px">
 <a href="${esc(home)}" style="text-decoration:none;display:inline-block"><img src="${esc(logo)}" width="96" height="81" alt="E-carte Studio" style="display:block;width:96px;height:81px;border:0;margin:0 auto;${FONT};font-size:14px;color:#D2B67F"></a>
 <div style="margin:18px 0 0;${SERIF};font-size:22px;letter-spacing:.32em;text-transform:uppercase;color:#F3EBDC;line-height:1">E-carte&nbsp;Studio</div>
 <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px auto 0"><tr>${rule(46)}<td style="padding:0 10px;${FONT};font-size:10px;line-height:1;color:#D2B67F">&#9670;</td>${rule(46)}</tr></table>
 <div style="margin:12px 0 0;${FONT};font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#B8A27A;line-height:1.4">${esc(c.tagline)}</div>
</td></tr>
<tr><td style="height:4px;font-size:0;line-height:0;background:#A8884F">&nbsp;</td></tr>
<tr><td style="padding:34px 30px 14px">${blocks.join("")}</td></tr>
<tr><td style="padding:0 30px"><div style="border-top:1px solid #EADFCB;font-size:0;line-height:0">&nbsp;</div></td></tr>
<tr><td align="center" style="padding:22px 30px 26px">
 <div style="${SERIF};font-size:14px;letter-spacing:.24em;text-transform:uppercase;color:#7A6640">E-carte&nbsp;Studio</div>
 <div style="margin:6px 0 14px"><a href="${esc(home)}" style="${FONT};font-size:13px;color:#A8884F;text-decoration:none">${esc(domain)}</a></div>
 <p style="margin:0;${FONT};font-size:12px;line-height:1.55;color:#9A8F84">${esc(c.footer)}</p>
</td></tr>
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

/** Enveloppe de marque personnalisée (même image que l'aperçu WhatsApp), entièrement cliquable. */
const envelope = (href: string, alt: string) =>
  `<div style="margin:0 0 20px;text-align:center"><a href="${esc(href)}" style="display:inline-block;text-decoration:none"><img src="${esc(href)}/opengraph-image" width="520" alt="${esc(alt)}" style="display:block;width:100%;max-width:520px;height:auto;border:0;border-radius:10px"></a></div>`;

export function publishedEmail(lang: Lang | null | undefined, d: Who, token: string, slug: string): Omit<Mail, "to"> {
  const t = emailDict(lang), n = names(lang, d);
  const pub = `${siteUrl()}${invitePath(slug)}`, space = `${siteUrl()}/espace/${token}`;
  return {
    subject: t.published.subject(n),
    html: layout(lang, [h1(t.published.title), p(t.common.hello(n)), p(t.published.body), envelope(pub, t.published.cardAlt(n)), linkBox(t.published.share, pub), `<div style="margin:0 0 18px">${button(waLink(t.published.waMsg(pub)), t.published.wa)}${button(pub, t.published.open, true)}${button(space, t.common.openSpace, true)}</div>`, p(t.published.after), p(t.common.keep, true)]),
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

/* ---------- Après l'événement (lib/aftercare.ts) ---------- */

const stopLine = (lang: Lang | null | undefined, token: string) => {
  const c = emailDict(lang).aftercare;
  return `<p style="margin:8px 0 0;${FONT};font-size:12px;line-height:1.5;color:#9A8F94">${esc(c.stop)} <a href="${esc(`${siteUrl()}/avis/${token}?stop=1`)}" style="color:#9A8F94">${esc(c.stopLink)}</a></p>`;
};

export function reviewRequestEmail(lang: Lang | null | undefined, d: Who, token: string, kind: string): Omit<Mail, "to"> {
  const t = emailDict(lang), n = names(lang, d), ev = t.aftercare.event[kind] ?? t.aftercare.event.mariage;
  const url = `${siteUrl()}/avis/${token}`;
  const stars = `<div style="margin:0 0 14px;font-size:30px;letter-spacing:6px;color:#D9B76E">★★★★★</div>`;
  return {
    subject: t.review.subject(ev),
    html: layout(lang, [h1(t.review.subject(ev)), p(t.common.hello(n)), p(t.review.body(ev)), p(t.review.ask), `<div style="margin:0 0 18px;text-align:center">${stars}${button(url, t.review.button)}</div>`, p(t.review.thanks), stopLine(lang, token)]),
    text: text([t.common.hello(n), t.review.body(ev), t.review.ask, `${t.review.button} : ${url}`, t.review.thanks, `${t.aftercare.stopLink} : ${siteUrl()}/avis/${token}?stop=1`]),
  };
}

export function followupEmail(lang: Lang | null | undefined, d: Who, token: string, kind: string, code: string | null): Omit<Mail, "to"> {
  const t = emailDict(lang), n = names(lang, d), ev = t.aftercare.event[kind] ?? t.aftercare.event.mariage;
  const create = `${siteUrl()}/creer`;
  const codeBox = code ? `<div style="margin:0 0 18px;padding:16px;border-radius:12px;background:#F7F1E6;border:1px dashed #C9A86A;text-align:center"><div style="${FONT};font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9A7B3F;margin-bottom:8px">${esc(t.followup.code)}</div><div style="font-family:Georgia,serif;font-size:26px;letter-spacing:.12em;color:#1D1418">${esc(code)}</div></div>` : "";
  return {
    subject: t.followup.subject,
    html: layout(lang, [h1(t.followup.subject), p(t.common.hello(n)), p(t.followup.body(ev)), p(t.followup.next), codeBox, `<div style="margin:0 0 18px">${button(create, t.followup.button)}</div>`, p(t.followup.friend), stopLine(lang, token)]),
    text: text([t.common.hello(n), t.followup.body(ev), t.followup.next, code && `${t.followup.code} : ${code}`, `${t.followup.button} : ${create}`, t.followup.friend, `${t.aftercare.stopLink} : ${siteUrl()}/avis/${token}?stop=1`]),
  };
}

/** Alerte à l'administrateur : nouvel avis à valider (en français, comme toute l'admin). */
export function newReviewEmail(r: { rating: number; display_name: string; body: string; kind: string }): Omit<Mail, "to"> {
  const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
  const url = `${siteUrl()}/admin/avis`;
  const subject = `Nouvel avis ${stars} de ${r.display_name}`;
  return {
    subject,
    html: layout("fr", [h1("Nouvel avis à valider"), `<div style="margin:0 0 10px;font-size:24px;letter-spacing:4px;color:#D9B76E">${stars}</div>`, p(`${r.display_name} · ${r.kind}`), `<div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:#F7F1E6;border:1px solid #EADBBE;${FONT};font-size:15px;line-height:1.6;color:#2B2128;white-space:pre-wrap">${esc(r.body)}</div>`, p("Il n'apparaîtra sur le site qu'après votre validation."), `<div style="margin:0 0 18px">${button(url, "Ouvrir les avis")}</div>`]),
    text: text([subject, r.body, `Ouvrir les avis : ${url}`]),
  };
}

/** Adresse e-mail valide (forme simple) ou null. */
export const cleanEmail = (v: unknown) => (typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? v.trim().toLowerCase().slice(0, 200) : null);

/** Code de connexion à l'administration (en français, comme toute l'admin), même en-tête que les autres e-mails. */
export function adminCodeEmail(code: string, t: { subject: string; intro: string; expiry: string }): Omit<Mail, "to"> {
  return {
    subject: t.subject,
    html: layout("fr", [h1(t.intro), `<div style="margin:0 0 18px;padding:18px;border-radius:12px;background:#F7F1E6;border:1px solid #EADBBE;text-align:center;font-family:Georgia,serif;font-size:34px;letter-spacing:.3em;color:#1E1812">${esc(code)}</div>`, p(t.expiry, true)]),
    text: text([`${t.intro} ${code}`, t.expiry]),
  };
}
