// Modèle « Le domaine » (id boule-neige) : une clé dorée ouvre la serrure d'un mur ivoire, les deux battants
// s'écartent sur le domaine, puis l'invitation est une promenade de jour : chaque section a son lieu (photo réelle)
// qui s'avance doucement au défilement et passe en fondu au lieu suivant.
// Même contrat et même ordre que les autres modèles : « Nous nous marions » + prénoms → photo + verset → date
// (buée à essuyer, obligatoire) → compte à rebours → programme → dress code → lieu → histoire → réponse.
import { esc, dateParts } from "../engine";
import { inviteDict } from "../../../lib/i18n/invite";
import { coupleHtml, mountCouple } from "../dresscode/couple";
import { wishHtml } from "../wishlist";
import { createMusic, fxLevel } from "../music";

const IMG = (n) => `/img/domaine-${n}.webp`;
// Lieux du parcours, dans l'ordre des sections (index = data-s).
const SCENES = ["portail", "allee", "orangerie", "cour", "arche", "vestibule", "facade", "terrasse", "table", "table-flou"];
// Repères mesurés sur les images (en %) : à remesurer si une image change.
const HOLE = { x: 49.45, y: 44 }; // centre du trou de la serrure (domaine-serrure.webp, 856 × 1500)
const TIP = { x: 99.8, y: 48.7 }; // bout de la tige de la clé (domaine-cle.webp, 1200 × 430)
// Intérieur du cadre doré du chevalet (domaine-allee.webp, 941 × 1672) : boîte englobante + quadrilatère
// (coins haut-gauche, haut-droit, bas-droit, bas-gauche, en % de la boîte). La photo y est posée en perspective.
const FRAME = { l: 63.44, t: 31.58, w: 30.39, h: 25.84, q: [[7.3, 5.6], [100, 0], [91.3, 100], [0, 95.4]] };
// matrix3d qui envoie un rectangle w × h sur le quadrilatère q (homographie)
function quadMatrix(w, h, q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / den, k = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  return `matrix3d(${[a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1].map((n) => +n.toFixed(6)).join(",")})`;
}

// Point de fuite de chaque image (en %) : la caméra « marche » vers ce point pour passer au lieu suivant.
const FOCAL = { portail: [50, 60], allee: [32, 52], orangerie: [50, 58], cour: [60, 48], arche: [50, 52], vestibule: [50, 52], facade: [50, 64], terrasse: [52, 46], table: [60, 40], "table-flou": [50, 50],
  "lieu-mairie": [50, 50], "lieu-eglise": [50, 44], "lieu-mosquee": [50, 47], "lieu-temple": [50, 46], "lieu-ceremonie": [49, 46], "lieu-cocktail": [50, 41], "lieu-reception": [50, 43], "lieu-soiree": [53, 50] };
// Lieu d'une étape du programme : choisi par les mariés (data.programme[i].place), sinon deviné d'après le titre.
const GUESS = [
  ["mairie", /mairie|civil|town hall|city hall|registry/i], ["mosquee", /mosqu|nikah|nikkah/i],
  ["temple", /temple|synagogue|houppa|chuppah/i], ["eglise", /[ée]glise|messe|religieu|church|\bmass\b|chapel|chapelle|b[ée]n[ée]diction|blessing/i],
  ["cocktail", /vin d.honneur|cocktail|ap[ée]ritif|drinks|toast|retrouvailles|accueil|welcome|gathering/i],
  ["reception", /d[îi]ner|repas|r[ée]ception|dinner|lunch|d[ée]jeuner|banquet/i],
  ["soiree", /soir[ée]e|danse|f[êe]te|party|dance|c[ée]l[ée]bration/i], ["ceremonie", /c[ée]r[ée]monie|ceremony|la[ïi]que|vows|engagement|fian[cç]ailles/i],
];
const ORDER = ["ceremonie", "cocktail", "reception", "soiree"];
const PLACE_IDS = ["mairie", "eglise", "mosquee", "temple", "ceremonie", "cocktail", "reception", "soiree"];
const placeOf = (x, i) => PLACE_IDS.includes(x.place) ? x.place : (GUESS.find(([, re]) => re.test(`${x.title} ${x.note}`))?.[0] || ORDER[Math.min(i, 3)]);
// Images des lieux du programme (domaine-lieu-<type>.webp) déjà livrées ; les autres empruntent un lieu du domaine.
const LIEUX_PRETS = new Set(["mairie", "eglise", "mosquee", "temple", "ceremonie", "cocktail", "reception", "soiree"]);
const LIEU_REPLI = { mairie: "facade", eglise: "arche", mosquee: "arche", temple: "arche", ceremonie: "arche", cocktail: "terrasse", reception: "table", soiree: "table-flou" };
const placeImg = (p) => (LIEUX_PRETS.has(p) ? `lieu-${p}` : LIEU_REPLI[p]);

