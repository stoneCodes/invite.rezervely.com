// Modèle « Le toast » (anniversaire adulte) : champagne sabré.
// Ouverture : on fait glisser le sabre le long du col, le bouchon saute, la mousse jaillit, l'écran se dore.
// Défilement : on remonte avec les bulles ; chaque section naît dans une bulle de verre, le fond passe du bleu nuit au champagne.
// Date : dans une grande bulle à faire éclater (obligatoire avant la suite).
import { prep, life, sound, soundButton, particles, reveal, countdown, countHtml, extras, venueBtns, swatches, rsvpForm, bindRsvp, portrait, agePhoto, esc, ICON, clamp } from "../fete/core";
import { wishHtml } from "../wishlist";

// Ouverture en photo (941 x 1672) : bouteille dont la capsule a été effacée + capsule détourée posée par-dessus,
// sabre détouré qui glisse vers le haut le long du col. Le prénom s'écrit sur l'étiquette vierge.
const DIR = { x: 0, y: -1 };

export function mountToast(root, data, OPTS = {}) {
  const P = prep(data, OPTS, "toast"), { F, REDUCE } = P, K = F.toast;
  document.body.dataset.tpl = "toast";
  const L = life(), S = sound(L, OPTS.music), X = extras(P), w = P.when, dc = P.dc;
  const glass = (inner, cls = "") => `<div class="tt-glass fx-r ${cls}"><i class="tt-sheen" aria-hidden="true"></i>${inner}</div>`;
  const head = (k, t) => `<header class="tt-h fx-r"><small>${k}</small><h2>${t}</h2></header>`;

  const after = [
    `<section class="tt-sec">${head(F.countdown, "")}<div class="tt-orbs fx-r">${countHtml(F)}</div></section>`,
    P.programme.length ? `<section class="tt-sec">${head(F.program, "")}<ol class="tt-prog">${P.programme.map((x, i) => `<li class="tt-glass fx-r ${i % 2 ? "r" : "l"}" style="--d:${4 + (i % 3)}s"><i class="tt-sheen" aria-hidden="true"></i><time>${esc(x.t)}</time><b>${esc(x.title)}</b>${x.note ? `<em>${esc(x.note)}</em>` : ""}</li>`).join("")}</ol></section>` : "",
    P.showDress ? `<section class="tt-sec">${glass(`<small>${F.dress}</small>${dc.title ? `<h3>${esc(dc.title)}</h3>` : ""}${dc.note ? `<p>${esc(dc.note)}</p>` : ""}${swatches(P)}`)}</section>` : "",
    P.venueQ || X.end ? `<section class="tt-sec">${glass(`<small>${F.venue}</small>${P.venueName ? `<h3>${P.venueName}</h3>` : ""}${P.venueAddr ? `<p>${P.venueAddr}</p>` : ""}${X.end}${venueBtns(P)}`)}</section>` : "",
    X.gifts ? `<section class="tt-sec">${glass(X.gifts, "tt-small")}</section>` : "",
    wishHtml(data) ? `<section class="tt-sec">${glass(`<small>${P.T.wish.eyebrow}</small><h2>${P.T.wish.title}</h2>${wishHtml(data)}`, "tt-wide")}</section>` : "",
    `<section class="tt-sec tt-rsvp">${glass(`<small>${K.cheers}</small><h2>${F.rsvp}</h2>${P.rsvpBy ? `<p class="tt-by">${P.rsvpBy}</p>` : ""}${rsvpForm(P)}<div class="tt-sent" aria-hidden="true"><img class="tt-flutes" src="/img/toast-flutes.webp" alt=""><p>${K.sent}</p></div>`, "tt-wide")}</section>`,
    `<footer class="tt-foot"><p class="tt-foot-name">${P.name}</p><p>${w ? esc(w.full) : ""}</p><button class="fx-replay" type="button">${F.replay}</button></footer>`,
  ];

  root.innerHTML = `<div class="fx fx-toast">
    <div class="tt-sky" aria-hidden="true"></div>
    <canvas class="tt-bubbles" aria-hidden="true"></canvas>
    <section class="tt-intro" aria-label="${esc(F.birthdayOf(P.nameRaw))}">
      <div class="tt-stage" role="button" tabindex="0" aria-label="${K.sabre}">
        <img class="tt-bottle" src="/img/toast-bouteille-ouverte.webp" alt="" draggable="false">
        <img class="tt-cork" src="/img/toast-bouchon.webp" alt="" draggable="false">
        <div class="tt-head"><h1>${P.name}</h1><p>${P.sub}</p></div>
        <div class="tt-sabre-wrap"><img src="/img/toast-sabre.webp" alt="" draggable="false"></div>
      </div>
      <p class="tt-hint"><span>${K.hint}</span></p>
      <div class="tt-flash" aria-hidden="true"></div>
    </section>
    <main class="tt-main">
      <header class="tt-hero">
        ${agePhoto(P) ? "" : P.photo ? `<div class="tt-photo fx-r">${portrait(P, "")}</div>` : ""}
        <h1 class="fx-r">${P.name}</h1>
        ${agePhoto(P, "tt-agephoto fx-r") || (P.age ? `<p class="tt-age fx-r" aria-hidden="true">${P.age}</p>` : "")}
        <p class="tt-sub fx-r">${P.sub}</p>
        ${P.intro ? `<p class="tt-txt fx-r">${P.intro}</p>` : ""}
        ${X.surprise ? glass(X.surprise, "tt-small tt-shh") : ""}
      </header>
      <section class="tt-sec tt-datesec">
        ${head(F.dateEyebrow, "")}
        <div class="tt-datebox fx-r">
          <div class="tt-date"><b>${w ? esc(w.day) : ""}</b><span>${w ? esc(`${w.month} ${w.year}`) : ""}</span><em>${w ? esc(w.full) : ""}</em></div>
          <button class="tt-orb-big" type="button" aria-label="${K.popAria}"><i class="tt-sheen" aria-hidden="true"></i><span>${K.pop}</span></button>
        </div>
      </section>
      <div class="fx-after">${after.join("")}</div>
    </main>
    <button type="button" class="fx-snd" aria-label="${F.mute}">${ICON.sound}</button>
  </div>`;

  const q = (s) => root.querySelector(s);
  const fx = q(".fx"), intro = q(".tt-intro"), stage = q(".tt-stage"), sabreW = q(".tt-sabre-wrap"), cork = q(".tt-cork");
  const FXP = particles(fx, L, REDUCE);
  const RV = reveal(root, REDUCE, L);
  const CD = countdown(root, P.start, REDUCE, L);
  soundButton(root, S, F, L);
  if (REDUCE) fx.classList.add("is-still");

  /* ---------- Musique : jazz pétillant ---------- */
  const CH = [[130.8, 246.9, 293.7, 329.6, 392], [110, 196, 246.9, 261.6, 329.6], [146.8, 261.6, 329.6, 349.2, 440], [98, 246.9, 329.6, 349.2, 392]];
  const swing = (t0) => {
    const b = 0.5;
    CH.forEach((c, bar) => {
      const t = t0 + bar * b * 4;
      S.tone(c[0], t, 1.6, 0.18); S.tone(c[0] * 1.5, t + b * 2, 1.2, 0.12);
      c.slice(1).forEach((f, j) => { S.tone(f, t + j * 0.09, 1.8, 0.05, "triangle"); S.tone(f * 2, t + b * 2.66 + j * 0.06, 0.6, 0.03, "sine"); });
      for (let h = 0; h < 4; h++) S.noise(t + h * b + b * 0.66, 0.09, 0.03, 6000, 0.6, "highpass");
    });
  };

  /* ---------- Ouverture : le sabre ---------- */
  let prog = 0, start = null, popped = false;
  const setProg = (k) => { prog = clamp(k, 0, 1); stage.style.setProperty("--k", prog.toFixed(3)); };
  function pop() {
    if (popped) return; popped = true; S.audio(); setProg(1); stage.classList.add("is-pop");
    const t = S.now(); S.tone(140, t, 0.25, 0.5, "sine", 0.3); S.noise(t, 0.18, 0.6, 1200, 0.7); S.noise(t + 0.05, 1.6, 0.12, 5000, 0.5, "highpass");
    navigator.vibrate?.([30, 40, 20]);
    const r = cork.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const ang = Math.atan2(DIR.y, DIR.x);
    FXP.burst(x, y, 180, { colors: ["#ffffff", "#fff6dc", "#f3dc92", "#e3c67e"], shape: "circle", size: 4, speed: 15, angle: ang, spread: 0.9, grav: 0.32, life: 90 });
    FXP.burst(x, y, 60, { colors: ["#f3dc92", "#ffffff"], shape: "ring", size: 6, speed: 7, angle: ang, spread: 1.6, grav: -0.04, life: 120 });
    L.later(() => intro.classList.add("is-flash"), REDUCE ? 0 : 500);
    L.later(() => openMain(false), REDUCE ? 50 : 1500);
    L.later(() => S.loop(swing, 8), 900);
  }
  L.on(stage, "pointerdown", (e) => { if (popped) return; S.audio(); start = { x: e.clientX, y: e.clientY, moved: false }; stage.setPointerCapture?.(e.pointerId); stage.classList.add("is-drag"); });
  L.on(stage, "pointermove", (e) => {
    if (!start || popped) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y, along = dx * DIR.x + dy * DIR.y;
    if (Math.hypot(dx, dy) > 8) start.moved = true;
    setProg(along / (stage.clientWidth * 0.5));
    if (prog >= 1) pop();
  });
  const release = () => {
    if (!start) return; const tap = !start.moved; start = null; stage.classList.remove("is-drag");
    if (popped) return;
    if (tap || prog > 0.6) { stage.classList.add("is-auto"); setProg(1); L.later(pop, REDUCE ? 0 : 420); } else setProg(0);
  };
  L.on(stage, "pointerup", release); L.on(stage, "pointercancel", release);
  L.on(stage, "keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stage.classList.add("is-auto"); setProg(1); L.later(pop, 420); } });

  function showIntro() {
    popped = false; setProg(0); S.stopLoop(); stage.classList.remove("is-pop", "is-auto");
    fx.classList.remove("is-open"); intro.hidden = false; intro.classList.remove("is-flash", "is-out");
    document.body.classList.add("fx-locked"); scrollTo(0, 0); RV.reset();
  }
  function openMain(instant) {
    fx.classList.add("is-open"); document.body.classList.remove("fx-locked"); scrollTo(0, 0);
    intro.classList.add("is-out"); L.later(() => { intro.hidden = true; }, instant ? 0 : 900);
    RV.again(); startBubbles();
  }

  /* ---------- Bulles qui montent (fond) et ciel qui se dore au défilement ---------- */
  const cv = q(".tt-bubbles"), g = cv.getContext("2d"); let B = [], bw = 0, bh = 0, running = false;
  const sizeCv = () => { const d = Math.min(2, devicePixelRatio || 1); bw = innerWidth; bh = innerHeight; cv.width = bw * d; cv.height = bh * d; g.setTransform(d, 0, 0, d, 0, 0); };
  sizeCv(); L.on(window, "resize", sizeCv);
  const mk = (y) => ({ x: Math.random() * bw, y: y ?? bh + 20, r: 1.5 + Math.random() * 5, v: 0.4 + Math.random() * 1.1, ph: Math.random() * 6 });
  function startBubbles() {
    if (running) return; running = true;
    B = Array.from({ length: REDUCE ? 14 : Math.min(46, Math.round(bw / 9)) }, () => mk(Math.random() * bh));
    const tick = () => {
      if (!running) return;
      g.clearRect(0, 0, bw, bh);
      for (const b of B) {
        if (!REDUCE) { b.y -= b.v; b.ph += 0.03; if (b.y < -20) Object.assign(b, mk()); }
        const x = b.x + Math.sin(b.ph) * 6;
        g.beginPath(); g.arc(x, b.y, b.r, 0, 7); g.strokeStyle = "rgba(255,246,220,.55)"; g.lineWidth = 1; g.stroke();
        g.beginPath(); g.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, 0, 7); g.fillStyle = "rgba(255,255,255,.7)"; g.fill();
      }
      if (!REDUCE) L.frame(tick);
    };
    tick();
  }
  let fr = 0;
  const onScroll = () => { cancelAnimationFrame(fr); fr = requestAnimationFrame(() => { const max = document.documentElement.scrollHeight - innerHeight; fx.style.setProperty("--p", (max > 0 ? clamp(scrollY / max, 0, 1) : 0).toFixed(3)); }); };
  L.on(window, "scroll", onScroll, { passive: true });

  /* ---------- La date : la bulle à faire éclater (obligatoire) ---------- */
  const orb = q(".tt-orb-big"); let gated = !OPTS.noGate;
  const setGate = (on) => { gated = on; fx.classList.toggle("is-gated", on); };
  setGate(gated);
  if (!gated) q(".tt-datebox").classList.add("is-done");
  L.on(orb, "click", () => {
    if (!gated) return; S.audio();
    const r = orb.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    q(".tt-datebox").classList.add("is-done"); setGate(false);
    const t = S.now(); S.noise(t, 0.08, 0.5, 2500, 1.2); S.tone(1046, t + 0.02, 0.4, 0.12); S.chime(); navigator.vibrate?.(20);
    for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; FXP.burst(x + Math.cos(a) * r.width * 0.45, y + Math.sin(a) * r.width * 0.45, 2, { colors: ["#ffffff", "#e9f4ff", "#f3dc92"], shape: "circle", size: 3, speed: 4, angle: a, spread: 0.4, grav: 0.12, life: 60 }); }
    CD.animate(); RV.again();
    L.later(() => scrollBy({ top: innerHeight * 0.55, behavior: REDUCE ? "auto" : "smooth" }), 1300);
  });

  /* ---------- Réponse : on trinque ---------- */
  bindRsvp(root, P, OPTS, L, (yes) => {
    q(".tt-rsvp").classList.add("is-sent");
    if (yes) { const t = S.now(); S.tone(2093, t + 0.55, 1.2, 0.12); S.tone(2637, t + 0.57, 1.0, 0.08); const r = q(".tt-sent").getBoundingClientRect(); L.later(() => FXP.burst(r.left + r.width / 2, r.top + 40, 70, { colors: ["#f3dc92", "#ffffff", "#e3c67e"], shape: "circle", size: 3, speed: 7 }), 550); }
    else S.chime();
  });
  L.on(q(".fx-replay"), "click", () => showIntro());

  if (OPTS.skipIntro) { intro.hidden = true; openMain(true); } else showIntro();

  return {
    replay() { showIntro(); },
    destroy() { running = false; L.end(); RV.stop(); S.close(); cancelAnimationFrame(fr); FXP.remove(); document.body.classList.remove("fx-locked"); root.innerHTML = ""; },
  };
}
