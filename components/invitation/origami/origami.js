// Modèle « Origami » : une enveloppe en papier washi plein écran, fermée par un sceau de cire gravé d'une grue ;
// le sceau se brise, les quatre rabats se déplient dans une lumière qui grandit, puis l'invitation apparaît.
// Chaque section est un pliage dessiné en code ; la date est dans une cocotte en papier ; la réponse part en avion.
// mountOrigami(racine, données, options) → { replay, destroy }. Même contrat que les autres modèles.
/* eslint-disable */
import { esc, dateParts } from "../engine";
import { inviteDict } from "../../../lib/i18n/invite";
import { wishHtml } from "../wishlist";
import { createMusic, fxLevel } from "../music";
import { coupleHtml, mountCouple } from "../dresscode/couple";

const IMG = { washi: "/img/origami-washi.webp", table: "/img/origami-table.webp", cranes: "/img/origami-grues.webp" };
const ICON = {
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.6 3 2.7-2.7-1.1-1.1-2.7 2.7-2.7-2.7-1.1 1.1 2.7 2.7-2.7 2.7 1.1 1.1 2.7-2.7 2.7 2.7 1.1-1.1z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
};

/* ---------- La grue : 8 facettes qui passent de leur place dans la grue à leur place dans la feuille dépliée ---------- */
const C = [100, 100], TL = [30, 30], T = [100, 30], TR = [170, 30], R = [170, 100], BR = [170, 170], B = [100, 170], BL = [30, 170], L = [30, 100];
const FACETS = [
  { c: [[104, 110], [156, 26], [120, 104]], s: [C, T, TR], k: 0.74, d: 0 },      // aile arrière
  { c: [[120, 122], [166, 70], [114, 112]], s: [C, TR, R], k: 0.86, d: 0.14 },   // queue
  { c: [[100, 112], [132, 124], [100, 146]], s: [C, R, BR], k: 0.68, d: 0.3 },   // ventre, côté ombre
  { c: [[86, 120], [42, 58], [78, 126]], s: [C, B, BL], k: 0.93, d: 0.2 },       // cou
  { c: [[42, 58], [30, 74], [48, 66]], s: [C, BL, L], k: 0.78, d: 0.26 },        // tête
  { c: [[100, 112], [100, 146], [68, 124]], s: [C, BR, B], k: 0.9, d: 0.32 },    // ventre, côté lumière
  { c: [[88, 118], [100, 106], [112, 118]], s: [C, L, TL], k: 0.82, d: 0.38 },   // dos
  { c: [[96, 112], [46, 30], [110, 100]], s: [C, TL, T], k: 1, d: 0.06 },        // aile avant
];
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pts = (p) => p.map((x) => x.map((n) => n.toFixed(1)).join(",")).join(" ");
const crane = (fill, id = "") => `<svg viewBox="22 20 152 132" aria-hidden="true">${FACETS.map((f) => `<polygon points="${pts(f.c)}" fill="${fill}"/><polygon points="${pts(f.c)}" fill="#4A2F1E" opacity="${((1 - f.k) * 1.15).toFixed(2)}"/>`).join("")}</svg>`;

