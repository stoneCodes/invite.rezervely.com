// Modèle « La piñata » (anniversaire enfant) : on tape 3 fois sur la piñata étoile, elle éclate en bonbons.
// Défilement : chaque section est un bonbon emballé qui tombe et rebondit en arrivant.
// Date : dans un gros bonbon à déballer d'un toucher (obligatoire avant la suite). Compte à rebours en sucettes.
// Palette au choix des parents (data.bday.palette).
import { prep, life, sound, soundButton, particles, reveal, countdown, countHtml, extras, venueBtns, rsvpForm, bindRsvp, portrait, esc, ICON } from "../fete/core";
import { wishHtml } from "../wishlist";

const PAL = {
  rose: { body: "#FF6F91", pts: ["#4FC3F7", "#B388FF", "#7BD389"], conf: ["#FF6F91", "#4FC3F7", "#B388FF", "#7BD389", "#FFD34E", "#ffffff"] },
  bleu: { body: "#4FB3F0", pts: ["#FFD34E", "#FF9F43", "#7BD389"], conf: ["#4FB3F0", "#FFD34E", "#FF9F43", "#7BD389", "#FF6F91", "#ffffff"] },
};

/** Guirlande de fanions (SVG étiré sur toute la largeur). */
function bunting(pal, cls = "") {
  const cols = [pal.body, ...pal.pts, "#FFD34E"];
  const flags = Array.from({ length: 11 }, (_, i) => { const x = 10 + i * 36, y = 14 + Math.sin((i / 10) * Math.PI) * 22; return `<path d="M${x} ${y} L${x + 30} ${y + 1} L${x + 15} ${y + 34} Z" fill="${cols[i % cols.length]}"/>`; }).join("");
  return `<svg class="pn-bunting ${cls}" viewBox="0 0 410 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0 12 Q205 64 410 12" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>${flags}</svg>`;
}

/** Piñata en photo (détourée, une par palette) ; 6 parts découpées autour du corps servent à l'éclatement. */
const BODY = [49, 46]; // centre du corps, en % de l'image
function pinataHtml(palId) {
  const src = `/img/pinata-${palId}.webp`, [cx, cy] = BODY;
  const pieces = Array.from({ length: 6 }, (_, k) => {
    const a0 = ((k * 60 - 90) * Math.PI) / 180, a1 = (((k + 1) * 60 - 90) * Math.PI) / 180, am = (a0 + a1) / 2, R = 160;
    const pt = (a) => `${(cx + Math.cos(a) * R).toFixed(1)}% ${(cy + Math.sin(a) * R).toFixed(1)}%`;
    return `<img class="pn-piece" src="${src}" alt="" draggable="false" style="clip-path:polygon(${cx}% ${cy}%,${pt(a0)},${pt(am)},${pt(a1)});--dx:${(Math.cos(am) * 190).toFixed(0)}px;--dy:${(Math.sin(am) * 190).toFixed(0)}px;--r:${k % 2 ? 130 : -150}deg">`;
  }).join("");
  return `<span class="pn-star"><img class="pn-whole" src="${src}" alt="" draggable="false">${pieces}
    <svg class="pn-cracks" viewBox="0 0 100 111" aria-hidden="true"><path class="pn-crack pn-c1" d="M37 43 l6 5 -3 6 7 4 -2 7"/><path class="pn-crack pn-c2" d="M61 47 l-5 4 4 5 -6 6 3 6 M44 65 l5-4 6 3 4-3"/></svg>
    <i class="pn-body" aria-hidden="true"></i></span>`;
}
const CANDIES = [["rose", "#e5308f"], ["bleu", "#2aa3e6"], ["jaune", "#f2b80c"], ["vert", "#3cb83c"], ["violet", "#9b3fd6"], ["orange", "#f57f17"]];

const STICK = `<svg class="pn-stick" viewBox="0 0 40 220" aria-hidden="true"><rect x="13" y="0" width="14" height="210" rx="7" fill="#d9a35b"/><rect x="13" y="0" width="5" height="210" rx="2.5" fill="rgba(255,255,255,.3)"/>${[30, 70, 110, 150].map((y) => `<rect x="12" y="${y}" width="16" height="10" fill="#ff6f91" opacity=".85"/>`).join("")}<rect x="11" y="170" width="18" height="44" rx="6" fill="#7a4a1e"/></svg>`;

