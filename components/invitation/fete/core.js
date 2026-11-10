// Socle commun des modèles d'anniversaire (Face A, Le toast, Le gâteau magique, La piñata).
// Chaque modèle garde sa propre ouverture, sa mise en page et son défilement ; ici seulement ce qui est identique :
// données préparées, cycle de vie, son, particules, compte à rebours, réponse (allergies pour les enfants).
// Contrat : mountX(root, data, { onRsvp, skipIntro, noGate }) → { replay, destroy }.
import { esc, dateParts } from "../engine";
import { inviteDict } from "../../../lib/i18n/invite";
import { createMusic, fxLevel } from "../music";

export { esc };

export const ICON = {
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm11 8H6v10h12V10z"/></svg>',
  tel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.6 3 2.4-2.4-1.1-1.1-2.4 2.4-2.4-2.4-1.1 1.1 2.4 2.4-2.4 2.4 1.1 1.1 2.4-2.4 2.4 2.4 1.1-1.1z"/></svg>',
};
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const KIDS = new Set(["gateau", "pinata"]);

/** Données prêtes à afficher (tout est échappé, sauf les champs *Raw). */
export function prep(D, OPTS, tpl) {
  const T = inviteDict(D.lang), F = T.fete;
  const kids = KIDS.has(tpl);
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches || (!!OPTS.skipIntro && !!OPTS.noGate);
  const bd = { age: null, surprise: false, gifts: "", endTime: "", parentPhone: "", palette: "rose", ...(D.bday || {}) };
  const nameRaw = String(D.partner1 || "").trim() || "…";
  const age = Number.isFinite(+bd.age) && +bd.age > 0 ? +bd.age : null;
  const when = dateParts(D.dateISO, D.lang);
  const start = new Date(D.dateISO), end = new Date(start.getTime() + (kids ? 4 : 6) * 3600e3);
  const gfmt = (d) => (isNaN(d) ? "" : d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""));
  const venueQ = [D.venue?.name, D.venue?.address].filter(Boolean).join(", ");
  const dc = D.dressCode || {};
  const colors = (dc.colors || []).slice(0, 4);
  return {
    T, F, kids, REDUCE, bd, age, when, start, venueQ,
    nameRaw, name: esc(nameRaw), initial: esc(([...nameRaw][0] || "").toUpperCase()),
    sub: age ? (kids ? F.turnsKid(age) : F.turns(age)) : F.birthday,
    intro: esc(D.intro || ""),
    photo: typeof D.photoUrl === "string" && D.photoUrl ? D.photoUrl : null,
    programme: (D.programme || []).filter((x) => x.title || x.t),
    dc, colors, showDress: dc.enabled !== false && (colors.length > 0 || !!dc.title || !!dc.note),
    calUrl: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(F.birthdayOf(nameRaw))}&dates=${gfmt(start)}/${gfmt(end)}&location=${encodeURIComponent(venueQ)}`,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQ)}`,
    rsvpBy: esc(D.rsvpBy || ""),
    venueName: esc(D.venue?.name || ""), venueAddr: esc(D.venue?.address || ""),
  };
}

/** Minuteries et écouteurs nettoyés d'un coup au démontage. */
export function life() {
  let alive = true;
  const timers = [], offs = [], frames = new Set();
  return {
    get alive() { return alive; },
    later(fn, ms) { const t = setTimeout(() => alive && fn(), ms); timers.push(t); return t; },
    every(fn, ms) { const t = setInterval(() => alive && fn(), ms); offs.push(() => clearInterval(t)); return t; },
    on(el, ev, fn, o) { el.addEventListener(ev, fn, o); offs.push(() => el.removeEventListener(ev, fn, o)); },
    frame(fn) { const id = requestAnimationFrame((t) => { frames.delete(id); alive && fn(t); }); frames.add(id); return id; },
    end() { alive = false; timers.forEach(clearTimeout); offs.forEach((f) => f()); frames.forEach(cancelAnimationFrame); },
  };
}

