// Modèle baby shower « Sur un petit nuage » / « On Cloud Nine » (id nuage, styles nu-). Cahier des charges : docs/sur-un-petit-nuage.md.
// Ouverture : une montgolfière en soie ivoire posée sur la mer de nuages à l'aube ; on maintient le doigt sur l'anneau doré,
// la flamme s'allume, la soie se tend et la montgolfière décolle. Ensuite on « monte » en faisant défiler : le ciel passe de
// l'aube à l'altitude, trois nappes de nuages glissent à des vitesses différentes derrière des cartes de nacre.
// Même contrat que les autres modèles (InvitationData ; options onRsvp, skipIntro, noGate, music) :
// parents + photo → date écrite en or par une étoile filante (obligatoire) → compte à rebours → révélation (facultative)
// → programme → thème → lieu → liste de souhaits → pronostics (facultatif) → réponse.
import { esc, dateParts } from "../engine";
import { inviteDict } from "../../../lib/i18n/invite";
import { wishHtml } from "../wishlist";
import { mountMeal } from "../meal";
import { createMusic, fxLevel } from "../music";

const IMG = "/img/nuage-";
const LANG_LOCALE = { fr: "fr-FR", en: "en-GB" };
/** Couleur de la soie et des feuilles d'or à la révélation. */
const REVEAL = { fille: { silk: "#EEB2BD", leaf: "#EFB6C0" }, garcon: { silk: "#A8C1E6", leaf: "#B0C8E8" } };
const ICON = {
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M4 6h16v14H4zM4 10h16M8 3v5M16 3v5"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.6 3 2.4-2.4-1.1-1.1-2.4 2.4-2.4-2.4-1.1 1.1 2.4 2.4-2.4 2.4 1.1 1.1 2.4-2.4 2.4 2.4 1.1-1.1z"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-5-5 5 5 5-5"/></svg>',
};
/** Étoile à cinq branches (svg) centrée sur 0,0. */
const STAR = (r) => { const p = []; for (let i = 0; i < 10; i++) { const a = (i * 36 - 90) * Math.PI / 180, rr = i % 2 ? r * 0.42 : r; p.push(`${(rr * Math.cos(a)).toFixed(2)},${(rr * Math.sin(a)).toFixed(2)}`); } return p.join(" "); };
/** Nuages du ciel fixe : image (1 dense, 2 légère, 3 voile), largeur en vw (bornée en svh), gauche en %, vitesse, départ et opacité. */
const CLOUDS = [
  { n: 3, w: 125, x: -18, sp: 0.18, y: 0.08, o: 0.55 },
  { n: 2, w: 140, x: -8, sp: 0.34, y: 0.62, o: 0.78 },
  { n: 1, w: 165, x: -34, sp: 0.55, y: 1.05, o: 0.92 },
  { n: 3, w: 115, x: 6, sp: 0.24, y: 1.5, o: 0.5 },
  { n: 2, w: 130, x: -30, sp: 0.42, y: 1.95, o: 0.7 },
  { n: 1, w: 150, x: -10, sp: 0.62, y: 2.4, o: 0.85 },
];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (k) => 1 - Math.pow(1 - k, 3);