export function mountPinata(root, data, OPTS = {}) {
  const P = prep(data, OPTS, "pinata"), { F, REDUCE } = P, K = F.pinata, w = P.when, dc = P.dc;
  const palId = P.bd.palette === "bleu" ? "bleu" : "rose", pal = PAL[palId];
  document.body.dataset.tpl = "pinata";
  const L = life(), S = sound(L, OPTS.music), X = extras(P);
  const cols = [pal.body, ...pal.pts, "#FFD34E"];
  let si = 0;
  const candy = (cls, inner) => { const [nm, hex] = CANDIES[si++ % CANDIES.length]; return `<section class="pn-sec fx-r ${cls}" style="--cc:${hex};--candy:url(/img/pinata-bonbon-${nm}.webp);--tilt:${si % 2 ? -1.5 : 1.5}deg"><div class="pn-wrap"><i class="pn-twist pn-l" aria-hidden="true"></i><div class="pn-card">${inner}</div><i class="pn-twist pn-r" aria-hidden="true"></i></div></section>`; };

  const after = [
    `<section class="pn-sec pn-lsec fx-r"><small>${F.countdown}</small>${countHtml(F, "pn-lolli")}</section>`,
    P.programme.length ? candy("", `<small>${F.program}</small><ol class="pn-prog">${P.programme.map((x, i) => `<li style="--b:${cols[(i + 1) % cols.length]}"><time>${esc(x.t)}</time><div><b>${esc(x.title)}</b>${x.note ? `<em>${esc(x.note)}</em>` : ""}</div></li>`).join("")}</ol>${X.end}`) : "",
    P.showDress ? candy("", `<small>${F.theme}</small>${dc.title ? `<h2>${esc(dc.title)}</h2>` : ""}${dc.note ? `<p>${esc(dc.note)}</p>` : ""}${P.colors.length ? `<div class="pn-gum">${P.colors.map((c) => `<span style="--sw:${esc(c.hex)}"><i></i>${esc(c.name)}</span>`).join("")}</div>` : ""}`) : "",
    P.venueQ || X.phone || X.gifts ? candy("", `<small>${F.venue}</small>${P.venueName ? `<h2>${P.venueName}</h2>` : ""}${P.venueAddr ? `<p>${P.venueAddr}</p>` : ""}${P.programme.length ? "" : X.end}${venueBtns(P)}${X.phone}${X.gifts ? `<div class="pn-gifts">${X.gifts}</div>` : ""}`) : "",
    wishHtml(data) ? candy("pn-wish", `<small>${P.T.wish.eyebrow}</small><h2>${P.T.wish.title}</h2>${wishHtml(data)}`) : "",
    candy("pn-rsvp", `<small>${F.rsvpKid}</small><h2>${F.rsvpKid}</h2>${P.rsvpBy ? `<p>${P.rsvpBy}</p>` : ""}${rsvpForm(P)}<p class="pn-sent">${K.sent}</p>`),
    `<footer class="pn-foot">${bunting(pal)}<p class="pn-foot-name">${P.name}</p><p>${w ? esc(w.full) : ""}</p><button class="fx-replay" type="button">${F.replay}</button></footer>`,
  ];

  root.innerHTML = `<div class="fx fx-pinata" data-pal="${palId}" style="--body:${pal.body};--p1:${pal.pts[0]};--p2:${pal.pts[1]};--p3:${pal.pts[2]}">
    <div class="pn-sky" aria-hidden="true"><i></i></div>
    <section class="pn-intro" aria-label="${esc(F.birthdayOf(P.nameRaw))}">
      ${bunting(pal, "pn-top")}
      <div class="pn-head"><h1>${P.name}</h1><p>${P.sub}</p></div>
      <div class="pn-stage">
        <div class="pn-hang"><button type="button" class="pn-hit" aria-label="${K.hit}">${pinataHtml(palId)}</button></div>
        <div class="pn-bat" aria-hidden="true">${STICK}</div>
      </div>
      <div class="pn-actions"><p class="pn-hint">${K.hint}</p><p class="pn-left" aria-live="polite"></p></div>
    </section>
    <main class="pn-main">
      <header class="pn-hero fx-r">
        ${bunting(pal)}
        ${P.photo ? `<div class="pn-balloon"><div class="pn-balloon-body">${portrait(P, "")}</div><i class="pn-balloon-knot" aria-hidden="true"></i><svg class="pn-balloon-string" viewBox="0 0 20 70" aria-hidden="true"><path d="M10 0c-7 10 7 16 0 26s7 16 0 26-4 12 0 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></div>` : ""}
        <h1>${P.name}</h1>
        ${P.age ? `<p class="pn-age" aria-hidden="true">${String(P.age).split("").map((c, i) => `<span style="--i:${i}">${c}</span>`).join("")}</p>` : ""}
        <p class="pn-sub">${P.sub}</p>
        ${P.intro ? `<p class="pn-txt">${P.intro}</p>` : ""}
        ${X.surprise}
      </header>
      <section class="pn-sec pn-datesec fx-r"><small>${F.dateEyebrow}</small>
        <button type="button" class="pn-sweet" aria-label="${K.unwrapAria}">
          <span class="pn-date"><b>${w ? esc(w.day) : ""}</b><span>${w ? esc(`${w.month} ${w.year}`) : ""}</span><em>${w ? esc(w.full) : ""}</em></span>
          <img class="pn-paper pn-pl" src="/img/pinata-bonbon-${palId}.webp" alt="" draggable="false"><img class="pn-paper pn-pr" src="/img/pinata-bonbon-${palId}.webp" alt="" draggable="false">
        </button>
        <p class="fx-gatehint pn-gh">${K.unwrap}</p>
      </section>
      <div class="fx-after">${after.join("")}</div>
    </main>
    <button type="button" class="fx-snd" aria-label="${F.mute}">${ICON.sound}</button>
  </div>`;

  const q = (s) => root.querySelector(s);
  const fx = q(".fx"), intro = q(".pn-intro"), hang = q(".pn-hang"), bat = q(".pn-bat"), leftEl = q(".pn-left");
  const FXP = particles(fx, L, REDUCE);
  const RV = reveal(root, REDUCE, L);
  const CD = countdown(root, P.start, REDUCE, L);
  soundButton(root, S, F, L);
  if (REDUCE) fx.classList.add("is-still");

  /* ---------- Musique : petite fanfare sautillante ---------- */
  const MEL = [659, 784, 880, 784, 659, 0, 587, 659, 523, 0, 659, 784, 988, 880, 784, 0];
  const BASS = [131, 196, 147, 196];
  const tune = (t0) => { const b = 0.2; MEL.forEach((f, i) => f && S.tone(f, t0 + i * b, 0.22, 0.07, "square")); BASS.forEach((f, i) => { S.tone(f, t0 + i * b * 4, 0.2, 0.18, "triangle"); S.tone(f * 2, t0 + i * b * 4 + b * 2, 0.15, 0.08, "triangle"); }); };

  /* ---------- Ouverture : 3 coups de bâton ---------- */
  let hits = 0, busy = false, done = false;
  function hit() {
    if (done || busy) return;
    S.audio(); busy = true; hits++;
    bat.classList.remove("is-whack"); void bat.offsetWidth; bat.classList.add("is-whack");
    L.later(() => {
      hang.classList.remove("is-hit"); void hang.offsetWidth; hang.classList.add("is-hit");
      hang.dataset.hits = String(hits);
      const t = S.now(); S.tone(140, t, 0.18, 0.35, "sine", 0.45); S.noise(t, 0.09, 0.25, 500, 0.7); navigator.vibrate?.(25);
      const r = q(".pn-body").getBoundingClientRect();
      FXP.burst(r.left + r.width / 2, r.top + r.height / 2, hits * 10, { colors: pal.conf, speed: 6, size: 4 });
      if (hits >= 3) { leftEl.textContent = ""; explode(); } else { leftEl.textContent = K.left(3 - hits); busy = false; }
    }, REDUCE ? 0 : 170);
  }
  function explode() {
    done = true; q(".pn-hint").textContent = "";
    L.later(() => {
      hang.classList.add("is-burst");
      const r = q(".pn-body").getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      const t = S.now(); S.noise(t, 0.4, 0.45, 900, 0.5); S.tone(90, t, 0.4, 0.4, "sine", 0.5); S.chime();
      FXP.burst(x, y, 40, { colors: pal.conf, shape: "candy", size: 5, speed: 14, life: 160 });
      if (!REDUCE) for (let i = 0; i < 16; i++) {
        const c = document.createElement("img"), a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 220;
        c.src = `/img/pinata-bonbon-${CANDIES[i % CANDIES.length][0]}.webp`; c.alt = ""; c.className = "pn-fly";
        c.style.cssText = `left:${x}px;top:${y}px;--dx:${(Math.cos(a) * v).toFixed(0)}px;--dy:${(Math.sin(a) * v - 60).toFixed(0)}px;--r:${(Math.random() * 720 - 360).toFixed(0)}deg;--d:${(Math.random() * 0.15).toFixed(2)}s`;
        intro.appendChild(c); L.later(() => c.remove(), 2200);
      }
      FXP.burst(x, y, 140, { colors: pal.conf, speed: 15, size: 5 });
      navigator.vibrate?.([30, 40, 60]);
    }, REDUCE ? 0 : 260);
    L.later(() => openMain(false), REDUCE ? 80 : 1800);
    L.later(() => S.loop(tune, 3.2), 1100);
  }
  L.on(q(".pn-hit"), "click", hit);

  function showIntro() {
    hits = 0; busy = false; done = false; S.stopLoop();
    hang.classList.remove("is-hit", "is-burst"); hang.dataset.hits = "0"; leftEl.textContent = ""; q(".pn-hint").textContent = K.hint;
    fx.classList.remove("is-open"); intro.hidden = false; intro.classList.remove("is-out");
    document.body.classList.add("fx-locked"); scrollTo(0, 0); RV.reset();
  }
  function openMain(instant) {
    fx.classList.add("is-open"); document.body.classList.remove("fx-locked"); scrollTo(0, 0);
    intro.classList.add("is-out"); L.later(() => { intro.hidden = true; }, instant ? 0 : 700);
    RV.again();
  }

  /* ---------- La date dans le bonbon (obligatoire) ---------- */
  let gated = !OPTS.noGate;
  const sweet = q(".pn-sweet");
  const setGate = (on) => { gated = on; fx.classList.toggle("is-gated", on); };
  setGate(gated);
  if (!gated) { sweet.classList.add("is-open"); q(".pn-gh").hidden = true; }
  L.on(sweet, "click", () => {
    if (sweet.classList.contains("is-open") || sweet.classList.contains("is-twist")) return;
    S.audio(); sweet.classList.add("is-twist");
    const t = S.now(); [0, 0.08, 0.16, 0.24].forEach((d) => S.noise(t + d, 0.06, 0.12, 3200, 1.2, "highpass"));
    L.later(() => {
      sweet.classList.add("is-open"); sweet.setAttribute("aria-label", w ? w.full : K.unwrap);
      if (!gated) return; setGate(false); q(".pn-gh").hidden = true; S.chime(); navigator.vibrate?.(20);
      const r = sweet.getBoundingClientRect(); FXP.burst(r.left + r.width / 2, r.top + r.height / 2, 60, { colors: pal.conf, speed: 9 });
      CD.animate(); RV.again();
      L.later(() => scrollBy({ top: innerHeight * 0.55, behavior: REDUCE ? "auto" : "smooth" }), 1300);
    }, REDUCE ? 0 : 650);
  });

  /* ---------- Réponse : pluie de confettis ---------- */
  bindRsvp(root, P, OPTS, L, (yes) => { q(".pn-rsvp").classList.add("is-sent"); S.chime(); if (yes) { FXP.rain(160, { colors: pal.conf }); FXP.rain(30, { colors: pal.conf, shape: "candy", size: 6 }); } });
  L.on(q(".fx-replay"), "click", () => showIntro());

  if (OPTS.skipIntro) { intro.hidden = true; openMain(true); } else showIntro();

  return {
    replay() { showIntro(); },
    destroy() { L.end(); RV.stop(); S.close(); FXP.remove(); document.body.classList.remove("fx-locked"); root.innerHTML = ""; },
  };
}
