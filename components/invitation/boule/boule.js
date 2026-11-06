// Modèle « Le monde miniature » (boule-neige) : une boule à neige à secouer, puis une plongée dans des
// maquettes miniatures. La date est de la buée à essuyer sur le verre.
// mountBoule(racine, données, options) → { replay, destroy }. Même contrat que les autres modèles.
/* eslint-disable */
import { esc, dateParts } from "../engine";
import { inviteDict } from "../../../lib/i18n/invite";

const IMG = {
  globe: "/img/boule-globe.webp", domaine: "/img/boule-domaine.webp", easel: "/img/boule-jardin-chevalet.webp",
  path: "/img/boule-chemin.webp", dress: "/img/boule-dressing.webp", banquet: "/img/boule-banquet.webp", dance: "/img/boule-piste.webp",
};
// Repères mesurés sur les images (en % de l'image).
const GLOBE = { cx: 0.496, cy: 0.391, r: 0.347, ground: 0.655 }; // sphère de verre dans boule-globe (image carrée)
const FRAME = { l: 26, t: 23.6, w: 45.6, h: 38.6 };                // cadre vide du chevalet
const STOPS = [[31, 78], [61, 47], [33, 31], [67, 13]];           // chemin : chapelle → cocktail → tente → piste
const MANOR = [70, 46.5];                                          // porte du domaine

const ICON = {
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.6 3 2.7-2.7-1.1-1.1-2.7 2.7-2.7-2.7-1.1 1.1 2.7 2.7-2.7 2.7 1.1 1.1 2.7-2.7 2.7 2.7 1.1-1.1z"/></svg>',
  snow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5M3 10.6l3.7-.6L5.4 6.5M21 13.4l-3.7.6 1.3 3.5M3 13.4l3.7.6-1.3 3.5M21 10.6l-3.7-.6 1.3-3.5"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
};

// Veste et robe (mêmes dessins que les autres modèles), recolorées par --gm / --gw.
const JACKET = `<svg viewBox="0 0 140 210" role="img" aria-label="__JACKET__"><defs><clipPath id="bnJ"><path d="M70 30 L52 33 L26 46 Q18 50 17 60 L10 168 Q10 174 17 174 L28 174 L31 112 L33 196 Q70 204 107 196 L109 112 L112 174 L123 174 Q130 174 130 168 L123 60 Q122 50 114 46 L88 33 Z"/></clipPath><linearGradient id="bnShJ" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs><path d="M70 8 q9 0 9 7 q0 6 -9 9 v6" stroke="#C9A86A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M70 29 L24 50 M70 29 L116 50" stroke="#C9A86A" stroke-width="4" stroke-linecap="round"/><path class="g-m" d="M70 30 L52 33 L26 46 Q18 50 17 60 L10 168 Q10 174 17 174 L28 174 L31 112 L33 196 Q70 204 107 196 L109 112 L112 174 L123 174 Q130 174 130 168 L123 60 Q122 50 114 46 L88 33 Z"/><g clip-path="url(#bnJ)"><path d="M10 40 L31 112 L28 180 L0 180 Z" fill="#000" opacity=".13"/><path d="M130 40 L109 112 L112 180 L140 180 Z" fill="#000" opacity=".09"/><rect width="140" height="210" fill="url(#bnShJ)"/></g><path fill="#F7F3EE" d="M56 33 L70 80 L84 33 L76 31 L70 36 L64 31 Z"/><path class="g-m" d="M67 38 L73 38 L74.5 72 L70 79 L65.5 72 Z"/><path d="M67 38 L73 38 L74.5 72 L70 79 L65.5 72 Z" fill="#000" opacity=".38"/><path class="g-m" d="M56 33 L46 40 L54 64 L47 68 L70 112 L70 82 Z"/><path d="M56 33 L46 40 L54 64 L47 68 L70 112 L70 82 Z" fill="#fff" opacity=".14"/><path class="g-m" d="M84 33 L94 40 L86 64 L93 68 L70 112 L70 82 Z"/><path d="M84 33 L94 40 L86 64 L93 68 L70 112 L70 82 Z" fill="#000" opacity=".1"/><path d="M70 112 L70 199" stroke="#000" stroke-opacity=".28" stroke-width="1"/><circle cx="70" cy="126" r="2.6" fill="#000" opacity=".45"/><circle cx="70" cy="146" r="2.6" fill="#000" opacity=".45"/><path d="M84 156 L104 154" stroke="#000" stroke-opacity=".3" stroke-width="2"/><path d="M38 154 L56 156" stroke="#000" stroke-opacity=".3" stroke-width="2"/><path d="M88 88 L104 86" stroke="#000" stroke-opacity=".3" stroke-width="2"/><path d="M92 87 L96 81 L100 86.5 Z" fill="#F7F3EE"/></svg>`;
const DRESS = `<svg viewBox="0 0 140 210" role="img" aria-label="__DRESS__"><defs><clipPath id="bnD"><path d="M50 42 L55 42 L70 70 L85 42 L90 42 L94 92 Q112 150 128 200 Q70 212 12 200 Q28 150 46 92 Z"/></clipPath><linearGradient id="bnShD" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs><path d="M70 8 q9 0 9 7 q0 6 -9 9 v6" stroke="#C9A86A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M70 29 L32 48 M70 29 L108 48" stroke="#C9A86A" stroke-width="4" stroke-linecap="round"/><path d="M50 42 L46 36 M90 42 L94 36" stroke="#C9A86A" stroke-width="1.4"/><path class="g-w" d="M50 42 L55 42 L70 70 L85 42 L90 42 L94 92 Q70 101 46 92 Z"/><path class="g-w" d="M46 97 Q70 106 94 97 Q112 150 128 200 Q70 212 12 200 Q28 150 46 97 Z"/><g clip-path="url(#bnD)"><path d="M58 104 Q50 150 36 204" stroke="#000" stroke-opacity=".16" stroke-width="7" fill="none"/><path d="M70 106 Q70 150 68 208" stroke="#fff" stroke-opacity=".14" stroke-width="5" fill="none"/><path d="M82 104 Q90 150 104 204" stroke="#000" stroke-opacity=".16" stroke-width="7" fill="none"/><rect width="140" height="210" fill="url(#bnShD)"/></g><path d="M46 92 Q70 101 94 92 L94 98 Q70 107 46 98 Z" fill="#000" opacity=".22"/></svg>`;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Courbe lisse (Catmull-Rom) passant par les étapes du chemin, échantillonnée pour y placer des points. */
function makeRoute(pts) {
  const P = pts.map(([x, y]) => [x, y * 1.5]); // repère 100 × 150 (image 2:3)
  const S = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
    for (let k = 0; k < 40; k++) {
      const t = k / 40, t2 = t * t, t3 = t2 * t;
      S.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  S.push(P[P.length - 1]);
  const L = [0]; for (let i = 1; i < S.length; i++) L.push(L[i - 1] + Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]));
  const total = L[L.length - 1];
  const at = (f) => { const d = clamp(f, 0, 1) * total; let i = 1; while (i < L.length - 1 && L[i] < d) i++; const k = (d - L[i - 1]) / (L[i] - L[i - 1] || 1); return [S[i - 1][0] + (S[i][0] - S[i - 1][0]) * k, (S[i - 1][1] + (S[i][1] - S[i - 1][1]) * k) / 1.5]; };
  return { d: "M" + S.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" L"), at };
}