/** Son : musique choisie par les mariés (music.js) + petits effets synthétisés (jamais avant un geste de l'invité). */
export function sound(L, track) {
  let ctx = null, master = null, on = true, pattern = null;
  const music = createMusic(track);
  const S = {
    get on() { return on; },
    get ctx() { return ctx; },
    audio() {
      music.unlock();
      try {
        if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.12 * fxLevel(track); master.connect(ctx.destination); }
        ctx.resume();
      } catch (e) {}
      return ctx;
    },
    now: () => (ctx ? ctx.currentTime : 0),
    tone(f, t, dur, vol = 0.2, type = "sine", slide = 0) {
      if (!ctx || !on) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
    },
    /** Bruit filtré : pop, souffle, craquement, crème. */
    noise(t, dur, vol = 0.3, freq = 1800, q = 0.8, type = "bandpass") {
      if (!ctx || !on) return;
      const n = Math.max(1, Math.floor(ctx.sampleRate * dur)), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = buf; f.type = type; f.frequency.value = freq; f.Q.value = q;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(master); src.start(t);
    },
    chime() { if (!ctx || !on) return; const t = ctx.currentTime; [784, 988, 1175, 1568].forEach((f, i) => S.tone(f, t + i * 0.08, 1.2, 0.12)); },
    /** Musique de fond : démarre le morceau choisi (les anciennes mélodies synthétisées ne sont plus jouées). */
    loop() { pattern = true; if (on && L.alive) music.play(); },
    stopLoop() { pattern = null; music.pause(); },
    toggle() { on = !on; if (on) { S.audio(); if (pattern) music.play(); } else music.pause(); return on; },
    close() { music.destroy(); try { ctx && ctx.close(); } catch (e) {} },
  };
  return S;
}

/** Bouton son (coin de l'écran). */
export function soundButton(root, S, F, L) {
  const b = root.querySelector(".fx-snd");
  if (!b) return;
  L.on(b, "click", () => { const on = S.toggle(); b.innerHTML = on ? ICON.sound : ICON.mute; b.setAttribute("aria-label", on ? F.mute : F.unmute); });
}

/** Particules sur un calque plein écran : confettis, mousse, poussière d'or, bonbons. */
export function particles(host, L, REDUCE) {
  const cv = document.createElement("canvas");
  cv.className = "fx-fx"; cv.setAttribute("aria-hidden", "true");
  host.appendChild(cv);
  const g = cv.getContext("2d");
  let P = [], running = false, w = 0, h = 0, dpr = 1;
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); L.on(window, "resize", size);
  const step = () => {
    g.clearRect(0, 0, w, h);
    P = P.filter((p) => p.life > 0 && p.y < h + 60);
    for (const p of P) {
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.grav; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      const a = Math.min(1, p.life / 30) * p.alpha;
      g.save(); g.globalAlpha = a; g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.c;
      if (p.shape === "circle") { g.beginPath(); g.arc(0, 0, p.s, 0, 7); g.fill(); }
      else if (p.shape === "ring") { g.strokeStyle = p.c; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, p.s, 0, 7); g.stroke(); }
      else if (p.shape === "candy") { g.beginPath(); g.ellipse(0, 0, p.s * 1.3, p.s, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-p.s * 1.2, 0); g.lineTo(-p.s * 2.4, -p.s); g.lineTo(-p.s * 2.4, p.s); g.closePath(); g.moveTo(p.s * 1.2, 0); g.lineTo(p.s * 2.4, -p.s); g.lineTo(p.s * 2.4, p.s); g.closePath(); g.fill(); g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(-p.s * 0.5, -p.s * 0.75, p.s * 0.35, p.s * 1.5); }
      else g.fillRect(-p.s, -p.s * 0.45, p.s * 2, p.s * 0.9);
      g.restore();
    }
    if (P.length) L.frame(step); else { running = false; g.clearRect(0, 0, w, h); }
  };
  return {
    burst(x, y, n, o = {}) {
      if (REDUCE) n = Math.min(n, 12);
      const cols = o.colors || ["#F6C744", "#FF6F91", "#4FC3F7", "#7BD389", "#B388FF"];
      for (let i = 0; i < n; i++) {
        const a = (o.angle ?? -Math.PI / 2) + (Math.random() - 0.5) * (o.spread ?? Math.PI * 2), v = (o.speed ?? 9) * (0.35 + Math.random() * 0.8);
        P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, grav: o.grav ?? 0.22, drag: o.drag ?? 0.985, s: (o.size ?? 5) * (0.6 + Math.random() * 0.8), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, life: (o.life ?? 110) * (0.7 + Math.random() * 0.6), c: cols[i % cols.length], shape: o.shape ?? "rect", alpha: o.alpha ?? 1 });
      }
      if (!running) { running = true; L.frame(step); }
    },
    /** Pluie depuis le haut de l'écran. */
    rain(n, o = {}) { for (let i = 0; i < n; i++) this.burst(Math.random() * w, -20 - Math.random() * h * 0.4, 1, { angle: Math.PI / 2, spread: 0.6, speed: 2, grav: 0.08, drag: 0.995, life: 260, ...o }); },
    remove() { cv.remove(); },
  };
}

