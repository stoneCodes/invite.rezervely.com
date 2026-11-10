// Modèle « Le gâteau magique » (anniversaire enfant) : on souffle les bougies, puis on descend le gâteau étage par étage.
// Ouverture : autant de bougies que l'âge (jusqu'à 12) ; on souffle dans le micro (autorisation au geste) ou on touche chaque flamme.
// Défilement : chaque section est un étage du gâteau, de plus en plus large ; les étages « atterrissent » en arrivant.
// Date : sous la crème, à étaler du doigt (obligatoire avant la suite). Palette au choix des parents (data.bday.palette).
import { prep, life, sound, soundButton, particles, reveal, countdown, countHtml, extras, venueBtns, rsvpForm, bindRsvp, portrait, wipe, esc, ICON, clamp } from "../fete/core";
import { wishHtml } from "../wishlist";

const PAL = {
  rose: { c1: "#F6B7CB", c2: "#A8DCCF", c3: "#FFD86B", ink: "#6b2a45", conf: ["#F6B7CB", "#A8DCCF", "#FFD86B", "#E2557F", "#ffffff"] },
  bleu: { c1: "#9FD0F0", c2: "#FFD86B", c3: "#F6A6B8", ink: "#1f3f63", conf: ["#9FD0F0", "#FFD86B", "#7BD389", "#2F7FC8", "#ffffff"] },
};

/** Bougies posées sur l'étage du haut de la photo du gâteau (repère : photo 941 x 1672). */
function candlesSvg(n, pal) {
  const rows = n > 6 ? [{ k: Math.ceil(n / 2), x0: 290, x1: 650, y: 220 }, { k: Math.floor(n / 2), x0: 330, x1: 610, y: 270 }] : [{ k: n, x0: n === 1 ? 470 : 310, x1: n === 1 ? 470 : 630, y: 252 }];
  let i = 0, out = "";
  for (const r of rows) for (let j = 0; j < r.k; j++) {
    const x = r.k === 1 ? (r.x0 + r.x1) / 2 : r.x0 + ((r.x1 - r.x0) * j) / (r.k - 1);
    const y = r.y + Math.sin((Math.PI * j) / Math.max(1, r.k - 1)) * 10, h = 130 + (i % 2) * 14, top = y - h;
    out += `<g class="gt-candle" data-i="${i}">
      <rect x="${x - 12}" y="${top}" width="24" height="${h}" rx="6" fill="url(#gtStripe)"/><rect x="${x - 12}" y="${top}" width="8" height="${h}" rx="4" fill="rgba(255,255,255,.35)"/>
      <path d="M${x} ${top} v-9" stroke="#3b2a1a" stroke-width="2.4"/>
      <g class="gt-flame"><ellipse cx="${x}" cy="${top - 34}" rx="24" ry="32" fill="rgba(255,196,80,.3)"/><path d="M${x} ${top - 70} c14 17 16 30 0 44 c-16-14-14-27 0-44z" fill="#FFC24A"/><path d="M${x} ${top - 50} c7 8 7 15 0 21 c-7-6-7-13 0-21z" fill="#fff3c4"/></g>
      <path class="gt-smoke" d="M${x} ${top - 16} c-10-14 10-20 0-34 c-10-14 10-20 0-38" stroke="#d6d6d6" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect class="gt-hit" x="${x - 28}" y="${top - 90}" width="56" height="${h + 100}" fill="transparent"/></g>`;
    i++;
  }
  return `<svg class="gt-cake" viewBox="0 0 941 1672" aria-hidden="true"><defs>
    <pattern id="gtStripe" width="18" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><rect width="18" height="22" fill="${pal.c2}"/><rect width="18" height="9" fill="#fff"/></pattern></defs>${out}</svg>`;
}

/** Textures d'étage (photos) : nappage + coulures en haut, rosaces en bas, couleur unie au milieu. */
const TEX = { rose: "#f1a6ac", menthe: "#83dfa0", bleu: "#8ed8e7", jaune: "#fdd415" };

/** Photo façon décor de gâteau (demandé par Glad le 10 nov. 2026) : photo ronde imprimée comme une plaque en sucre,
 *  bordée de perles de crème fouettée, vermicelles autour. Seulement si les parents ont mis une photo. */
