// Modèle « Appel entrant » : les mariés « appellent » l'invité ; une fois décroché, l'invitation se déroule
// comme une conversation. mountAppel(racine, données, options) → { replay, destroy }.
// Même contrat de données que les autres modèles (InvitationData), mêmes options (onRsvp, skipIntro, noGate).
/* eslint-disable */
import { esc, dateParts } from "../engine";
import { inviteDict } from "../../../lib/i18n/invite";
import { coupleHtml, mountCouple } from "../dresscode/couple";
import { wishHtml } from "../wishlist";
import { mountMeal } from "../meal";
import { createMusic, fxLevel } from "../music";

const IMG = { call: "/img/appel-fond-defaut.webp", end: "/img/appel-fin.webp" };
const ICON = {
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>',
  hang: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 9c-1.6 0-3.2.3-4.6.7v3.1c0 .4-.2.7-.6.9-1 .5-1.9 1.1-2.6 1.8-.2.2-.4.3-.7.3s-.5-.1-.7-.3L.3 13c-.2-.2-.3-.4-.3-.7s.1-.5.3-.7A17 17 0 0 1 12 7c4.6 0 8.7 1.8 11.7 4.6.2.2.3.4.3.7s-.1.5-.3.7l-2.5 2.5c-.2.2-.4.3-.7.3s-.5-.1-.7-.3c-.8-.7-1.7-1.3-2.6-1.8-.3-.2-.6-.5-.6-.9V9.7C15.2 9.3 13.6 9 12 9z"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 15.3A8.5 8.5 0 0 1 8.7 4a8.5 8.5 0 1 0 11.3 11.3z"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.6 3 2.7-2.7-1.1-1.1-2.7 2.7-2.7-2.7-1.1 1.1 2.7 2.7-2.7 2.7 1.1 1.1 2.7-2.7 2.7 2.7 1.1-1.1z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm-2 7h14v10H5V9z"/></svg>',
  send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 20.5 21 12 3 3.5v6.6L15 12 3 13.9z"/></svg>',
};