export function mountNuage(root, data, OPTS = {}) {
  const D = data;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LOW = (navigator.hardwareConcurrency || 8) <= 4;
  document.body.dataset.tpl = "nuage";
  const T = inviteDict(D.lang), V = T.nuage, C = T.c;
  const lang = D.lang === "en" ? "en" : "fr";
  const baby = D.baby || { sex: "surprise", due: "", guesses: false, palette: "ivoire" };
  const reveal = !!baby.reveal && (baby.sex === "fille" || baby.sex === "garcon");
  // Avec la révélation, le sexe reste secret jusqu'au ballon : les phrases d'avant parlent de « bébé ».
  const sexTxt = reveal ? "surprise" : baby.sex;
  const when = dateParts(D.dateISO, D.lang);
  const names = [D.partner1, D.partner2].map((x) => String(x || "").trim()).filter(Boolean);
  const two = names.length > 1;
  const namesHtml = names.map(esc).join(" <i>&amp;</i> ");
  const ini = names.map((s) => esc(([...s][0] || "").toUpperCase())).join("<i>&amp;</i>");
  const photo = typeof D.photoUrl === "string" && D.photoUrl ? D.photoUrl : null;
  let dueTxt = "";
  if (/^\d{4}-\d{2}$/.test(baby.due || "")) {
    try { dueTxt = V.due(sexTxt, new Intl.DateTimeFormat(LANG_LOCALE[lang], { month: "long", timeZone: "UTC" }).format(new Date(`${baby.due}-15T12:00:00Z`))); } catch (e) {}
  }
  let alive = true, timers = [], countI = 0, raf = 0;
  const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); return t; };
  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];

  /* ---------- Liens utiles ---------- */
  const start = new Date(D.dateISO), end = new Date(start.getTime() + 3 * 3600e3);
  const gfmt = (d) => isNaN(d) ? "" : d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const venueQ = [D.venue?.name, D.venue?.address].filter(Boolean).join(", ");
  const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(V.calTitle(names.join(" & ")))}&dates=${gfmt(start)}/${gfmt(end)}&location=${encodeURIComponent(venueQ)}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQ)}`;

  const programme = (D.programme || []).filter((x) => x.title || x.t);
  const dc = D.dressCode || {};
  const colors = (dc.colors || []).slice(0, 4);
  const showTheme = dc.enabled !== false && (colors.length > 0 || dc.title || dc.note);
  const wish = wishHtml(D);
  const head = (k, t) => `<header class="nu-head"><small>${k}</small><h2>${t}</h2></header>`;
  const sec = (id, inner, cls = "") => `<section class="nu-sec ${cls}" data-s="${id}"><div class="nu-card">${inner}</div></section>`;

  /* ---------- Date : l'étoile filante écrit la date en or ---------- */
  let wd = "", dm = "", yh = "";
  if (when) {
    try {
      const d = new Date(D.dateISO), f = (o) => new Intl.DateTimeFormat(LANG_LOCALE[lang], { timeZone: "Europe/Paris", ...o }).format(d);
      wd = f({ weekday: "long" }); wd = wd.charAt(0).toUpperCase() + wd.slice(1);
      dm = lang === "en" ? `${when.day} ${when.month.charAt(0).toUpperCase() + when.month.slice(1)}` : `${when.day} ${when.month}`;
      yh = `${when.year} · ${lang === "en" ? f({ hour: "numeric", minute: "2-digit", hour12: true }) : f({ hour: "2-digit", minute: "2-digit" }).replace(":", " h ").replace(/ h 00$/, " h")}`;
    } catch (e) {}
  }
  const TRAIL = "M14,104 C70,28 120,118 176,70 S270,18 306,30";
  const dateSec = sec("date", `${head(V.dateEyebrow, V.dateTitle)}
    <div class="nu-sky-date" role="slider" tabindex="0" aria-label="${esc(V.trailAria)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <svg class="nu-trail" viewBox="0 0 320 200" aria-hidden="true">
        <defs><linearGradient id="nuGold" x1="0" x2="1"><stop offset="0" stop-color="#9c7a3e"/><stop offset=".4" stop-color="#f1deb0"/><stop offset=".7" stop-color="#b8955e"/><stop offset="1" stop-color="#e2c992"/></linearGradient>
        <filter id="nuGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>
        <path class="nu-trail-guide" d="${TRAIL}"/>
        <path class="nu-trail-glow" d="${TRAIL}" filter="url(#nuGlow)"/>
        <path class="nu-trail-line" d="${TRAIL}"/>
        <g class="nu-shoot"><circle r="13" class="nu-shoot-halo" filter="url(#nuGlow)"/><polygon points="${STAR(9)}" fill="url(#nuGold)"/></g>
      </svg>
      <div class="nu-dt" aria-live="polite"><b>${esc(wd)}</b><b>${esc(dm)}</b><span>${esc(yh)}</span></div>
    </div>
    <p class="nu-gate-note">${V.gate}</p>`, "is-date");

  /* ---------- Révélation (facultative) ---------- */
  const rv = reveal ? REVEAL[baby.sex] : null;
  const revealSec = reveal ? sec("reveal", `${head(V.revealEyebrow, V.revealTitle)}
    <div class="nu-rv-zone"><button type="button" class="nu-rv" aria-label="${esc(V.revealAria)}" style="--silk:${rv.silk};--leaf:${rv.leaf}">
      <span class="nu-rv-bal"><img src="${IMG}ballon.webp" alt="" draggable="false"><i></i></span>
      <span class="nu-rv-leaves" aria-hidden="true"></span>
    </button>
    <p class="nu-rv-txt" aria-live="polite"><small>${esc(V.revealIs)}</small><b>${esc(V.revealSex(baby.sex))}</b></p></div>
    <p class="nu-rv-hint">${V.revealHint}</p>`, "is-reveal") : "";

  const medal = `<span class="nu-medal">${photo ? `<img src="${esc(photo)}" alt="${esc(V.photoAlt)}">` : `<b aria-hidden="true">${ini}</b>`}</span>`;
  const sections = [
    sec("hero", `${medal}<p class="nu-kick">${V.kicker}</p><h1 class="nu-names">${namesHtml}</h1>
      <p class="nu-expect">${esc(V.expect(two, sexTxt))}</p>${dueTxt ? `<p class="nu-due">${esc(dueTxt)}</p>` : ""}
      ${D.intro ? `<p class="nu-intro">${esc(D.intro)}</p>` : ""}`, "is-hero"),
    dateSec,
  ];
  const after = [
    sec("count", `${head(V.countdown, V.countTitle)}
      <div class="nu-cd">${[V.days, V.hours, V.min, V.sec].map((l, i) => `<div><b data-c="${i}">0</b><small>${l}</small></div>`).join("")}</div>
      ${when ? `<p class="nu-sub">${esc(when.full)}</p>` : ""}`),
    revealSec,
    programme.length ? sec("prog", `${head(V.program, V.programTitle)}<ol class="nu-prog">${programme.map((x) => `<li><time>${esc(x.t)}</time><h3>${esc(x.title)}</h3>${x.note ? `<p>${esc(x.note)}</p>` : ""}</li>`).join("")}</ol>`) : "",
    showTheme ? sec("theme", `${head(V.theme, dc.title ? esc(dc.title) : V.colors)}${dc.note ? `<p class="nu-sub">${esc(dc.note)}</p>` : ""}
      ${colors.length ? `<ul class="nu-sw">${colors.map((c) => `<li><span style="--sw:${esc(c.women || c.hex)}${c.men && c.men !== c.women ? `;--sw2:${esc(c.men)}` : ""}"></span>${esc(c.name)}</li>`).join("")}</ul>` : ""}`) : "",
    venueQ ? sec("venue", `${head(V.venue, esc(D.venue?.name || ""))}<p class="nu-addr">${esc(D.venue?.address || "")}</p>
      <div class="nu-btns"><a class="nu-btn" href="${mapUrl}" target="_blank" rel="noopener noreferrer">${ICON.pin}${V.route}</a><a class="nu-btn ghost" href="${calUrl}" target="_blank" rel="noopener noreferrer">${ICON.cal}${esc(C.addCal)}</a></div>`) : "",
    wish ? sec("wish", `${head(T.wish.eyebrow, T.wish.title)}${wish}`) : "",
    baby.guesses ? sec("guess", `${head(V.guessEyebrow, V.guessTitle)}<p class="nu-sub">${V.guessHelp}</p>
      <div class="nu-guess">
        <label>${V.gName}<input name="gname" maxlength="40" placeholder="${esc(V.gNamePh)}" autocomplete="off"></label>
        <label>${V.gDate}<input name="gdate" type="date"></label>
        <label>${V.gWeight}<input name="gweight" maxlength="20" placeholder="${esc(V.gWeightPh)}" autocomplete="off"></label>
      </div>`) : "",
    sec("rsvp", `<div class="nu-rsvp">${head(V.rsvpEyebrow, V.rsvp)}${D.rsvpBy ? `<p class="nu-sub">${esc(D.rsvpBy)}</p>` : ""}
      <form class="nu-form" novalidate>
        <div class="nu-choice" role="group" aria-label="${esc(V.rsvp)}"><button type="button" data-a="yes" aria-pressed="true">${V.yes}</button><button type="button" data-a="no" aria-pressed="false">${V.no}</button></div>
        <label>${V.yourName}<input name="name" autocomplete="name" placeholder="${esc(C.namePh)}" maxlength="120"></label>
        <label class="nu-guests">${V.guests}<span><button type="button" data-g="-1" aria-label="${V.less}">−</button><output>1</output><button type="button" data-g="1" aria-label="${V.more}">+</button></span></label>
        <label>${V.note}<textarea name="msg" rows="3" maxlength="900" placeholder="${esc(V.notePh)}"></textarea></label>
        <p class="nu-err" hidden>${V.error}</p>
        <button class="nu-btn nu-send" type="submit">${V.send}</button>
      </form></div>`, "is-rsvp"),
    `<footer class="nu-end"><p>${V.end}</p><b>${namesHtml}</b><button type="button" class="nu-replay">${V.replay}</button></footer>`,
  ].join("");

  /* ---------- Balisage ---------- */
  root.innerHTML = `<div class="nu" data-pal="${esc(baby.palette || "ivoire")}">
    <div class="nu-sky" aria-hidden="true"><img class="nu-sky-lo" src="${IMG}ciel-aube.webp" alt="" decoding="async"><img class="nu-sky-hi" src="${IMG}ciel-haut.webp" alt="" decoding="async"></div>
    <div class="nu-clouds" aria-hidden="true">${CLOUDS.map((c, i) => `<span class="nu-c" data-i="${i}" style="--w:${c.w};left:${c.x}%;opacity:${c.o}"><img src="${IMG}nappe-${c.n}.webp" alt="" decoding="async"></span>`).join("")}</div>
    <div class="nu-pal" aria-hidden="true"><img src="${IMG}montgolfiere.webp" alt="" decoding="async"></div>
    <main class="nu-main">${sections.join("")}<div class="nu-after">${after}</div></main>
    <section class="nu-open" aria-label="${esc(V.kicker)}">
      <img class="nu-o-sky" src="${IMG}ciel-aube.webp" alt="" decoding="async">
      <span class="nu-o-veil" aria-hidden="true"></span>
      <span class="nu-o-cloud is-back" aria-hidden="true"><img src="${IMG}nappe-2.webp" alt=""></span>
      <span class="nu-o-glow" aria-hidden="true"></span>
      <div class="nu-o-bal" aria-hidden="true"><img src="${IMG}montgolfiere.webp" alt="" decoding="async"><span class="nu-flame"><i></i></span></div>
      <span class="nu-o-cloud is-front" aria-hidden="true"><img src="${IMG}nappe-1.webp" alt=""></span>
      <span class="nu-o-cloud is-mist" aria-hidden="true"><img src="${IMG}nappe-3.webp" alt=""></span>
      <div class="nu-o-text"><p class="nu-kick">${V.kicker}</p><p class="nu-names">${namesHtml}</p><p class="nu-expect">${esc(V.expect(two, sexTxt))}</p></div>
      <div class="nu-o-act">
        <p class="nu-o-hint">${V.hold}</p>
        <button type="button" class="nu-hold" aria-label="${esc(V.holdAria)}">
          <svg viewBox="0 0 84 84" aria-hidden="true"><circle class="nu-hold-bg" cx="42" cy="42" r="39"/><circle class="nu-hold-fg" cx="42" cy="42" r="39" pathLength="100"/></svg>
          <i></i>
        </button>
      </div>
      <span class="nu-o-white" aria-hidden="true"></span>
    </section>
    <button type="button" class="nu-snd" aria-label="${V.mute}">${ICON.sound}</button>
    <p class="nu-more" aria-hidden="true">${V.more_}${ICON.down}</p>
  </div>`;

  const nu = q(".nu"), open = q(".nu-open"), hold = q(".nu-hold");
  if (REDUCE) nu.classList.add("nu-still");
  if (LOW) nu.classList.add("nu-low");
  let gated = !OPTS.noGate;
  nu.classList.toggle("is-gated", gated);

  /* ---------- Son : musique de la bibliothèque + brûleur, étoile, éclat (synthétisés) ---------- */
  let actx = null, master = null, soundOn = true, playing = false;
  const music = createMusic(OPTS.music);
  const audio = () => { music.unlock(); try { if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.gain.value = 0.5 * fxLevel(OPTS.music); master.connect(actx.destination); } actx.resume(); } catch (e) {} return actx; };
  const noise = (len) => { const buf = actx.createBuffer(1, Math.floor(actx.sampleRate * len), actx.sampleRate), ch = buf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; const s = actx.createBufferSource(); s.buffer = buf; return s; };
  /** Souffle feutré du brûleur (bruit filtré grave). */
  let burnG = null;
  const burner = (on) => {
    if (!actx || !soundOn) return;
    const t = actx.currentTime;
    if (on && !burnG) {
      const s = noise(4), f = actx.createBiquadFilter(), g = actx.createGain();
      f.type = "lowpass"; f.frequency.value = 420; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.32, t + 0.35);
      s.loop = true; s.connect(f).connect(g).connect(master); s.start(t); burnG = { g, s };
    } else if (!on && burnG) { const b = burnG; burnG = null; b.g.gain.cancelScheduledValues(t); b.g.gain.setValueAtTime(b.g.gain.value, t); b.g.gain.linearRampToValueAtTime(0, t + 0.6); b.s.stop(t + 0.7); }
  };
  const chime = (notes = [1047, 1319, 1568, 2093]) => {
    if (!actx || !soundOn) return; const t = actx.currentTime;
    notes.forEach((fr, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = "sine"; o.frequency.value = fr; g.gain.setValueAtTime(0, t + i * 0.11); g.gain.linearRampToValueAtTime(0.055, t + i * 0.11 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.11 + 1.8); o.connect(g).connect(master); o.start(t + i * 0.11); o.stop(t + i * 0.11 + 1.9); });
  };
  const shimmer = (k) => { // tintement léger qui monte pendant le tracé de l'étoile
    if (!actx || !soundOn) return; const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = "sine"; o.frequency.value = 1400 + k * 900; g.gain.setValueAtTime(0.022, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(g).connect(master); o.start(t); o.stop(t + 0.55);
  };
  const pop = () => { if (!actx || !soundOn) return; const t = actx.currentTime, s = noise(0.25), f = actx.createBiquadFilter(), g = actx.createGain(); f.type = "bandpass"; f.frequency.value = 900; f.Q.value = 0.8; g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); s.connect(f).connect(g).connect(master); s.start(t); };
  const startMusic = () => { if (soundOn && alive) { playing = true; music.play(); } };
  const sndBtn = q(".nu-snd");
  sndBtn.addEventListener("click", () => {
    soundOn = !soundOn; sndBtn.innerHTML = soundOn ? ICON.sound : ICON.mute; sndBtn.setAttribute("aria-label", soundOn ? V.mute : V.unmute);
    if (soundOn) { audio(); if (!open.hidden || nu.classList.contains("is-in")) startMusic(); } else { music.pause(); playing = false; burner(false); }
  });

  /* ---------- Ascension : ciel et nuages qui glissent au défilement ---------- */
  const sky = q(".nu-sky-hi"), pal = q(".nu-pal"), cls = qa(".nu-c"), more = q(".nu-more");
  let vh = innerHeight, docMax = 1, ticking = false;
  const measure = () => { vh = innerHeight; docMax = Math.max(1, document.documentElement.scrollHeight - vh); };
  function frame() {
    ticking = false;
    const y = scrollY, asc = clamp(y / docMax, 0, 1);
    sky.style.opacity = (asc < 0.08 ? 0 : clamp((asc - 0.08) / 0.5, 0, 1)).toFixed(3);
    if (!REDUCE) {
      const span = vh * 2.9;
      cls.forEach((el, i) => {
        const c = CLOUDS[i];
        if (LOW && c.n === 3) return;
        const yy = ((((c.y * vh + y * c.sp) % span) + span) % span) - vh * 0.85;
        el.style.transform = `translate3d(0,${yy.toFixed(1)}px,0)`;
      });
      pal.style.transform = `translate3d(0,${(-Math.min(y, vh * 3) * 0.02).toFixed(1)}px,0)`;
    }
    more.classList.toggle("is-on", nu.classList.contains("is-in") && !gated && y < vh * 0.6 && asc < 0.9 && nu.classList.contains("show-more"));
  }
  const onScroll = () => { if (!ticking) { ticking = true; raf = requestAnimationFrame(frame); } };
  const onResize = () => { measure(); onScroll(); };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onResize);

  /* Apparition douce des cartes à l'écran */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-seen"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
  qa(".nu-sec").forEach((s) => io.observe(s));

  /* ---------- Date : suivre l'étoile du doigt (ou la toucher trois fois) ---------- */
  const dPanel = q(".nu-sky-date"), dCard = dPanel.closest(".nu-sec"), line = q(".nu-trail-line"), glow = q(".nu-trail-glow"), shoot = q(".nu-shoot"), dt = q(".nu-dt");
  let LEN = 0; try { LEN = line.getTotalLength(); } catch (e) { LEN = 400; }
  let prog = 0, lastShim = 0, tapAnim = 0;
  function setProg(k) {
    prog = clamp(k, 0, 1);
    const off = (LEN * (1 - prog)).toFixed(1);
    line.style.strokeDasharray = glow.style.strokeDasharray = `${LEN.toFixed(1)} ${LEN.toFixed(1)}`;
    line.style.strokeDashoffset = glow.style.strokeDashoffset = off;
    let p = { x: 14, y: 150 }; try { p = line.getPointAtLength(LEN * prog); } catch (e) {}
    shoot.setAttribute("transform", `translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${(prog * 160).toFixed(1)})`);
    dCard.style.setProperty("--w", prog.toFixed(3));
    dPanel.setAttribute("aria-valuenow", String(Math.round(prog * 100)));
    if (prog - lastShim > 0.07) { lastShim = prog; shimmer(prog); }
    if (prog >= 0.98) finishDate(false);
  }
  function finishDate(instant) {
    if (dCard.classList.contains("is-written")) return;
    prog = 1; dCard.classList.add("is-written"); dCard.style.setProperty("--w", "1");
    line.style.strokeDashoffset = glow.style.strokeDashoffset = "0";
    try { const p = line.getPointAtLength(LEN); shoot.setAttribute("transform", `translate(${p.x},${p.y})`); } catch (e) {}
    dPanel.setAttribute("aria-valuetext", V.written); q(".nu-gate-note").textContent = V.written;
    gated = false; nu.classList.remove("is-gated");
    if (!instant) { audio(); chime(); if (navigator.vibrate) navigator.vibrate(18); countUp(); later(() => { nu.classList.add("show-more"); measure(); onScroll(); }, 900); }
    measure(); onScroll();
  }
  if (!gated) finishDate(true); else setProg(0);
  let dd = null;
  dPanel.addEventListener("pointerdown", (e) => { if (!gated) return; audio(); dd = { x: e.clientX, y: e.clientY, k: prog, moved: false, w: dPanel.getBoundingClientRect().width }; });
  dPanel.addEventListener("pointermove", (e) => {
    if (!dd) return; const dx = e.clientX - dd.x;
    if (!dd.moved && Math.abs(dx) < 6) return;
    dd.moved = true; dPanel.classList.add("is-drag");
    setProg(Math.max(prog, dd.k + Math.max(0, dx) / (dd.w * 0.85)));
  });
  const dUp = () => {
    if (!dd) return; const wasTap = !dd.moved; dd = null; dPanel.classList.remove("is-drag");
    if (gated && (wasTap || prog > 0.8)) { // un toucher avance d'un tiers ; un tracé presque fini se termine tout seul
      cancelAnimationFrame(tapAnim); const k0 = prog, k1 = wasTap ? Math.min(1, Math.floor(prog * 3 + 1e-3) / 3 + 1 / 3) : 1, t0 = performance.now();
      const st = (now) => { const k = Math.min(1, (now - t0) / 650); setProg(k0 + (k1 - k0) * ease(k)); if (k < 1 && alive && gated) tapAnim = requestAnimationFrame(st); };
      tapAnim = requestAnimationFrame(st);
    }
  };
  dPanel.addEventListener("pointerup", dUp); dPanel.addEventListener("pointercancel", () => { dd = null; dPanel.classList.remove("is-drag"); });
  dPanel.addEventListener("keydown", (e) => { if (["Enter", " ", "ArrowRight"].includes(e.key) && gated) { e.preventDefault(); audio(); setProg(Math.min(1, prog + 0.34)); } });

  /* ---------- Compte à rebours ---------- */
  const remaining = () => { let s = Math.max(0, Math.floor((start - Date.now()) / 1000)); const d0 = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; return [d0, hh, Math.floor(s / 60), s % 60]; };
  let counting = false;
  const setCount = (vals) => qa("[data-c]").forEach((b) => { const i = +b.dataset.c; b.textContent = isNaN(vals[i]) ? "–" : i === 0 ? vals[0] : String(vals[i]).padStart(2, "0"); });
  function countUp() { if (REDUCE) return setCount(remaining()); counting = true; const tgt = remaining(), t0 = performance.now(); const st = (now) => { const k = Math.min(1, (now - t0) / 1700); setCount(tgt.map((x) => Math.round(x * ease(k)))); if (k < 1 && alive) requestAnimationFrame(st); else counting = false; }; requestAnimationFrame(st); }
  setCount(remaining()); countI = setInterval(() => { if (!counting) setCount(remaining()); }, 1000);

  /* ---------- Révélation : le ballon de soie s'ouvre en feuilles d'or teintées ---------- */
  const rvBtn = q(".nu-rv");
  if (rvBtn) {
    const leaves = rvBtn.querySelector(".nu-rv-leaves");
    leaves.innerHTML = Array.from({ length: LOW ? 22 : 40 }, (_, i) => {
      const a = (i / (LOW ? 22 : 40)) * Math.PI * 2 + Math.random() * 0.4, r = 90 + Math.random() * 120;
      return `<i style="--x:${(Math.cos(a) * r).toFixed(0)}px;--y:${(Math.sin(a) * r * 0.8 - 30).toFixed(0)}px;--fall:${(140 + Math.random() * 160).toFixed(0)}px;--r:${(Math.random() * 720 - 360).toFixed(0)}deg;--d:${(Math.random() * 0.25).toFixed(2)}s;--s:${(0.6 + Math.random() * 0.8).toFixed(2)}"></i>`;
    }).join("");
    rvBtn.addEventListener("click", () => {
      if (rvBtn.classList.contains("is-open")) return;
      audio(); rvBtn.classList.add("is-tint");
      later(() => { rvBtn.classList.add("is-open"); rvBtn.closest(".nu-sec").classList.add("is-revealed"); pop(); later(() => chime([880, 1109, 1319, 1760, 2217]), 180); if (navigator.vibrate) navigator.vibrate([12, 40, 18]); }, REDUCE ? 0 : 520);
      rvBtn.setAttribute("aria-label", V.revealSex(baby.sex));
    });
  }

  /* ---------- Ouverture : maintenir l'anneau, la flamme s'allume, la montgolfière décolle ---------- */
  let held = 0, holdT = 0, holdOn = false, launched = false;
  const HOLD_MS = 1600;
  function setHeld(k) { held = clamp(k, 0, 1); open.style.setProperty("--h", held.toFixed(3)); }
  function holdLoop(now) {
    const dt0 = now - holdT; holdT = now;
    setHeld(held + (holdOn ? dt0 / HOLD_MS : -dt0 / 700));
    if (held >= 1 && holdOn) { launch(); return; }
    if (held > 0 || holdOn) raf = requestAnimationFrame(holdLoop); else open.classList.remove("is-holding");
  }
  const holdStart = (e) => {
    if (launched) return; e.preventDefault(); audio(); holdOn = true; open.classList.add("is-holding");
    burner(true); if (!playing) startMusic();
    holdT = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(holdLoop);
  };
  const holdEnd = () => { if (!holdOn) return; holdOn = false; if (!launched) { burner(false); if (held < 0.15) { hold.classList.remove("is-nudge"); void hold.offsetWidth; hold.classList.add("is-nudge"); } } };
  hold.addEventListener("pointerdown", holdStart);
  hold.addEventListener("pointerup", holdEnd); hold.addEventListener("pointerleave", holdEnd); hold.addEventListener("pointercancel", holdEnd);
  hold.addEventListener("contextmenu", (e) => e.preventDefault());
  hold.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat && !launched) { e.preventDefault(); audio(); startMusic(); burner(true); setHeld(1); launch(); } });

  function launch() {
    if (launched) return; launched = true; holdOn = false; setHeld(1);
    open.classList.add("is-launch");
    if (navigator.vibrate) navigator.vibrate(20);
    later(() => burner(false), 1500);
    const D1 = REDUCE ? 300 : 2500, D2 = REDUCE ? 200 : 900;
    later(() => { enter(false); open.classList.add("is-out"); }, D1);
    later(() => { open.hidden = true; document.body.classList.remove("nu-locked"); }, D1 + D2);
  }
  function enter(instant) {
    nu.classList.add("is-in");
    scrollTo(0, 0); measure(); onScroll();
    if (instant) qa(".nu-sec").forEach((s) => s.classList.add("is-seen"));
  }
  function showOpen() {
    launched = false; holdOn = false; setHeld(0); burner(false);
    open.hidden = false; open.classList.remove("is-launch", "is-out", "is-holding");
    nu.classList.remove("is-in", "show-more"); document.body.classList.add("nu-locked"); scrollTo(0, 0);
    music.pause(); playing = false;
  }

  /* ---------- Réponse ---------- */
  const form = q(".nu-form"), rsvpBox = q(".nu-rsvp"); let attending = true, guests = 1;
  form.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]"); if (a) { attending = a.dataset.a === "yes"; form.querySelectorAll("[data-a]").forEach((b) => b.setAttribute("aria-pressed", String(b === a))); q(".nu-guests").hidden = !attending; return; }
    const g = e.target.closest("[data-g]"); if (g) { guests = clamp(guests + +g.dataset.g, 1, 20); form.querySelector("output").textContent = guests; }
  });
  // Choix du repas (meal.js) : sous le nombre de personnes, visible seulement si « présent ».
  const mealEl = document.createElement("div"); q(".nu-guests").after(mealEl);
  const MEAL = mountMeal(mealEl, data), mealSync = () => MEAL.update(guests, attending);
  form.addEventListener("click", mealSync); mealSync();
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); const inp = form.querySelector("input[name=name]"), name = inp.value.trim();
    if (!name) { inp.focus(); inp.placeholder = C.nameMissing; return; }
    const meal = MEAL.collect(); if (!meal.ok) return;
    // Pronostics (facultatifs) en tête du message : pas de nouvelle colonne.
    const gv = (n) => { const el = q(`.nu-guess [name=${n}]`); return el ? el.value.trim() : ""; };
    let gdate = gv("gdate");
    if (gdate) { try { gdate = new Intl.DateTimeFormat(LANG_LOCALE[lang], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${gdate}T12:00:00Z`)); } catch (x) {} }
    const sep = lang === "fr" ? " : " : ": ";
    const guess = [gv("gname") && V.gName + sep + gv("gname"), gdate && V.gDate + sep + gdate, gv("gweight") && V.gWeight + sep + gv("gweight")].filter(Boolean);
    const note = form.querySelector("textarea:not(.ml-remarks)").value.trim();
    const msg = [guess.length ? V.guessPrefix + guess.join(" · ") : "", note].filter(Boolean).join("\n").slice(0, 1000);
    const btn = form.querySelector(".nu-send"), err = form.querySelector(".nu-err");
    err.hidden = true;
    if (OPTS.onRsvp) { btn.disabled = true; btn.textContent = C.sending; try { await OPTS.onRsvp({ name, attending, guests: attending ? guests : 0, message: msg, choices: meal.choices, remarks: meal.remarks }); } catch (x) { btn.disabled = false; btn.textContent = V.send; err.hidden = false; return; } }
    // Une petite montgolfière emporte la réponse vers le haut
    if (!REDUCE) {
      const r = btn.getBoundingClientRect(), b = document.createElement("img");
      b.src = `${IMG}montgolfiere.webp`; b.alt = ""; b.className = "nu-fly"; b.style.left = `${r.left + r.width / 2}px`; b.style.top = `${r.top - 40}px`;
      nu.appendChild(b); later(() => b.remove(), 4200);
    }
    const first = esc(name.split(" ")[0]);
    form.outerHTML = `<div class="nu-thanks"><small>${esc(C.thanks(first))}</small><h3>${attending ? V.yesTitle : V.noTitle}</h3><p>${esc(attending ? C.noted(String(guests)) : C.missYou)}</p>${OPTS.onRsvp ? "" : `<p class="nu-sub">${esc(C.previewOnly)}</p>`}<a class="nu-btn ghost" href="${calUrl}" target="_blank" rel="noopener noreferrer">${ICON.cal}${esc(C.addCal)}</a></div>`;
    rsvpBox.classList.add("is-sent"); audio(); chime();
  });
  q(".nu-replay").addEventListener("click", () => showOpen());

  /* ---------- Démarrage ---------- */
  measure();
  if (OPTS.skipIntro) { open.hidden = true; enter(true); }
  else showOpen();
  frame();

  return {
    replay() { showOpen(); },
    destroy() {
      alive = false; timers.forEach(clearTimeout); clearInterval(countI); cancelAnimationFrame(raf); cancelAnimationFrame(tapAnim); io.disconnect();
      removeEventListener("scroll", onScroll); removeEventListener("resize", onResize);
      document.body.classList.remove("nu-locked"); burner(false); music.destroy(); try { actx && actx.close(); } catch (e) {} root.innerHTML = "";
    },
  };
}
