// Modèle « Face A » (anniversaire adulte) : platine vinyle.
// Ouverture : on fait glisser le bras de lecture sur le disque, le disque tourne, la musique part, la platine s'approche.
// Défilement : l'invitation est un album ; chaque section est une piste, un lecteur « en cours » suit la lecture en bas d'écran.
// Date : sur l'étiquette d'un grand disque, floue tant qu'on ne la « scratche » pas (obligatoire avant la suite).
import { prep, life, sound, soundButton, particles, reveal, countdown, countHtml, extras, venueBtns, swatches, rsvpForm, bindRsvp, portrait, esc, ICON, clamp } from "../fete/core";
import { wishHtml } from "../wishlist";

// Repères mesurés sur la photo de la platine (941 x 1672, bras d'origine effacé) : pivot du bras en % de la scène.
// Le bras est la photo détourée vinyle-bras.webp ; ARM_PLAY pose la pointe sur les premiers sillons du disque.
const ARM_REST = 0, ARM_PLAY = 21, ARM_MAX = 28, ARM_DROP = 11;
const PIVOT = { x: 0.8395, y: 0.3517 };
const ARM = `<img src="/img/vinyle-bras.webp" alt="" draggable="false">`;

export function mountVinyle(root, data, OPTS = {}) {
  const P = prep(data, OPTS, "vinyle"), { F, REDUCE } = P, V = F.vinyle;
  document.body.dataset.tpl = "vinyle";
  const L = life(), S = sound(L, OPTS.music), X = extras(P);
  const lbl = P.age ? String(P.age) : P.initial;
  const rec = (cls, inner = `<span>${lbl}</span>`) => `<div class="vy-rec ${cls}"><i class="vy-shine"></i><div class="vy-label">${inner}</div></div>`;

  // Pistes dans l'ordre d'affichage (la date est toujours la piste 1).
  const tracks = [{ id: "date", t: V.tDate }, { id: "count", t: V.tCount }];
  if (P.programme.length) tracks.push({ id: "prog", t: V.tProg });
  if (P.showDress) tracks.push({ id: "dress", t: V.tDress });
  if (P.venueQ || X.end || X.gifts) tracks.push({ id: "place", t: V.tPlace });
  const W = P.T.wish, wish = wishHtml(data);
  if (wish) tracks.push({ id: "wish", t: W.title });
  tracks.push({ id: "rsvp", t: V.tRsvp });
  const head = (id) => { const i = tracks.findIndex((x) => x.id === id); return `<header class="vy-th fx-r"><span class="vy-no" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><div><small>${V.track(i + 1)}</small><h2>${tracks[i].t}</h2></div></header>`; };
  const w = P.when;
  const dc = P.dc;

  const after = [
    `<section class="vy-track" data-t="count">${head("count")}${countHtml(F, "vy-lcd fx-r")}</section>`,
    P.programme.length ? `<section class="vy-track" data-t="prog">${head("prog")}<ol class="vy-list">${P.programme.map((x, i) => `<li class="fx-r"><span class="vy-n">${i + 1}</span><div><b>${esc(x.title)}</b>${x.note ? `<em>${esc(x.note)}</em>` : ""}</div><time>${esc(x.t)}</time></li>`).join("")}</ol></section>` : "",
    P.showDress ? `<section class="vy-track" data-t="dress">${head("dress")}<div class="vy-dress fx-r">${dc.title ? `<h3>${esc(dc.title)}</h3>` : ""}${dc.note ? `<p>${esc(dc.note)}</p>` : ""}
      ${P.colors.length ? `<div class="vy-sleeves">${P.colors.map((c) => `<figure style="--sw:${esc(c.hex)}"><i></i><div></div><figcaption>${esc(c.name)}</figcaption></figure>`).join("")}</div>` : ""}</div></section>` : "",
    P.venueQ || X.end || X.gifts ? `<section class="vy-track" data-t="place">${head("place")}<div class="vy-place fx-r">${P.venueName ? `<h3>${P.venueName}</h3>` : ""}${P.venueAddr ? `<p>${P.venueAddr}</p>` : ""}${X.end}${venueBtns(P)}</div>${X.gifts ? `<div class="vy-notes fx-r">${X.gifts}</div>` : ""}</section>` : "",
    wish ? `<section class="vy-track" data-t="wish">${head("wish")}<div class="vy-wish fx-r"><p class="vy-wish-k">${W.eyebrow}</p>${wish}</div></section>` : "",
    `<section class="vy-track vy-rsvp" data-t="rsvp">${head("rsvp")}<div class="fx-r">${P.rsvpBy ? `<p class="vy-by">${P.rsvpBy}</p>` : ""}${rsvpForm(P)}</div>
      <div class="vy-sent" aria-hidden="true"><div class="vy-sent-sleeve"></div>${rec("vy-sent-rec", "")}</div></section>`,
    `<footer class="vy-foot"><div class="vy-foot-rec" aria-hidden="true">${rec("", "")}</div><p class="vy-foot-name">${P.name}</p><p>${w ? esc(w.full) : ""}</p><button class="fx-replay" type="button">${F.replay}</button></footer>`,
  ];

  root.innerHTML = `<div class="fx fx-vinyle">
    <section class="vy-intro" aria-label="${esc(F.birthdayOf(P.nameRaw))}">
      <div class="vy-head"><small>${V.sideA}</small><h1>${P.name}</h1><p>${P.sub}</p></div>
      <div class="vy-deck">
        <img class="vy-plate" src="/img/vinyle-platine.webp" alt="" draggable="false">
        ${rec("vy-rec-intro")}
        <button class="vy-arm" type="button" aria-label="${V.arm}">${ARM}</button>
      </div>
      <p class="vy-hint"><span>${V.hint}</span></p>
    </section>
    <main class="vy-main">
      <header class="vy-cover">
        <div class="vy-album fx-r">${rec("vy-rec-cover")}<div class="vy-sleeve">${portrait(P, "vy-photo")}<span class="vy-badge">${P.age ? V.edition(P.age) : V.sideA}</span></div></div>
        <small class="fx-r">${V.sideA}</small>
        <h1 class="fx-r">${P.name}</h1>
        <p class="vy-sub fx-r">${P.sub}</p>
        ${P.intro ? `<p class="vy-txt fx-r">${P.intro}</p>` : ""}
        ${X.surprise ? `<div class="vy-advisory fx-r">${X.surprise}</div>` : ""}
        <ol class="vy-tracklist fx-r">${tracks.map((x, i) => `<li><span>${i + 1}</span>${x.t}</li>`).join("")}</ol>
      </header>
      <section class="vy-track vy-date" data-t="date">${head("date")}
        <div class="vy-scratch fx-r">
          <div class="vy-big" tabindex="0" role="button" aria-label="${V.scratchAria}">
            <i class="vy-shine"></i>
            <div class="vy-dlabel"><div class="vy-dtxt"><b>${w ? esc(w.day) : ""}</b><span>${w ? esc(`${w.month} ${w.year}`) : ""}</span><em>${w ? esc(w.full) : ""}</em></div></div>
          </div>
          <div class="vy-hand" aria-hidden="true"></div>
        </div>
        <p class="fx-gatehint vy-gh">${V.scratch}</p>
      </section>
      <div class="fx-after">${after.join("")}</div>
    </main>
    <div class="vy-np" aria-hidden="true">${rec("vy-np-rec", "")}<div><small>${V.sideA}</small><b class="vy-np-t">${tracks[0].t}</b></div><span class="vy-np-bar"><i></i></span></div>
    <button type="button" class="fx-snd" aria-label="${F.mute}">${ICON.sound}</button>
  </div>`;

  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
  const fx = q(".fx"), intro = q(".vy-intro"), deck = q(".vy-deck"), arm = q(".vy-arm");
  const FXP = particles(fx, L, REDUCE);
  const RV = reveal(root, REDUCE, L);
  const CD = countdown(root, P.start, REDUCE, L);
  soundButton(root, S, F, L);
  if (REDUCE) fx.classList.add("is-still");

  /* ---------- Musique : groove feutré, craquements de vinyle ---------- */
  const CH = [[174.6, 220, 261.6, 329.6], [164.8, 196, 246.9, 293.7], [146.8, 174.6, 220, 261.6], [130.8, 164.8, 196, 246.9]];
  const groove = (t0) => {
    const b = 0.625;
    CH.forEach((c, bar) => {
      const t = t0 + bar * b * 4;
      [0, 2].forEach((k) => { S.tone(c[0] / 2, t + k * b, 0.5, 0.22); S.tone(110, t + k * b, 0.25, 0.25, "sine", 0.4); });
      [1, 3].forEach((k) => c.slice(1).forEach((f, j) => S.tone(f, t + k * b + j * 0.012, 0.9, 0.05, "triangle")));
      for (let h = 0; h < 8; h++) S.noise(t + h * b / 2, 0.04, h % 2 ? 0.02 : 0.035, 8000, 0.7, "highpass");
      for (let c2 = 0; c2 < 3; c2++) S.noise(t + Math.random() * b * 4, 0.012, 0.05, 3000, 0.5);
    });
  };

  /* ---------- Ouverture : le bras de lecture ---------- */
  let armA = ARM_REST, dragging = false, moved = false, dropped = false;
  const setArm = (a) => { armA = a; deck.style.setProperty("--arm", `${a}deg`); };
  const pivot = () => { const r = deck.getBoundingClientRect(); return { x: r.left + r.width * PIVOT.x, y: r.top + r.height * PIVOT.y }; };
  const angleAt = (e) => { const p = pivot(), vx = e.clientX - p.x, vy = e.clientY - p.y; return clamp((Math.atan2(-vx, vy) * 180) / Math.PI, ARM_REST, ARM_MAX); };
  function drop() {
    if (dropped) return; dropped = true;
    S.audio(); deck.classList.remove("is-drag"); setArm(ARM_PLAY);
    L.later(() => { deck.classList.add("is-play"); S.noise(S.now(), 0.08, 0.25, 600, 0.6); S.loop(groove, 10); }, REDUCE ? 0 : 450);
    L.later(() => intro.classList.add("is-zoom"), REDUCE ? 0 : 2000);
    L.later(() => openMain(false), REDUCE ? 50 : 2900);
  }
  L.on(deck, "pointerdown", (e) => { if (dropped) return; dragging = true; moved = false; S.audio(); deck.setPointerCapture?.(e.pointerId); deck.classList.add("is-drag"); });
  L.on(deck, "pointermove", (e) => { if (!dragging) return; const a = angleAt(e); if (Math.abs(a - armA) > 1.5) moved = true; setArm(a); });
  const release = () => {
    if (!dragging) return; dragging = false; deck.classList.remove("is-drag");
    if (!moved || armA >= ARM_DROP) drop(); else setArm(ARM_REST);
  };
  L.on(deck, "pointerup", release); L.on(deck, "pointercancel", release);
  L.on(arm, "keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); drop(); } });

  function showIntro() {
    dropped = false; S.stopLoop(); setArm(ARM_REST);
    fx.classList.remove("is-open"); intro.hidden = false; intro.classList.remove("is-zoom"); deck.classList.remove("is-play");
    document.body.classList.add("fx-locked"); scrollTo(0, 0); RV.reset();
  }
  function openMain(instant) {
    fx.classList.add("is-open"); document.body.classList.remove("fx-locked"); scrollTo(0, 0);
    L.later(() => { intro.hidden = true; }, instant ? 0 : 50);
    RV.again();
  }

  /* ---------- La date : scratch sur l'étiquette (obligatoire) ---------- */
  const big = q(".vy-big"); let gated = !OPTS.noGate, acc = 0, rot = 0, sx = null, lastSnd = 0;
  const setGate = (on) => { gated = on; fx.classList.toggle("is-gated", on); };
  setGate(gated);
  const blur = () => big.style.setProperty("--blur", `${Math.max(0, 12 - acc / 38).toFixed(1)}px`);
  if (!gated) { acc = 9999; big.classList.add("is-done"); q(".vy-gh").textContent = V.scratched; }
  blur();
  const scratch = (dx) => {
    if (!gated) return;
    rot += dx * 0.7; acc += Math.abs(dx); big.style.setProperty("--r", `${rot}deg`); blur();
    const now = performance.now();
    if (now - lastSnd > 70) { lastSnd = now; S.noise(S.now(), 0.07, 0.18, dx > 0 ? 1400 : 900, 2.5); }
    if (acc > 460) revealDate();
  };
  function revealDate() {
    setGate(false); big.classList.add("is-done"); acc = 9999; blur(); S.chime(); navigator.vibrate?.(20);
    const r = big.getBoundingClientRect(); FXP.burst(r.left + r.width / 2, r.top + r.height / 2, 60, { colors: ["#C9A24A", "#F3E6CC", "#E8C77A"], shape: "circle", size: 3, speed: 8 });
    q(".vy-gh").textContent = V.scratched; CD.animate(); RV.again(); watchTracks();
    L.later(() => scrollBy({ top: innerHeight * 0.55, behavior: REDUCE ? "auto" : "smooth" }), 1400);
  }
  L.on(big, "pointerdown", (e) => { S.audio(); sx = e.clientX; big.setPointerCapture?.(e.pointerId); big.classList.add("is-hold"); });
  L.on(big, "pointermove", (e) => { if (sx == null) return; scratch(e.clientX - sx); sx = e.clientX; });
  const up = () => { sx = null; big.classList.remove("is-hold"); };
  L.on(big, "pointerup", up); L.on(big, "pointercancel", up);
  L.on(big, "keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") { e.preventDefault(); S.audio(); scratch(e.key === "ArrowLeft" ? -60 : 60); } });

  /* ---------- Lecteur « en cours » : piste visible + progression ---------- */
  const np = q(".vy-np"), npT = q(".vy-np-t"), npBar = q(".vy-np-bar i"), cover = q(".vy-rec-cover");
  let tio = null;
  function watchTracks() {
    tio?.disconnect();
    if (!("IntersectionObserver" in window)) return;
    tio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const t = tracks.find((x) => x.id === e.target.dataset.t); if (t) npT.textContent = t.t; } }), { rootMargin: "-45% 0px -45% 0px" });
    qa(".vy-track").forEach((s) => tio.observe(s));
  }
  watchTracks();
  let fr = 0;
  const onScroll = () => {
    cancelAnimationFrame(fr);
    fr = requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight, k = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
      npBar.style.transform = `scaleX(${k.toFixed(3)})`; np.classList.toggle("is-on", scrollY > innerHeight * 0.5);
      if (!REDUCE) cover.style.setProperty("--spin", `${(scrollY * 0.35).toFixed(1)}deg`);
    });
  };
  L.on(window, "scroll", onScroll, { passive: true });

  /* ---------- Réponse : le disque rentre dans sa pochette ---------- */
  bindRsvp(root, P, OPTS, L, (yes) => { q(".vy-rsvp").classList.add("is-sent"); S.chime(); if (yes) { const r = q(".vy-sent").getBoundingClientRect(); FXP.burst(r.left + r.width / 2, r.top, 50, { colors: ["#C9A24A", "#F3E6CC"], shape: "circle", size: 3 }); } });
  L.on(q(".fx-replay"), "click", () => showIntro());

  if (OPTS.skipIntro) { intro.hidden = true; openMain(true); } else showIntro();

  return {
    replay() { showIntro(); },
    destroy() { L.end(); tio?.disconnect(); RV.stop(); S.close(); cancelAnimationFrame(fr); FXP.remove(); document.body.classList.remove("fx-locked"); root.innerHTML = ""; },
  };
}