// Sceau de cire dorée, bord irrégulier, grue gravée en creux (motif de la grue réduit dans le disque).
const SEAL = (() => {
  const n = 30, ptsW = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, r = 54 + Math.sin(i * 2.7) * 2.6 + Math.cos(i * 5.3) * 1.8; ptsW.push(`${(60 + Math.cos(a) * r).toFixed(1)},${(60 + Math.sin(a) * r).toFixed(1)}`); }
  // Grue de profil : aile dressée, corps, cou et tête à gauche, queue à droite
  // [facette, opacité] : aile arrière, corps, aile avant, cou, tête, queue (facettes plus ou moins sombres)
  const cr = [["62,60 92,30 74,63", .7], ["44,66 61,57 79,66 61,75", .79], ["58,61 70,22 68,64", .9], ["47,66 29,38 34,37 52,63", .86], ["29,38 20,45 34,41", .9], ["76,67 99,44 94,43 72,63", .83]];
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
    <radialGradient id="SW" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#F6DE9E"/><stop offset=".45" stop-color="#D3A652"/><stop offset=".85" stop-color="#9A6E2A"/><stop offset="1" stop-color="#7A531C"/></radialGradient>
    <radialGradient id="SD" cx="62%" cy="66%" r="70%"><stop offset="0" stop-color="#E8C77D"/><stop offset=".6" stop-color="#C3954A"/><stop offset="1" stop-color="#9B7030"/></radialGradient></defs>
    <polygon points="${ptsW.join(" ")}" fill="url(#SW)"/>
    <circle cx="60" cy="60" r="39" fill="url(#SD)"/>
    <circle cx="60" cy="60" r="39" fill="none" stroke="#7E5820" stroke-opacity=".55" stroke-width="1.6"/>
    <circle cx="60" cy="60" r="41.5" fill="none" stroke="#FFF1C8" stroke-opacity=".55" stroke-width="1"/>
    <circle cx="60" cy="60" r="33" fill="none" stroke="#7E5820" stroke-opacity=".35" stroke-width=".8" stroke-dasharray="1.2 2.4"/>
    <g transform="translate(.8 1)" fill="#FFF0C4" opacity=".5">${cr.map(([c]) => `<polygon points="${c}"/>`).join("")}</g>
    <g fill="#5E3E12">${cr.map(([c, o]) => `<polygon points="${c}" opacity="${o}"/>`).join("")}</g>
    <path d="M24 46 A38 38 0 0 1 52 22" fill="none" stroke="#FFF6D8" stroke-opacity=".45" stroke-width="2.4" stroke-linecap="round"/></svg>`;
})();

// Tenues pliées (facettes recolorées par --gm / --gw)
const shade = (pts, o) => `<polygon points="${pts}" fill="${o > 0 ? "#3A2516" : "#fff"}" opacity="${Math.abs(o)}"/>`;
const PLANE = `<svg viewBox="0 0 120 70" aria-hidden="true"><polygon points="0,30 120,0 44,44" fill="#FBF5EA"/><polygon points="44,44 120,0 52,68" fill="#E9DDCB"/><polygon points="0,30 44,44 34,50" fill="#D9C9B2"/><path d="M44 44 120 0" stroke="#B9A487" stroke-width=".8"/></svg>`;

export function mountOrigami(root, INPUT, OPTS = {}) {
  const D = INPUT || {};
  // Aperçu de l'éditeur (sans ouverture ni enveloppe) : tout est déjà déplié, sans mouvement.
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches || (!!OPTS.skipIntro && !!OPTS.noGate);
  document.body.dataset.tpl = "origami";
  const T = inviteDict(D.lang), O = T.origami;
  const when = dateParts(D.dateISO, D.lang);
  const p1 = esc(D.partner1), p2 = esc(D.partner2);
  const ini = (s) => esc((String(s || "").trim()[0] || "").toUpperCase());
  const photo = typeof D.photoUrl === "string" && D.photoUrl ? D.photoUrl : null;
  let alive = true, timers = [], countI = 0;
  const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); return t; };
  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];

  /* ---------- Liens utiles ---------- */
  const start = new Date(D.dateISO), end = new Date(start.getTime() + 10 * 3600e3);
  const gfmt = (d) => isNaN(d) ? "" : d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const venueQ = [D.venue?.name, D.venue?.address].filter(Boolean).join(", ");
  const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(T.c.weddingOf(D.partner1, D.partner2))}&dates=${gfmt(start)}/${gfmt(end)}&location=${encodeURIComponent(venueQ)}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQ)}`;

  /* ---------- Pliages réutilisables ---------- */
  // Carte pliée en deux : le rabat du bas est replié sur le haut et se rabat quand la carte arrive à l'écran.
  const fold2 = (top, flap, cls = "") => `<div class="or-fold or-v2 ${cls}"><div class="or-pan">${top}</div><div class="or-flap"><div class="or-front">${flap}</div><div class="or-back"></div></div></div>`;
  // Accordéon : chaque étape est pliée sous la précédente et se déplie à son tour.
  const accordion = (items) => items.reduceRight((inner, html, i) => `<div class="or-p" style="--i:${i};--r:${i ? (i % 2 ? -176 : 176) : 0}deg"><div class="or-pc"><div class="or-front">${html}</div><div class="or-back"></div></div>${inner}</div>`, "");
  const head = (k, t) => `<header class="or-head"><small>${k}</small><h2>${t}</h2></header>`;

  const v = D.verse && D.verse.text ? D.verse : null;
  const programme = (D.programme || []).filter((x) => x.title || x.t);
  const dc = D.dressCode || {};
  const colors = (dc.colors || []).slice(0, 4);
  const showDress = dc.enabled !== false && colors.length > 0;
  const story = (D.story || []).filter((s) => s.text || s.y);
  const dayLine = when ? esc(`${when.full.split(" ")[0]} · ${when.full.split(" · ")[1] || ""}`) : "";
  const monoHtml = `<span class="or-mono">${ini(D.partner1)}<i>&amp;</i>${ini(D.partner2)}</span>`;
  const sheetText = `<small>${O.married}</small><h1><span>${p1}</span><i>&amp;</i><span>${p2}</span></h1>${D.intro ? `<p>${esc(D.intro)}</p>` : ""}`;
  const MAP = `<svg viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="300" height="160" fill="#F3EADB"/><path d="M-10 118 C60 96 100 136 170 116 S270 74 320 88 L320 170 L-10 170Z" fill="#DDE6CF"/><path d="M200 -5 C210 40 240 52 310 46 L310 -5Z" fill="#D5E1EA"/><path d="M-5 64 H310 M124 -5 V170 M40 -5 L96 170 M214 64 L262 170" stroke="#fff" stroke-width="7" fill="none"/><path d="M-5 64 H310 M124 -5 V170 M40 -5 L96 170 M214 64 L262 170" stroke="#E2D3BC" stroke-width="1" fill="none"/><path d="M-5 30 H124 M124 100 H310 M166 -5 V64" stroke="#fff" stroke-width="3" fill="none"/></svg>`;

  const before = `
    <section class="or-sec or-hero"><div class="or-sheet">${sheetText}</div><div class="or-cue" aria-hidden="true">${O.scroll}<i></i></div></section>
    <section class="or-sec or-photo">
      ${fold2(`<div class="or-pic">${photo ? `<img src="${esc(photo)}" alt="${O.photoOf(p1, p2)}">` : monoHtml}</div>`,
        v ? `<div class="or-verse">${v.orig ? `<p class="or-orig" dir="auto">${esc(v.orig)}</p>` : ""}<p>${v.orig ? esc(v.text) : esc(T.c.quote(v.text))}</p>${v.ref ? `<small>${esc(v.ref)}</small>` : ""}</div>`
          : `<div class="or-verse"><p class="or-script">${p1} &amp; ${p2}</p></div>`)}
    </section>
    <section class="or-sec or-envsec">
      ${head(O.dateEyebrow, O.dateTitle)}
      <div class="or-cot" role="button" tabindex="0" aria-label="${O.cotAria}">
        <div class="or-cot-in" aria-hidden="true"></div>
        <div class="or-env-in"><small>${O.saveDate}</small><b>${when ? esc(when.day) : ""}</b><span class="or-my">${when ? esc(`${when.month} ${when.year}`) : ""}</span><span class="or-wd">${dayLine}</span></div>
        <span class="or-q tl"></span><span class="or-q tr"></span><span class="or-q bl"></span><span class="or-q br"></span>
      </div>
      <p class="or-env-hint">${O.envHint}</p>
    </section>`;

  const after = [
    `<section class="or-sec or-countsec"><div class="or-count" aria-label="${O.countdown}"><span><b data-c="0">0</b>${O.days}</span><span><b data-c="1">00</b>${O.hours}</span><span><b data-c="2">00</b>${O.min}</span><span><b data-c="3">00</b>${O.sec}</span></div></section>`,
    programme.length ? `<section class="or-sec">${head(O.progEyebrow, O.progTitle)}<div class="or-fold or-acc">${accordion(programme.map((x, i) => `<div class="or-item"><span class="or-num">${i + 1}</span><div><time>${esc(x.t)}</time><h3>${esc(x.title)}</h3>${x.note ? `<p>${esc(x.note)}</p>` : ""}</div></div>`))}</div></section>` : "",
    showDress ? `<section class="or-sec">${head(O.dressEyebrow, dc.title ? esc(dc.title) : O.dressTitle)}
      ${fold2(`<div class="or-dress">${coupleHtml(O.dressEyebrow)}</div>
        <div class="or-sw" role="group" aria-label="${O.colors}">${colors.map((c, i) => { const m = c.men || c.hex, w = c.women || c.hex; return `<button type="button" data-i="${i}" aria-pressed="${i === 0}" aria-label="${esc(c.name)}" style="background:${m === w ? m : `linear-gradient(135deg,${m} 50%,${w} 50%)`}"></button>`; }).join("")}</div>
        <p class="or-cname">${esc(colors[0].name)}</p>`,
        `<div class="or-dctext">${dc.note ? `<p>${esc(dc.note)}</p>` : ""}${dc.men?.text ? `<p><b>${esc(dc.men.label || O.men)}</b>${esc(dc.men.text)}</p>` : ""}${dc.women?.text ? `<p><b>${esc(dc.women.label || O.women)}</b>${esc(dc.women.text)}</p>` : ""}</div>`)}</section>` : "",
    venueQ ? `<section class="or-sec">${head(O.venueEyebrow, esc(D.venue?.name))}
      <div class="or-fold or-h3"><div class="or-side l"><div class="or-mapc">${MAP}</div></div><div class="or-mid"><div class="or-mapc">${MAP}</div><span class="or-pin">${ICON.pin}</span></div><div class="or-side r"><div class="or-mapc">${MAP}</div></div></div>
      <p class="or-addr">${esc(D.venue?.address)}</p>
      <div class="or-btns"><a class="or-btn" href="${mapUrl}" target="_blank" rel="noopener">${ICON.pin} ${O.route}</a><a class="or-btn ghost" href="${calUrl}" target="_blank" rel="noopener">${esc(T.c.addCal)}</a></div></section>` : "",
    story.length ? `<section class="or-sec">${head(O.storyEyebrow, O.storyTitle)}<div class="or-notes">${story.map((s, i) => fold2(`<b class="or-year">${esc(s.y)}</b>`, `<p>${esc(s.text)}</p>`, `or-note${i % 2 ? " alt" : ""}`)).join("")}</div></section>` : "",
    wishHtml(D) ? `<section class="or-sec or-wishsec">${head(inviteDict(D.lang).wish.eyebrow, inviteDict(D.lang).wish.title)}<div class="or-wish">${wishHtml(D)}</div></section>` : "",
    `<section class="or-sec or-rsvpsec">${head(O.rsvpEyebrow, O.rsvpTitle)}
      <div class="or-rsvp">${D.rsvpBy ? `<p class="or-by">${esc(D.rsvpBy)}</p>` : ""}
        <form novalidate>
          <div class="or-choice" role="group" aria-label="${O.presence}"><button type="button" data-a="yes" aria-pressed="true">${O.yes}</button><button type="button" data-a="no" aria-pressed="false">${O.no}</button></div>
          <label>${O.yourName}<input name="name" autocomplete="name" placeholder="${esc(T.c.namePh)}" maxlength="120"></label>
          <label class="or-guests">${O.guests}<span><button type="button" data-g="-1" aria-label="${O.less}">−</button><output>1</output><button type="button" data-g="1" aria-label="${O.more}">+</button></span></label>
          <label>${O.word}<textarea name="msg" rows="2" maxlength="1000"></textarea></label>
          <p class="or-err" hidden>${O.err}</p>
          <button class="or-btn or-send" type="submit">${O.send}</button>
        </form>
      </div>
      <div class="or-fin"><div class="or-fin-crane">${crane("#F7EFE2")}</div><p class="or-fin-names">${p1} <i>&amp;</i> ${p2}</p><p>${when ? esc(when.full) : ""}</p><button type="button" class="or-btn ghost or-again">${O.again}</button></div>
    </section>`,
  ];

  const sky = [["#F7EFE2", 8, 18, 0], ["#EFC3C6", 82, 30, -6], ["#E3C489", 14, 64, -11], ["#F7EFE2", 76, 78, -3], ["#EFC3C6", 46, 92, -14]];
  root.innerHTML = `
  <div class="or">
    <div class="or-bg" aria-hidden="true"></div>
    <div class="or-sky" aria-hidden="true">${sky.map(([c, x, y, dl], i) => `<span style="left:${x}%;top:${y}%;--d:${dl}s;--s:${0.7 + (i % 3) * 0.2}">${crane(c)}</span>`).join("")}</div>

    <section class="or-intro" aria-label="${O.introAria(p1, p2)}">
      <div class="or-envx" aria-hidden="true">
        <div class="or-inside"></div>
        <div class="or-glow"><i></i></div>
        <div class="or-fl l"><i></i></div><div class="or-fl r"><i></i></div><div class="or-fl b"><i></i></div><div class="or-fl t"><i></i></div>
      </div>
      <button type="button" class="or-wax" aria-label="${O.unfold}">
        <span class="or-wax-p a">${SEAL}</span><span class="or-wax-p b">${SEAL}</span><span class="or-wax-p c">${SEAL}</span>
        <svg class="or-crack" viewBox="0 0 120 120" aria-hidden="true"><path d="M57.6 0 51.6 33.6 62.4 50.4 54 72 64.8 92.4 58.8 120"/><path d="M62.4 50.4 82.8 54 103.2 57.6 120 55.2"/></svg>
      </button>
      <div class="or-burst" aria-hidden="true"></div>
      <p class="or-hint">${O.hint}</p>
    </section>

    <main class="or-main">
      ${before}
      <div class="or-after">${after.join("")}</div>
    </main>
    <button type="button" class="or-snd" aria-label="${O.mute}">${ICON.sound}</button>
  </div>`;

  const or = q(".or"), intro = q(".or-intro");
  if (REDUCE) or.classList.add("or-still");

  /* ---------- Son : papier froissé et kalimba (seulement après un geste) ---------- */
  let actx = null, master = null, soundOn = true, loopT = 0, looping = false;
  const music = createMusic(OPTS.music); // musique choisie par les mariés (remplace la mélodie synthétisée)
  const audio = () => { music.unlock(); try { if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.gain.value = 0.12 * fxLevel(OPTS.music); master.connect(actx.destination); } actx.resume(); } catch (e) {} return actx; };
  const tone = (f, t, dur, vol = 0.3) => { if (!actx || !soundOn) return; const o = actx.createOscillator(), g = actx.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
    const o2 = actx.createOscillator(), g2 = actx.createGain(); o2.frequency.value = f * 4.2; g2.gain.setValueAtTime(vol * 0.12, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); o2.connect(g2).connect(master); o2.start(t); o2.stop(t + 0.2); };
  const paper = (len = 0.18, vol = 0.5) => { if (!actx || !soundOn) return; const t = actx.currentTime, n = actx.sampleRate * len, b = actx.createBuffer(1, n, actx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2) * (Math.random() < 0.3 ? 1 : 0.35);
    const s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain(); s.buffer = b; f.type = "highpass"; f.frequency.value = 1800; g.gain.value = vol; s.connect(f).connect(g).connect(master); s.start(t); };
  // Kalimba douce, gamme pentatonique
  const loop = () => { if (!soundOn || !alive) return; looping = true; music.play(); };
  const chime = () => { if (!actx || !soundOn) return; const t = actx.currentTime; [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, t + i * 0.08, 1.2, 0.16)); };
  const sndBtn = q(".or-snd");
  sndBtn.addEventListener("click", () => { soundOn = !soundOn; sndBtn.innerHTML = soundOn ? ICON.sound : ICON.mute; sndBtn.setAttribute("aria-label", soundOn ? O.mute : O.unmute);
    if (soundOn) { audio(); if (or.classList.contains("is-open")) loop(); } else { clearTimeout(loopT); music.pause(); looping = false; } });

  /* ---------- Ouverture : le sceau se brise, les rabats s'ouvrent dans la lumière ---------- */
  const wax = q(".or-wax");
  const crack = () => { if (!actx || !soundOn) return; const t = actx.currentTime; paper(0.07, 0.9); tone(150, t, 0.25, 0.35); tone(2600, t + 0.02, 0.06, 0.12); };
  let opening = false;
  function unfold() {
    if (opening) return; opening = true; audio();
    intro.classList.add("is-cracking"); crack(); if (navigator.vibrate) navigator.vibrate([12, 40, 18]);
    if (REDUCE) { intro.classList.add("is-broken", "is-t", "is-lr", "is-b", "is-burst"); return later(() => openMain(false), 400); }
    const steps = [["is-broken", 380, () => paper(0.12, 0.5)], ["is-t", 760, () => paper(0.35, 0.55)], ["is-lr", 1300, () => paper(0.3, 0.45)],
      ["is-b", 1800, () => paper(0.3, 0.45)], ["is-burst", 2350, chime]];
    steps.forEach(([c, ms, fx]) => later(() => { intro.classList.add(c); fx(); }, ms));
    later(() => openMain(false), 3150);
  }
  wax.addEventListener("click", unfold);
  function showIntro() {
    opening = false; or.classList.remove("is-open"); intro.hidden = false; intro.classList.remove("is-cracking", "is-broken", "is-t", "is-lr", "is-b", "is-burst", "is-out");
    document.body.classList.add("or-locked"); scrollTo(0, 0);
    clearTimeout(loopT); music.pause(); looping = false;
  }
  function openMain(instant) {
    intro.classList.add("is-out"); or.classList.add("is-open"); document.body.classList.remove("or-locked"); scrollTo(0, 0);
    later(() => { intro.hidden = true; }, instant ? 0 : 900);
    if (!instant && !looping) later(loop, 700);
    observeFolds();
  }

  /* ---------- Les pliages se déplient en arrivant à l'écran ---------- */
  let io = null;
  function observeFolds() {
    const els = qa(".or-fold, .or-head, .or-sheet");
    if (REDUCE || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-in")); return; }
    if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); if (e.target.classList.contains("or-fold")) later(() => paper(0.2, 0.35), 120); } }), { rootMargin: "0px 0px -18% 0px", threshold: 0.2 });
    els.forEach((el) => !el.classList.contains("is-in") && io.observe(el));
  }

  /* ---------- Dress code ---------- */
  const dressEl = q(".or-dress");
  const couple = dressEl ? mountCouple(dressEl.querySelector(".dcc"), dc.couple) : null;
  const setColor = (i) => { const c = colors[i]; if (!c || !dressEl) return; dressEl.style.setProperty("--gm", c.men || c.hex); dressEl.style.setProperty("--gw", c.women || c.hex); couple.set(c.men || c.hex, c.women || c.hex);
    q(".or-cname").textContent = c.name; qa(".or-sw button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === i)));
  };
  if (dressEl) { setColor(0); q(".or-sw").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { setColor(+b.dataset.i); paper(0.12, 0.3); } }); }

  /* ---------- La cocotte en papier : trois touches pour l'ouvrir et voir la date (obligatoire avant la suite) ---------- */
  let gated = !OPTS.noGate, taps = 0;
  const cot = q(".or-cot");
  const setGate = (on) => { gated = on; or.classList.toggle("is-gated", on); };
  setGate(gated);
  if (!gated) { cot.classList.add("is-open", "is-done"); q(".or-env-hint").textContent = O.envDone; }
  const tapCot = () => {
    if (!gated || cot.classList.contains("is-open")) return;
    audio(); taps++; cot.classList.add("is-started"); if (navigator.vibrate) navigator.vibrate(12);
    if (taps === 1) { paper(0.16, 0.5); cot.classList.add("is-h"); }
    else if (taps === 2) { paper(0.16, 0.5); cot.classList.remove("is-h"); later(() => cot.classList.add("is-v"), REDUCE ? 0 : 220); }
    else {
      paper(0.3, 0.55); cot.classList.remove("is-h", "is-v"); cot.classList.add("is-open"); later(() => cot.classList.add("is-done"), REDUCE ? 0 : 900);
      setGate(false); chime(); countUp(); observeFolds(); q(".or-env-hint").textContent = O.envDone;
      later(() => scrollBy({ top: innerHeight * 0.6, behavior: REDUCE ? "auto" : "smooth" }), 1600);
    }
  };
  cot.addEventListener("click", tapCot);
  cot.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tapCot(); } });

  /* ---------- Compte à rebours ---------- */
  const remaining = () => { let s = Math.max(0, Math.floor((start - Date.now()) / 1000)); const dd = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; return [dd, hh, Math.floor(s / 60), s % 60]; };
  let counting = false;
  const setCount = (vals) => qa("[data-c]").forEach((b) => { const i = +b.dataset.c; b.textContent = isNaN(vals[i]) ? "–" : i === 0 ? vals[0] : String(vals[i]).padStart(2, "0"); });
  function countUp() { if (REDUCE) return setCount(remaining()); counting = true; const tg = remaining(), t0 = performance.now(); const st = (now) => { const k = Math.min(1, (now - t0) / 1600), e = 1 - Math.pow(1 - k, 3); setCount(tg.map((x) => Math.round(x * e))); if (k < 1 && alive) requestAnimationFrame(st); else counting = false; }; requestAnimationFrame(st); }
  setCount(remaining()); countI = setInterval(() => { if (!counting) setCount(remaining()); }, 1000);

  /* ---------- Réponse : la carte se plie en avion et s'envole ---------- */
  const card = q(".or-rsvp"), form = card.querySelector("form"); let attending = true, guests = 1;
  form.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]"); if (a) { attending = a.dataset.a === "yes"; form.querySelectorAll("[data-a]").forEach((b) => b.setAttribute("aria-pressed", String(b === a))); q(".or-guests").hidden = !attending; return; }
    const g = e.target.closest("[data-g]"); if (g) { guests = Math.min(20, Math.max(1, guests + +g.dataset.g)); form.querySelector("output").textContent = guests; }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); const inp = form.querySelector("input"), name = inp.value.trim();
    if (!name) { inp.focus(); inp.placeholder = O.nameMissing; return; }
    const msg = form.querySelector("textarea").value.trim(), btn = form.querySelector(".or-send"), err = form.querySelector(".or-err");
    err.hidden = true;
    if (OPTS.onRsvp) { btn.disabled = true; btn.textContent = T.c.sending; try { await OPTS.onRsvp({ name, attending, guests: attending ? guests : 0, message: msg }); } catch (x) { btn.disabled = false; btn.textContent = O.send; err.hidden = false; return; } }
    audio(); paper(0.3, 0.6);
    const r = card.getBoundingClientRect();
    card.classList.add("is-folding");
    const fly = () => {
      const plane = document.createElement("div"); plane.className = "or-plane"; plane.innerHTML = PLANE;
      plane.style.left = r.left + r.width / 2 - 60 + "px"; plane.style.top = clamp(r.top + r.height / 2, 80, innerHeight - 80) - 35 + "px";
      or.appendChild(plane); paper(0.5, 0.3); later(() => plane.remove(), 2400);
      const first = esc(name.split(" ")[0]);
      card.innerHTML = `<div class="or-thanks"><small>${T.c.thanks(first)}</small><h3>${attending ? O.flewYes : O.flewNo}</h3><p>${attending ? O.seeYou(guests) : O.missYou}</p>${OPTS.onRsvp ? "" : `<p class="or-by">${esc(T.c.previewOnly)}.</p>`}<a class="or-btn" href="${calUrl}" target="_blank" rel="noopener">${esc(T.c.addCal)}</a></div>`;
      card.classList.remove("is-folding"); card.classList.add("is-sent"); later(chime, 1200);
    };
    later(fly, REDUCE ? 0 : 650);
  });
  q(".or-again").addEventListener("click", () => showIntro());

  /* ---------- Démarrage ---------- */
  if (OPTS.skipIntro) { intro.hidden = true; or.classList.add("is-open"); later(() => openMain(true), 0); }
  else showIntro();

  return {
    replay() { showIntro(); },
    destroy() { alive = false; couple?.destroy(); timers.forEach(clearTimeout); clearInterval(countI); io && io.disconnect(); document.body.classList.remove("or-locked"); music.destroy(); try { actx && actx.close(); } catch (e) {} root.innerHTML = ""; },
  };
}