const ICON = {
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.6 3 2.4-2.4-1.1-1.1-2.4 2.4-2.4-2.4-1.1 1.1 2.4 2.4-2.4 2.4 1.1 1.1 2.4-2.4 2.4 2.4 1.1-1.1z"/></svg>',
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function mountDomaine(root, data, OPTS = {}) {
  const D = data;
  const STILL = !!OPTS.skipIntro && !!OPTS.noGate; // aperçu de l'éditeur : tout affiché d'un coup
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches || STILL;
  document.body.dataset.tpl = "boule-neige";
  const T = inviteDict(D.lang), M = T.domaine, C = T.classic;
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
  const head = (k, t) => `<header class="dm-head"><small>${k}</small><h2>${t}</h2></header>`;
  const inFrame = photo ? `<img src="${esc(photo)}" alt="${esc(T.c.photoAlt)}">` : `<span class="dm-mono">${ini(D.partner1)}<i>&amp;</i>${ini(D.partner2)}</span>`;

  // ---------- Le parcours : une station par étape, chacune dans son lieu ----------
  const st = []; // { k: genre, img: lieu, say: phrase du fil, html: contenu }
  const add = (k, img, say, html, cls = "") => st.push({ k, img, say, html, cls });
  add("cover", "portail", "", `<div class="dm-cover-in dm-rv"><small>${M.married}</small><h1>${p1}<i>&amp;</i>${p2}</h1>${D.intro ? `<p>${esc(D.intro)}</p>` : ""}</div>
        <div class="dm-cue" aria-hidden="true">${M.scroll}<i></i></div>`, "dm-cover");
  add("portrait", "allee", M.say.portrait, `<figure class="dm-easel dm-rv"><img class="dm-easel-bg" src="${IMG("allee")}" alt="" loading="lazy"><div class="dm-frame" style="left:${FRAME.l}%;top:${FRAME.t}%;width:${FRAME.w}%;height:${FRAME.h}%"><div class="dm-pic">${inFrame}</div></div></figure>
        ${v ? `<div class="dm-card dm-verse dm-rv">${v.orig ? `<p class="dm-verse-orig" dir="auto">${esc(v.orig)}</p>` : ""}<blockquote>${v.orig ? esc(v.text) : esc(T.c.quote(v.text))}</blockquote>${v.ref ? `<cite>${esc(v.ref)}</cite>` : ""}</div>` : ""}`, "dm-portrait");
  add("date", "orangerie", M.say.date, `<div class="dm-card dm-datecard dm-rv">${head(M.dateEyebrow, M.dateTitle)}
          <div class="dm-pane"><div class="dm-date"><b>${when ? esc(when.day) : ""}</b><span>${when ? esc(`${when.month} ${when.year}`) : ""}</span><em>${when ? esc(when.full) : ""}</em></div><canvas aria-label="${M.fogHint}"></canvas><span class="dm-bars" aria-hidden="true"></span></div>
          <p class="dm-fog-hint">${M.fogHint}</p>
        </div>`);
  const DATE_I = st.length - 1;
  add("count", "cour", M.say.count, `<div class="dm-card dm-count dm-rv"><small>${M.countdown}</small><div class="dm-count-grid"><span><b data-c="0">0</b><i>${M.days}</i></span><span><b data-c="1">00</b><i>${M.hours}</i></span><span><b data-c="2">00</b><i>${M.min}</i></span><span><b data-c="3">00</b><i>${M.sec}</i></span></div></div>`);
  programme.forEach((x, i) => { const pl = placeOf(x, i);
    add("step", placeImg(pl), i === 0 ? M.say.program : M.step(i + 1), `<div class="dm-card dm-step dm-rv">${i === 0 ? `<p class="dm-step-top">${M.program}</p>` : ""}<small>${x.t ? `${esc(x.t)} · ` : ""}${M.places[pl]}</small><h2>${esc(x.title)}</h2>${x.note ? `<p class="dm-note">${esc(x.note)}</p>` : ""}</div>`); });
  if (showDress) add("dress", "vestibule", M.say.dress, `<div class="dm-card dm-dress dm-rv">${head(M.dress, dc.title ? esc(dc.title) : M.colors)}${dc.note ? `<p class="dm-note">${esc(dc.note)}</p>` : ""}
      <div class="dm-sw" role="group" aria-label="${M.colors}">${colors.map((c, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}" aria-label="${esc(c.name)}" style="--sw:${swBg(c)}"></button>`).join("")}</div>
      ${coupleHtml(M.dress, "dm-couple")}
      <p class="dm-cname">${esc(colors[0].name)}</p>
      ${dc.men?.text || dc.women?.text ? `<div class="dm-dress-cols">${dc.men?.text ? `<p><b>${esc(dc.men.label || M.men)}</b>${esc(dc.men.text)}</p>` : ""}${dc.women?.text ? `<p><b>${esc(dc.women.label || M.women)}</b>${esc(dc.women.text)}</p>` : ""}</div>` : ""}
    </div>`);
  if (venueQ) add("venue", "facade", M.say.venue, `<div class="dm-card dm-place dm-rv">${head(M.venueEyebrow, esc(D.venue?.name || ""))}<p class="dm-note">${esc(D.venue?.address)}</p>
      <div class="dm-btns"><a class="dm-btn" href="${mapUrl}" target="_blank" rel="noopener noreferrer">${ICON.pin}${M.route}</a><a class="dm-btn ghost" href="${calUrl}" target="_blank" rel="noopener noreferrer">${esc(T.c.addCal)}</a></div></div>`);
  if (story.length) add("story", "terrasse", M.say.story, `<div class="dm-card dm-story dm-rv">${head(M.storyEyebrow, C.storyTitle)}${story.map((s) => `<article class="dm-rv"><time>${esc(s.y)}</time><p>${esc(s.text)}</p></article>`).join("")}</div>`);
  const W = inviteDict(D.lang).wish, wish = wishHtml(D);
  if (wish) add("wish", "arche", W.say, `<div class="dm-card dm-wish dm-rv">${head(W.eyebrow, W.title)}${wish}</div>`);
  add("table", "table", M.say.rsvp, `<header class="dm-table-head dm-rv"><small>${M.rsvpEyebrow}</small><h2>${M.rsvp}</h2>${D.rsvpBy ? `<p>${esc(D.rsvpBy)}</p>` : ""}</header>`, "dm-sec-table");
  add("rsvp", "table-flou", "", `<div class="dm-card dm-rsvp dm-rv">
      <form class="dm-form" novalidate>
        <div class="dm-choice" role="group" aria-label="${M.presence}"><button type="button" data-a="yes" aria-pressed="true">${M.yes}</button><button type="button" data-a="no" aria-pressed="false">${M.no}</button></div>
        <label>${M.yourName}<input name="name" autocomplete="name" placeholder="${esc(T.c.namePh)}" maxlength="120"></label>
        <label class="dm-guests">${M.guests}<span><button type="button" data-g="-1" aria-label="${M.less}">−</button><output>1</output><button type="button" data-g="1" aria-label="${M.more}">+</button></span></label>
        <label>${M.note}<textarea name="msg" rows="3" maxlength="1000"></textarea></label>
        <p class="dm-err" hidden>${M.error}</p>
        <button class="dm-submit" type="submit">${M.send}</button>
      </form></div>
      <footer class="dm-footer"><p>${p1} <i>&amp;</i> ${p2}</p><p class="dm-footer-date">${when ? esc(when.full) : ""}</p><button class="dm-replay" type="button">${M.replay}</button></footer>`);
  const sec = (s, i) => `<section class="dm-sec ${s.cls}" data-s="${i}" data-k="${s.k}">${s.say ? `<p class="dm-mark"><i></i><span>${s.say}</span></p>` : ""}${s.html}</section>`;

  root.innerHTML = `<div class="dm">
    <div class="dm-world" aria-hidden="true">${st.map((s, i) => { const f = FOCAL[s.img] || [50, 50]; return `<div class="dm-layer" data-i="${i}" data-k="${s.k}" data-src="${IMG(s.img)}" style="transform-origin:${f[0]}% ${f[1]}%"></div>`; }).join("")}
      <div class="dm-curtain l"></div><div class="dm-curtain r"></div><div class="dm-veil"></div><div class="dm-pollen"></div></div>
    <section class="dm-intro" aria-label="${esc(M.introAria(D.partner1, D.partner2))}">
      <div class="dm-behind"></div>
      <div class="dm-door l"><i></i></div><div class="dm-door r"><i></i></div>
      <div class="dm-lock"><span class="dm-peek"></span><img src="${IMG("serrure")}" alt="" draggable="false"></div>
      <button class="dm-key" type="button" aria-label="${M.keyAria}"><img src="${IMG("cle")}" alt="" draggable="false"></button>
      <div class="dm-flash"></div>
      <p class="dm-hint">${M.hint}</p>
    </section>
    <main class="dm-main">
      <svg class="dm-thread" aria-hidden="true"><path class="dm-thread-way"/><path class="dm-thread-glow"/><path class="dm-thread-ln"/><circle class="dm-thread-hd" r="4"/></svg>
      ${st.slice(0, DATE_I + 1).map(sec).join("")}
      <div class="dm-after">${st.slice(DATE_I + 1).map((s, j) => sec(s, j + DATE_I + 1)).join("")}</div>
    </main>
    <button type="button" class="dm-snd" aria-label="${M.mute}">${ICON.sound}</button>
  </div>`;

  const dm = q(".dm"), intro = q(".dm-intro"), keyBtn = q(".dm-key"), lock = q(".dm-lock");
  if (REDUCE) dm.classList.add("dm-still");
  // Charge l'image d'un lieu seulement quand on en approche.
  const layers = qa(".dm-layer");
  const load = (i) => { const l = layers[i]; if (l && l.dataset.src) { l.style.backgroundImage = `url(${l.dataset.src})`; delete l.dataset.src; } };
  load(0); load(1);

  /* ---------- Son : petite musique champêtre et chants d'oiseaux (seulement après un geste) ---------- */
  let actx = null, master = null, soundOn = true, loopT = 0, birdT = 0, looping = false;
  const music = createMusic(OPTS.music); // musique choisie par les mariés (remplace la mélodie synthétisée)
  const audio = () => { music.unlock(); try { if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.gain.value = 0.1 * fxLevel(OPTS.music); master.connect(actx.destination); } actx.resume(); } catch (e) {} return actx; };
  const tone = (f, t, dur, vol = 0.25, type = "sine") => { if (!actx || !soundOn) return; const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05); };
  // Arpèges de harpe en sol majeur, lents et clairs
  const loop = () => { if (!soundOn || !alive) return; looping = true; music.play(); };
  const bird = () => { if (!actx || !soundOn || !alive) return; const t = actx.currentTime + 0.05, n = 2 + Math.floor(Math.random() * 3), base = 2600 + Math.random() * 1400;
    for (let i = 0; i < n; i++) { const o = actx.createOscillator(), g = actx.createGain(), s = t + i * 0.13; o.type = "sine"; o.frequency.setValueAtTime(base, s); o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), s + 0.06); o.frequency.exponentialRampToValueAtTime(base * 0.9, s + 0.1);
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.035, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.11); o.connect(g).connect(master); o.start(s); o.stop(s + 0.13); }
    birdT = later(bird, 3500 + Math.random() * 6000); };
  const click = () => { if (!actx || !soundOn) return; const t = actx.currentTime; tone(1800, t, 0.05, 0.25, "square"); tone(140, t + 0.01, 0.25, 0.5); tone(2400, t + 0.11, 0.04, 0.18, "square"); };
  const chime = () => { if (!actx || !soundOn) return; const t = actx.currentTime; [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.09, 1.4, 0.12)); };
  const sndBtn = q(".dm-snd");
  sndBtn.addEventListener("click", () => { soundOn = !soundOn; sndBtn.innerHTML = soundOn ? ICON.sound : ICON.mute; sndBtn.setAttribute("aria-label", soundOn ? M.mute : M.unmute);
    if (soundOn) { audio(); if (dm.classList.contains("is-open")) { loop(); bird(); } } else { clearTimeout(loopT); music.pause(); clearTimeout(birdT); looping = false; } });

  /* ---------- Promenade : la caméra avance dans le lieu, puis marche jusqu'au suivant ---------- */
  let io = null, cur = -1, frame = 0;
  function observe() {
    const els = qa(".dm-rv");
    if (REDUCE || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-in")); return; }
    if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => { if (!el.classList.contains("is-in")) io.observe(el); });
  }
  const WALK = 0.58; // à partir de ce point de la station, on marche vers la suivante
  function walk() {
    frame = 0; if (!alive) return;
    const mid = innerHeight * 0.55; let s = -1, t = 0;
    for (const el of qa(".dm-sec")) { const r = el.getBoundingClientRect(); if (r.height && r.top <= mid && r.bottom > mid) { s = +el.dataset.s; t = clamp((mid - r.top) / r.height, 0, 1); break; } }
    if (s < 0) s = cur < 0 ? 0 : cur;
    if (s !== cur) { cur = s; load(s); load(s + 1); load(s + 2); dm.dataset.k = st[s].k; }
    if (REDUCE) layers.forEach((l, i) => l.classList.toggle("is-on", i === s));
    else {
      const last = s >= st.length - 1 || (gated && s >= DATE_I);
      const u = last ? 0 : clamp((t - WALK) / (1 - WALK), 0, 1), e = u * u * (3 - 2 * u);
      layers.forEach((l, i) => {
        let o = 0, sc = 1;
        if (i === s) { o = 1 - e * e; sc = 1 + 0.07 * Math.min(t, WALK) / WALK + e * 0.75; }
        else if (i === s + 1 && e > 0) { o = Math.min(1, e * 1.6); sc = 0.9 + 0.1 * e; }
        if (l._o !== o || l._sc !== sc) { l._o = o; l._sc = sc; l.style.opacity = o.toFixed(3); l.style.transform = `scale(${sc.toFixed(4)})`; l.style.zIndex = i === s + 1 ? "2" : i === s ? "1" : "0"; }
      });
    }
    drawThread();
  }
  const onScroll = () => { if (!frame) frame = requestAnimationFrame(walk); };
  addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Le fil doré qui relie les stations et « parle » à chacune ---------- */
  const main = q(".dm-main"), thread = q(".dm-thread"), tWay = q(".dm-thread-way"), tGlow = q(".dm-thread-glow"), tLine = q(".dm-thread-ln"), tHead = q(".dm-thread-hd");
  let tLen = 0, tSamples = [], marks = [], tFrame = 0;
  const ping = () => { if (!actx || !soundOn) return; const t = actx.currentTime; tone(1175, t, 1.4, 0.07, "triangle"); tone(1568, t + 0.09, 1.4, 0.045, "triangle"); };
  function buildThread() {
    tFrame = 0; if (!alive || !dm.classList.contains("is-open")) return;
    const mr = main.getBoundingClientRect(), w = mr.width, h = main.scrollHeight;
    thread.setAttribute("viewBox", `0 0 ${w} ${h}`); thread.style.width = `${w}px`; thread.style.height = `${h}px`;
    marks = qa(".dm-mark").filter((m) => m.getClientRects().length);
    const cue = q(".dm-cue i").getBoundingClientRect();
    const pts = [{ x: w / 2, y: cue.bottom - mr.top }].concat(marks.map((m) => { const r = m.firstElementChild.getBoundingClientRect(); return { x: r.left + r.width / 2 - mr.left, y: r.top + r.height / 2 - mr.top }; }));
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const A = pts[i - 1], B = pts[i], dy = B.y - A.y, sw = (i % 2 ? 1 : -1) * w * 0.52;
      d += ` C${(A.x + sw).toFixed(1)},${(A.y + dy * 0.3).toFixed(1)} ${(B.x + sw).toFixed(1)},${(B.y - dy * 0.42).toFixed(1)} ${B.x.toFixed(1)},${B.y.toFixed(1)}`;
    }
    [tWay, tGlow, tLine].forEach((p) => p.setAttribute("d", d));
    tLen = tLine.getTotalLength(); [tGlow, tLine].forEach((p) => { p.style.strokeDasharray = `${tLen} ${tLen}`; });
    tSamples = []; for (let l = 0; l <= tLen + 6; l += 6) { const p = tLine.getPointAtLength(Math.min(l, tLen)); tSamples.push([Math.min(l, tLen), p.x, p.y]); }
    marks.forEach((m, i) => { m._y = pts[i + 1].y; });
    drawThread();
  }
  const rebuild = () => { if (!tFrame) tFrame = requestAnimationFrame(buildThread); };
  function drawThread() {
    if (!tLen) return;
    if (REDUCE) { [tGlow, tLine].forEach((p) => { p.style.strokeDashoffset = "0"; }); tHead.style.opacity = "0"; marks.forEach((m) => m.classList.add("is-lit")); return; }
    const y = innerHeight * 0.64 - main.getBoundingClientRect().top;
    let L = 0, X = tSamples[0] ? tSamples[0][1] : 0, Y = tSamples[0] ? tSamples[0][2] : 0;
    for (const p of tSamples) { if (p[2] > y) break; [L, X, Y] = p; }
    const off = String(tLen - L); tGlow.style.strokeDashoffset = off; tLine.style.strokeDashoffset = off;
    tHead.setAttribute("cx", X); tHead.setAttribute("cy", Y); tHead.style.opacity = L > 2 && L < tLen - 2 ? "1" : "0";
    marks.forEach((m) => { const lit = m._y <= y + 1; if (lit !== m.classList.contains("is-lit")) { m.classList.toggle("is-lit", lit); if (lit) ping(); } });
  }
  const ro = "ResizeObserver" in window ? new ResizeObserver(rebuild) : null;
  if (ro) ro.observe(main);

  // Photo du chevalet : recalée en perspective sur l'intérieur du cadre à chaque changement de taille
  const fitFrame = (fr) => { const w = fr.offsetWidth, h = fr.offsetHeight, pic = fr.firstElementChild; if (!w || !h || !pic) return;
    pic.style.transform = quadMatrix(w, h, FRAME.q.map(([x, y]) => [x * w / 100, y * h / 100])); };
  const fro = "ResizeObserver" in window ? new ResizeObserver((es) => es.forEach((en) => fitFrame(en.target))) : null;
  qa(".dm-frame").forEach((fr) => { fitFrame(fr); fro?.observe(fr); });

  /* ---------- Ouverture : la clé entre dans la serrure, tourne, le mur s'ouvre ---------- */
  let opening = false, drag = null, keyAnim = null;
  function showIntro() {
    opening = false; dm.classList.remove("is-open", "is-opening", "is-turned"); intro.hidden = false; intro.classList.remove("is-out");
    keyAnim?.cancel(); keyAnim = null; keyBtn.style.transform = "";
    qa(".dm-rv.is-in").forEach((el) => el.classList.remove("is-in"));
    document.body.classList.add("dm-locked"); scrollTo(0, 0); clearTimeout(loopT); music.pause(); clearTimeout(birdT); looping = false;
  }
  function openMain(instant) {
    dm.classList.add("is-open"); document.body.classList.remove("dm-locked"); scrollTo(0, 0);
    intro.classList.add("is-out"); later(() => { intro.hidden = true; }, instant ? 0 : 1000);
    if (!instant && !looping) { later(loop, 300); later(bird, 1800); }
    observe(); walk(); later(paintFog, 80); later(buildThread, 60);
  }
  function unlock(dx = 0, dy = 0) {
    if (opening) return; opening = true; audio(); dm.classList.add("is-opening");
    if (REDUCE) { click(); return later(() => openMain(false), 300); }
    // Bout de la clé (sans transformation) → centre du trou de la serrure.
    const kr = keyBtn.getBoundingClientRect(), lr = lock.getBoundingClientRect();
    const kx = kr.left - dx, ky = kr.top - dy, kw = kr.width;
    const tipX = kx + kw * TIP.x / 100, tipY = ky + kr.height * TIP.y / 100;
    const X = lr.left + lr.width * HOLE.x / 100 - tipX, Y = lr.top + lr.height * HOLE.y / 100 - tipY;
    // Geste d'une main invisible, en 3D (perspective centrée sur le bout de la clé, qui reste au trou) :
    // la clé monte en arc et se présente de trois quarts (l'anneau vient vers nous, la tige part dans le mur),
    // vise, s'enfonce en deux poussées (la partie entrée est masquée), hésite, puis tourne sur son axe
    // d'un quart de tour, avec un léger dépassement et un retour, comme un poignet.
    const s1 = clamp((lr.width * 1.85) / kw, 0.6, 1.3), P = Math.round(kw * s1 * 1.5);
    const L = kw * s1, depth = 0.24; // part de la clé qui entre dans la serrure
    const k = (tx, ty, rz, ry, rx, ins, sc, br = 1) => ({
      transform: `translate(${tx}px,${ty}px) perspective(${P}px) rotateZ(${rz}deg) rotateY(${ry}deg) rotateX(${rx}deg) translateX(${(ins * L).toFixed(1)}px) scale(${sc})`,
      clipPath: `inset(-60% ${(ins * 100).toFixed(2)}% -60% -60%)`, filter: `drop-shadow(0 12px 14px rgba(80,58,26,.35)) brightness(${br})`,
    });
    keyAnim = keyBtn.animate([
      { ...k(dx, dy, 0, 0, 0, 0, 1), offset: 0 },
      { ...k(dx + (X - dx) * 0.45, dy + (Y - dy) * 0.55 + 30, -7, 22, 0, 0, (1 + s1) / 2), offset: 0.2, easing: "cubic-bezier(.3,.5,.4,1)" },
      { ...k(X - 6, Y + 10, 3, 52, 0, -0.05, s1), offset: 0.36, easing: "cubic-bezier(.4,0,.3,1)" },
      { ...k(X, Y, 0, 58, 0, -0.03, s1), offset: 0.42, easing: "cubic-bezier(.6,0,.4,1)" },
      { ...k(X, Y, 0, 60, 0, depth * 0.55, s1), offset: 0.5, easing: "cubic-bezier(.3,0,.7,1)" },
      { ...k(X, Y, 0, 60, 0, depth * 0.5, s1), offset: 0.54, easing: "cubic-bezier(.5,0,.3,1)" },
      { ...k(X, Y, 0, 60, 0, depth, s1), offset: 0.62, easing: "ease-in-out" },
      { ...k(X, Y, 0, 60, -7, depth, s1, 0.97), offset: 0.68, easing: "ease-in-out" },
      { ...k(X, Y, 0, 60, 3, depth, s1), offset: 0.73, easing: "cubic-bezier(.55,0,.3,1)" },
      { ...k(X, Y, 0, 60, 88, depth, s1, 0.82), offset: 0.92, easing: "ease-out" },
      { ...k(X, Y, 0, 60, 80, depth, s1, 0.86), offset: 1 },
    ], { duration: 3000, fill: "forwards" });
    keyAnim.onfinish = () => {
      if (!alive) return; click(); if (navigator.vibrate) navigator.vibrate(18); dm.classList.add("is-turned");
      later(() => { chime(); dm.classList.add("is-unlocked"); }, 350);
      later(() => openMain(false), 2300);
    };
  }
  keyBtn.addEventListener("pointerdown", (e) => { if (opening) return; drag = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, id: e.pointerId }; try { keyBtn.setPointerCapture(e.pointerId); } catch {} audio(); });
  keyBtn.addEventListener("pointermove", (e) => { if (!drag || opening) return; drag.dx = e.clientX - drag.x; drag.dy = e.clientY - drag.y; keyBtn.style.transform = `translate(${drag.dx}px,${drag.dy}px)`; });
  const release = () => { if (!drag || opening) return; const { dx, dy } = drag; drag = null; unlock(dx, dy); };
  keyBtn.addEventListener("pointerup", release); keyBtn.addEventListener("pointercancel", release);
  keyBtn.addEventListener("click", (e) => { if (e.detail === 0) unlock(); }); // clavier (Entrée / Espace)

  /* ---------- La date derrière la vitre embuée (obligatoire avant la suite) ---------- */
  let gated = !OPTS.noGate, wiped = false;
  const setGate = (on) => { gated = on; dm.classList.toggle("is-gated", on); };
  setGate(gated);
  const fog = q(".dm-pane canvas"), pane = q(".dm-pane");
  if (!gated) { fog.remove(); pane.classList.add("is-done"); q(".dm-fog-hint").hidden = true; }
  const viewImg = new Image(); viewImg.src = IMG("orangerie");
  let fx = null, fw = 0, fh = 0, strokes = 0, last = null, dist = 0;
  function paintFog() {
    if (!gated || wiped || !fog.isConnected) return;
    const r = pane.getBoundingClientRect(); if (!r.width) return;
    if (!viewImg.complete || !viewImg.naturalWidth) { viewImg.onload = () => alive && paintFog(); return; }
    const d = Math.min(2, devicePixelRatio || 1); fw = r.width; fh = r.height;
    fog.width = fw * d; fog.height = fh * d; fx = fog.getContext("2d", { willReadFrequently: true }); fx.setTransform(d, 0, 0, d, 0, 0);
    fx.globalCompositeOperation = "source-over";
    // Vue floue de l'orangerie à travers la buée
    const iw = viewImg.naturalWidth, ih = viewImg.naturalHeight, k = Math.max(fw / iw, fh / ih) * 1.6, sx = (fw - iw * k) / 2, sy = (fh - ih * k) * 0.55;
    fx.fillStyle = "#e9e1d2"; fx.fillRect(0, 0, fw, fh);
    if (typeof fx.filter === "string") { fx.filter = `blur(${Math.round(fw * 0.04)}px)`; fx.drawImage(viewImg, sx, sy, iw * k, ih * k); fx.filter = "none"; }
    else { fx.globalAlpha = 0.5; fx.drawImage(viewImg, sx, sy, iw * k, ih * k); fx.globalAlpha = 1; }
    fx.fillStyle = "rgba(246,243,236,.62)"; fx.fillRect(0, 0, fw, fh);
    for (let i = 0; i < fw * fh / 240; i++) { fx.fillStyle = `rgba(255,255,255,${Math.random() * 0.18})`; fx.fillRect(Math.random() * fw, Math.random() * fh, 1.3, 1.3); }
    for (let i = 0; i < 70; i++) { const x = Math.random() * fw, y = Math.random() * fh, rr = Math.random() * 3 + 0.8, g = fx.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 0, x, y, rr);
      g.addColorStop(0, "rgba(255,255,255,.8)"); g.addColorStop(0.6, "rgba(255,255,255,.2)"); g.addColorStop(1, "rgba(255,255,255,0)"); fx.fillStyle = g; fx.beginPath(); fx.arc(x, y, rr, 0, 7); fx.fill(); }
    // Un petit cœur déjà tracé du doigt dans la buée
    fx.globalCompositeOperation = "destination-out"; fx.lineWidth = 4; fx.lineCap = "round"; fx.strokeStyle = "#000";
    const hx = fw * 0.82, hy = fh * 0.2, hs = Math.min(fw, fh) * 0.05;
    fx.beginPath(); fx.moveTo(hx, hy + hs); fx.bezierCurveTo(hx - hs * 1.6, hy, hx - hs * 0.8, hy - hs * 1.1, hx, hy - hs * 0.3); fx.bezierCurveTo(hx + hs * 0.8, hy - hs * 1.1, hx + hs * 1.6, hy, hx, hy + hs); fx.stroke();
    fx.globalCompositeOperation = "source-over";
  }
  const R = () => Math.max(24, fw * 0.09);
  const dab = (x, y) => { const rr = R(), g = fx.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.55, "rgba(0,0,0,.92)"); g.addColorStop(1, "rgba(0,0,0,0)"); fx.fillStyle = g; fx.beginPath(); fx.arc(x, y, rr, 0, 7); fx.fill(); };
  const wipe = (p) => { if (!fx) return; fx.globalCompositeOperation = "destination-out"; const a = last || p, len = Math.hypot(p.x - a.x, p.y - a.y), n = Math.max(1, Math.ceil(len / (R() / 3)));
    for (let i = 1; i <= n; i++) dab(a.x + ((p.x - a.x) * i) / n, a.y + ((p.y - a.y) * i) / n);
    fx.globalCompositeOperation = "source-over"; dist += len; last = p; if (++strokes % 6 === 0) checkFog(); };
  function checkFog() {
    const im = fx.getImageData(0, 0, fog.width, fog.height).data; let clear = 0, n = 0;
    for (let i = 3; i < im.length; i += 4 * 24) { n++; if (im[i] < 60) clear++; }
    if (clear / n > 0.5 || dist > Math.max(fw, fh) * 8) revealDate();
  }
  function revealDate() {
    if (wiped) return; wiped = true; pane.classList.add("is-done"); later(() => fog.remove(), 1000);
    setGate(false); chime(); if (navigator.vibrate) navigator.vibrate(20); countUp(); observe(); load(DATE_I + 1); load(DATE_I + 2); later(buildThread, 30);
    q(".dm-fog-hint").textContent = M.fogDone;
    later(() => scrollBy({ top: innerHeight * 0.65, behavior: REDUCE ? "auto" : "smooth" }), 1400);
  }
  const pos = (e) => { const r = fog.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  let down = false;
  fog.addEventListener("pointerdown", (e) => { down = true; last = null; audio(); try { fog.setPointerCapture(e.pointerId); } catch {} wipe(pos(e)); });
  fog.addEventListener("pointermove", (e) => { if (down) wipe(pos(e)); });
  const up = () => { down = false; last = null; if (fx && !wiped) checkFog(); };
  fog.addEventListener("pointerup", up); fog.addEventListener("pointercancel", up);
  const onResize = () => { if (gated && !wiped && dm.classList.contains("is-open")) paintFog(); onScroll(); };
  addEventListener("resize", onResize);

  /* ---------- Compte à rebours ---------- */
  const remaining = () => { let s = Math.max(0, Math.floor((start - Date.now()) / 1000)); const dd = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; return [dd, hh, Math.floor(s / 60), s % 60]; };
  let counting = false;
  const setCount = (vals) => qa("[data-c]").forEach((b) => { const i = +b.dataset.c; b.textContent = isNaN(vals[i]) ? "–" : i === 0 ? vals[0] : String(vals[i]).padStart(2, "0"); });
  function countUp() { if (REDUCE) return setCount(remaining()); counting = true; const tg = remaining(), t0 = performance.now(); const st = (now) => { const k = Math.min(1, (now - t0) / 1600), e = 1 - Math.pow(1 - k, 3); setCount(tg.map((x) => Math.round(x * e))); if (k < 1 && alive) requestAnimationFrame(st); else counting = false; }; requestAnimationFrame(st); }
  setCount(remaining()); countI = setInterval(() => { if (!counting) setCount(remaining()); }, 1000);

  /* ---------- Dress code : tenues réalistes recolorées ---------- */
  const coupleEl = q(".dm-couple"), couple = coupleEl ? mountCouple(coupleEl, dc.couple) : null;
  let dcI = 0, dcManual = false;
  const setColor = (i) => { const c = colors[i]; if (!c || !couple) return; dcI = i; couple.set(c.men || c.hex, c.women || c.hex);
    q(".dm-cname").textContent = c.name; qa(".dm-sw button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === i))); };
  if (couple) {
    setColor(0);
    q(".dm-sw").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { dcManual = true; setColor(+b.dataset.i); } });
    if (colors.length > 1 && !REDUCE) dcTimer = setInterval(() => { if (!dcManual) setColor((dcI + 1) % colors.length); }, 2800);
  }

  /* ---------- Réponse ---------- */
  const card = q(".dm-rsvp"), form = q(".dm-form"); let attending = true, guests = 1;
  form.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]"); if (a) { attending = a.dataset.a === "yes"; form.querySelectorAll("[data-a]").forEach((b) => b.setAttribute("aria-pressed", String(b === a))); q(".dm-guests").hidden = !attending; return; }
    const g = e.target.closest("[data-g]"); if (g) { guests = clamp(guests + +g.dataset.g, 1, 20); form.querySelector("output").textContent = guests; }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); const inp = form.querySelector("input"), name = inp.value.trim();
    if (!name) { inp.focus(); inp.placeholder = T.c.nameMissing; return; }
    const msg = form.querySelector("textarea").value.trim(), btn = form.querySelector(".dm-submit"), err = form.querySelector(".dm-err");
    err.hidden = true;
    if (OPTS.onRsvp) { btn.disabled = true; btn.textContent = T.c.sending; try { await OPTS.onRsvp({ name, attending, guests: attending ? guests : 0, message: msg }); } catch (x) { btn.disabled = false; btn.textContent = M.send; err.hidden = false; return; } }
    const first = esc(name.split(" ")[0]);
    form.outerHTML = `<div class="dm-thanks"><small>${esc(T.c.thanks(first))}</small><h3>${attending ? M.yesTitle : M.noTitle}</h3><p>${esc(attending ? T.c.noted(String(guests)) : T.c.missYou)}</p>${OPTS.onRsvp ? "" : `<p class="dm-note">${esc(T.c.previewOnly)}</p>`}<a class="dm-btn" href="${calUrl}" target="_blank" rel="noopener noreferrer">${esc(T.c.addCal)}</a></div>`;
    card.classList.add("is-sent"); chime(); if (!REDUCE) petals();
  });
  // Pétales de lin à l'envoi de la réponse
  function petals() {
    const box = document.createElement("div"); box.className = "dm-petals"; box.setAttribute("aria-hidden", "true");
    box.innerHTML = Array.from({ length: 26 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 9) * 0.12}s;--r:${(i * 47) % 360}deg;--x:${((i * 29) % 60) - 30}px"></i>`).join("");
    dm.appendChild(box); later(() => box.remove(), 4200);
  }
  q(".dm-replay").addEventListener("click", () => showIntro());

  /* ---------- Démarrage ---------- */
  if (OPTS.skipIntro) { intro.hidden = true; openMain(true); }
  else showIntro();

  return {
    replay() { showIntro(); },
    destroy() {
      alive = false; couple?.destroy(); timers.forEach(clearTimeout); clearInterval(countI); clearInterval(dcTimer); cancelAnimationFrame(frame); keyAnim?.cancel();
      io && io.disconnect(); ro?.disconnect(); fro?.disconnect(); cancelAnimationFrame(tFrame); removeEventListener("scroll", onScroll); removeEventListener("resize", onResize);
      document.body.classList.remove("dm-locked"); music.destroy(); try { actx && actx.close(); } catch (e) {} root.innerHTML = "";
    },
  };
}
