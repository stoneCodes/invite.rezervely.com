// Modèle « Le coutumier » / « Traditional Wedding » (id `dot`, nom changé le 13 nov. 2026 ; avant « La dot ») : mariage coutumier d'Afrique centrale.
// Ouverture : satin ivoire et vannerie (fond de Glad), frange de raphia en haut (vrais brins détourés, qui bougent au doigt),
// cœurs dorés + prénoms + pastille brune ; on écarte le raphia (glisser) ou on touche pour entrer.
// Le pagne des mariés (data.dot.fabric, sinon un pagne original de démonstration) habille toute l'invitation :
// anneau du médaillon, bandes entre les sections, nœud de la date, dessins du dress code (carnet du tailleur).
// Même contrat que les autres modèles (options onRsvp, skipIntro, noGate, music) et même parcours :
// prénoms → photo + verset → date nouée dans le pagne (obligatoire) → compte à rebours → programme
// → dress code → lieu → histoire → liste de souhaits → réponse.
import { esc, dateParts } from "../engine";
import { inviteDict } from "../../../lib/i18n/invite";
import { wishHtml } from "../wishlist";
import { mountMeal } from "../meal";
import { createMusic, fxLevel } from "../music";

export const DOT_DEMO_FABRIC = "/img/dot-pagne-demo.webp";
const ICON = {
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.6 3 2.4-2.4-1.1-1.1-2.4 2.4-2.4-2.4-1.1 1.1 2.4 2.4-2.4 2.4 1.1 1.1 2.4-2.4 2.4 2.4 1.1-1.1z"/></svg>',
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const cssUrl = (u) => `url("${String(u).replace(/["\\\n\r]/g, "")}")`;

/* ---------- Dress code : carnet du tailleur ----------
   Dessins techniques (chemise seule pour les messieurs, robe sirène pour les dames) remplis du pagne comme une aquarelle,
   échantillon épinglé, craie et mètre ruban. Tout est dans un seul SVG (viewBox 356 × 520) qui suit la largeur de la carte. */
const SHIRT = "M64 12 L50 18 L22 28 Q14 32 12 44 L4 150 L22 152 L30 62 L34 64 L34 186 Q80 192 126 186 L126 64 L130 62 L138 152 L156 150 L148 44 Q146 32 138 28 L110 18 L96 12 Q80 18 64 12 Z";
const COLLAR = "M64 12 Q80 18 96 12 L96 3 Q80 8 64 3 Z";
const BODICE = "M62 14 Q80 26 98 14 L110 18 L108 50 Q110 70 106 92 L54 92 Q50 70 52 50 L50 18 Z";
const PUFFS = "M50 18 Q26 10 20 30 Q16 46 30 52 L48 50 Z M110 18 Q134 10 140 30 Q144 46 130 52 L112 50 Z";
const BELT = "M54 92 H106 V102 H54 Z";
const SKIRT = "M54 102 Q48 140 56 180 Q60 205 62 215 Q36 270 14 312 Q80 322 146 312 Q124 270 98 215 Q100 205 104 180 Q112 140 106 102 Z";
function zigzag(w, h, n) {
  const pts = [], d = 3;
  for (let i = 0; i <= n; i++) pts.push([(w * i) / n, i % 2 ? d : 0]);
  for (let i = 0; i <= n; i++) pts.push([w - (i % 2 ? d : 0), (h * i) / n]);
  for (let i = n; i >= 0; i--) pts.push([(w * i) / n, h - (i % 2 ? d : 0)]);
  for (let i = n; i >= 0; i--) pts.push([i % 2 ? d : 0, (h * i) / n]);
  return pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
}
const ZZ = zigzag(104, 84, 20);
function atelier({ fab1, fab2, tile, X, men, women }) {
  const pat = (id, href, s) => `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><image href="${esc(href)}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid slice"/></pattern>`;
  const two = fab2 !== fab1;
  const sw = (x, y, rot, id) => `<g transform="translate(${x} ${y}) rotate(${rot})"><polygon points="${ZZ}" fill="#3a2410" opacity=".28" filter="url(#dtBlur)" transform="translate(3 5)"/><polygon points="${ZZ}" fill="url(#${id})"/><polygon points="${ZZ}" fill="url(#dtSheen)"/></g>`;
  const pin = (x, y) => `<g transform="translate(${x} ${y}) rotate(-28)"><rect x="9" y="5.4" width="34" height="1.6" fill="url(#dtSteel)"/><circle cx="6.5" cy="6.5" r="6.5" fill="url(#dtPin)" filter="url(#dtDrop)"/></g>`;
  const ticks = Array.from({ length: 37 }, (_, i) => `M${i * 6} 0 v${i % 5 ? 4 : 9}`).join(" ");
  return `<svg class="dt-atelier" viewBox="0 0 356 520" role="img" aria-label="${esc(X.atelier)}">
  <defs>
    ${pat("dtP1", fab1, tile)}${pat("dtP2", fab2, tile)}${pat("dtS1", fab1, 58)}${pat("dtS2", fab2, 58)}
    <filter id="dtAq" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="7" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="5" result="d"/><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="2" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -.35 1.08" result="gm"/><feComposite in="d" in2="gm" operator="in"/></filter>
    <filter id="dtInk"><feTurbulence baseFrequency=".05" numOctaves="2" seed="11"/><feDisplacementMap in="SourceGraphic" scale="1.6"/></filter>
    <filter id="dtBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.5"/></filter>
    <filter id="dtDrop" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="1" dy="2" stdDeviation="1.4" flood-opacity=".35"/></filter>
    <linearGradient id="dtLavS" x1="0" x2="1"><stop offset="0" stop-color="#1c0f04" stop-opacity=".34"/><stop offset=".22" stop-color="#1c0f04" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".14"/><stop offset=".78" stop-color="#1c0f04" stop-opacity="0"/><stop offset="1" stop-color="#1c0f04" stop-opacity=".34"/></linearGradient>
    <linearGradient id="dtLavV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".7" stop-color="#1c0f04" stop-opacity="0"/><stop offset="1" stop-color="#1c0f04" stop-opacity=".22"/></linearGradient>
    <linearGradient id="dtSheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>
    <linearGradient id="dtSteel"><stop offset="0" stop-color="#9a9a9a"/><stop offset=".3" stop-color="#ececec"/><stop offset="1" stop-color="#8d8d8d"/></linearGradient>
    <radialGradient id="dtPin" cx=".35" cy=".3"><stop offset="0" stop-color="#fff3cf"/><stop offset=".45" stop-color="#d4ae5e"/><stop offset="1" stop-color="#7d5f2c"/></radialGradient>
    <linearGradient id="dtTape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4d98a"/><stop offset="1" stop-color="#e3bf62"/></linearGradient>
    <linearGradient id="dtChalk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3efe7"/><stop offset="1" stop-color="#d3cbbb"/></linearGradient>
  </defs>
  <text x="24" y="38" class="dt-at-h">${esc(X.atelier)}</text>
  <text x="24" y="58" class="dt-at-sub">${esc(X.atelierSub)}</text>
  <text x="30" y="82" class="dt-at-who" transform="rotate(-3 30 82)">${esc(men)}</text>
  <text x="232" y="86" class="dt-at-who" transform="rotate(3 232 86)">${esc(women)}</text>
  <text x="124" y="104" class="dt-at-n" transform="rotate(-3 124 104)">← ${esc(X.collar)}</text>
  <text x="44" y="318" class="dt-at-n" transform="rotate(-2 44 318)">${esc(X.shirtNotes)}</text>
  <text x="194" y="430" class="dt-at-n" transform="rotate(-2 194 430)">${esc(X.gownNotes)}</text>
  <g transform="translate(22 112) scale(1.02)">
    <g filter="url(#dtAq)"><path d="${SHIRT}" fill="url(#dtP1)"/><path d="${COLLAR}" fill="url(#dtP1)"/></g>
    <path d="${SHIRT}" fill="url(#dtLavS)"/><path d="M34 64 L34 186 Q80 192 126 186 L126 64 Z" fill="url(#dtLavV)"/>
    <g fill="none" stroke="#2B2419" stroke-linecap="round" stroke-linejoin="round" filter="url(#dtInk)">
      <path stroke-width="1.3" d="${SHIRT}"/><path stroke-width="1.3" d="${COLLAR} M80 8 V17"/>
      <path stroke-width=".9" d="M50 18 Q38 40 34 64 M110 18 Q122 40 126 64 M5 136 L23 138 M137 138 L155 136"/>
      <path stroke-width=".7" stroke-dasharray="2.4 2" d="M75 18 V98 Q80 101 85 98 V18 M36 182 Q80 188 124 182 M6 140 L22 142 M138 142 L154 140 M34 186 V170 M126 186 V170"/>
      <path stroke-width=".55" opacity=".7" d="M16 70 q4 30 1 60 M144 70 q-4 30 -1 60 M46 120 q8 30 2 60 M114 120 q-8 30 -2 60"/>
    </g>
  </g>
  <g transform="translate(190 128) scale(.9)">
    <g filter="url(#dtAq)"><path d="${BODICE}" fill="url(#dtP2)"/><path d="${PUFFS}" fill="url(#dtP2)"/><path d="${BELT}" fill="url(#dtP2)"/><path d="${SKIRT}" fill="url(#dtP2)"/></g>
    <path d="${SKIRT}" fill="url(#dtLavS)"/><path d="${BODICE}" fill="url(#dtLavS)"/>
    <g fill="none" stroke="#2B2419" stroke-linecap="round" stroke-linejoin="round" filter="url(#dtInk)">
      <path stroke-width="1.3" d="${BODICE}"/><path stroke-width="1.3" d="${PUFFS}"/><path stroke-width="1.3" d="${BELT}"/><path stroke-width="1.3" d="${SKIRT}"/>
      <path stroke-width=".8" d="M26 24 q4 8 2 18 M34 16 q2 10 0 22 M134 24 q-4 8 -2 18 M126 16 q-2 10 0 22 M68 26 Q64 60 66 92 M92 26 Q96 60 94 92 M66 102 Q60 160 68 215 M94 102 Q100 160 92 215 M62 215 Q80 220 98 215"/>
      <path stroke-width=".7" stroke-dasharray="2.4 2" d="M64 17 Q80 29 96 17 M56 95 H104 M56 99 H104 M18 307 Q80 317 142 307"/>
      <path stroke-width=".6" opacity=".7" d="M68 218 Q52 270 40 314 M80 220 V318 M92 218 Q108 270 120 314 M74 219 Q66 270 60 316 M86 219 Q94 270 100 316"/>
    </g>
  </g>
  ${two ? sw(16, 350, -7, "dtS1") + sw(70, 368, 5, "dtS2") + pin(50, 348) + pin(118, 368) : sw(30, 350, -6, "dtS1") + pin(72, 348)}
  <text x="36" y="${two ? 476 : 462}" class="dt-at-n" transform="rotate(-6 36 470)">${esc(X.swatch)}</text>
  <path d="M200 458 l52 -8" stroke="#fff" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/>
  <polygon points="252,446 272,436 292,446 292,470 252,470" fill="url(#dtChalk)" transform="rotate(14 272 453)" filter="url(#dtDrop)"/>
  <g transform="translate(160 482) rotate(-3)" filter="url(#dtDrop)"><rect width="230" height="20" rx="2" fill="url(#dtTape)"/><path d="${ticks}" stroke="#3a3226" stroke-width="1" fill="none"/></g>
</svg>`;
}

export function mountDot(root, data, OPTS = {}) {
  const D = data;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches || (!!OPTS.skipIntro && !!OPTS.noGate);
  document.body.dataset.tpl = "dot";
  const T = inviteDict(D.lang), X = T.dot, C = T.classic;
  const when = dateParts(D.dateISO, D.lang);
  const p1 = esc(D.partner1), p2 = esc(D.partner2);
  const ini = (s) => esc((String(s || "").trim()[0] || "").toUpperCase());
  const photo = typeof D.photoUrl === "string" && D.photoUrl ? D.photoUrl : null;
  const dot = D.dot || {};
  const fabric = dot.fabric || DOT_DEMO_FABRIC, fabric2 = dot.fabric2 || fabric;
  const scale = clamp((+dot.scale || 100) / 100, 0.5, 2);
  let alive = true, timers = [], countI = 0;
  const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); return t; };
  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];

  /* ---------- Liens utiles ---------- */
  const start = new Date(D.dateISO), end = new Date(start.getTime() + 10 * 3600e3);
  const gfmt = (d) => isNaN(d) ? "" : d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const venueQ = [D.venue?.name, D.venue?.address].filter(Boolean).join(", ");
  const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(T.c.weddingOf(D.partner1, D.partner2))}&dates=${gfmt(start)}/${gfmt(end)}&location=${encodeURIComponent(venueQ)}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQ)}`;

  const v = D.verse && D.verse.text ? D.verse : null;
  const programme = (D.programme || []).filter((x) => x.title || x.t);
  const dc = D.dressCode || {};
  const colors = (dc.colors || []).slice(0, 4);
  const showDress = dc.enabled !== false;
  const story = (D.story || []).filter((s) => s.text || s.y);
  const head = (k, t) => `<header class="dt-heading dt-reveal"><span class="dt-orn" aria-hidden="true"></span><small>${k}</small><h2>${t}</h2></header>`;
  const band = '<div class="dt-band" aria-hidden="true"><i></i><b></b><i></i></div>';
  const portrait = photo ? `<img src="${esc(photo)}" alt="${esc(T.c.photoAlt)}">` : `<span class="dt-monogram">${ini(D.partner1)}<i>&amp;</i>${ini(D.partner2)}</span>`;
  const families = dot.families ? `<p class="dt-families">${esc(X.families(dot.families))}</p>` : "";

  // Brins du rideau : bandes de la vraie photo de raphia, posées côte à côte (fondues sur les bords)
  const N = clamp(Math.round(innerWidth / 30), 12, 40);
  const strands = Array.from({ length: N }, (_, i) => `<i style="--o:${(i * 137) % 640}px;--k:${(i + 0.5) / N}"></i>`).join("");

  const after = [
    `<section class="dt-count dt-reveal"><small>${X.countdown}</small><div class="dt-count-grid">${[X.days, X.hours, X.min, X.sec].map((u, i) => `<span class="dt-tray"><b data-c="${i}">${i ? "00" : "0"}</b><i>${u}</i></span>`).join("")}</div></section>`,
    programme.length ? `<section class="dt-card dt-program"><span class="dt-basket" aria-hidden="true"></span>${head(X.programEyebrow, X.program)}<ol class="dt-path">${programme.map((x, i) => `<li class="dt-event dt-reveal${i % 2 ? " is-alt" : ""}"><span class="dt-step" aria-hidden="true"><b>${String(i + 1).padStart(2, "0")}</b></span><div class="dt-event-txt">${x.t ? `<time>${esc(x.t)}</time>` : ""}<h3>${esc(x.title)}</h3>${x.note ? `<p>${esc(x.note)}</p>` : ""}</div></li>`).join("")}</ol><div class="dt-fringe" aria-hidden="true"></div></section>` : "",
    showDress ? `${band}<section class="dt-card dt-dress dt-reveal"><small>${X.dress}</small><h2>${dc.title ? esc(dc.title) : X.dressTitle}</h2>
      <p>${dc.note ? esc(dc.note) : X.dressHelp}</p>
      <div class="dt-book dt-reveal"><div class="dt-page">${atelier({ fab1: fabric, fab2: fabric2, tile: Math.round(30 * scale), X, men: dc.men?.label || X.men, women: dc.women?.label || X.women })}</div><span class="dt-elastic" aria-hidden="true"></span></div>
      ${dc.men?.text || dc.women?.text ? `<div class="dt-dress-cols">${dc.men?.text ? `<p><b>${esc(dc.men.label || X.men)}</b>${esc(dc.men.text)}</p>` : ""}${dc.women?.text ? `<p><b>${esc(dc.women.label || X.women)}</b>${esc(dc.women.text)}</p>` : ""}</div>` : ""}
      ${colors.length ? `<div class="dt-colors"><small>${X.colors}</small><ul>${colors.map((c) => `<li><span style="background:${esc(c.hex)}"></span>${esc(c.name)}</li>`).join("")}</ul></div>` : ""}
    </section>` : "",
    venueQ ? `<section class="dt-card dt-place dt-reveal"><div class="dt-place-img" aria-hidden="true"></div><small>${X.venue}</small><h2>${esc(D.venue?.name)}</h2><p>${esc(D.venue?.address)}</p>
      <div class="dt-btns"><a class="dt-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer">${ICON.pin}${X.route}</a><a class="dt-link ghost" href="${calUrl}" target="_blank" rel="noopener noreferrer">${esc(T.c.addCal)}</a></div></section>` : "",
    story.length ? `<section class="dt-card dt-story">${head(X.story, C.storyTitle)}${story.map((s) => `<article class="dt-story-item dt-reveal"><time>${esc(s.y)}</time><p>${esc(s.text)}</p></article>`).join("")}</section>` : "",
    wishHtml(D) ? `<section class="dt-card dt-wish">${head(T.wish.eyebrow, T.wish.title)}<div class="dt-reveal">${wishHtml(D)}</div></section>` : "",
    `${band}<section class="dt-rsvp"><div class="dt-card dt-rsvp-card dt-reveal"><small>${X.rsvpEyebrow}</small><h2>${X.rsvp}</h2>${D.rsvpBy ? `<p class="dt-rsvp-by">${esc(D.rsvpBy)}</p>` : ""}
      <form class="dt-form" novalidate>
        <div class="dt-choice" role="group" aria-label="${X.rsvpEyebrow}"><button type="button" data-a="yes" aria-pressed="true">${X.yes}</button><button type="button" data-a="no" aria-pressed="false">${X.no}</button></div>
        <label>${X.yourName}<input name="name" autocomplete="name" placeholder="${esc(T.c.namePh)}" maxlength="120"></label>
        <label class="dt-guests">${X.guests}<span><button type="button" data-g="-1" aria-label="${X.less}">−</button><output>1</output><button type="button" data-g="1" aria-label="${X.more}">+</button></span></label>
        <label>${X.note}<textarea name="msg" rows="3" maxlength="1000"></textarea></label>
        <p class="dt-err" hidden>${X.error}</p>
        <button class="dt-submit" type="submit">${X.send}</button>
      </form></div></section>`,
    `<footer class="dt-footer">${band}<p>${p1} <i>&amp;</i> ${p2}</p><p class="dt-footer-date">${when ? esc(when.full) : ""}</p><button class="dt-replay" type="button">${X.replay}</button></footer>`,
  ];

  root.innerHTML = `<div class="dt">
    <section class="dt-intro" aria-label="${X.kicker} ${p1} &amp; ${p2}">
      <div class="dt-scene" aria-hidden="true"></div>
      <div class="dt-strands" aria-hidden="true">${strands}</div>
      <div class="dt-rod" aria-hidden="true"></div>
      <div class="dt-title" aria-hidden="true">
        <svg class="dt-hearts" viewBox="0 0 150 110"><defs><linearGradient id="dtHg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e3a6"/><stop offset=".35" stop-color="#c9973d"/><stop offset=".6" stop-color="#f2d27f"/><stop offset="1" stop-color="#8f6420"/></linearGradient><path id="dtH" d="M50 88 C20 66 4 48 4 30 C4 14 16 4 30 4 C40 4 47 10 50 18 C53 10 60 4 70 4 C84 4 96 14 96 30 C96 48 80 66 50 88 Z"/></defs>
          <g fill="none" stroke="url(#dtHg)" stroke-linejoin="round"><use href="#dtH" transform="translate(6 4)" stroke-width="5"/><use href="#dtH" transform="translate(52 22) scale(.86)" stroke-width="5.8"/><path d="M96 26 C102 34 105 44 102 54" stroke-width="5" stroke-linecap="round"/></g>
          <g fill="none" stroke="#fff6d8" stroke-opacity=".7" stroke-width="1.1" stroke-linecap="round"><path d="M20 32 C22 20 32 14 42 15"/><path d="M60 30 C62 20 70 15 78 16"/></g></svg>
        <small>${X.kicker}</small>
        <p class="dt-names"><b>${p1}</b> <i>&amp;</i> <b>${p2}</b></p>
        <svg class="dt-swash" viewBox="0 0 300 40"><defs><linearGradient id="dtSw" x1="0" x2="1"><stop offset="0" stop-color="#c9973d" stop-opacity="0"/><stop offset=".25" stop-color="#d9ad52"/><stop offset=".6" stop-color="#f0cd78"/><stop offset="1" stop-color="#a9792c" stop-opacity=".15"/></linearGradient></defs><path d="M6 34 C70 6 170 4 294 16 C190 14 96 18 6 34 Z" fill="url(#dtSw)"/></svg>
      </div>
      <button class="dt-open" type="button" aria-label="${X.open}"></button>
      <p class="dt-hint" aria-hidden="true"><span>${X.hint}</span><i>›</i></p>
    </section>
    <main class="dt-main">
      <header class="dt-cover">
        <div class="dt-cover-txt dt-reveal"><small>${X.kicker}</small><h1>${p1} <i>&amp;</i> ${p2}</h1>${families}${D.intro ? `<p class="dt-intro-txt">${esc(D.intro)}</p>` : ""}</div>
        <div class="dt-cue" aria-hidden="true">${X.scroll}<i></i></div>
      </header>
      ${band}
      <section class="dt-portrait">
        <div class="dt-photo dt-reveal">${portrait}</div>
        ${v ? `<div class="dt-verse dt-reveal">${v.orig ? `<p class="dt-verse-orig" dir="auto">${esc(v.orig)}</p>` : ""}<blockquote>${v.orig ? esc(v.text) : esc(T.c.quote(v.text))}</blockquote>${v.ref ? `<cite>${esc(v.ref)}</cite>` : ""}</div>` : ""}
      </section>
      <section class="dt-card dt-datesec dt-reveal">
        <small>${X.dateEyebrow}</small><h2>${X.dateTitle}</h2>
        <div class="dt-knotbox">
          <div class="dt-date"><b>${when ? esc(when.day) : ""}</b><span>${when ? esc(`${when.month} ${when.year}`) : ""}</span><em>${when ? esc(when.full) : ""}</em></div>
          <div class="dt-cloth" aria-hidden="true"><div class="dt-flap l"></div><div class="dt-flap r"></div></div>
          <button class="dt-knot" type="button" aria-label="${X.pullAria}"><span class="dt-tail l"></span><span class="dt-tail r"></span><span class="dt-bulb"></span></button>
        </div>
        <p class="dt-date-hint">${X.pull}</p>
      </section>
      <p class="dt-gate-msg">${X.gate}</p>
      <div class="dt-after">${after.join("")}</div>
    </main>
    <button type="button" class="dt-snd" aria-label="${X.mute}">${ICON.sound}</button>
  </div>`;

  const dt = q(".dt"), intro = q(".dt-intro");
  dt.style.setProperty("--pagne", cssUrl(fabric));
  dt.style.setProperty("--pagne2", cssUrl(fabric2));
  dt.style.setProperty("--tile", `${Math.round(190 * scale)}px`);
  if (REDUCE) dt.classList.add("dt-still");

  /* ---------- Son : musique choisie + bruissement du raphia et petit carillon (synthétisés, après un geste) ---------- */
  let actx = null, master = null, soundOn = true, looping = false;
  const music = createMusic(OPTS.music);
  const audio = () => { music.unlock(); try { if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.gain.value = 0.16 * fxLevel(OPTS.music); master.connect(actx.destination); } actx.resume(); } catch (e) {} return actx; };
  const rustle = (dur = 0.9, vol = 0.5) => {
    if (!actx || !soundOn) return; const t = actx.currentTime, len = Math.round(actx.sampleRate * dur), buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.3 ? 1 : 0.25);
    const s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain(); s.buffer = buf; f.type = "bandpass"; f.frequency.value = 2600; f.Q.value = 0.7;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(master); s.start(t);
  };
  const chime = () => { if (!actx || !soundOn) return; const t = actx.currentTime; [784, 988, 1175, 1568].forEach((fq, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = fq; g.gain.setValueAtTime(0, t + i * 0.08); g.gain.linearRampToValueAtTime(0.12, t + i * 0.08 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 1.3); o.connect(g).connect(master); o.start(t + i * 0.08); o.stop(t + i * 0.08 + 1.4); }); };
  const loop = () => { if (!soundOn || !alive) return; looping = true; music.play(); };
  const sndBtn = q(".dt-snd");
  sndBtn.addEventListener("click", () => { soundOn = !soundOn; sndBtn.innerHTML = soundOn ? ICON.sound : ICON.mute; sndBtn.setAttribute("aria-label", soundOn ? X.mute : X.unmute);
    if (soundOn) { audio(); if (dt.classList.contains("is-open")) loop(); } else { music.pause(); looping = false; } });

  /* ---------- Rideau de raphia : chaque brin est un petit pendule que le doigt pousse ---------- */
  const strandEls = qa(".dt-strands i");
  const S = strandEls.map(() => ({ a: 0, v: 0 }));
  let raf = 0, ptr = null, lastPtr = null, opened = false, tick = 0;
  function physics() {
    raf = 0; if (!alive || opened) return;
    tick++;
    const W = intro.clientWidth || innerWidth;
    let moving = false;
    S.forEach((s, i) => {
      const x = (i + 0.5) / N;
      let f = Math.sin(tick / 70 + i * 0.9) * 0.0016; // brise légère
      if (ptr) { const dx = (x - ptr.x / W); const near = Math.exp(-(dx * dx) / 0.006); f += near * clamp(ptr.vx, -40, 40) * 0.0016; }
      s.v += f - s.a * 0.045; s.v *= 0.9; s.a += s.v;
      strandEls[i].style.transform = `rotate(${(s.a * 57).toFixed(2)}deg) skewX(${(s.a * 20).toFixed(2)}deg)`;
      if (Math.abs(s.v) > 1e-4) moving = true;
    });
    if (ptr) ptr.vx *= 0.6;
    if (!REDUCE) raf = requestAnimationFrame(physics);
    else if (moving) raf = requestAnimationFrame(physics);
  }
  let dragX0 = null;
  const onMove = (e) => {
    const r = intro.getBoundingClientRect(), x = e.clientX - r.left;
    ptr = { x, vx: lastPtr == null ? 0 : x - lastPtr }; lastPtr = x;
    if (dragX0 != null && Math.abs(x - dragX0) > 70) openCurtain();
    if (!raf) raf = requestAnimationFrame(physics);
  };
  intro.addEventListener("pointermove", onMove);
  intro.addEventListener("pointerdown", (e) => { audio(); rustle(0.5, 0.25); dragX0 = e.clientX - intro.getBoundingClientRect().left; lastPtr = dragX0; });
  intro.addEventListener("pointerup", () => { dragX0 = null; });
  intro.addEventListener("pointerleave", () => { ptr = null; lastPtr = null; dragX0 = null; });
  // 1er toucher : on écarte le raphia ; ensuite, toucher l'écran passe directement à la suite.
  q(".dt-open").addEventListener("click", () => { if (opened) toMain(); else openCurtain(); });

  /* ---------- Ouverture ---------- */
  function openCurtain() {
    if (opened) return; opened = true; audio(); rustle(1.4, 0.6);
    cancelAnimationFrame(raf); raf = 0;
    strandEls.forEach((el, i) => {
      const x = (i + 0.5) / N, side = x < 0.5 ? -1 : 1, far = Math.abs(x - 0.5) * 2;
      el.style.transition = `transform ${REDUCE ? 0.01 : 1.5 + far * 0.3}s cubic-bezier(.3,.1,.2,1) ${REDUCE ? 0 : (1 - far) * 0.12}s`;
      el.style.transform = `translateX(${side * (55 + (1 - far) * 45)}vw) rotate(${side * (8 + (1 - far) * 10)}deg)`;
    });
    dt.classList.add("is-opening");
    // Le raphia écarté découvre « La dot de … » ; on le laisse lire, puis la suite s'ouvre toute seule.
    later(toMain, REDUCE ? 2200 : 3600);
  }
  function toMain() {
    if (dt.classList.contains("is-leaving") || dt.classList.contains("is-open")) return;
    dt.classList.add("is-leaving");
    later(() => openMain(false), REDUCE ? 0 : 700);
  }
  function showIntro() {
    opened = false; dt.classList.remove("is-open", "is-opening", "is-leaving"); intro.hidden = false; intro.classList.remove("is-out");
    strandEls.forEach((el) => { el.style.transition = "none"; el.style.transform = ""; }); S.forEach((s) => { s.a = 0; s.v = 0; });
    qa(".dt-reveal.is-visible").forEach((el) => el.classList.remove("is-visible"));
    document.body.classList.add("dt-locked"); scrollTo(0, 0); music.pause(); looping = false;
    if (!REDUCE && !raf) raf = requestAnimationFrame(physics);
  }
  function openMain(instant) {
    dt.classList.add("is-open"); document.body.classList.remove("dt-locked"); scrollTo(0, 0);
    intro.classList.add("is-out"); later(() => { intro.hidden = true; }, instant ? 0 : 900);
    if (!instant && !looping) later(loop, 300);
    observe();
  }

  /* ---------- Apparitions au défilement ---------- */
  let io = null;
  function observe() {
    const els = qa(".dt-reveal");
    if (REDUCE || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-visible")); return; }
    if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach((el, i) => { if (el.classList.contains("is-visible")) return; el.style.setProperty("--dt-delay", `${Math.min(i % 4, 3) * 90}ms`); io.observe(el); });
  }

  /* ---------- La date nouée dans le pagne : on tire le nœud vers le bas (obligatoire avant la suite) ---------- */
  let gated = !OPTS.noGate, untied = false;
  const setGate = (on) => { gated = on; dt.classList.toggle("is-gated", on); };
  setGate(gated);
  const box = q(".dt-knotbox"), knot = q(".dt-knot");
  if (!gated) { box.classList.add("is-untied", "no-anim"); q(".dt-date-hint").textContent = X.untied; }
  let y0 = null, prog = 0, moved = false;
  const setProg = (p) => { prog = clamp(p, 0, 1); box.style.setProperty("--p", prog.toFixed(3)); };
  knot.addEventListener("pointerdown", (e) => { if (untied || !gated) return; y0 = e.clientY; moved = false; audio(); knot.setPointerCapture?.(e.pointerId); box.classList.add("is-pulling"); });
  knot.addEventListener("pointermove", (e) => { if (y0 == null) return; const dy = e.clientY - y0; if (Math.abs(dy) > 6) moved = true; setProg(dy / 110); if (prog > 0.85) untie(); });
  const release = () => { if (y0 == null) return; y0 = null; box.classList.remove("is-pulling"); if (untied) return; if (prog > 0.45) untie(); else setProg(0); };
  knot.addEventListener("pointerup", release); knot.addEventListener("pointercancel", release);
  knot.addEventListener("click", () => { if (!moved) untie(); moved = false; });
  function untie() {
    if (untied || !gated) return; untied = true; y0 = null; box.classList.remove("is-pulling"); box.classList.add("is-untied");
    audio(); rustle(0.7, 0.4); later(chime, 350); if (navigator.vibrate) navigator.vibrate(18);
    setGate(false); countUp(); observe();
    q(".dt-date-hint").textContent = X.untied;
    later(() => scrollBy({ top: innerHeight * 0.55, behavior: REDUCE ? "auto" : "smooth" }), 1500);
  }

  /* ---------- Compte à rebours ---------- */
  const remaining = () => { let s = Math.max(0, Math.floor((start - Date.now()) / 1000)); const dd = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; return [dd, hh, Math.floor(s / 60), s % 60]; };
  let counting = false;
  const setCount = (vals) => qa("[data-c]").forEach((b) => { const i = +b.dataset.c; b.textContent = isNaN(vals[i]) ? "–" : i === 0 ? vals[0] : String(vals[i]).padStart(2, "0"); });
  function countUp() { if (REDUCE) return setCount(remaining()); counting = true; const tg = remaining(), t0 = performance.now(); const st = (now) => { const k = Math.min(1, (now - t0) / 1600), e = 1 - Math.pow(1 - k, 3); setCount(tg.map((x) => Math.round(x * e))); if (k < 1 && alive) requestAnimationFrame(st); else counting = false; }; requestAnimationFrame(st); }
  setCount(remaining()); countI = setInterval(() => { if (!counting) setCount(remaining()); }, 1000);

  /* ---------- Réponse ---------- */
  const card = q(".dt-rsvp-card"), form = q(".dt-form"); let attending = true, guests = 1;
  form.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]"); if (a) { attending = a.dataset.a === "yes"; form.querySelectorAll("[data-a]").forEach((b) => b.setAttribute("aria-pressed", String(b === a))); q(".dt-guests").hidden = !attending; return; }
    const g = e.target.closest("[data-g]"); if (g) { guests = clamp(guests + +g.dataset.g, 1, 20); form.querySelector("output").textContent = guests; }
  });
  // Choix du repas (meal.js) : sous le nombre de personnes, visible seulement si « présent ».
  const mealEl = document.createElement("div"); q(".dt-guests").after(mealEl);
  const MEAL = mountMeal(mealEl, data), mealSync = () => MEAL.update(guests, attending);
  form.addEventListener("click", mealSync); mealSync();
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); const inp = form.querySelector("input:not([data-p])"), name = inp.value.trim();
    if (!name) { inp.focus(); inp.placeholder = T.c.nameMissing; return; }
    const meal = MEAL.collect(); if (!meal.ok) return;
    const msg = form.querySelector("textarea:not(.ml-remarks)").value.trim(), btn = form.querySelector(".dt-submit"), err = form.querySelector(".dt-err");
    err.hidden = true;
    if (OPTS.onRsvp) { btn.disabled = true; btn.textContent = T.c.sending; try { await OPTS.onRsvp({ name, attending, guests: attending ? guests : 0, message: msg, choices: meal.choices, remarks: meal.remarks }); } catch (x) { btn.disabled = false; btn.textContent = X.send; err.hidden = false; return; } }
    const first = esc(name.split(" ")[0]);
    form.outerHTML = `<div class="dt-thanks"><small>${esc(T.c.thanks(first))}</small><h3>${attending ? X.yesTitle : X.noTitle}</h3><p>${esc(attending ? T.c.noted(String(guests)) : T.c.missYou)}</p>${OPTS.onRsvp ? "" : `<p class="dt-rsvp-by">${esc(T.c.previewOnly)}</p>`}<a class="dt-link" href="${calUrl}" target="_blank" rel="noopener noreferrer">${esc(T.c.addCal)}</a></div>`;
    card.classList.add("is-sent"); audio(); chime();
  });
  q(".dt-replay").addEventListener("click", () => showIntro());

  /* ---------- Démarrage ---------- */
  if (OPTS.skipIntro) { intro.hidden = true; openMain(true); }
  else showIntro();

  return {
    replay() { showIntro(); },
    destroy() {
      alive = false; timers.forEach(clearTimeout); clearInterval(countI); cancelAnimationFrame(raf);
      io && io.disconnect(); document.body.classList.remove("dt-locked"); music.destroy();
      try { actx && actx.close(); } catch (e) {} root.innerHTML = "";
    },
  };
}