/** Apparitions au défilement : ajoute .is-in aux éléments .fx-r. */
export function reveal(root, REDUCE, L) {
  const els = [...root.querySelectorAll(".fx-r")];
  if (REDUCE || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-in")); return { again() { root.querySelectorAll(".fx-r").forEach((e) => e.classList.add("is-in")); }, reset() {}, stop() {} }; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
  const watch = () => root.querySelectorAll(".fx-r:not(.is-in)").forEach((e) => io.observe(e));
  watch();
  return { again: watch, reset() { root.querySelectorAll(".fx-r.is-in").forEach((e) => e.classList.remove("is-in")); watch(); }, stop() { io.disconnect(); } };
}

/** Compte à rebours : éléments [data-c="0..3"] (jours, heures, minutes, secondes). */
export function countdown(root, start, REDUCE, L) {
  const remaining = () => { let s = Math.max(0, Math.floor((start - Date.now()) / 1000)); const dd = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; return [dd, hh, Math.floor(s / 60), s % 60]; };
  const set = (v) => root.querySelectorAll("[data-c]").forEach((b) => { const i = +b.dataset.c; b.textContent = isNaN(v[i]) ? "–" : i === 0 ? v[0] : String(v[i]).padStart(2, "0"); });
  let counting = false;
  set(remaining()); L.every(() => { if (!counting) set(remaining()); }, 1000);
  return {
    animate() {
      if (REDUCE) return set(remaining());
      counting = true; const tg = remaining(), t0 = performance.now();
      const st = (now) => { const k = Math.min(1, (now - t0) / 1500), e = 1 - Math.pow(1 - k, 3); set(tg.map((x) => Math.round(x * e))); if (k < 1) L.frame(st); else counting = false; };
      L.frame(st);
    },
  };
}
export const countHtml = (F, cls = "") => `<div class="fx-count ${cls}">${[F.days, F.hours, F.min, F.sec].map((u, i) => `<span><b data-c="${i}">0</b><i>${u}</i></span>`).join("")}</div>`;

/** Informations pratiques propres aux anniversaires (surprise, horaires, téléphone, cadeaux). */
export function extras(P) {
  const { F, kids, bd, nameRaw } = P;
  const tel = String(bd.parentPhone || "").replace(/[^\d+]/g, "");
  return {
    surprise: bd.surprise ? `<p class="fx-surprise">${esc((kids ? F.surpriseKid : F.surprise)(nameRaw))}</p>` : "",
    end: bd.endTime ? `<p class="fx-end">${esc((kids ? F.pickUp : F.endAt)(bd.endTime))}</p>` : "",
    phone: kids && tel ? `<a class="fx-link fx-tel" href="tel:${esc(tel)}">${ICON.tel}${F.phone} · ${esc(bd.parentPhone)}</a>` : "",
    gifts: bd.gifts ? `<div class="fx-gifts"><small>${F.gifts}</small><p>${esc(bd.gifts)}</p></div>` : "",
  };
}

export const venueBtns = (P) => P.venueQ ? `<div class="fx-btns"><a class="fx-link" href="${P.mapUrl}" target="_blank" rel="noopener noreferrer">${ICON.pin}${P.F.route}</a><a class="fx-link ghost" href="${P.calUrl}" target="_blank" rel="noopener noreferrer">${ICON.cal}${esc(P.T.c.addCal)}</a></div>` : "";

export const swatches = (P) => P.colors.length ? `<div class="fx-swatches">${P.colors.map((c) => `<span style="--sw:${esc(c.hex)}"><i></i>${esc(c.name)}</span>`).join("")}</div>` : "";

/** Formulaire de réponse ; enfant : prénom de l'enfant, nombre d'enfants, allergies. */
export function rsvpForm(P) {
  const { F, T, kids } = P;
  return `<form class="fx-form" novalidate>
    <div class="fx-choice" role="group" aria-label="${kids ? F.rsvpKid : F.rsvp}"><button type="button" data-a="yes" aria-pressed="true">${kids ? F.yesKid : F.yes}</button><button type="button" data-a="no" aria-pressed="false">${kids ? F.noKid : F.no}</button></div>
    <label class="fx-field">${kids ? F.kidName : F.yourName}<input name="name" autocomplete="${kids ? "off" : "name"}" placeholder="${esc(kids ? F.kidNamePh : T.c.namePh)}" maxlength="120"></label>
    <label class="fx-field fx-guests">${kids ? F.kids : F.guests}<span><button type="button" data-g="-1" aria-label="${F.less}">−</button><output>1</output><button type="button" data-g="1" aria-label="${F.more}">+</button></span></label>
    ${kids ? `<label class="fx-field fx-allergy">${F.allergies}<input name="allergy" maxlength="200" placeholder="${esc(F.allergiesPh)}"></label>` : ""}
    <label class="fx-field">${F.note}<textarea name="msg" rows="3" maxlength="700"></textarea></label>
    <p class="fx-err" hidden>${F.error}</p>
    <button class="fx-submit" type="submit">${F.send}</button>
  </form>`;
}

export function bindRsvp(root, P, OPTS, L, onSent) {
  const { F, T, kids } = P;
  const form = root.querySelector(".fx-form");
  if (!form) return;
  let attending = true, guests = 1;
  L.on(form, "click", (e) => {
    const a = e.target.closest("[data-a]");
    if (a) { attending = a.dataset.a === "yes"; form.querySelectorAll("[data-a]").forEach((b) => b.setAttribute("aria-pressed", String(b === a))); form.querySelectorAll(".fx-guests,.fx-allergy").forEach((x) => (x.hidden = !attending)); return; }
    const g = e.target.closest("[data-g]");
    if (g) { guests = clamp(guests + +g.dataset.g, 1, 20); form.querySelector("output").textContent = guests; }
  });
  L.on(form, "submit", async (e) => {
    e.preventDefault();
    const inp = form.querySelector('input[name="name"]'), name = inp.value.trim();
    if (!name) { inp.focus(); inp.placeholder = T.c.nameMissing; return; }
    const allergy = attending ? (form.querySelector('input[name="allergy"]')?.value.trim() || "") : "";
    const note = form.querySelector("textarea").value.trim();
    const message = [allergy ? F.allergyPrefix + allergy : "", note].filter(Boolean).join("\n");
    const btn = form.querySelector(".fx-submit"), err = form.querySelector(".fx-err");
    err.hidden = true;
    if (OPTS.onRsvp) {
      btn.disabled = true; btn.textContent = T.c.sending;
      try { await OPTS.onRsvp({ name, attending, guests: attending ? guests : 0, message }); }
      catch (x) { btn.disabled = false; btn.textContent = F.send; err.hidden = false; return; }
    }
    const first = esc(name.split(" ")[0]);
    form.outerHTML = `<div class="fx-thanks"><small>${esc(T.c.thanks(first))}</small><h3>${attending ? F.yesTitle : F.noTitle}</h3><p>${esc(attending ? T.c.noted(String(guests)) : T.c.missYou)}</p>${OPTS.onRsvp ? "" : `<p class="fx-preview">${esc(T.c.previewOnly)}</p>`}${attending ? `<a class="fx-link" href="${P.calUrl}" target="_blank" rel="noopener noreferrer">${ICON.cal}${esc(T.c.addCal)}</a>` : ""}</div>`;
    onSent?.(attending);
  });
}

/** Photo de la personne fêtée, ou repli dessiné (initiale). */
export const portrait = (P, cls) => P.photo ? `<img class="${cls}" src="${esc(P.photo)}" alt="${esc(P.F.photoAlt(P.nameRaw))}">` : `<span class="${cls} fx-mono" aria-hidden="true">${P.initial}</span>`;

/**
 * Âge en très grand chiffres remplis par la photo de la personne fêtée (demandé par Glad le 10 nov. 2026).
 * Seulement si photo ET âge ; sinon "" et chaque modèle garde son rendu habituel.
 * ::before = contour (couleur --ap-ring, épaisseur --ap-stroke) ; le span porte la photo découpée dans les chiffres.
 */
export const agePhoto = (P, cls = "") => P.photo && P.age
  ? `<p class="fx-agephoto${String(P.age).length === 1 ? " is-1" : ""} ${cls}" role="img" aria-label="${esc(P.F.photoAlt(P.nameRaw))} · ${P.age}" data-n="${P.age}"><span style="background-image:url('${esc(P.photo)}')">${P.age}</span></p>`
  : "";

/** Grattage générique sur un canvas (crème du gâteau…) : appelle done() quand ~55 % est dégagé. */
export function wipe(canvas, paint, done, L, S, opts = {}) {
  let ctx = null, last = null, down = false, strokes = 0, finished = false;
  const box = canvas.parentElement;
  const draw = () => {
    if (finished) return;
    const r = box.getBoundingClientRect(); if (!r.width) return;
    const d = Math.min(2, devicePixelRatio || 1);
    canvas.width = r.width * d; canvas.height = r.height * d;
    ctx = canvas.getContext("2d", { willReadFrequently: true }); ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.globalCompositeOperation = "source-over"; paint(ctx, r.width, r.height);
  };
  const check = () => {
    const im = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let clear = 0, n = 0;
    for (let i = 3; i < im.length; i += 4 * 24) { n++; if (im[i] < 40) clear++; }
    if (clear / n > (opts.threshold ?? 0.55)) { finished = true; done(); }
  };
  const at = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const stroke = (p) => {
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out"; ctx.lineCap = "round"; ctx.lineWidth = opts.width ?? 44;
    ctx.beginPath(); ctx.moveTo(last ? last.x : p.x, last ? last.y : p.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p;
    if (++strokes % 6 === 0) { check(); opts.onStroke?.(); }
  };
  L.on(canvas, "pointerdown", (e) => { down = true; last = null; S.audio(); canvas.setPointerCapture?.(e.pointerId); stroke(at(e)); });
  L.on(canvas, "pointermove", (e) => { if (down) stroke(at(e)); });
  const up = () => { down = false; last = null; if (ctx && !finished) check(); };
  L.on(canvas, "pointerup", up); L.on(canvas, "pointercancel", up);
  L.on(window, "resize", () => { if (!finished && !down) draw(); });
  return { draw };
}
