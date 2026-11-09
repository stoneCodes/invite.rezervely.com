// Modèle « Éclat de velours » : enveloppe scellée qui s'illumine, velours bordeaux et cartes crème.
// Même contrat que les autres modèles (InvitationData ; options onRsvp, skipIntro, noGate) et même parcours :
// « Nous nous marions » + prénoms → photo + verset → date à gratter (obligatoire) → compte à rebours → programme
// → dress code → lieu → histoire → réponse.
import { esc, dateParts } from "../engine";
import { inviteDict } from "../../../lib/i18n/invite";
import { wishHtml } from "../wishlist";
import { coupleHtml, mountCouple } from "../dresscode/couple";

const ICON = {
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.6 3 2.4-2.4-1.1-1.1-2.4 2.4-2.4-2.4-1.1 1.1 2.4 2.4-2.4 2.4 1.1 1.1 2.4-2.4 2.4 2.4 1.1-1.1z"/></svg>',
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function mountVelours(root, data, OPTS = {}) {
  const D = data;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches || (!!OPTS.skipIntro && !!OPTS.noGate);
  document.body.dataset.tpl = "velours";
  const T = inviteDict(D.lang), V = T.velours, C = T.classic;
  const when = dateParts(D.dateISO, D.lang);
  const p1 = esc(D.partner1), p2 = esc(D.partner2);
  const ini = (s) => esc((String(s || "").trim()[0] || "").toUpperCase());
  const photo = typeof D.photoUrl === "string" && D.photoUrl ? D.photoUrl : null;
  let alive = true, timers = [], countI = 0, dcTimer = 0;
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
  const showDress = dc.enabled !== false && colors.length > 0;
  const story = (D.story || []).filter((s) => s.text || s.y);
  const swBg = (c) => { const m = c.men || c.hex, w = c.women || c.hex; return m === w ? m : `linear-gradient(135deg,${m} 50%,${w} 50%)`; };
  const head = (k, t) => `<header class="ve-heading ve-reveal"><small>${k}</small><h2>${t}</h2></header>`;
  const portrait = photo ? `<img src="${esc(photo)}" alt="${esc(T.c.photoAlt)}">` : `<span class="ve-monogram">${ini(D.partner1)}<i>&amp;</i>${ini(D.partner2)}</span>`;

  const after = [
    `<section class="ve-count ve-reveal"><small>${V.countdown}</small><div class="ve-count-grid"><span><b data-c="0">0</b><i>${V.days}</i></span><span><b data-c="1">00</b><i>${V.hours}</i></span><span><b data-c="2">00</b><i>${V.min}</i></span><span><b data-c="3">00</b><i>${V.sec}</i></span></div></section>`,
    programme.length ? `<section class="ve-section ve-program">${head(V.invitation, V.program)}<ol>${programme.map((x, i) => `<li class="ve-event ve-reveal"><span class="ve-event-number">${String(i + 1).padStart(2, "0")}</span><div><time>${esc(x.t)}</time><h3>${esc(x.title)}</h3>${x.note ? `<p>${esc(x.note)}</p>` : ""}</div></li>`).join("")}</ol></section>` : "",
    showDress ? `<section class="ve-dress ve-reveal"><small>${V.dress}</small><h2>${dc.title ? esc(dc.title) : V.colors}</h2>${dc.note ? `<p>${esc(dc.note)}</p>` : ""}
      <div class="ve-swatches" role="group" aria-label="${V.colors}">${colors.map((c, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}" aria-label="${esc(c.name)}" style="--swatch:${swBg(c)}"></button>`).join("")}</div>
      ${coupleHtml(V.dress, "ve-couple")}
      <p class="ve-cname">${esc(colors[0].name)}</p>
      ${dc.men?.text || dc.women?.text ? `<div class="ve-dress-cols">${dc.men?.text ? `<p><b>${esc(dc.men.label || V.men)}</b>${esc(dc.men.text)}</p>` : ""}${dc.women?.text ? `<p><b>${esc(dc.women.label || V.women)}</b>${esc(dc.women.text)}</p>` : ""}</div>` : ""}
    </section>` : "",
    venueQ ? `<section class="ve-place ve-reveal"><small>${V.venue}</small><h2>${esc(D.venue?.name)}</h2><p>${esc(D.venue?.address)}</p>
      <div class="ve-btns"><a class="ve-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer">${ICON.pin}${V.route}</a><a class="ve-link ghost" href="${calUrl}" target="_blank" rel="noopener noreferrer">${esc(T.c.addCal)}</a></div></section>` : "",
    story.length ? `<section class="ve-story">${head(V.story, C.storyTitle)}${story.map((s) => `<article class="ve-story-item ve-reveal"><time>${esc(s.y)}</time><p>${esc(s.text)}</p></article>`).join("")}</section>` : "",
    wishHtml(D) ? `<section class="ve-wish">${head(inviteDict(D.lang).wish.eyebrow, inviteDict(D.lang).wish.title)}<div class="ve-reveal">${wishHtml(D)}</div></section>` : "",
    `<section class="ve-rsvp ve-reveal"><small>${V.presence}</small><h2>${V.rsvp}</h2>${D.rsvpBy ? `<p class="ve-rsvp-by">${esc(D.rsvpBy)}</p>` : ""}
      <form class="ve-form" novalidate>
        <div class="ve-choice" role="group" aria-label="${V.presence}"><button type="button" data-a="yes" aria-pressed="true">${V.yes}</button><button type="button" data-a="no" aria-pressed="false">${V.no}</button></div>
        <label>${V.yourName}<input name="name" autocomplete="name" placeholder="${esc(T.c.namePh)}" maxlength="120"></label>
        <label class="ve-guests">${V.guests}<span><button type="button" data-g="-1" aria-label="${V.less}">−</button><output>1</output><button type="button" data-g="1" aria-label="${V.more}">+</button></span></label>
        <label>${V.note}<textarea name="msg" rows="3" maxlength="1000"></textarea></label>
        <p class="ve-err" hidden>${V.error}</p>
        <button class="ve-submit" type="submit">${V.send}</button>
      </form></section>`,
    `<footer class="ve-footer"><span>✦</span><p>${p1} <i>&amp;</i> ${p2}</p><p class="ve-footer-date">${when ? esc(when.full) : ""}</p><button class="ve-replay" type="button">${V.replay}</button></footer>`,
  ];

  root.innerHTML = `<div class="ve">
    <div class="ve-atmosphere" aria-hidden="true"></div>
    <section class="ve-intro" aria-label="${V.invitation}">
      <button class="ve-envelope" type="button" aria-label="${V.open}"></button>
      <div class="ve-intro-glow" aria-hidden="true"></div>
      <p class="ve-hint">${V.hint}</p>
    </section>
    <main class="ve-main">
      <header class="ve-cover ve-reveal">
        <small>${V.married}</small><h1>${p1} <i>&amp;</i> ${p2}</h1>
        ${D.intro ? `<p>${esc(D.intro)}</p>` : ""}
        <div class="ve-cue" aria-hidden="true">${V.scroll}<i></i></div>
      </header>
      <section class="ve-portrait">
        <div class="ve-cover-photo ve-reveal">${portrait}<span class="ve-photo-glint" aria-hidden="true"></span></div>
        ${v ? `<div class="ve-verse ve-reveal"><span class="ve-ornament">✦</span>${v.orig ? `<p class="ve-verse-orig" dir="auto">${esc(v.orig)}</p>` : ""}<blockquote>${v.orig ? esc(v.text) : esc(T.c.quote(v.text))}</blockquote>${v.ref ? `<cite>${esc(v.ref)}</cite>` : ""}</div>` : ""}
      </section>
      <section class="ve-datesec ve-reveal">
        <small>${V.dateEyebrow}</small><h2>${V.dateTitle}</h2>
        <div class="ve-foil">
          <div class="ve-date"><b>${when ? esc(when.day) : ""}</b><span>${when ? esc(`${when.month} ${when.year}`) : ""}</span><em>${when ? esc(when.full) : ""}</em></div>
          <canvas aria-label="${V.scratchHint}"></canvas>
        </div>
        <p class="ve-date-hint">${V.scratchHint}</p>
      </section>
      <div class="ve-after">${after.join("")}</div>
    </main>
    <button type="button" class="ve-snd" aria-label="${V.mute}">${ICON.sound}</button>
  </div>`;

  const ve = q(".ve"), intro = q(".ve-intro"), envBtn = q(".ve-envelope");
  if (REDUCE) ve.classList.add("ve-still");

  /* ---------- Son : arpèges feutrés (seulement après un geste) ---------- */
  let actx = null, master = null, soundOn = true, loopT = 0, looping = false;
  const audio = () => { try { if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.gain.value = 0.11; master.connect(actx.destination); } actx.resume(); } catch (e) {} return actx; };
  const tone = (f, t, dur, vol = 0.25, type = "sine") => { if (!actx || !soundOn) return; const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05); };
  // Valse lente en la mineur / fa majeur, notes longues comme un piano feutré
  const BARS = [[220, 262, 330, 440], [175, 220, 262, 349], [131, 196, 262, 330], [165, 208, 247, 330]];
  const TOP = [659, 587, 523, 494, 523, 440, 523, 587, 659, 698, 659, 587, 523, 494, 440, 0];
  const loop = () => { if (!actx || !soundOn || !alive) return; looping = true; const t0 = actx.currentTime + 0.05, st = 0.5;
    BARS.forEach((b, i) => b.forEach((f, j) => tone(f, t0 + i * st * 4 + j * 0.12, 2.6, j ? 0.07 : 0.1)));
    TOP.forEach((f, i) => f && tone(f, t0 + i * st, 1.6, 0.09, "triangle"));
    loopT = later(loop, BARS.length * 4 * st * 1000); };
  const chime = () => { if (!actx || !soundOn) return; const t = actx.currentTime; [880, 1109, 1319, 1760].forEach((f, i) => tone(f, t + i * 0.09, 1.4, 0.14)); };
  const sndBtn = q(".ve-snd");
  sndBtn.addEventListener("click", () => { soundOn = !soundOn; sndBtn.innerHTML = soundOn ? ICON.sound : ICON.mute; sndBtn.setAttribute("aria-label", soundOn ? V.mute : V.unmute);
    if (soundOn) { audio(); if (ve.classList.contains("is-open")) loop(); } else { clearTimeout(loopT); looping = false; } });

  /* ---------- Apparitions au défilement ---------- */
  let io = null;
  function observe() {
    const els = qa(".ve-reveal");
    if (REDUCE || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-visible")); return; }
    if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });
    els.forEach((el, i) => { if (el.classList.contains("is-visible")) return; el.style.setProperty("--ve-delay", `${Math.min(i % 5, 4) * 90}ms`); io.observe(el); });
  }
  let scrollFrame = 0;
  const parallax = () => { cancelAnimationFrame(scrollFrame); scrollFrame = requestAnimationFrame(() => ve.style.setProperty("--ve-parallax", `${Math.min(scrollY * 0.035, 56)}px`)); };
  addEventListener("scroll", parallax, { passive: true });

  /* ---------- Ouverture : le sceau s'illumine, l'enveloppe s'ouvre dans la lumière ---------- */
  let opening = false;
  function showIntro() {
    opening = false; ve.classList.remove("is-open", "is-opening"); intro.hidden = false; intro.classList.remove("is-out");
    qa(".ve-reveal.is-visible").forEach((el) => el.classList.remove("is-visible"));
    document.body.classList.add("ve-locked"); scrollTo(0, 0); clearTimeout(loopT); looping = false;
  }
  function openMain(instant) {
    ve.classList.add("is-open"); document.body.classList.remove("ve-locked"); scrollTo(0, 0);
    intro.classList.add("is-out"); later(() => { intro.hidden = true; }, instant ? 0 : 900);
    if (!instant && !looping) later(loop, 400);
    observe(); later(paintFoil, 60);
  }
  envBtn.addEventListener("click", () => {
    if (opening) return; opening = true; audio(); chime();
    ve.classList.add("is-opening"); later(() => openMain(false), REDUCE ? 0 : 2100);
  });

  /* ---------- La date : une feuille d'or à gratter (obligatoire avant la suite) ---------- */
  let gated = !OPTS.noGate, scratched = false;
  const setGate = (on) => { gated = on; ve.classList.toggle("is-gated", on); };
  setGate(gated);
  const foil = q(".ve-foil canvas"), foilBox = q(".ve-foil");
  if (!gated) { foil.remove(); foilBox.classList.add("is-done"); q(".ve-date-hint").hidden = true; }
  let fctx = null, fw = 0, fh = 0, strokes = 0, last = null;
  function paintFoil() {
    if (!gated || scratched || !foil.isConnected) return;
    const r = foilBox.getBoundingClientRect(); if (!r.width) return;
    const d = Math.min(2, devicePixelRatio || 1); fw = r.width; fh = r.height;
    foil.width = fw * d; foil.height = fh * d; fctx = foil.getContext("2d", { willReadFrequently: true }); fctx.setTransform(d, 0, 0, d, 0, 0);
    const g = fctx.createLinearGradient(0, 0, fw, fh);
    g.addColorStop(0, "#9a7138"); g.addColorStop(0.3, "#f3d99b"); g.addColorStop(0.5, "#c99a55"); g.addColorStop(0.72, "#f6e2b0"); g.addColorStop(1, "#a57a3e");
    fctx.globalCompositeOperation = "source-over"; fctx.fillStyle = g; fctx.fillRect(0, 0, fw, fh);
    // Grain et paillettes de la feuille d'or
    for (let i = 0; i < 260; i++) { fctx.fillStyle = `rgba(255,${230 + (i % 25)},${180 + (i % 60)},${0.12 + (i % 7) * 0.05})`; fctx.fillRect((i * 97.3) % fw, (i * 53.7) % fh, 1.4, 1.4); }
    for (let i = 0; i < 9; i++) { fctx.strokeStyle = "rgba(120,80,30,.12)"; fctx.lineWidth = 0.8; fctx.beginPath(); fctx.moveTo(0, (i + 0.5) * fh / 9); fctx.bezierCurveTo(fw * 0.3, (i + 0.1) * fh / 9, fw * 0.7, (i + 0.9) * fh / 9, fw, (i + 0.4) * fh / 9); fctx.stroke(); }
    fctx.fillStyle = "rgba(68,39,44,.55)"; fctx.font = `italic 400 ${Math.round(fh * 0.12)}px "Cormorant Garamond", Georgia, serif`; fctx.textAlign = "center"; fctx.textBaseline = "middle";
    fctx.fillText(T.c.scratchHere, fw / 2, fh / 2);
  }
  const scratchAt = (x, y) => {
    if (!fctx) return;
    fctx.globalCompositeOperation = "destination-out"; fctx.strokeStyle = "#000"; fctx.lineCap = "round"; fctx.lineWidth = 46;
    fctx.beginPath(); fctx.moveTo(last ? last.x : x, last ? last.y : y); fctx.lineTo(x, y); fctx.stroke(); last = { x, y };
    if (++strokes % 6 === 0) checkFoil();
  };
  function checkFoil() {
    const im = fctx.getImageData(0, 0, foil.width, foil.height).data; let clear = 0, n = 0;
    for (let i = 3; i < im.length; i += 4 * 24) { n++; if (im[i] < 40) clear++; }
    if (clear / n > 0.5) revealDate();
  }
  function revealDate() {
    if (scratched) return; scratched = true; foilBox.classList.add("is-done"); later(() => foil.remove(), 900);
    setGate(false); chime(); if (navigator.vibrate) navigator.vibrate(20); countUp(); observe();
    q(".ve-date-hint").textContent = V.scratchDone;
    later(() => scrollBy({ top: innerHeight * 0.6, behavior: REDUCE ? "auto" : "smooth" }), 1500);
  }
  const pos = (e) => { const r = foil.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  let down = false;
  foil.addEventListener("pointerdown", (e) => { down = true; last = null; audio(); foil.setPointerCapture?.(e.pointerId); const p = pos(e); scratchAt(p.x, p.y); });
  foil.addEventListener("pointermove", (e) => { if (!down) return; const p = pos(e); scratchAt(p.x, p.y); });
  const up = () => { down = false; last = null; if (fctx && !scratched) checkFoil(); };
  foil.addEventListener("pointerup", up); foil.addEventListener("pointercancel", up);
  const onResize = () => { if (gated && !scratched && ve.classList.contains("is-open")) paintFoil(); };
  addEventListener("resize", onResize);

  /* ---------- Compte à rebours ---------- */
  const remaining = () => { let s = Math.max(0, Math.floor((start - Date.now()) / 1000)); const dd = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; return [dd, hh, Math.floor(s / 60), s % 60]; };
  let counting = false;
  const setCount = (vals) => qa("[data-c]").forEach((b) => { const i = +b.dataset.c; b.textContent = isNaN(vals[i]) ? "–" : i === 0 ? vals[0] : String(vals[i]).padStart(2, "0"); });
  function countUp() { if (REDUCE) return setCount(remaining()); counting = true; const tg = remaining(), t0 = performance.now(); const st = (now) => { const k = Math.min(1, (now - t0) / 1600), e = 1 - Math.pow(1 - k, 3); setCount(tg.map((x) => Math.round(x * e))); if (k < 1 && alive) requestAnimationFrame(st); else counting = false; }; requestAnimationFrame(st); }
  setCount(remaining()); countI = setInterval(() => { if (!counting) setCount(remaining()); }, 1000);

  /* ---------- Dress code : le couple change de tenue au fil des couleurs ---------- */
  const coupleEl = q(".ve-couple"), couple = coupleEl ? mountCouple(coupleEl, dc.couple) : null;
  let dcI = 0, dcManual = false;
  const setColor = (i) => { const c = colors[i]; if (!c || !couple) return; dcI = i; couple.set(c.men || c.hex, c.women || c.hex);
    q(".ve-cname").textContent = c.name; qa(".ve-swatches button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === i))); };
  if (couple) {
    setColor(0);
    q(".ve-swatches").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { dcManual = true; setColor(+b.dataset.i); } });
    if (colors.length > 1 && !REDUCE) dcTimer = setInterval(() => { if (!dcManual) setColor((dcI + 1) % colors.length); }, 2800);
  }

  /* ---------- Réponse ---------- */
  const card = q(".ve-rsvp"), form = q(".ve-form"); let attending = true, guests = 1;
  form.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]"); if (a) { attending = a.dataset.a === "yes"; form.querySelectorAll("[data-a]").forEach((b) => b.setAttribute("aria-pressed", String(b === a))); q(".ve-guests").hidden = !attending; return; }
    const g = e.target.closest("[data-g]"); if (g) { guests = clamp(guests + +g.dataset.g, 1, 20); form.querySelector("output").textContent = guests; }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); const inp = form.querySelector("input"), name = inp.value.trim();
    if (!name) { inp.focus(); inp.placeholder = T.c.nameMissing; return; }
    const msg = form.querySelector("textarea").value.trim(), btn = form.querySelector(".ve-submit"), err = form.querySelector(".ve-err");
    err.hidden = true;
    if (OPTS.onRsvp) { btn.disabled = true; btn.textContent = T.c.sending; try { await OPTS.onRsvp({ name, attending, guests: attending ? guests : 0, message: msg }); } catch (x) { btn.disabled = false; btn.textContent = V.send; err.hidden = false; return; } }
    const first = esc(name.split(" ")[0]);
    form.outerHTML = `<div class="ve-thanks"><small>${esc(T.c.thanks(first))}</small><h3>${attending ? V.yesTitle : V.noTitle}</h3><p>${esc(attending ? T.c.noted(String(guests)) : T.c.missYou)}</p>${OPTS.onRsvp ? "" : `<p class="ve-rsvp-by">${esc(T.c.previewOnly)}</p>`}<a class="ve-link" href="${calUrl}" target="_blank" rel="noopener noreferrer">${esc(T.c.addCal)}</a></div>`;
    card.classList.add("is-sent"); chime();
  });
  q(".ve-replay").addEventListener("click", () => showIntro());

  /* ---------- Démarrage ---------- */
  if (OPTS.skipIntro) { intro.hidden = true; openMain(true); }
  else showIntro();

  return {
    replay() { showIntro(); },
    destroy() {
      alive = false; couple?.destroy(); timers.forEach(clearTimeout); clearInterval(countI); clearInterval(dcTimer); cancelAnimationFrame(scrollFrame);
      io && io.disconnect(); removeEventListener("scroll", parallax); removeEventListener("resize", onResize);
      document.body.classList.remove("ve-locked"); try { actx && actx.close(); } catch (e) {} root.innerHTML = "";
    },
  };
}
