// Modèles « Save the date » (16 nov. 2026, demandés par Glad) : un produit à part, assorti à une invitation (même identité,
// autre ouverture). Version courte : ouverture → date mise en scène (moment fort) → photo → compte à rebours → lieu
// s'il est connu → « L'invitation arrive bientôt » + agenda. Pas de réponse, pas de programme.
//   variant "nuit"    : « Nuit dorée » — une carte noir et or posée sur la table de fête se retourne, la date se grave en or.
//   variant "domaine" : « Le domaine » — une étiquette de lin nouée d'un ruban, sur le mur ivoire, se retourne.
// Même contrat que les autres moteurs : mountStd(root, data, opts) → { replay, destroy } ; options skipIntro / noGate / music.
import { esc, dateParts } from "../engine";
import { inviteDict } from "../../../lib/i18n/invite";
import { createMusic, fxLevel } from "../music";

const ICON = {
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>',
};

export function mountStd(root, data, OPTS = {}, variant = "nuit") {
  const D = data, V = variant === "domaine" ? "domaine" : "nuit";
  const STILL = !!OPTS.skipIntro && !!OPTS.noGate; // aperçu de l'éditeur : carte déjà retournée, rien d'animé
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches || STILL;
  document.body.dataset.tpl = V === "nuit" ? "std-nuit-doree" : "std-domaine";
  const T = inviteDict(D.lang), S = T.save;
  const when = dateParts(D.dateISO, D.lang);
  const p1 = esc(D.partner1), p2 = esc(D.partner2);
  const ini = (s) => esc((String(s || "").trim()[0] || "").toUpperCase());
  const photo = typeof D.photoUrl === "string" && D.photoUrl ? D.photoUrl : null;
  let alive = true, timers = [], countI = 0, raf = 0, flipped = false;
  const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); return t; };
  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];

  /* ---------- Liens utiles ---------- */
  const start = new Date(D.dateISO), end = new Date(start.getTime() + 10 * 3600e3);
  const gfmt = (d) => isNaN(d) ? "" : d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const venueQ = [D.venue?.name, D.venue?.address].filter(Boolean).join(", ");
  const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(T.c.weddingOf(D.partner1, D.partner2))}&dates=${gfmt(start)}/${gfmt(end)}&location=${encodeURIComponent(venueQ)}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQ)}`;
  const note = esc(String(D.std?.note || "").trim() || S.followText);
  const time = when ? esc(when.full.split(" · ")[1] || "") : "";

  /* ---------- La carte (ou l'étiquette) : dos = monogramme, face = la date ---------- */
  const mono = `<span class="sd-mono">${ini(D.partner1)}<i>&amp;</i>${ini(D.partner2)}</span>`;
  const dateHtml = when ? `<div class="sd-engrave"><b>${esc(when.day)}</b><span>${esc(when.month)}</span><span>${esc(when.year)}</span></div>` : "";
  const back = V === "nuit"
    ? `<div class="sd-face sd-back"><div class="sd-ring">${mono}</div><small>${S.eyebrow}</small></div>`
    : `<div class="sd-face sd-back"><div class="sd-in">${mono}<hr><small>${S.eyebrow}</small></div></div>`;
  const front = `<div class="sd-face sd-front"><div class="sd-in"><small class="sd-k">${S.eyebrow}</small>
      <p class="sd-names">${p1}<i>&amp;</i>${p2}</p>${dateHtml}${time ? `<p class="sd-time">${time}</p>` : ""}</div></div>`;
  const card = V === "nuit"
    ? `<button type="button" class="sd-card" aria-label="${esc(S.openAria(D.partner1, D.partner2))}"><span class="sd-flip">${back}${front}</span></button>`
    : `<div class="sd-hang"><button type="button" class="sd-card sd-tag" aria-label="${esc(S.openAria(D.partner1, D.partner2))}"><span class="sd-flip">${back}${front}</span></button></div>`;

  const frame = photo ? `<img src="${esc(photo)}" alt="${esc(T.c.photoAlt)}" loading="lazy">` : mono;
  root.innerHTML = `<div class="sd sd-${V}">
    <div class="sd-bg" aria-hidden="true"><i class="sd-bg1"></i><i class="sd-bg2"></i><canvas class="sd-dust"></canvas></div>
    <section class="sd-stage">
      ${card}${V === "domaine" ? '<i class="sd-nailhead" aria-hidden="true"></i>' : ""}
      <p class="sd-hint">${V === "nuit" ? S.hintCard : S.hintTag}</p>
      <p class="sd-cue" aria-hidden="true">${S.scroll}<i></i></p>
    </section>
    <main class="sd-main">
      <section class="sd-sec sd-photo sd-rv"><div class="sd-frame">${frame}</div>${D.intro ? `<p class="sd-intro">${esc(D.intro)}</p>` : ""}</section>
      <section class="sd-sec sd-rv"><small class="sd-k">${S.countEyebrow}</small><h2>${S.countTitle}</h2>
        <div class="sd-count"><span><b data-c="0">0</b><i>${S.days}</i></span><span><b data-c="1">00</b><i>${S.hours}</i></span><span><b data-c="2">00</b><i>${S.min}</i></span><span><b data-c="3">00</b><i>${S.sec}</i></span></div></section>
      ${venueQ ? `<section class="sd-sec sd-rv"><small class="sd-k">${S.where}</small><h2>${esc(D.venue?.name || "")}</h2>${D.venue?.address ? `<p class="sd-note">${esc(D.venue.address)}</p>` : ""}
        <a class="sd-btn ghost" href="${mapUrl}" target="_blank" rel="noopener noreferrer">${ICON.pin}${S.route}</a></section>` : ""}
      <section class="sd-sec sd-follow sd-rv"><small class="sd-k">${S.followEyebrow}</small><h2>${S.followTitle}</h2><p class="sd-note">${note}</p>
        <a class="sd-btn" href="${calUrl}" target="_blank" rel="noopener noreferrer">${ICON.cal}${S.calendar}</a></section>
      <footer class="sd-footer"><p>${p1} <i>&amp;</i> ${p2}</p>${when ? `<p class="sd-footer-date">${esc(when.full)}</p>` : ""}<button type="button" class="sd-replay">${S.replay}</button></footer>
    </main>
    <button type="button" class="sd-snd" aria-label="${S.mute}" hidden>${ICON.sound}</button>
  </div>`;

  const sd = q(".sd"), cardEl = q(".sd-card");
  if (REDUCE) sd.classList.add("sd-still");

  /* ---------- Son : la musique choisie + un carillon au retournement ---------- */
  const music = createMusic(OPTS.music);
  let actx = null, soundOn = true;
  const audio = () => { music.unlock(); try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch (e) {} };
  const chime = () => { if (!actx || !soundOn) return; const t = actx.currentTime, g0 = 0.12 * fxLevel(OPTS.music);
    (V === "nuit" ? [784, 988, 1175, 1568, 1976] : [659, 784, 988, 1319]).forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(), s = t + i * 0.08;
      o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(g0, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + 1.6); o.connect(g).connect(actx.destination); o.start(s); o.stop(s + 1.7); }); };
  const snd = q(".sd-snd");
  snd.addEventListener("click", () => { soundOn = !soundOn; snd.innerHTML = soundOn ? ICON.sound : ICON.mute; snd.setAttribute("aria-label", soundOn ? S.mute : S.unmute); soundOn ? music.play() : music.pause(); });

  /* ---------- Poussière d'or (Nuit dorée) / poussière de lumière (Le domaine) ---------- */
  const cv = q(".sd-dust"), ctx = cv.getContext("2d"); let parts = [], W = 0, H = 0, dpr = 1;
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; };
  const NAIL = { w: 941, h: 1672, x: 470, head: 135, hang: 150, r: 38 };
  const place = () => {
    if (V !== "domaine") return;
    const vw = innerWidth, vh = innerHeight, wide = vw / vh > NAIL.w / NAIL.h;
    const s = wide ? vh / NAIL.h : Math.max(vw / NAIL.w, vh / NAIL.h);
    const ox = (vw - NAIL.w * s) / 2, oy = wide ? 0 : (vh - NAIL.h * s) / 2;
    sd.style.setProperty("--nx", `${(NAIL.x * s + ox).toFixed(1)}px`);
    sd.style.setProperty("--ny", `${(NAIL.hang * s + oy).toFixed(1)}px`);
    sd.style.setProperty("--nh", `${(NAIL.head * s + oy).toFixed(1)}px`);
    sd.style.setProperty("--nd", `${(NAIL.r * 2 * s).toFixed(1)}px`);
    sd.classList.toggle("is-wide", wide);
  };
  size(); place(); addEventListener("resize", size); addEventListener("resize", place);
  const gold = V === "nuit";
  const spawn = (x, y, burst) => ({ x, y, vx: burst ? (Math.random() - 0.5) * 9 * dpr : (Math.random() - 0.5) * 0.3 * dpr, vy: burst ? (Math.random() - 0.75) * 9 * dpr : (0.15 + Math.random() * 0.35) * dpr,
    r: (burst ? 1 + Math.random() * 2.4 : 0.6 + Math.random() * 1.6) * dpr, life: burst ? 1 : 0.4 + Math.random() * 0.6, burst, tw: Math.random() * 6 });
  if (!REDUCE) for (let i = 0; i < (gold ? 46 : 22); i++) parts.push(spawn(Math.random() * W, Math.random() * H, false));
  const tick = () => {
    if (!alive) return; ctx.clearRect(0, 0, W, H);
    parts = parts.filter((p) => p.life > 0.02);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.tw += 0.05;
      if (p.burst) { p.vy += 0.12 * dpr; p.vx *= 0.985; p.life -= 0.012; } else if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
      const a = (p.burst ? p.life : 0.35 + 0.35 * Math.sin(p.tw)) * (gold ? 1 : 0.7);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fillStyle = gold ? `rgba(255,${200 + (p.r * 10 | 0) % 40},120,${a})` : `rgba(255,248,230,${a})`;
      ctx.shadowBlur = gold ? 8 * dpr : 4 * dpr; ctx.shadowColor = gold ? "rgba(255,200,100,.8)" : "rgba(255,240,210,.8)"; ctx.fill();
    }
    raf = requestAnimationFrame(tick);
  };
  if (!REDUCE) raf = requestAnimationFrame(tick);
  const burst = () => { if (REDUCE) return; const r = cardEl.getBoundingClientRect(); for (let i = 0; i < (gold ? 90 : 50); i++) parts.push(spawn((r.left + Math.random() * r.width) * dpr, (r.top + Math.random() * r.height) * dpr, true)); };

  /* ---------- Retournement ---------- */
  const lock = (on) => document.body.classList.toggle("sd-locked", on);
  function flip(instant) {
    if (flipped) return; flipped = true;
    if (!instant) { audio(); if (soundOn) music.play(); snd.hidden = false; later(chime, V === "nuit" ? 380 : 520); later(burst, V === "nuit" ? 420 : 560); }
    sd.classList.add("is-flipped"); if (instant) sd.classList.add("is-instant");
    later(() => { lock(false); sd.classList.add("is-done"); }, instant || REDUCE ? 0 : 2400);
  }
  cardEl.addEventListener("click", () => flip(false));
  // Le domaine : on tire le ruban (l'étiquette descend un peu, puis se retourne au lâcher).
  if (V === "domaine") {
    const hang = q(".sd-hang"); let y0 = null, dy = 0;
    cardEl.addEventListener("pointerdown", (e) => { if (flipped) return; y0 = e.clientY; dy = 0; cardEl.setPointerCapture?.(e.pointerId); hang.classList.add("is-pull"); });
    cardEl.addEventListener("pointermove", (e) => { if (y0 === null) return; dy = Math.max(0, Math.min(60, (e.clientY - y0) * 0.6)); hang.style.setProperty("--pull", (dy / 60).toFixed(3)); });
    const up = () => { if (y0 === null) return; y0 = null; hang.classList.remove("is-pull"); hang.style.setProperty("--pull", "0"); if (dy > 18) flip(false); };
    cardEl.addEventListener("pointerup", up); cardEl.addEventListener("pointercancel", up);
  }

  /* ---------- Révélation au défilement et compte à rebours ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.18 });
  qa(".sd-rv").forEach((el) => (REDUCE ? el.classList.add("is-in") : io.observe(el)));
  const cells = qa(".sd-count b");
  const setCount = () => { let s = Math.max(0, Math.floor((start - Date.now()) / 1000)); if (isNaN(s)) s = 0;
    const v = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
    cells.forEach((c, i) => { c.textContent = i ? String(v[i]).padStart(2, "0") : String(v[i]); }); };
  setCount(); countI = setInterval(setCount, 1000);
  q(".sd-replay").addEventListener("click", () => replay());

  function replay() {
    flipped = false; sd.classList.remove("is-flipped", "is-done", "is-instant"); scrollTo(0, 0);
    if (OPTS.skipIntro) return flip(true);
    lock(true);
  }
  if (OPTS.skipIntro) flip(true); else lock(true);

  return {
    replay,
    destroy() {
      alive = false; timers.forEach(clearTimeout); clearInterval(countI); cancelAnimationFrame(raf); io.disconnect();
      removeEventListener("resize", size); removeEventListener("resize", place); lock(false); music.destroy(); try { actx && actx.close(); } catch (e) {} root.innerHTML = "";
    },
  };
}