export function mountBoule(root, INPUT, OPTS = {}) {
  const D = INPUT || {};
  // Aperçu de l'éditeur (sans ouverture ni buée) : tout est posé d'un coup, sans mouvement.
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches || (!!OPTS.skipIntro && !!OPTS.noGate);
  document.body.dataset.tpl = "boule-neige";
  const T = inviteDict(D.lang), B = T.boule;
  const jacket = JACKET.replace("__JACKET__", B.jacket), dress = DRESS.replace("__DRESS__", B.dress);
  const when = dateParts(D.dateISO, D.lang);
  const p1 = esc(D.partner1), p2 = esc(D.partner2);
  const ini = (s) => esc((String(s || "").trim()[0] || "").toUpperCase());
  const photo = typeof D.photoUrl === "string" && D.photoUrl ? D.photoUrl : null;
  const cssUrl = (u) => `url('${String(u).replace(/['"\\\n()]/g, "")}')`;
  let alive = true, timers = [], countI = 0, raf = 0;
  const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); return t; };
  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];

  /* ---------- Liens utiles ---------- */
  const start = new Date(D.dateISO), end = new Date(start.getTime() + 10 * 3600e3);
  const gfmt = (d) => isNaN(d) ? "" : d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const venueQ = [D.venue?.name, D.venue?.address].filter(Boolean).join(", ");
  const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(T.c.weddingOf(D.partner1, D.partner2))}&dates=${gfmt(start)}/${gfmt(end)}&location=${encodeURIComponent(venueQ)}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQ)}`;

  /* ---------- Contenu ---------- */
  const v = D.verse && D.verse.text ? D.verse : null;
  const programme = (D.programme || []).filter((x) => x.title || x.t);
  const dc = D.dressCode || {};
  const colors = (dc.colors || []).slice(0, 4);
  const showDress = dc.enabled !== false && colors.length > 0;
  const story = (D.story || []).filter((s) => s.text || s.y);
  const route = makeRoute(STOPS);
  const stopAt = (i) => route.at(programme.length < 2 ? 0.5 : i / (programme.length - 1));

  const scene = (id, img, extra, flow, cls = "") => `
    <section class="bn-scene ${cls}" data-s="${id}">
      <div class="bn-stage"><div class="bn-blur" style="background-image:${cssUrl(img)}"></div>
        <div class="bn-col"><div class="bn-pic"><img src="${img}" alt="" decoding="async"${id === "hero" ? "" : ' loading="lazy"'}>${extra}</div></div>
      </div>
      <div class="bn-flow">${flow}</div>
    </section>`;

  const dayLine = when ? esc(`${when.full.split(" ")[0]} · ${when.full.split(" · ")[1] || ""}`) : "";
  const monthYear = when ? esc(`${when.month} ${when.year}`) : "";

  const scenes = [
    scene("hero", IMG.domaine, "", `
      <div class="bn-hero"><small>${B.married}</small><h1><span>${p1}</span><i>&amp;</i><span>${p2}</span></h1>${D.intro ? `<p>${esc(D.intro)}</p>` : ""}</div>
      <div class="bn-cue" aria-hidden="true"><span>${B.dive}</span><i></i></div>`, "bn-s-hero"),

    scene("photo", IMG.easel, `<div class="bn-frame" style="left:${FRAME.l}%;top:${FRAME.t}%;width:${FRAME.w}%;height:${FRAME.h}%">${photo ? `<img src="${esc(photo)}" alt="${B.photoOf(p1, p2)}">` : `<span class="bn-mono">${ini(D.partner1)}<i>&amp;</i>${ini(D.partner2)}</span>`}</div>`,
      `<div class="bn-spacer"></div>${v ? `<article class="bn-card bn-verse">${v.orig ? `<p class="bn-orig" dir="auto">${esc(v.orig)}</p>` : ""}<p>${v.orig ? esc(v.text) : esc(T.c.quote(v.text))}</p>${v.ref ? `<small>${esc(v.ref)}</small>` : ""}</article>` : ""}`, v ? "" : "bn-short"),
  ];

  const dateScene = `
    <section class="bn-datesc" data-s="date">
      <div class="bn-blur" style="background-image:${cssUrl(IMG.globe)}"></div>
      <div class="bn-col">
        <div class="bn-gview" aria-hidden="true"></div>
        <div class="bn-date">
          <small>${B.bigDay}</small>
          <b>${when ? esc(when.day) : ""}</b>
          <span class="bn-my">${monthYear}</span>
          <span class="bn-wd">${dayLine}</span>
          <div class="bn-count" aria-label="${B.countdown}"><span><b data-c="0">0</b>${B.days}</span><span><b data-c="1">00</b>${B.hours}</span><span><b data-c="2">00</b>${B.min}</span><span><b data-c="3">00</b>${B.sec}</span></div>
        </div>
        <canvas class="bn-fog" aria-hidden="true"></canvas>
        <p class="bn-fog-hint"><i aria-hidden="true"></i>${B.fog}</p>
      </div>
    </section>`;

  const after = [
    programme.length ? scene("prog", IMG.path, `
      <svg class="bn-route" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true"><path class="bg" d="${route.d}"/><path class="lit" d="${route.d}" pathLength="1"/></svg>
      ${programme.map((_, i) => { const [x, y] = stopAt(i); return `<span class="bn-stop" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%">${i + 1}</span>`; }).join("")}
      <span class="bn-walker" aria-hidden="true"></span>`,
      `<header class="bn-title"><small>${B.progEyebrow}</small><h2>${B.progTitle}</h2></header>
       ${programme.map((x, i) => `<div class="bn-step"><article class="bn-card bn-prog"><span class="bn-num">${i + 1}</span><div><time>${esc(x.t)}</time><h3>${esc(x.title)}</h3>${x.note ? `<p>${esc(x.note)}</p>` : ""}</div></article></div>`).join("")}`) : "",

    showDress ? scene("dress", IMG.dress, `
      <div class="bn-rack"><i class="bn-rod"></i><figure class="bn-g men">${jacket}</figure><figure class="bn-g women">${dress}</figure></div>`,
      `<div class="bn-spacer"></div>
       <article class="bn-card bn-dc"><small>${B.dressEyebrow}</small>${dc.title ? `<h2>${esc(dc.title)}</h2>` : ""}${dc.note ? `<p>${esc(dc.note)}</p>` : ""}
         <div class="bn-sw" role="group" aria-label="${B.colors}">${colors.map((c, i) => { const m = c.men || c.hex, w = c.women || c.hex; return `<button type="button" data-i="${i}" aria-pressed="${i === 0}" aria-label="${esc(c.name)}" style="background:${m === w ? m : `linear-gradient(135deg,${m} 50%,${w} 50%)`}"></button>`; }).join("")}</div>
         <p class="bn-cname">${esc(colors[0].name)}</p>
         ${dc.men?.text ? `<p class="bn-dcl"><b>${esc(dc.men.label || B.men)}</b> ${esc(dc.men.text)}</p>` : ""}
         ${dc.women?.text ? `<p class="bn-dcl"><b>${esc(dc.women.label || B.women)}</b> ${esc(dc.women.text)}</p>` : ""}
       </article>`) : "",

    venueQ ? scene("lieu", IMG.domaine, `<span class="bn-pin" style="left:${MANOR[0]}%;top:${MANOR[1]}%">${ICON.pin}</span>`,
      `<div class="bn-spacer"></div>
       <article class="bn-card bn-lieu"><small>${B.venueEyebrow}</small><h2>${esc(D.venue?.name)}</h2><p>${esc(D.venue?.address)}</p>
         <div class="bn-btns"><a class="bn-btn" href="${mapUrl}" target="_blank" rel="noopener">${ICON.pin} ${B.route}</a><a class="bn-btn ghost" href="${calUrl}" target="_blank" rel="noopener">${esc(T.c.addCal)}</a></div></article>`) : "",

    story.length ? scene("story", IMG.banquet, "",
      `<header class="bn-title"><small>${B.storyEyebrow}</small><h2>${B.storyTitle}</h2></header>
       ${story.map((s, i) => `<div class="bn-step short"><article class="bn-place" style="--r:${i % 2 ? 2 : -2}deg"><b>${esc(s.y)}</b><p>${esc(s.text)}</p></article></div>`).join("")}`) : "",

    scene("rsvp", IMG.dance, "", `
      <div class="bn-spacer short"></div>
      <article class="bn-card bn-rsvp">
        <small>${B.rsvpEyebrow}</small><h2>${B.rsvpTitle}</h2>${D.rsvpBy ? `<p class="bn-by">${esc(D.rsvpBy)}</p>` : ""}
        <form novalidate>
          <div class="bn-choice" role="group" aria-label="${B.presence}"><button type="button" data-a="yes" aria-pressed="true">${B.yes}</button><button type="button" data-a="no" aria-pressed="false">${B.no}</button></div>
          <label>${B.yourName}<input name="name" autocomplete="name" placeholder="${esc(T.c.namePh)}" maxlength="120"></label>
          <label class="bn-guests">${B.guests}<span><button type="button" data-g="-1" aria-label="${B.less}">−</button><output>1</output><button type="button" data-g="1" aria-label="${B.more}">+</button></span></label>
          <label>${B.word}<textarea name="msg" rows="2" maxlength="1000"></textarea></label>
          <p class="bn-err" hidden>${B.err}</p>
          <button class="bn-btn bn-send" type="submit">${B.send}</button>
        </form>
      </article>
      <div class="bn-fin"><p class="bn-fin-names">${p1} <i>&amp;</i> ${p2}</p><p>${when ? esc(when.full) : ""}</p><button type="button" class="bn-btn ghost bn-again">${ICON.snow} ${B.again}</button></div>`, "bn-s-rsvp"),
  ];

  root.innerHTML = `
  <div class="bn">
    <section class="bn-intro" aria-label="${B.introAria(p1, p2)}">
      <p class="bn-kicker">${B.kicker}</p>
      <div class="bn-globe-wrap">
        <div class="bn-globe">
          <img src="${IMG.globe}" alt="${B.globeAlt}" draggable="false">
          <canvas class="bn-snow" aria-hidden="true"></canvas>
          <p class="bn-plaque">${p1} <i>&amp;</i> ${p2}</p>
        </div>
        <div class="bn-floor" aria-hidden="true"></div>
      </div>
      <div class="bn-intro-bot">
        <button type="button" class="bn-btn bn-shake">${ICON.snow}<span>${B.shake}</span></button>
        <p class="bn-hint">${B.hint}</p>
      </div>
    </section>

    <div class="bn-world">
      ${scenes.join("")}
      ${dateScene}
      <div class="bn-after">${after.join("")}</div>
    </div>

    <canvas class="bn-flakes" aria-hidden="true"></canvas>
    <div class="bn-glass" aria-hidden="true"></div>
    <button type="button" class="bn-snd" aria-label="${B.mute}">${ICON.sound}</button>
  </div>`;

  const bn = q(".bn"), intro = q(".bn-intro");
  if (REDUCE) bn.classList.add("bn-still");

  /* ---------- Son : boîte à musique et clochettes (seulement après un geste) ---------- */
  let actx = null, master = null, soundOn = true, loopT = 0, looping = false;
  const audio = () => { try { if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.gain.value = 0.11; master.connect(actx.destination); } actx.resume(); } catch (e) {} return actx; };
  const tone = (f, t, dur, vol = 0.4, type = "sine") => { if (!actx || !soundOn) return; const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05); };
  const BELLS = [1568, 1760, 2093, 2349, 2637, 3136];
  let lastChime = 0;
  const chime = (n = 3) => { if (!actx || !soundOn) return; const now = performance.now(); if (now - lastChime < 90) return; lastChime = now; const t = actx.currentTime; for (let i = 0; i < n; i++) tone(BELLS[(Math.random() * BELLS.length) | 0], t + i * 0.06 + Math.random() * 0.03, 1.2, 0.12); };
  // Valse de boîte à musique (3 temps), jouée en boucle une fois dans le monde miniature.
  const MEL = [784, 988, 1175, 1047, 988, 880, 784, 0, 659, 880, 1047, 988, 880, 784, 740, 0, 784, 988, 1175, 1319, 1175, 1047, 988, 0, 880, 784, 740, 784, 0, 0];
  const loop = () => { if (!actx || !soundOn || !alive) return; looping = true; const t0 = actx.currentTime + 0.05, st = 0.36; MEL.forEach((f, i) => f && tone(f, t0 + i * st, 1.6, i % 3 ? 0.13 : 0.2, "triangle")); [196, 262, 247, 196, 220, 294, 196, 262, 247, 196].forEach((f, i) => tone(f, t0 + i * st * 3, 1.8, 0.1)); loopT = later(loop, MEL.length * st * 1000); };
  const sparkle = () => { if (!actx || !soundOn) return; const t = actx.currentTime; [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(f, t + i * 0.08, 1.1, 0.2)); };
  const whoosh = () => { if (!actx || !soundOn) return; const t = actx.currentTime, len = actx.sampleRate * 1.6, b = actx.createBuffer(1, len, actx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI); const s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain(); s.buffer = b; f.type = "bandpass"; f.Q.value = 0.8; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2400, t + 1.4); g.gain.value = 0.5; s.connect(f).connect(g).connect(master); s.start(t); };
  const sndBtn = q(".bn-snd");
  sndBtn.addEventListener("click", () => { soundOn = !soundOn; sndBtn.innerHTML = soundOn ? ICON.sound : ICON.mute; sndBtn.setAttribute("aria-label", soundOn ? B.mute : B.unmute);
    if (soundOn) { audio(); if (bn.classList.contains("is-world")) loop(); } else { clearTimeout(loopT); looping = false; } });

  /* ---------- La boule à neige (ouverture) ---------- */
  const globe = q(".bn-globe"), snowC = q(".bn-snow"), sx = snowC.getContext("2d");
  let GW = 0, flakes = [], energy = 0, total = 0, ang = 0, angV = 0, diveT = 0, introRaf = 0, introOn = false;
  const THRESH = 2.6;
  const geo = () => ({ x: GLOBE.cx * GW, y: GLOBE.cy * GW, R: GLOBE.r * GW, G: GLOBE.ground * GW, k: GW / 420 });
  function sizeGlobe() {
    const w = globe.clientWidth; if (!w) return; const d = Math.min(2, devicePixelRatio || 1);
    if (GW && flakes.length) { const s = w / GW; flakes.forEach((f) => { f.x *= s; f.y *= s; f.r *= s; }); }
    GW = w; snowC.width = w * d; snowC.height = w * d; sx.setTransform(d, 0, 0, d, 0, 0);
    if (!flakes.length) seed();
  }
  function seed() {
    const g = geo(); flakes = [];
    for (let i = 0; i < 240; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * g.R * 0.9;
      const y = Math.min(g.G, g.y + Math.sin(a) * rr);
      flakes.push({ x: g.x + Math.cos(a) * rr, y, vx: 0, vy: 0, r: (Math.random() * 1.5 + 0.7) * g.k, a: Math.random() * 0.45 + 0.55, ph: Math.random() * 6, rest: y >= g.G });
    }
  }
  function stepGlobe(now) {
    if (!alive || !introOn) return;
    const g = geo();
    angV += -ang * 0.07; angV *= 0.9; ang += angV;
    globe.style.transform = `rotate(${ang.toFixed(2)}deg)`;
    sx.clearRect(0, 0, GW, GW);
    sx.save(); sx.beginPath(); sx.arc(g.x, g.y, g.R * 0.97, 0, Math.PI * 2); sx.clip();
    for (const f of flakes) {
      if (energy > 0.03) { f.vx += (Math.random() - 0.5) * energy * 1.5 * g.k + angV * 0.12 * g.k; f.vy += (Math.random() - 0.66) * energy * 1.7 * g.k; f.rest = false; }
      if (!f.rest) {
        f.vy += 0.012 * g.k; f.vx += Math.sin(now * 0.0015 + f.ph) * 0.006 * g.k; f.vx *= 0.965; f.vy *= 0.965;
        f.x += f.vx; f.y += f.vy;
        const dx = f.x - g.x, dy = f.y - g.y, dd = Math.hypot(dx, dy), lim = g.R * 0.93;
        if (dd > lim) { f.x = g.x + (dx / dd) * lim; f.y = g.y + (dy / dd) * lim; f.vx *= -0.3; f.vy *= -0.3; }
        if (f.y >= g.G) { f.y = g.G - Math.random() * g.k; f.vx = 0; f.vy = 0; f.rest = true; }
      }
      sx.globalAlpha = f.rest ? f.a * 0.75 : f.a; sx.fillStyle = "#fff";
      sx.beginPath(); sx.arc(f.x, f.y, f.r, 0, Math.PI * 2); sx.fill();
    }
    sx.restore();
    energy *= 0.94;
    introRaf = requestAnimationFrame(stepGlobe);
  }
  const shook = (power, dir) => {
    if (diveT || !introOn) return;
    energy = Math.min(3, energy + power); angV += dir * 3 * Math.min(1.2, power); total += power; chime(power > 0.4 ? 4 : 2);
    intro.classList.add("is-shaken");
    if (total >= THRESH) { q(".bn-kicker").textContent = B.opening; diveT = later(dive, 1300); if (navigator.vibrate) navigator.vibrate([30, 50, 30]); }
    else if (total > 0.8) q(".bn-kicker").textContent = B.more2;
  };
  const autoShake = () => { [0, 260, 520, 800].forEach((t, i) => later(() => shook(0.75, i % 2 ? -1 : 1), t)); };

  // Secouer au doigt : faire glisser la boule de gauche à droite.
  let dragX = null;
  globe.addEventListener("pointerdown", (e) => { dragX = e.clientX; globe.setPointerCapture(e.pointerId); });
  globe.addEventListener("pointermove", (e) => { if (dragX === null) return; const dx = e.clientX - dragX; dragX = e.clientX; if (Math.abs(dx) > 1) shook(Math.min(0.4, Math.abs(dx) * 0.006), Math.sign(dx)); });
  const dragEnd = () => { dragX = null; audio(); };
  globe.addEventListener("pointerup", dragEnd); globe.addEventListener("pointercancel", () => { dragX = null; });

  // Secouer le téléphone (capteur de mouvement ; sur iPhone, l'autorisation est demandée au toucher).
  let motionOn = false, lastAcc = null, lastJolt = 0;
  const onMotion = (e) => { const a = e.accelerationIncludingGravity; if (!a || a.x === null) return;
    if (lastAcc) { const d = Math.hypot(a.x - lastAcc.x, a.y - lastAcc.y, (a.z || 0) - (lastAcc.z || 0)); const now = performance.now();
      if (d > 13 && now - lastJolt > 110) { lastJolt = now; shook(Math.min(0.7, d / 40), a.x - lastAcc.x > 0 ? 1 : -1); } }
    lastAcc = { x: a.x, y: a.y, z: a.z }; };
  const listenMotion = () => { if (motionOn || !("DeviceMotionEvent" in window)) return; motionOn = true; addEventListener("devicemotion", onMotion); };
  const needsPerm = typeof window.DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function";
  if (!needsPerm) listenMotion();
  let asked = false;
  q(".bn-shake").addEventListener("click", () => {
    audio();
    if (needsPerm && !asked) {
      asked = true;
      DeviceMotionEvent.requestPermission().then((st) => {
        if (st === "granted") { listenMotion(); q(".bn-hint").textContent = B.shakePhone; q(".bn-shake span").textContent = B.shakeForMe; }
        else autoShake();
      }).catch(autoShake);
      return;
    }
    autoShake();
  });

  function dive() {
    whoosh();
    bn.classList.add("is-diving");
    later(() => showWorld(false), REDUCE ? 0 : 1250);
  }
  function showIntro() {
    clearTimeout(diveT); diveT = 0; total = 0; energy = 0;
    bn.classList.remove("is-world", "is-diving"); intro.hidden = false; intro.classList.remove("is-shaken");
    q(".bn-kicker").textContent = B.kicker;
    document.body.classList.add("bn-locked"); scrollTo(0, 0);
    introOn = true; sizeGlobe(); cancelAnimationFrame(introRaf); introRaf = requestAnimationFrame(stepGlobe);
  }

  /* ---------- Le monde miniature ---------- */
  function showWorld(instant) {
    introOn = false; cancelAnimationFrame(introRaf);
    bn.classList.add("is-world"); bn.classList.remove("is-diving"); intro.hidden = true;
    document.body.classList.remove("bn-locked"); scrollTo(0, 0);
    if (!instant) { audio(); if (!looping) later(loop, 600); }
    sizeFlakes(); initFog(); revealCards(); tick();
  }

  // Les cartes apparaissent quand elles entrent à l'écran.
  let cio = null;
  function revealCards() {
    const els = qa(".bn-card, .bn-place, .bn-title, .bn-hero, .bn-fin");
    if (REDUCE || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-in")); return; }
    if (!cio) cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); cio.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.15 });
    els.forEach((el) => !el.classList.contains("is-in") && cio.observe(el));
  }

  // Neige qui tombe doucement sur tout le monde miniature (on est « dans » la boule).
  const fC = q(".bn-flakes"), fx = fC.getContext("2d"); let F = [], fRaf = 0, gust = 0;
  function sizeFlakes() { const d = Math.min(2, devicePixelRatio || 1); fC.width = innerWidth * d; fC.height = innerHeight * d; fx.setTransform(d, 0, 0, d, 0, 0);
    if (!F.length) for (let i = 0; i < 70; i++) F.push(newFlake(true));
    if (!REDUCE && !fRaf) fRaf = requestAnimationFrame(stepFlakes); }
  const newFlake = (any) => ({ x: Math.random() * innerWidth, y: any ? Math.random() * innerHeight : -10, r: Math.random() * 1.8 + 0.6, s: Math.random() * 0.5 + 0.35, ph: Math.random() * 6, a: Math.random() * 0.5 + 0.35 });
  let lastY = scrollY, scrollV = 0;
  function stepFlakes(now) {
    if (!alive) return; fRaf = requestAnimationFrame(stepFlakes);
    if (!bn.classList.contains("is-world")) { fx.clearRect(0, 0, innerWidth, innerHeight); return; }
    scrollV = scrollV * 0.9 + (scrollY - lastY) * 0.1; lastY = scrollY;
    fx.clearRect(0, 0, innerWidth, innerHeight); fx.fillStyle = "#fff";
    const extra = gust > 0 ? 1 : 0; gust = Math.max(0, gust - 1);
    for (const f of F) {
      f.y += f.s * (1 + extra * 2) - scrollV * 0.25 * f.s; f.x += Math.sin(now * 0.001 + f.ph) * 0.35;
      if (f.y > innerHeight + 10) Object.assign(f, newFlake(false)); if (f.y < -20) { f.y = innerHeight + 5; }
      fx.globalAlpha = f.a; fx.beginPath(); fx.arc(f.x, f.y, f.r, 0, Math.PI * 2); fx.fill();
    }
  }

  /* ---------- Caméra : chaque maquette est filmée de près, la caméra avance au défilement ---------- */
  // ay : hauteur à l'écran où placer le point visé (0.5 = centre ; plus haut quand une carte occupe le bas).
  function cam(s, fxp, fyp, z, ay = 0.5) {
    const pic = s.querySelector(".bn-pic"), col = pic && pic.parentElement; if (!pic) return;
    const pw = pic.offsetWidth, ph = pic.offsetHeight, cw = col.clientWidth, ch = col.clientHeight;
    let tx = (0.5 - fxp / 100) * pw * z, ty = (0.5 - fyp / 100) * ph * z + (ay - 0.5) * ch;
    const mx = Math.max(0, (pw * z - cw) / 2), my = Math.max(0, (ph * z - ch) / 2);
    tx = clamp(tx, -mx, mx); ty = clamp(ty, -my, my);
    pic.style.transform = `translate(calc(-50% + ${tx.toFixed(1)}px), calc(-50% + ${ty.toFixed(1)}px)) scale(${z.toFixed(3)})`;
  }
  const lerp = (a, b, k) => a + (b - a) * k;
  const CAMS = {
    hero: (s, p) => cam(s, 46, 44, 1.04 + p * 0.22),
    photo: (s, p) => cam(s, 49, 44, 1 + p * 0.08),
    dress: (s, p) => cam(s, 26, 30, 1.55 + p * 0.1, 0.27), // gros plan sur le portant miniature
    lieu: (s, p) => { const k = clamp(p * 1.3, 0, 1); cam(s, lerp(50, MANOR[0], k), lerp(55, MANOR[1], k), 1 + k * 0.45); },
    story: (s, p) => cam(s, lerp(32, 66, p), lerp(72, 38, p), 1.3),
    rsvp: (s, p) => cam(s, 50, 55, 1.04 + p * 0.1),
    prog: (s) => {
      const cards = [...s.querySelectorAll(".bn-prog")], line = innerHeight * 0.72, n = cards.length;
      const cs = cards.map((c) => { const r = c.getBoundingClientRect(); return r.top + r.height / 2; });
      let pos = 0;
      if (n > 1) { if (line >= cs[n - 1]) pos = n - 1; else if (line > cs[0]) for (let i = 0; i < n - 1; i++) if (cs[i] <= line && line < cs[i + 1]) { pos = i + (line - cs[i]) / (cs[i + 1] - cs[i]); break; } }
      const f = n < 2 ? 0.5 : pos / (n - 1), [x, y] = route.at(f);
      cam(s, x, y, 1.4, 0.3);
      s.querySelector(".lit").style.strokeDashoffset = String(1 - f);
      const w = s.querySelector(".bn-walker"); w.style.left = x + "%"; w.style.top = y + "%";
      s.querySelectorAll(".bn-stop").forEach((el, i) => el.classList.toggle("is-on", i <= pos + 0.35));
      cards.forEach((c, i) => c.classList.toggle("is-on", Math.round(pos) === i));
    },
  };
  function tick() {
    raf = 0; if (!alive || !bn.classList.contains("is-world")) return;
    const vh = innerHeight;
    for (const s of qa(".bn-scene")) {
      const r = s.getBoundingClientRect(); if (!r.height || r.bottom < -40 || r.top > vh + 40) continue;
      const enter = clamp((vh - r.top) / vh, 0, 1), p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
      s.style.setProperty("--in", REDUCE ? "1" : enter.toFixed(3));
      if (REDUCE) {
        if (!s.dataset.still) { s.dataset.still = 1; cam(s, 50, 50, 1);
          if (s.dataset.s === "prog") { s.querySelector(".lit").style.strokeDashoffset = "0"; s.querySelectorAll(".bn-stop").forEach((el) => el.classList.add("is-on")); } }
        continue;
      }
      CAMS[s.dataset.s] && CAMS[s.dataset.s](s, p);
    }
  }
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener("scroll", onScroll, { passive: true });
  const onResize = () => { sizeGlobe(); if (bn.classList.contains("is-world")) { const d = Math.min(2, devicePixelRatio || 1); fC.width = innerWidth * d; fC.height = innerHeight * d; fx.setTransform(d, 0, 0, d, 0, 0); qa(".bn-scene").forEach((s) => delete s.dataset.still); if (gated && !wiped) { fogReady = false; initFog(); } onScroll(); } };
  addEventListener("resize", onResize);

  /* ---------- Dress code : les tenues se recolorent ---------- */
  const rack = q(".bn-rack");
  const setColor = (i) => { const c = colors[i]; if (!c || !rack) return; rack.style.setProperty("--gm", c.men || c.hex); rack.style.setProperty("--gw", c.women || c.hex);
    q(".bn-cname").textContent = c.name; qa(".bn-sw button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === i)));
    rack.classList.remove("is-swing"); void rack.offsetWidth; rack.classList.add("is-swing"); };
  if (rack) { setColor(0); q(".bn-sw").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { setColor(+b.dataset.i); chime(2); } }); }

  /* ---------- La buée sur le verre : à essuyer pour voir la date (obligatoire avant la suite) ---------- */
  let gated = !OPTS.noGate, wiped = false, fogReady = false;
  const setGate = (on) => { gated = on; bn.classList.toggle("is-gated", on); };
  setGate(gated);
  const fog = q(".bn-fog"), fogCol = fog.parentElement;
  const globeImg = new Image(); globeImg.src = IMG.globe; globeImg.onload = () => { if (alive && bn.classList.contains("is-world")) initFog(); };
  function initFog() {
    if (!gated || wiped) { fog.remove(); q(".bn-fog-hint")?.remove(); return; }
    if (fogReady || !globeImg.complete || !globeImg.naturalWidth) return;
    const W = fogCol.clientWidth, H = fogCol.clientHeight; if (!W || !H) return;
    fogReady = true;
    const d = Math.min(2, devicePixelRatio || 1); fog.width = W * d; fog.height = H * d;
    const c = fog.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0); c.globalCompositeOperation = "source-over";
    // Même cadrage que le fond (.bn-gview) : image carrée haute de 150 %, centrée sur la sphère.
    const S = 1.5 * H, x0 = 0.494 * (W - S), y0 = 0.173 * (H - S);
    // Vue floue à travers la buée : flou natif du canvas si disponible, sinon petite image agrandie et moyennée.
    c.fillStyle = "#151a33"; c.fillRect(0, 0, W, H);
    if (typeof c.filter === "string") {
      c.filter = `blur(${Math.round(W * 0.045)}px)`; c.drawImage(globeImg, x0, y0, S, S); c.filter = "none";
    } else {
      const sm = document.createElement("canvas"), k = 10; sm.width = Math.ceil(W / k); sm.height = Math.ceil(H / k);
      const s2 = sm.getContext("2d"); s2.drawImage(globeImg, x0 / k, y0 / k, S / k, S / k); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
      [[0, 0], [-1, -1], [1, 1], [-1, 1], [1, -1], [0, 2], [2, 0], [0, -2], [-2, 0]].forEach(([ox, oy], i) => { c.globalAlpha = 1 / (i + 1); c.drawImage(sm, ox * k * 0.6, oy * k * 0.6, W, H); });
      c.globalAlpha = 1;
    }
    c.fillStyle = "rgba(222,230,244,.5)"; c.fillRect(0, 0, W, H);
    for (let i = 0; i < W * H / 260; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.16})`; c.fillRect(Math.random() * W, Math.random() * H, 1.3, 1.3); }
    for (let i = 0; i < 90; i++) { const x = Math.random() * W, y = Math.random() * H, r = Math.random() * 3.2 + 0.8, g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,.75)"); g.addColorStop(0.6, "rgba(255,255,255,.18)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    // Un petit cœur déjà dessiné du doigt dans la buée
    c.globalCompositeOperation = "destination-out"; c.lineWidth = 5; c.lineCap = "round"; c.strokeStyle = "#000";
    const hx = W * 0.5, hy = H * 0.2, hs = Math.min(W, H) * 0.06;
    c.beginPath(); c.moveTo(hx, hy + hs); c.bezierCurveTo(hx - hs * 1.6, hy, hx - hs * 0.8, hy - hs * 1.1, hx, hy - hs * 0.3); c.bezierCurveTo(hx + hs * 0.8, hy - hs * 1.1, hx + hs * 1.6, hy, hx, hy + hs); c.stroke();
    if (!wipeBound) bindWipe(c, W, H); else fogCtx = { c, W, H };
  }
  let wipeBound = false, fogCtx = null;
  function bindWipe(c0, W0, H0) {
    wipeBound = true; fogCtx = { c: c0, W: W0, H: H0 };
    let down = false, last = null, dist = 0, checks = 0;
    const R = () => Math.max(26, fogCtx.W * 0.085);
    const pt = (e) => { const r = fog.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const dab = (x, y) => { const c = fogCtx.c, rr = R(), g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.55, "rgba(0,0,0,.92)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); };
    const draw = (p) => { const a = last || p, len = Math.hypot(p.x - a.x, p.y - a.y), stp = R() / 3; const n = Math.max(1, Math.ceil(len / stp));
      for (let i = 1; i <= n; i++) dab(a.x + ((p.x - a.x) * i) / n, a.y + ((p.y - a.y) * i) / n);
      dist += len; last = p; if (++checks % 6 === 0) check(); if (Math.random() < 0.15) chime(1); };
    const check = () => {
      const box = q(".bn-date").getBoundingClientRect(), fr = fog.getBoundingClientRect(), d = fog.width / fogCtx.W;
      const x = Math.max(0, (box.left - fr.left) * d) | 0, y = Math.max(0, (box.top - fr.top) * d) | 0, w = Math.min(fog.width - x, box.width * d) | 0, h = Math.min(fog.height - y, box.height * d) | 0;
      if (w < 4 || h < 4) return; const img = fogCtx.c.getImageData(x, y, w, h).data; let clear = 0, n = 0;
      for (let i = 3; i < img.length; i += 48) { n++; if (img[i] < 60) clear++; }
      if (clear / n > 0.5 || dist > Math.max(fogCtx.W, fogCtx.H) * 7) reveal();
    };
    fog.addEventListener("pointerdown", (e) => { down = true; last = null; fog.setPointerCapture(e.pointerId); audio(); q(".bn-fog-hint")?.classList.add("is-off"); draw(pt(e)); });
    fog.addEventListener("pointermove", (e) => { if (down) draw(pt(e)); });
    const up = () => { down = false; last = null; }; fog.addEventListener("pointerup", up); fog.addEventListener("pointercancel", up);
  }
  function reveal() {
    if (wiped) return; wiped = true; fog.classList.add("is-done"); q(".bn-fog-hint")?.remove(); later(() => fog.remove(), 1300);
    q(".bn-datesc").classList.add("is-open"); setGate(false); sparkle(); gust = 140; countUp(); revealCards();
    if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
    later(() => { onScroll(); scrollBy({ top: innerHeight * 0.85, behavior: REDUCE ? "auto" : "smooth" }); }, 1700);
  }

  /* ---------- Compte à rebours ---------- */
  const remaining = () => { let s = Math.max(0, Math.floor((start - Date.now()) / 1000)); const dd = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; return [dd, hh, Math.floor(s / 60), s % 60]; };
  let counting = false;
  const setCount = (vals) => qa("[data-c]").forEach((b) => { const i = +b.dataset.c; b.textContent = isNaN(vals[i]) ? "–" : i === 0 ? vals[0] : String(vals[i]).padStart(2, "0"); });
  function countUp() { if (REDUCE) return setCount(remaining()); counting = true; const tg = remaining(), t0 = performance.now(); const st = (now) => { const k = Math.min(1, (now - t0) / 1600), e = 1 - Math.pow(1 - k, 3); setCount(tg.map((x) => Math.round(x * e))); if (k < 1 && alive) requestAnimationFrame(st); else counting = false; }; requestAnimationFrame(st); }
  setCount(remaining()); countI = setInterval(() => { if (!counting) setCount(remaining()); }, 1000);

  /* ---------- Réponse (RSVP) sur la piste de danse ---------- */
  const card = q(".bn-rsvp"), form = card.querySelector("form"); let attending = true, guests = 1;
  form.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]"); if (a) { attending = a.dataset.a === "yes"; form.querySelectorAll("[data-a]").forEach((b) => b.setAttribute("aria-pressed", String(b === a))); q(".bn-guests").hidden = !attending; return; }
    const g = e.target.closest("[data-g]"); if (g) { guests = Math.min(20, Math.max(1, guests + +g.dataset.g)); form.querySelector("output").textContent = guests; }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); const inp = form.querySelector("input"), name = inp.value.trim();
    if (!name) { inp.focus(); inp.placeholder = B.nameMissing; return; }
    const msg = form.querySelector("textarea").value.trim(), btn = form.querySelector(".bn-send"), err = form.querySelector(".bn-err");
    err.hidden = true;
    if (OPTS.onRsvp) { btn.disabled = true; btn.textContent = T.c.sending; try { await OPTS.onRsvp({ name, attending, guests: attending ? guests : 0, message: msg }); } catch (x) { btn.disabled = false; btn.textContent = B.send; err.hidden = false; return; } }
    const first = esc(name.split(" ")[0]);
    card.innerHTML = `<small>${B.thanks(first)}</small><h2>${attending ? B.yesTitle : B.noTitle}</h2><p>${attending ? B.yesText(guests) : B.noText}</p>${OPTS.onRsvp ? "" : `<p class="bn-by">${B.previewOnly}</p>`}<div class="bn-btns"><a class="bn-btn" href="${calUrl}" target="_blank" rel="noopener">${esc(T.c.addCal)}</a></div>`;
    card.classList.add("is-done"); if (attending) { gust = 200; sparkle(); q(".bn-s-rsvp").classList.add("is-party"); }
  });
  q(".bn-again").addEventListener("click", () => showIntro());

  /* ---------- Démarrage ---------- */
  if (OPTS.skipIntro) { intro.hidden = true; later(() => showWorld(true), 0); bn.classList.add("is-world"); }
  else showIntro();

  return {
    replay() { showIntro(); },
    destroy() {
      alive = false; timers.forEach(clearTimeout); clearInterval(countI); cancelAnimationFrame(introRaf); cancelAnimationFrame(fRaf); cancelAnimationFrame(raf);
      cio && cio.disconnect(); removeEventListener("scroll", onScroll); removeEventListener("resize", onResize); removeEventListener("devicemotion", onMotion);
      document.body.classList.remove("bn-locked"); try { actx && actx.close(); } catch (e) {} root.innerHTML = "";
    },
  };
}