export function mountAppel(root, INPUT, OPTS = {}) {
  const D = INPUT || {};
  const T = inviteDict(D.lang), A = T.appel;
  // Aperçu de l'éditeur (sans appel ni grattage) : tout s'affiche d'un coup, sinon chaque frappe relance l'animation.
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches || (!!OPTS.skipIntro && !!OPTS.noGate);
  document.body.dataset.tpl = "appel";
  const when = dateParts(D.dateISO, D.lang);
  const p1 = esc(D.partner1), p2 = esc(D.partner2);
  const ini = (s) => esc((String(s || "").trim()[0] || "").toUpperCase());
  const photo = typeof D.photoUrl === "string" && D.photoUrl ? D.photoUrl : null;
  // Guillemets simples : la valeur est insérée dans un attribut style="…" entre guillemets doubles.
  const cssUrl = (u) => `url('${String(u).replace(/['"\\\n()]/g, "")}')`;
  const avatar = (cls = "") => photo ? `<img class="ap-av ${cls}" src="${esc(photo)}" alt="">` : `<span class="ap-av ap-mono ${cls}" aria-hidden="true">${ini(D.partner1)}&amp;${ini(D.partner2)}</span>`;
  let alive = true, timers = [], started = 0, timerI = 0, countI = 0;
  const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); return t; };
  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];

  /* ---------- Liens utiles ---------- */
  const start = new Date(D.dateISO), end = new Date(start.getTime() + 10 * 3600e3);
  const gfmt = (d) => isNaN(d) ? "" : d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const venueQ = [D.venue?.name, D.venue?.address].filter(Boolean).join(", ");
  const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(T.c.weddingOf(D.partner1, D.partner2))}&dates=${gfmt(start)}/${gfmt(end)}&location=${encodeURIComponent(venueQ)}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQ)}`;

  /* ---------- Bulles ---------- */
  const them = (html, cls = "") => `<div class="ap-m them ${cls}">${html.startsWith("<div class=\"ap-b") ? html : `<div class="ap-b">${html}</div>`}</div>`;
  const sep = (t) => `<div class="ap-sep"><span>${t}</span></div>`;
  const dc = D.dressCode || {};
  const colors = (dc.colors || []).slice(0, 4);
  const v = D.verse && D.verse.text ? D.verse : null;

  const before = [
    sep(A.today),
    them(A.hello),
    them(A.itsUs(p1, p2)),
    them(A.news),
    them(`<div class="ap-b ap-hero"><small>${A.married}</small><b>${p1} <i>&amp;</i> ${p2}</b>${D.intro ? `<p>${esc(D.intro)}</p>` : ""}</div>`, "ap-wide"),
    them(`<div class="ap-b ap-photo">${photo ? `<img src="${esc(photo)}" alt="${A.photoOf(p1, p2)}">` : `<div class="ap-photo-ph">${ini(D.partner1)}&amp;${ini(D.partner2)}</div>`}</div>`),
    v ? them(`<div class="ap-b ap-quote">${v.orig ? `<p class="ap-orig" dir="auto">${esc(v.orig)}</p>` : ""}<p>${v.orig ? esc(v.text) : esc(T.c.quote(v.text))}</p>${v.ref ? `<small>${esc(v.ref)}</small>` : ""}</div>`) : "",
    them(A.dateHidden),
    them(`<div class="ap-b ap-secret"><small>${A.hiddenMsg}</small><b>${when ? esc(when.full) : ""}</b><canvas aria-hidden="true"></canvas></div>`, "ap-wide ap-gate-msg"),
  ];

  const programme = (D.programme || []).filter((x) => x.title || x.t);
  const after = [
    them(A.joinUs),
    them(`<div class="ap-b ap-count"><small>${A.left}</small><div><span><b data-c="0">0</b>${A.days}</span><span><b data-c="1">00</b>${A.hours}</span><span><b data-c="2">00</b>${A.min}</span><span><b data-c="3">00</b>${A.sec}</span></div></div>`, "ap-wide"),
    programme.length ? them(A.progIntro) : "",
    programme.length ? them(`<div class="ap-b ap-cal"><header>${ICON.cal}<div><small>${A.invitation}</small><b>${T.c.weddingOf(p1, p2).replace("&", "&amp;")}</b><span>${when ? esc(when.full.split(" · ")[0]) : ""}</span></div></header><ol>${programme.map((x) => `<li><time>${esc(x.t)}</time><div><b>${esc(x.title)}</b>${x.note ? `<span>${esc(x.note)}</span>` : ""}</div></li>`).join("")}</ol><a class="ap-btn" href="${calUrl}" target="_blank" rel="noopener">${esc(T.c.addCal)}</a></div>`, "ap-wide") : "",
    dc.enabled !== false && colors.length ? them(`${A.outfit} ${dc.title ? `<b>${esc(dc.title)}</b>` : ""}${dc.note ? `<br>${esc(dc.note)}` : ""}`) : "",
    dc.enabled !== false && colors.length ? `<div class="ap-m them ap-stickers">${colors.map((c, i) => { const m = c.men || c.hex, w = c.women || c.hex; return `<figure style="--i:${i}"><i style="background:${m === w ? m : `linear-gradient(135deg,${m} 50%,${w} 50%)`}"></i><figcaption>${esc(c.name)}</figcaption></figure>`; }).join("")}</div>` : "",
    dc.enabled !== false && colors.length ? them(`<div class="ap-b ap-dcphoto">${coupleHtml(esc(A.outfit))}</div>`) : "",
    dc.enabled !== false && colors.length && dc.men?.text ? them(`<b>${esc(dc.men.label || A.men)}</b> · ${esc(dc.men.text)}`) : "",
    dc.enabled !== false && colors.length && dc.women?.text ? them(`<b>${esc(dc.women.label || A.women)}</b> · ${esc(dc.women.text)}`) : "",
    venueQ ? them(A.waitHere) : "",
    venueQ ? them(`<div class="ap-b ap-map"><div class="ap-mapview" aria-hidden="true"><svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice"><rect width="300" height="150" class="g0"/><path class="g1" d="M-10 110 C60 90 90 130 160 112 S260 70 320 84 L320 160 L-10 160Z"/><path class="g2" d="M190 -5 C200 40 230 50 300 46 L300 -5Z"/><path class="rd" d="M-5 62 H310 M120 -5 V160 M40 -5 L95 160 M210 60 L260 160"/><path class="rd2" d="M-5 30 H120 M120 96 H310 M160 -5 V62"/></svg><span class="ap-pin">${ICON.pin}</span></div><div class="ap-mapinfo"><b>${esc(D.venue?.name)}</b><span>${esc(D.venue?.address)}</span><a class="ap-btn" href="${mapUrl}" target="_blank" rel="noopener">${A.route}</a></div></div>`, "ap-wide") : "",
    (D.story || []).length ? them(A.flashback) : "",
    ...(D.story || []).flatMap((s) => [sep(esc(s.y)), them(esc(s.text))]),
    wishHtml(D) ? them(esc(inviteDict(D.lang).wish.say)) : "",
    wishHtml(D) ? them(`<div class="ap-b ap-wish">${wishHtml(D)}</div>`, "ap-wide") : "",
    sep(A.now),
    them(A.coming),
    D.rsvpBy ? `<p class="ap-note">${esc(D.rsvpBy)}</p>` : "",
    `<div class="ap-m me ap-quick"><button type="button" data-a="yes">${A.yes}</button><button type="button" data-a="no">${A.no}</button></div>`,
    `<form class="ap-m me ap-form" hidden novalidate><div class="ap-b"><label>${A.yourName}<input name="name" autocomplete="name" placeholder="${esc(T.c.namePh)}" maxlength="120"></label><label class="ap-guests">${A.guests}<span><button type="button" data-g="-1" aria-label="${A.less}">−</button><output>1</output><button type="button" data-g="1" aria-label="${A.more}">+</button></span></label><label>${A.word}<textarea name="msg" rows="2" maxlength="1000"></textarea></label><p class="ap-err" hidden>${A.err}</p><button class="ap-send" type="submit">${ICON.send}<span>${A.send}</span></button></div></form>`,
    `<div class="ap-thread-end"></div>`,
  ];

  root.innerHTML = `
  <div class="ap" data-theme="clair">
    <div class="ap-backdrop" style="background-image:${cssUrl(photo || IMG.call)}" aria-hidden="true"></div>
    <section class="ap-call" role="dialog" aria-modal="true" aria-label="${A.callFrom(p1, p2)}">
      <div class="ap-call-bg" style="background-image:${cssUrl(photo || IMG.call)}"></div>
      <div class="ap-call-top"><span class="ap-pill"><i></i>${A.incoming}</span></div>
      <div class="ap-call-mid">
        <div class="ap-ring"><i></i><i></i><i></i>${avatar("big")}</div>
        <h1>${p1} <span>&amp;</span> ${p2}</h1>
        <p class="ap-callsub">${A.calling}<span class="ap-dots"><i>.</i><i>.</i><i>.</i></span></p>
        <p class="ap-nudge" role="status"></p>
      </div>
      <div class="ap-call-bot">
        <button type="button" class="ap-later">${ICON.hang}<span>${A.later}</span></button>
        <div class="ap-slide"><span class="ap-slide-txt">${A.slide}</span><button type="button" class="ap-knob" aria-label="${A.answer}">${ICON.phone}</button></div>
      </div>
    </section>

    <div class="ap-shell">
      <header class="ap-head">
        ${avatar()}
        <div class="ap-who"><b>${p1} &amp; ${p2}</b><small><i></i>${A.inCall}<span class="ap-timer">00:00</span></small></div>
        <button type="button" class="ap-ic ap-theme" aria-label="${A.night}">${ICON.moon}</button>
        <button type="button" class="ap-ic ap-snd" aria-label="${A.mute}">${ICON.sound}</button>
        <button type="button" class="ap-ic ap-hang" aria-label="${A.hangUp}">${ICON.hang}</button>
      </header>
      <main class="ap-chat">
        ${before.join("")}
        <p class="ap-gate-hint">${A.rub}</p>
        <div class="ap-after">${after.join("")}</div>
      </main>
    </div>

    <section class="ap-end" hidden aria-label="${A.ended}">
      <div class="ap-end-bg" style="background-image:${cssUrl(IMG.end)}"></div>
      <div class="ap-end-in">
        ${avatar("big")}
        <small>${A.endedAt}<span class="ap-dur">00:00</span></small>
        <h2>${p1} <span>&amp;</span> ${p2}</h2>
        <p>${when ? esc(when.full) : ""}</p>
        <div class="ap-end-btns"><button type="button" class="ap-btn ap-recall">${ICON.phone} ${A.recall}</button><a class="ap-btn ghost" href="${calUrl}" target="_blank" rel="noopener">${esc(T.c.addCal)}</a></div>
      </div>
    </section>
    <canvas class="ap-fx" aria-hidden="true"></canvas>
  </div>`;

  const ap = q(".ap"), call = q(".ap-call"), chat = q(".ap-chat"), endEl = q(".ap-end");

  /* ---------- Son : tonalité de connexion, « pop » des messages, petite boîte à musique ---------- */
  let actx = null, master = null, soundOn = true, loopT = 0;
  const music = createMusic(OPTS.music); // musique choisie par les mariés (remplace la mélodie synthétisée)
  const audio = () => { music.unlock(); try { if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.gain.value = 0.12 * fxLevel(OPTS.music); master.connect(actx.destination); } actx.resume(); } catch (e) {} return actx; };
  const tone = (f, t, dur, vol = 0.5, type = "sine") => { if (!actx || !soundOn) return; const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05); };
  const pop = () => { if (actx && soundOn) { const t = actx.currentTime; tone(880, t, 0.12, 0.35); tone(1320, t + 0.05, 0.1, 0.2); } };
  const connect = () => { if (!audio()) return; const t = actx.currentTime; tone(523, t, 0.18, 0.4); tone(784, t + 0.16, 0.3, 0.4); };
  const loop = () => { if (!soundOn || !alive) return; music.play(); };
  const sparkle = () => { if (actx && soundOn) { const t = actx.currentTime; [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, t + i * 0.07, 0.9, 0.25)); } };

  /* ---------- Effets : cœurs et confettis ---------- */
  const fxC = q(".ap-fx"), fx = fxC.getContext("2d"); let P = [], fxRun = false;
  const size = () => { const d = Math.min(2, devicePixelRatio || 1); fxC.width = innerWidth * d; fxC.height = innerHeight * d; fx.setTransform(d, 0, 0, d, 0, 0); };
  size(); addEventListener("resize", size);
  const COLS = ["#E7C68C", "#F3D79B", "#E7A6B6", "#FFFFFF", "#C99A4B"];
  const burst = (x, y, n = 60) => { if (REDUCE) return; for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = Math.random() * 6 + 2; P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3, r: Math.random() * 6 + 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: COLS[i % COLS.length], heart: i % 3 === 0, l: 1 }); } if (!fxRun) { fxRun = true; requestAnimationFrame(fxLoop); } };
  const heartPath = (r) => { fx.beginPath(); fx.moveTo(0, r * 0.3); fx.bezierCurveTo(-r, -r * 0.4, -r * 0.4, -r, 0, -r * 0.35); fx.bezierCurveTo(r * 0.4, -r, r, -r * 0.4, 0, r * 0.3); fx.fill(); };
  function fxLoop() { if (!alive) return; fx.clearRect(0, 0, innerWidth, innerHeight); P = P.filter((p) => p.l > 0 && p.y < innerHeight + 40);
    for (const p of P) { p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.vx *= 0.985; p.rot += p.vr; p.l -= 0.008; fx.save(); fx.translate(p.x, p.y); fx.rotate(p.rot); fx.globalAlpha = Math.min(1, p.l * 2); fx.fillStyle = p.c; if (p.heart) heartPath(p.r); else fx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); fx.restore(); }
    if (P.length) requestAnimationFrame(fxLoop); else fxRun = false; }

  /* ---------- Révélation des messages au défilement (avec « en train d'écrire… ») ---------- */
  const msgs = () => qa(".ap-chat > .ap-m, .ap-chat > .ap-sep, .ap-chat > .ap-note, .ap-after > .ap-m, .ap-after > .ap-sep, .ap-after > .ap-note");
  let queue = [], busy = false, io = null;
  const clock = new Date(); let mins = clock.getHours() * 60 + clock.getMinutes();
  const stamp = () => { mins += Math.random() < 0.18 ? 1 : 0; return `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`; };
  const typing = document.createElement("div"); typing.className = "ap-m them ap-typing"; typing.innerHTML = '<div class="ap-b"><i></i><i></i><i></i></div>';
  const showNow = (el) => { el.classList.add("is-in"); if (el.classList.contains("them") && !el.querySelector(".ap-time") && !el.classList.contains("ap-stickers")) { const b = el.querySelector(".ap-b"); b && b.insertAdjacentHTML("beforeend", `<span class="ap-time">${stamp()}</span>`); } onShown(el); };
  const pump = () => {
    if (busy || !queue.length || !alive) return; busy = true;
    const el = queue.shift();
    const isThem = el.classList.contains("them") && !el.classList.contains("ap-typing");
    const wait = REDUCE ? 0 : isThem ? (queue.length > 2 ? 160 : Math.min(1100, 380 + (el.textContent || "").length * 9)) : 120;
    if (isThem && wait > 200) { el.before(typing); typing.classList.add("is-in"); }
    later(() => { typing.remove(); showNow(el); if (isThem) pop(); busy = false; pump(); }, wait);
  };
  const observe = () => {
    if (io) io.disconnect();
    if (REDUCE || !("IntersectionObserver" in window)) { msgs().forEach(showNow); return; }
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !e.target.dataset.q) { e.target.dataset.q = 1; queue.push(e.target); queue.sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : 1)); pump(); } }), { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });
    msgs().forEach((m) => { if (!m.classList.contains("is-in")) io.observe(m); });
  };

  /* Ce qui se passe quand certains messages apparaissent */
  function onShown(el) {
    if (el.classList.contains("ap-gate-msg")) initScratch();
    if (el.querySelector(".ap-count")) countUp();
    if (el.classList.contains("ap-stickers")) sparkle();
  }

  /* ---------- Date masquée à frotter (obligatoire avant la suite) ---------- */
  let gated = !OPTS.noGate, scratchReady = false;
  const setGate = (on) => { gated = on; ap.classList.toggle("is-gated", on); };
  setGate(gated);
  function initScratch() {
    const box = q(".ap-secret"), cv = box.querySelector("canvas");
    if (scratchReady || !box) return; scratchReady = true;
    if (!gated) { cv.remove(); return; }
    const d = Math.min(2, devicePixelRatio || 1), w = box.offsetWidth, h = box.offsetHeight;
    cv.width = w * d; cv.height = h * d; const c = cv.getContext("2d"); c.scale(d, d);
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#CFAE72"); g.addColorStop(0.5, "#F1DCAE"); g.addColorStop(1, "#B98F4E");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`; c.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2); }
    c.fillStyle = "rgba(60,40,15,.75)"; c.font = "500 13px Jost, system-ui, sans-serif"; c.textAlign = "center"; c.fillText(A.rubHere, w / 2, h / 2 + 5);
    c.globalCompositeOperation = "destination-out";
    let down = false, last = null, moves = 0;
    const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const draw = (p) => { c.lineWidth = 34; c.lineCap = "round"; c.beginPath(); c.moveTo((last || p).x, (last || p).y); c.lineTo(p.x, p.y); c.stroke(); last = p; if (++moves % 8 === 0) check(); };
    const check = () => { const img = c.getImageData(0, 0, cv.width, cv.height).data; let clear = 0, n = 0; for (let i = 3; i < img.length; i += 64) { n++; if (img[i] < 40) clear++; } if (clear / n > 0.5) reveal(); };
    cv.addEventListener("pointerdown", (e) => { down = true; last = null; cv.setPointerCapture(e.pointerId); draw(pt(e)); });
    cv.addEventListener("pointermove", (e) => { if (down) draw(pt(e)); });
    const up = () => { down = false; last = null; };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    function reveal() { if (!gated) return; cv.classList.add("is-done"); later(() => cv.remove(), 700); setGate(false); if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
      const r = box.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 90); sparkle(); observe();
      later(() => scrollBy({ top: innerHeight * 0.45, behavior: REDUCE ? "auto" : "smooth" }), 900); }
  }

  /* ---------- Compte à rebours ---------- */
  const remaining = () => { let s = Math.max(0, Math.floor((start - Date.now()) / 1000)); const dd = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; return [dd, hh, Math.floor(s / 60), s % 60]; };
  let counting = false;
  const setCount = (vals) => qa("[data-c]").forEach((b) => { const i = +b.dataset.c; b.textContent = i === 0 ? vals[0] : String(vals[i]).padStart(2, "0"); });
  function countUp() { if (REDUCE) return setCount(remaining()); counting = true; const tg = remaining(), t0 = performance.now(); const st = (now) => { const k = Math.min(1, (now - t0) / 1500), e = 1 - Math.pow(1 - k, 3); setCount(tg.map((x) => Math.round(x * e))); if (k < 1 && alive) requestAnimationFrame(st); else counting = false; }; requestAnimationFrame(st); }
  setCount(remaining()); countI = setInterval(() => { if (!counting) setCount(remaining()); }, 1000);

  /* ---------- Réponse (RSVP) dans la conversation ---------- */
  const form = q(".ap-form"), quick = q(".ap-quick"); let attending = true, guests = 1;
  quick.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; attending = b.dataset.a === "yes";
    qa(".ap-quick button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    form.hidden = false; form.classList.add("is-in"); q(".ap-guests").hidden = !attending; form.querySelector("input:not([data-p])").focus({ preventScroll: true });
    form.scrollIntoView({ block: "center", behavior: REDUCE ? "auto" : "smooth" }); });
  form.addEventListener("click", (e) => { const b = e.target.closest("[data-g]"); if (!b) return; guests = Math.min(20, Math.max(1, guests + +b.dataset.g)); form.querySelector("output").textContent = guests; });
  // Choix du repas (meal.js) : sous le nombre de personnes, visible seulement si « présent ».
  const mealEl = document.createElement("div"); q(".ap-guests").after(mealEl);
  const MEAL = mountMeal(mealEl, INPUT), mealSync = () => MEAL.update(guests, attending);
  form.addEventListener("click", mealSync); quick.addEventListener("click", mealSync); mealSync();
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); const inp = form.querySelector("input:not([data-p])"), name = inp.value.trim();
    if (!name) { inp.focus(); inp.placeholder = A.nameMissing; return; }
    const meal = MEAL.collect(); if (!meal.ok) return;
    const msg = form.querySelector("textarea:not(.ml-remarks)").value.trim(), btn = form.querySelector(".ap-send"), err = form.querySelector(".ap-err");
    err.hidden = true;
    if (OPTS.onRsvp) { btn.disabled = true; btn.querySelector("span").textContent = T.c.sending; try { await OPTS.onRsvp({ name, attending, guests: attending ? guests : 0, message: msg, choices: meal.choices, remarks: meal.remarks }); } catch (x) { btn.disabled = false; btn.querySelector("span").textContent = A.send; err.hidden = false; return; } }
    const first = esc(name.split(" ")[0]);
    form.outerHTML = `<div class="ap-m me is-in ap-mine"><div class="ap-b">${attending ? A.sentYes(guests) : A.sentNo}${msg ? `<br>${esc(msg)}` : ""}<span class="ap-time">${A.sent}</span></div></div>`;
    quick.remove();
    const reply = attending ? A.thanksYes(first) : A.thanksNo(first);
    const tail = [them(reply), OPTS.onRsvp ? "" : `<p class="ap-note">${A.previewOnly}</p>`, `<div class="ap-m ap-bye"><button type="button" class="ap-btn ap-hang2">${ICON.hang} ${A.hangUp}</button></div>`].join("");
    q(".ap-thread-end").insertAdjacentHTML("beforebegin", tail);
    q(".ap-hang2").addEventListener("click", hangUp);
    observe();
    if (attending) later(() => { const r = q(".ap-mine")?.getBoundingClientRect(); r && burst(r.left + r.width / 2, r.top, 70); }, 300);
  });

  /* ---------- Décrocher / raccrocher ---------- */
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const lock = (on) => document.body.classList.toggle("ap-locked", on);
  function answer(instant) {
    if (!call || ap.classList.contains("is-live")) return;
    if (!instant) { audio(); connect(); later(loop, 900); if (navigator.vibrate) navigator.vibrate(40); }
    ap.classList.add("is-live"); lock(false); scrollTo(0, 0);
    started = Date.now(); clearInterval(timerI);
    timerI = setInterval(() => { q(".ap-timer").textContent = fmt(Math.floor((Date.now() - started) / 1000)); }, 1000);
    later(observe, instant ? 0 : 450);
  }
  function hangUp() {
    q(".ap-dur").textContent = fmt(Math.floor((Date.now() - (started || Date.now())) / 1000));
    clearInterval(timerI); clearTimeout(loopT); music.pause(); endEl.hidden = false; void endEl.offsetWidth; endEl.classList.add("is-on"); lock(true);
    if (actx && soundOn) { const t = actx.currentTime; tone(659, t, 0.2, 0.35); tone(523, t + 0.2, 0.35, 0.35); }
  }
  function ring() {
    ap.classList.remove("is-live"); endEl.classList.remove("is-on"); endEl.hidden = true; lock(true); scrollTo(0, 0);
    knob.style.transform = ""; slide.classList.remove("is-done");
  }

  // Curseur « glisser pour décrocher » (un simple toucher marche aussi)
  const slide = q(".ap-slide"), knob = q(".ap-knob"); let sx = null, moved = 0;
  const maxX = () => slide.offsetWidth - knob.offsetWidth - 8;
  knob.addEventListener("pointerdown", (e) => { sx = e.clientX; moved = 0; knob.setPointerCapture(e.pointerId); knob.classList.add("is-drag"); });
  knob.addEventListener("pointermove", (e) => { if (sx === null) return; moved = Math.max(0, Math.min(maxX(), e.clientX - sx)); knob.style.transform = `translateX(${moved}px)`; slide.style.setProperty("--k", (moved / maxX()).toFixed(2)); });
  const release = () => { if (sx === null) return; sx = null; knob.classList.remove("is-drag");
    if (moved > maxX() * 0.6 || moved < 6) { knob.style.transform = `translateX(${maxX()}px)`; slide.classList.add("is-done"); later(() => answer(false), 260); }
    else { knob.style.transform = ""; slide.style.setProperty("--k", 0); } };
  knob.addEventListener("pointerup", release); knob.addEventListener("pointercancel", release);
  knob.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); answer(false); } });

  const NUDGES = A.nudges;
  let nudge = 0;
  q(".ap-later").addEventListener("click", () => { const n = q(".ap-nudge"); n.innerHTML = NUDGES[nudge++ % NUDGES.length]; n.classList.remove("is-on"); void n.offsetWidth; n.classList.add("is-on");
    call.classList.remove("is-shake"); void call.offsetWidth; call.classList.add("is-shake"); if (navigator.vibrate) navigator.vibrate([60, 40, 60]); });

  q(".ap-hang").addEventListener("click", hangUp);
  q(".ap-recall").addEventListener("click", () => ring());
  q(".ap-theme").addEventListener("click", (e) => { const night = ap.dataset.theme !== "nuit"; ap.dataset.theme = night ? "nuit" : "clair"; e.currentTarget.setAttribute("aria-pressed", String(night)); });
  q(".ap-snd").addEventListener("click", (e) => { soundOn = !soundOn; e.currentTarget.innerHTML = soundOn ? ICON.sound : ICON.mute; e.currentTarget.setAttribute("aria-label", soundOn ? A.mute : A.unmute);
    if (soundOn) { audio(); loop(); } else { clearTimeout(loopT); music.pause(); } });

  /* Dress code : le couple change de tenue au fil des couleurs ; toucher une pastille la choisit. */
  const dcEl = q(".ap-dcphoto .dcc"), couple = dcEl ? mountCouple(dcEl, dc.couple) : null;
  let dcI = 0, dcManual = false, dcTimer = 0;
  const setDc = (i) => { const c = colors[i]; if (!c || !couple) return; dcI = i; couple.set(c.men || c.hex, c.women || c.hex); qa(".ap-stickers figure").forEach((f, k) => f.classList.toggle("is-on", k === i)); };
  if (couple) {
    setDc(0);
    qa(".ap-stickers figure").forEach((f, k) => f.addEventListener("click", () => { dcManual = true; setDc(k); }));
    if (colors.length > 1) dcTimer = setInterval(() => { if (!dcManual) setDc((dcI + 1) % colors.length); }, 2800);
  }

  if (OPTS.skipIntro) answer(true); else ring();

  return {
    replay() { ring(); },
    destroy() { alive = false; couple?.destroy(); clearInterval(dcTimer); timers.forEach(clearTimeout); clearInterval(timerI); clearInterval(countI); io && io.disconnect(); removeEventListener("resize", size); lock(false); music.destroy(); try { actx && actx.close(); } catch (e) {} root.innerHTML = ""; },
  };
}