function topper(P) {
  const n = 20, pearls = Array.from({ length: n }, (_, i) => `<i style="--a:${(i * 360) / n}deg"></i>`).join("");
  const sprinkles = Array.from({ length: 9 }, (_, i) => `<b style="--a:${i * 40 + 12}deg;--d:${i % 3}"></b>`).join("");
  return `<div class="gt-topper"><div class="gt-topper-sprinkles" aria-hidden="true">${sprinkles}</div><div class="gt-topper-photo">${portrait(P, "")}</div><div class="gt-topper-pearls" aria-hidden="true">${pearls}</div></div>`;
}

export function mountGateau(root, data, OPTS = {}) {
  const P = prep(data, OPTS, "gateau"), { F, REDUCE } = P, G = F.gateau, w = P.when, dc = P.dc;
  const palId = P.bd.palette === "bleu" ? "bleu" : "rose", pal = PAL[palId];
  document.body.dataset.tpl = "gateau";
  const L = life(), S = sound(L, OPTS.music), X = extras(P);
  const n = P.age && P.age <= 12 ? P.age : 5;
  let ti = 0;
  const skins = palId === "bleu" ? ["bleu", "jaune"] : ["rose", "menthe"];
  const tier = (cls, inner) => { const i = ti++, k = skins[i % 2]; return `<section class="gt-tier fx-r ${cls}" style="--w:${Math.min(100, 80 + i * 4)}%;--tc:${TEX[k]};--top:url(/img/gateau-${k}-haut.webp);--bot:url(/img/gateau-${k}-bas.webp)"><div class="gt-in">${inner}</div></section>`; };

  const tiers = [
    tier("gt-datet", `<small>${F.dateEyebrow}</small>
      <div class="gt-cream"><div class="gt-date"><b>${w ? esc(w.day) : ""}</b><span>${w ? esc(`${w.month} ${w.year}`) : ""}</span><em>${w ? esc(w.full) : ""}</em></div><canvas aria-label="${G.spreadAria}"></canvas></div>
      <p class="fx-gatehint gt-gh">${G.spread}</p>`),
  ];
  const after = [
    tier("", `<small>${F.countdown}</small>${countHtml(F, "gt-candies")}`),
    P.programme.length ? tier("", `<small>${F.program}</small><ol class="gt-prog">${P.programme.map((x, i) => `<li><i style="--b:${[pal.c3, "#fff", pal.c1, pal.c2][i % 4]}"></i><time>${esc(x.t)}</time><div><b>${esc(x.title)}</b>${x.note ? `<em>${esc(x.note)}</em>` : ""}</div></li>`).join("")}</ol>${X.end}`) : "",
    P.showDress ? tier("", `<small>${F.theme}</small>${dc.title ? `<h2>${esc(dc.title)}</h2>` : ""}${dc.note ? `<p>${esc(dc.note)}</p>` : ""}${P.colors.length ? `<div class="gt-balloons">${P.colors.map((c, i) => `<span style="--sw:${esc(c.hex)};--d:${(i % 3) * 0.4}s"><i></i>${esc(c.name)}</span>`).join("")}</div>` : ""}`) : "",
    P.venueQ || X.phone || X.gifts ? tier("", `<small>${F.venue}</small>${P.venueName ? `<h2>${P.venueName}</h2>` : ""}${P.venueAddr ? `<p>${P.venueAddr}</p>` : ""}${P.programme.length ? "" : X.end}${venueBtns(P)}${X.phone}${X.gifts ? `<div class="gt-gifts">${X.gifts}</div>` : ""}`) : "",
    wishHtml(data) ? tier("gt-wish", `<small>${P.T.wish.eyebrow}</small><h2>${P.T.wish.title}</h2>${wishHtml(data)}`) : "",
    tier("gt-rsvp", `<small>${F.rsvpKid}</small><h2>${F.rsvpKid}</h2>${P.rsvpBy ? `<p>${P.rsvpBy}</p>` : ""}${rsvpForm(P)}<div class="gt-sent" aria-hidden="true"><svg viewBox="0 0 120 100"><path d="M10 70 L100 40 L100 78 L10 92Z" fill="${pal.c1}"/><path d="M10 70 L100 40 L100 52 L10 80Z" fill="#fffaf3"/><path d="M10 70 L100 40 L96 30 Z" fill="#fff"/><circle cx="92" cy="30" r="7" fill="#e2557f"/></svg><p>${G.sent}</p></div>`),
  ];

  root.innerHTML = `<div class="fx fx-gateau" data-pal="${palId}" style="--c1:${pal.c1};--c2:${pal.c2};--c3:${pal.c3}">
    <section class="gt-intro" aria-label="${esc(F.birthdayOf(P.nameRaw))}">
      <div class="gt-head"><h1>${P.name}</h1><p>${P.sub}</p></div>
      <div class="gt-stage" role="button" tabindex="0" aria-label="${G.hint}"><img class="gt-photo-cake" src="/img/gateau-${palId}.webp" alt="" draggable="false">${candlesSvg(n, pal)}</div>
      <div class="gt-actions"><p class="gt-hint">${G.hint}</p><p class="gt-touch">${G.touch}</p>${navigator.mediaDevices?.getUserMedia ? `<button type="button" class="gt-blow">${G.blow}</button>` : ""}</div>
    </section>
    <main class="gt-main">
      <header class="gt-top fx-r">
        ${P.photo ? topper(P) : ""}
        <h1>${P.name}</h1>
        ${P.age ? `<p class="gt-age" aria-hidden="true">${P.age}</p>` : ""}
        <p class="gt-sub">${P.sub}</p>
        ${P.intro ? `<p class="gt-txt">${P.intro}</p>` : ""}
        ${X.surprise}
        <div class="gt-cue" aria-hidden="true"><i></i></div>
      </header>
      <div class="gt-cakebody">${tiers.join("")}<div class="fx-after">${after.join("")}</div></div>
      <footer class="gt-plate fx-after"><p class="gt-foot-name">${P.name}</p><p>${w ? esc(w.full) : ""}</p><button class="fx-replay" type="button">${F.replay}</button></footer>
    </main>
    <button type="button" class="fx-snd" aria-label="${F.mute}">${ICON.sound}</button>
  </div>`;

  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
  const fx = q(".fx"), intro = q(".gt-intro");
  const FXP = particles(fx, L, REDUCE);
  const RV = reveal(root, REDUCE, L);
  const CD = countdown(root, P.start, REDUCE, L);
  soundButton(root, S, F, L);
  if (REDUCE) fx.classList.add("is-still");

  /* ---------- Musique : ritournelle de xylophone ---------- */
  const MEL = [523, 659, 784, 659, 698, 880, 784, 0, 587, 698, 880, 698, 659, 784, 659, 523];
  const BASS = [131, 196, 175, 196];
  const tune = (t0) => { const b = 0.25; MEL.forEach((f, i) => f && (S.tone(f, t0 + i * b, 0.5, 0.1), S.tone(f * 2, t0 + i * b, 0.18, 0.03, "triangle"))); BASS.forEach((f, i) => { S.tone(f, t0 + i * b * 4, 0.35, 0.16); S.tone(f * 1.5, t0 + i * b * 4 + b * 2, 0.3, 0.1); }); };

  /* ---------- Ouverture : les bougies ---------- */
  const candles = qa(".gt-candle"); let left = candles.length, done = false, mic = null;
  function blowOut(c) {
    if (!c || c.classList.contains("is-out")) return;
    c.classList.add("is-out"); left--;
    S.noise(S.now(), 0.25, 0.12, 900, 0.6); navigator.vibrate?.(10);
    if (left <= 0) finish();
  }
  function finish() {
    if (done) return; done = true; stopMic();
    const r = q(".gt-cake").getBoundingClientRect();
    L.later(() => {
      S.chime(); FXP.burst(r.left + r.width / 2, r.top + r.height * 0.13, 160, { colors: pal.conf, speed: 13, size: 6 });
      intro.classList.add("is-done");
    }, REDUCE ? 0 : 500);
    L.later(() => openMain(false), REDUCE ? 60 : 1900);
    L.later(() => S.loop(tune, 4), 1200);
  }
  L.on(q(".gt-stage"), "pointerdown", (e) => { S.audio(); const c = e.target.closest(".gt-candle"); if (c) blowOut(c); });
  L.on(q(".gt-stage"), "keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); S.audio(); blowOut(candles.find((c) => !c.classList.contains("is-out"))); } });
  const blowBtn = q(".gt-blow");
  async function startMic() {
    try {
      S.audio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
      if (!L.alive || done) { stream.getTracks().forEach((t) => t.stop()); return; }
      const ctx = S.ctx || new (window.AudioContext || window.webkitAudioContext)(), src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser();
      an.fftSize = 1024; src.connect(an); const buf = new Float32Array(an.fftSize); let loud = 0, lastOut = 0;
      mic = { stream, stop() { stream.getTracks().forEach((t) => t.stop()); try { src.disconnect(); } catch (e) {} } };
      blowBtn?.classList.add("is-on");
      const listen = (t) => {
        if (!mic || done) return;
        an.getFloatTimeDomainData(buf); let s = 0; for (const v of buf) s += v * v; const rms = Math.sqrt(s / buf.length);
        loud = rms > 0.09 ? loud + 1 : 0;
        if (loud > 3 && t - lastOut > 110) { lastOut = t; blowOut(candles.find((c) => !c.classList.contains("is-out"))); }
        L.frame(listen);
      };
      L.frame(listen);
    } catch (e) { blowBtn?.remove(); }
  }
  function stopMic() { mic?.stop(); mic = null; blowBtn?.classList.remove("is-on"); }
  if (blowBtn) L.on(blowBtn, "click", startMic);

  function showIntro() {
    done = false; left = candles.length; candles.forEach((c) => c.classList.remove("is-out")); S.stopLoop();
    fx.classList.remove("is-open"); intro.hidden = false; intro.classList.remove("is-done", "is-out");
    document.body.classList.add("fx-locked"); scrollTo(0, 0); RV.reset();
  }
  function openMain(instant) {
    fx.classList.add("is-open"); document.body.classList.remove("fx-locked"); scrollTo(0, 0);
    intro.classList.add("is-out"); L.later(() => { intro.hidden = true; }, instant ? 0 : 800);
    RV.again(); L.later(() => cream.draw(), 80);
  }

  /* ---------- Vermicelles qui défilent un peu moins vite que le gâteau ---------- */
  let fr = 0;
  L.on(window, "scroll", () => { cancelAnimationFrame(fr); fr = requestAnimationFrame(() => fx.style.setProperty("--sy", `${Math.round(scrollY * -0.18)}px`)); }, { passive: true });

  /* ---------- La date sous la crème (obligatoire) ---------- */
  let gated = !OPTS.noGate;
  const setGate = (on) => { gated = on; fx.classList.toggle("is-gated", on); };
  setGate(gated);
  const cv = q(".gt-cream canvas");
  let creamSnd = 0;
  const cream = wipe(cv, (g, cw, ch) => {
    g.fillStyle = "#fffaf3"; g.fillRect(0, 0, cw, ch);
    g.strokeStyle = "rgba(220,200,180,.55)"; g.lineWidth = 3; g.lineCap = "round";
    for (let i = 0; i < 7; i++) { g.beginPath(); for (let x = -10; x <= cw + 10; x += 8) g.lineTo(x, ch * (0.12 + i * 0.13) + Math.sin(x / 22 + i) * 6); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,.9)"; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc((i * 67) % cw, (i * 41) % ch, 2 + (i % 4), 0, 7); g.fill(); }
  }, revealDate, L, S, { width: 50, onStroke: () => { const t = performance.now(); if (t - creamSnd > 120) { creamSnd = t; S.noise(S.now(), 0.12, 0.05, 700, 0.5); } } });
  if (!gated) { cv.remove(); q(".gt-cream").classList.add("is-done"); q(".gt-gh").hidden = true; }
  function revealDate() {
    if (!gated) return; setGate(false); q(".gt-cream").classList.add("is-done"); L.later(() => cv.remove(), 700);
    q(".gt-gh").hidden = true; S.chime(); navigator.vibrate?.(20);
    const r = q(".gt-cream").getBoundingClientRect(); FXP.burst(r.left + r.width / 2, r.top + r.height / 2, 70, { colors: pal.conf, speed: 9 });
    CD.animate(); RV.again();
    L.later(() => scrollBy({ top: innerHeight * 0.55, behavior: REDUCE ? "auto" : "smooth" }), 1300);
  }

  /* ---------- Réponse : une part de gâteau s'envole ---------- */
  bindRsvp(root, P, OPTS, L, (yes) => { q(".gt-rsvp").classList.add("is-sent"); S.chime(); if (yes) FXP.rain(120, { colors: pal.conf }); });
  L.on(q(".fx-replay"), "click", () => showIntro());

  if (OPTS.skipIntro) { intro.hidden = true; openMain(true); } else showIntro();

  return {
    replay() { showIntro(); },
    destroy() { stopMic(); L.end(); RV.stop(); S.close(); cancelAnimationFrame(fr); FXP.remove(); document.body.classList.remove("fx-locked"); root.innerHTML = ""; },
  };
}
