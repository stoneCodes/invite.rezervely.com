// Modèle baby shower « Il était une fois » / « Once Upon a Time » (id livre, styles lv-).
// Un livre en toile de lin : on soulève la couverture, puis on tourne les pages. Chaque page porte une scène
// en papier découpé blanc (plans superposés, teintés par la palette, ombre entre les plans, lumière derrière)
// qui se déplie en relief quand la page se découvre.
// Même contrat que les autres modèles (InvitationData ; options onRsvp, skipIntro, noGate, music) :
// titre + photo → date derrière une tirette (obligatoire) → compte à rebours → programme → thème → lieu
// → liste de souhaits → pronostics (facultatif) → réponse, puis le livre se referme sur « … à suivre ».
// Pas de défilement du document : le geste vertical (doigt, molette) ou horizontal tourne la page ;
// le texte d'une page trop longue défile dans la page, et la page tourne une fois en bas.
import { esc, dateParts } from "../engine";
import { inviteDict } from "../../../lib/i18n/invite";
import { wishHtml } from "../wishlist";
import { createMusic, fxLevel } from "../music";

const IMG = "/img/livre-";
/** Couverture (livre-couverture.webp, 1024 × 1536) : livre, charnière et ovale en creux, en pixels de l'image. */
const COVER = { w: 1024, h: 1536, book: { x: 124, y: 247, w: 746, h: 1005 }, hinge: 160, oval: { x: 252, y: 352, w: 520, h: 720 } };
const LANG_LOCALE = { fr: "fr-FR", en: "en-GB" };
const ICON = {
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M4 6h16v14H4zM4 10h16M8 3v5M16 3v5"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.6 3 2.4-2.4-1.1-1.1-2.4 2.4-2.4-2.4-1.1 1.1 2.4 2.4-2.4 2.4 1.1 1.1 2.4-2.4 2.4 2.4 1.1-1.1z"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="m14.5 6-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="m9.5 6 6 6-6 6"/></svg>',
  swipe: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" d="M19 12H6m4-4-4 4 4 4"/></svg>',
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (k) => 1 - Math.pow(1 - k, 3);

/** Un plan de papier découpé. x, b, w : position (gauche, bas) et largeur en % de la scène ; d : profondeur 0 (fond) → 4 (devant).
 *  cls : classes en plus (lv-float = flotte doucement, lv-top = accroché en haut) ; tint : couleur imposée (nuages du thème). */
const L = (img, x, b, w, d, cls = "", tint = "") => `<span class="lv-l lv-d${d} ${cls}" style="left:${x}%;${cls.includes("lv-top") ? `top:${b}%` : `bottom:${b}%`};width:${w}%;--d:${d};--img:url(${IMG}${img}.webp)${tint ? `;--tint:${tint}` : ""}" aria-hidden="true"><img src="${IMG}${img}.webp" alt="" draggable="false" decoding="async"></span>`;
const HILLS = (from = 2) => L("colline-3", -18, 17, 136, from) + L("colline-2", -8, 6, 128, from + 1) + L("colline-1", -14, -6, 132, Math.min(4, from + 2));

export function mountLivre(root, data, OPTS = {}) {
  const D = data;
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LOW = (navigator.hardwareConcurrency || 8) <= 4;
  document.body.dataset.tpl = "livre";
  const T = inviteDict(D.lang), V = T.livre, C = T.c;
  const lang = D.lang === "en" ? "en" : "fr";
  const baby = D.baby || { sex: "surprise", due: "", guesses: false, palette: "ivoire" };
  const when = dateParts(D.dateISO, D.lang);
  const names = [D.partner1, D.partner2].map((x) => String(x || "").trim()).filter(Boolean);
  const two = names.length > 1;
  const namesHtml = names.map(esc).join(" <i>&amp;</i> ");
  const ini = names.map((s) => esc(([...s][0] || "").toUpperCase())).join("<i>&amp;</i>");
  const photo = typeof D.photoUrl === "string" && D.photoUrl ? D.photoUrl : null;
  let dueTxt = "";
  if (/^\d{4}-\d{2}$/.test(baby.due || "")) {
    try { dueTxt = V.due(baby.sex, new Intl.DateTimeFormat(LANG_LOCALE[lang], { month: "long", timeZone: "UTC" }).format(new Date(`${baby.due}-15T12:00:00Z`))); } catch (e) {}
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
  const head = (k, t) => `<header class="lv-head"><small>${k}</small><h2>${t}</h2></header>`;

  /* ---------- Les pages : une scène en papier découpé + le texte ---------- */
  const pages = [];
  const page = (id, scene, text, cls = "") => pages.push({ id, scene, text, cls });

  const medal = `<span class="lv-medal" aria-hidden="${photo ? "false" : "true"}" style="--d:2">${photo ? `<img src="${esc(photo)}" alt="${esc(V.photoAlt)}">` : `<b>${ini}</b>`}</span>`;
  page("titre",
    L("croissant", 72, 7, 15, 0, "lv-top lv-float") + L("etoile-1", 10, 9, 7, 0, "lv-top lv-float") + L("etoile-3", 26, 22, 5, 0, "lv-top lv-float") + L("etoile-5", 58, 7, 5, 0, "lv-top lv-float")
      + L("nuage-3", 4, 52, 30, 1, "lv-float") + L("nuage-2", 68, 40, 34, 1, "lv-float") + medal + HILLS(2),
    `<p class="lv-once">${V.once}</p><h1 class="lv-names">${namesHtml}</h1>
     <p class="lv-expect">${esc(V.expect(two, baby.sex))}</p>
     ${dueTxt ? `<p class="lv-due">${esc(dueTxt)}</p>` : ""}
     ${D.intro ? `<p class="lv-intro">${esc(D.intro)}</p>` : ""}
     <p class="lv-swipe">${ICON.swipe}<span>${V.turn}</span></p>`, "is-title");

  page("date",
    L("etoile-2", 8, 8, 6, 0, "lv-top lv-float") + L("etoile-4", 30, 18, 4.5, 0, "lv-top lv-float") + L("etoile-6", 84, 12, 6, 0, "lv-top lv-float") + L("etoile-7", 64, 26, 4, 0, "lv-top lv-float")
      + `<span class="lv-moon" style="--d:1" aria-hidden="true">${L("lune", 0, 0, 100, 1)}</span>` + L("nuage-5", 64, 56, 30, 1, "lv-float") + HILLS(2),
    `${head(V.dateEyebrow, V.dateTitle)}
     <div class="lv-date" aria-live="polite"><b>${when ? esc(when.day) : ""}</b><span>${when ? esc(`${when.month} ${when.year}`) : ""}</span><em>${when ? esc(when.full) : ""}</em></div>
     <div class="lv-pull" role="slider" tabindex="0" aria-label="${esc(V.pullAria)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
       <span class="lv-pull-track" aria-hidden="true"></span>
       <span class="lv-pull-tab"><span>${V.pull}</span>${ICON.next}</span>
     </div>
     <p class="lv-pull-note">${V.gate}</p>`, "is-date");

  page("count",
    L("nuage-1", -6, 58, 34, 0, "lv-float") + L("nuage-4", 70, 62, 32, 0, "lv-float")
      + `<span class="lv-stars" style="--d:2">${["etoile-1", "etoile-3", "etoile-5", "etoile-7"].map((s, i) => `<span class="lv-star">${L(s, 0, 0, 100, 2, "lv-float")}<b data-c="${i}">0</b><small>${[V.days, V.hours, V.min, V.sec][i]}</small></span>`).join("")}</span>`
      + L("colline-2", -10, -2, 130, 3) + L("colline-1", -16, -12, 134, 4),
    `${head(V.countdown, V.countTitle)}${when ? `<p class="lv-sub">${esc(when.full)}</p>` : ""}`);

  if (programme.length) page("programme",
    L("fanions-1", -4, -6, 108, 0, "lv-top") + L("nuage-3", 70, 46, 26, 0, "lv-float") + L("cypres", 10, 14, 9, 1) + L("arbre-rond", 74, 12, 22, 1) + L("colline-3", -18, 6, 136, 2) + L("cypres", 84, 4, 7, 3) + L("colline-1", -10, -10, 128, 4),
    `${head(V.program, V.program)}<ol class="lv-prog">${programme.map((x, i) => `<li><span class="lv-flag" aria-hidden="true">${i + 1}</span><div><time>${esc(x.t)}</time><h3>${esc(x.title)}</h3>${x.note ? `<p>${esc(x.note)}</p>` : ""}</div></li>`).join("")}</ol>`, "is-prog");

  if (showTheme) {
    const spots = [[4, 56, 34], [56, 60, 38], [24, 30, 36], [66, 26, 30]];
    const clouds = colors.length ? colors.map((c, i) => L(`nuage-${[2, 1, 5, 3][i]}`, spots[i][0], spots[i][1], spots[i][2], 1 + (i % 2), "lv-float lv-tinted", esc(c.women || c.hex))).join("")
      : L("nuage-2", 8, 54, 34, 1, "lv-float") + L("nuage-1", 54, 40, 40, 2, "lv-float");
    page("theme", L("etoile-2", 46, 8, 5, 0, "lv-top lv-float") + clouds + L("colline-2", -10, -4, 128, 3) + L("colline-1", -16, -14, 134, 4),
      `${head(V.theme, dc.title ? esc(dc.title) : V.colors)}${dc.note ? `<p class="lv-sub">${esc(dc.note)}</p>` : ""}
       ${colors.length ? `<ul class="lv-sw">${colors.map((c) => `<li><span style="--sw:${esc(c.women || c.hex)}${c.men && c.men !== c.women ? `;--sw2:${esc(c.men)}` : ""}"></span>${esc(c.name)}</li>`).join("")}</ul>` : ""}`);
  }

  if (venueQ) page("lieu",
    L("nuage-4", 58, 64, 30, 0, "lv-float") + L("oiseau-2", 12, 70, 11, 0, "lv-float") + L("colline-3", -18, 14, 136, 1) + L("saule", 2, 10, 26, 1) + L("maison", 30, 8, 40, 2) + L("arbre-rond", 74, 10, 22, 2) + L("colline-1", -10, -12, 128, 3) + L("fleurs", 66, -6, 34, 4),
    `${head(V.venue, esc(D.venue?.name || ""))}<p class="lv-addr">${esc(D.venue?.address || "")}</p>
     <div class="lv-btns"><a class="lv-btn" href="${mapUrl}" target="_blank" rel="noopener noreferrer">${ICON.pin}${V.route}</a><a class="lv-btn ghost" href="${calUrl}" target="_blank" rel="noopener noreferrer">${ICON.cal}${esc(C.addCal)}</a></div>`);

  if (wish) page("souhaits",
    L("nuage-2", -4, 58, 32, 0, "lv-float") + L("montgolfiere", 56, 22, 24, 1, "lv-float lv-drift") + L("oiseau-1", 14, 46, 12, 1, "lv-float") + L("oiseau-3", 30, 62, 9, 0, "lv-float") + L("nuage-5", 6, 22, 30, 2, "lv-float") + L("colline-2", -10, -4, 128, 3) + L("colline-1", -16, -14, 134, 4),
    `${head(T.wish.eyebrow, T.wish.title)}${wish}`);

  if (baby.guesses) page("pronostics",
    L("mobile", 56, -4, 30, 0, "lv-top lv-swing") + L("etoile-4", 10, 14, 6, 0, "lv-top lv-float") + L("etoile-6", 30, 30, 4.5, 0, "lv-top lv-float") + L("colline-3", -18, 4, 136, 1) + L("berceau", 12, 6, 44, 2) + L("colline-1", -14, -14, 132, 3),
    `${head(V.guessEyebrow, V.guessTitle)}<p class="lv-sub">${V.guessHelp}</p>
     <div class="lv-guess">
       <label>${V.gName}<input name="gname" maxlength="40" placeholder="${esc(V.gNamePh)}" autocomplete="off"></label>
       <label>${V.gDate}<input name="gdate" type="date"></label>
       <label>${V.gWeight}<input name="gweight" maxlength="20" placeholder="${esc(V.gWeightPh)}" autocomplete="off"></label>
     </div>`);

  page("reponse",
    L("fanions-2", -4, -6, 108, 0, "lv-top") + L("oiseau-4", 70, 50, 10, 0, "lv-float") + L("oiseau-1", 82, 64, 8, 1, "lv-float") + L("colline-3", -18, 8, 136, 1) + L("arbre-rond", 4, 8, 20, 2) + L("colline-2", -10, -4, 128, 3) + L("fleurs", 34, -8, 44, 4),
    `<div class="lv-rsvp">${head(V.rsvpEyebrow, V.rsvp)}${D.rsvpBy ? `<p class="lv-sub">${esc(D.rsvpBy)}</p>` : ""}
     <form class="lv-form" novalidate>
       <div class="lv-choice" role="group" aria-label="${esc(V.rsvp)}"><button type="button" data-a="yes" aria-pressed="true">${V.yes}</button><button type="button" data-a="no" aria-pressed="false">${V.no}</button></div>
       <label>${V.yourName}<input name="name" autocomplete="name" placeholder="${esc(C.namePh)}" maxlength="120"></label>
       <label class="lv-guests">${V.guests}<span><button type="button" data-g="-1" aria-label="${V.less}">−</button><output>1</output><button type="button" data-g="1" aria-label="${V.more}">+</button></span></label>
       <label>${V.note}<textarea name="msg" rows="3" maxlength="900" placeholder="${esc(V.notePh)}"></textarea></label>
       <p class="lv-err" hidden>${V.error}</p>
       <button class="lv-btn lv-send" type="submit">${V.send}</button>
     </form>
     <button class="lv-replay" type="button">${V.replay}</button></div>`, "is-rsvp");

  const N = pages.length;
  const DATE = pages.findIndex((p) => p.id === "date");

  /* ---------- Balisage ---------- */
  const leaf = (p, i) => `<article class="lv-leaf ${p.cls}" data-i="${i}" aria-label="${esc(V.pageAria(i + 1, N))}">
    <div class="lv-face lv-front">
      <div class="lv-scene" aria-hidden="${p.id === "titre" && photo ? "false" : "true"}"><span class="lv-glow" aria-hidden="true"></span>${p.scene}</div>
      <div class="lv-text">${p.text}</div>
      <span class="lv-folio" aria-hidden="true">${i + 1}</span>
    </div>
    <div class="lv-crease" aria-hidden="true"><i></i></div>
    <div class="lv-flap" aria-hidden="true"><div class="lv-face lv-back"><span class="lv-ghost"></span><span class="lv-folio">${i + 1}</span></div><div class="lv-flight"><i></i></div></div>
  </article>`;

  const ov = COVER.oval, bk = COVER.book;
  const pct = (v, of) => `${(v / of) * 100}%`;
  root.innerHTML = `<div class="lv" data-pal="${esc(baby.palette || "ivoire")}">
    <section class="lv-cover" aria-label="${esc(V.once)}">
      <div class="lv-cv">
        <img class="lv-cv-bg" src="${IMG}couverture.webp" alt="" decoding="async">
        <div class="lv-under" style="left:${pct(bk.x, COVER.w)};top:${pct(bk.y, COVER.h)};width:${pct(bk.w, COVER.w)};height:${pct(bk.h, COVER.h)}"><span></span></div>
        <button type="button" class="lv-lid" aria-label="${esc(V.open)}" style="left:${pct(bk.x, COVER.w)};top:${pct(bk.y, COVER.h)};width:${pct(bk.w, COVER.w)};height:${pct(bk.h, COVER.h)};--hinge:${pct(COVER.hinge - bk.x, bk.w)}">
          <span class="lv-lid-front"><img src="${IMG}couverture.webp" alt="" style="width:${pct(COVER.w, bk.w)};left:${pct(-bk.x, bk.w)};top:${pct(-bk.y, bk.h)}">
            <span class="lv-oval" style="left:${pct(ov.x - bk.x, bk.w)};top:${pct(ov.y - bk.y, bk.h)};width:${pct(ov.w, bk.w)};height:${pct(ov.h, bk.h)}">
              <em class="lv-oval-once">${V.once}</em><b>${namesHtml}</b><small>${esc(V.expect(two, baby.sex))}</small><em class="lv-oval-end">${V.end}</em>
            </span></span>
          <span class="lv-lid-back"></span>
        </button>
      </div>
      <p class="lv-hint"><span class="lv-hint-open">${V.hint}</span><span class="lv-hint-end">${V.reread}</span></p>
    </section>
    <section class="lv-read" aria-roledescription="livre">
      <div class="lv-room" aria-hidden="true"></div>
      <div class="lv-stage">
        <div class="lv-book">
          <div class="lv-board" aria-hidden="true"><span class="lv-endpaper"><em>${V.once}</em><b>${namesHtml}</b></span></div>
          ${pages.map(leaf).join("")}
        </div>
        <nav class="lv-nav">
          <button type="button" class="lv-prev" aria-label="${V.prev}">${ICON.prev}</button>
          <span class="lv-ribbon" aria-live="polite"><span class="lv-num">1 / ${N}</span></span>
          <button type="button" class="lv-next" aria-label="${V.next}">${ICON.next}</button>
        </nav>
      </div>
    </section>
    <button type="button" class="lv-snd" aria-label="${V.mute}">${ICON.sound}</button>
  </div>`;

  const lv = q(".lv"), cover = q(".lv-cover"), lid = q(".lv-lid"), read = q(".lv-read"), stage = q(".lv-stage");
  const leaves = qa(".lv-leaf");
  if (REDUCE) lv.classList.add("lv-still");
  if (LOW) lv.classList.add("lv-low"); // téléphone peu puissant : pas d'ombre floue sous le rabat
  document.body.classList.add("lv-locked");

  /* ---------- Son : musique de la bibliothèque + froissement de page et carillon (synthétisés) ---------- */
  let actx = null, master = null, soundOn = true, playing = false;
  const music = createMusic(OPTS.music);
  const audio = () => { music.unlock(); try { if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.gain.value = 0.5 * fxLevel(OPTS.music); master.connect(actx.destination); } actx.resume(); } catch (e) {} return actx; };
  const rustle = () => {
    if (!actx || !soundOn) return;
    const t = actx.currentTime, len = 0.32, buf = actx.createBuffer(1, Math.floor(actx.sampleRate * len), actx.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) { const k = i / ch.length; ch[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * k) * (0.6 + 0.4 * Math.sin(k * 40)); }
    const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
    src.buffer = buf; f.type = "bandpass"; f.frequency.value = 2400; f.Q.value = 0.7; g.gain.value = 0.16;
    src.connect(f).connect(g).connect(master); src.start(t);
  };
  const chime = () => {
    if (!actx || !soundOn) return; const t = actx.currentTime;
    [1047, 1319, 1568, 2093].forEach((fr, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = "sine"; o.frequency.value = fr; g.gain.setValueAtTime(0, t + i * 0.1); g.gain.linearRampToValueAtTime(0.06, t + i * 0.1 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 1.6); o.connect(g).connect(master); o.start(t + i * 0.1); o.stop(t + i * 0.1 + 1.7); });
  };
  const startMusic = () => { if (soundOn && alive) { playing = true; music.play(); } };
  const sndBtn = q(".lv-snd");
  sndBtn.addEventListener("click", () => {
    soundOn = !soundOn; sndBtn.innerHTML = soundOn ? ICON.sound : ICON.mute; sndBtn.setAttribute("aria-label", soundOn ? V.mute : V.unmute);
    if (soundOn) { audio(); if (lv.classList.contains("is-reading")) startMusic(); } else { music.pause(); playing = false; }
  });

  /* ---------- Position dans le livre : pos = page courante + avancement du tour (0..N-1) ---------- */
  let pos = 0, anim = 0, pulled = !!OPTS.noGate, openRise = 1;
  /* Tour de page « papier » : la page se plie le long d'une ligne qui suit le coin attrapé (en bas, ou en haut si
     on la prend par le haut). Devant : la page découpée de ce côté de la pliure ; le rabat : le dos de la page,
     reflété par rapport à la pliure, avec un reflet clair sur le pli ; dessous : l'ombre du pli sur la page suivante. */
  let corner = "b", bendY = 0, size = null;
  const measure = () => { const b = q(".lv-book"); return (size = { w: b.offsetWidth || 1, h: b.offsetHeight || 1 }); };
  const RECT = (w, h) => [[0, 0], [w, 0], [w, h], [0, h]];
  /** Partie du polygone où sg·(nx·x + ny·y − c) ≥ 0 (une seule coupe, Sutherland-Hodgman). */
  const cut = (pts, nx, ny, c, sg) => {
    const out = [], f = (p) => sg * (nx * p[0] + ny * p[1] - c);
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length], fa = f(a), fb = f(b);
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    });
    return out;
  };
  const poly = (pts) => (pts.length < 3 ? "polygon(0 0,0 0,0 0)" : `polygon(${pts.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(",")})`);
  function curl(el, k) {
    const f = el._f || (el._f = { front: el.querySelector(".lv-front"), under: el.querySelector(".lv-crease"), ui: el.querySelector(".lv-crease i"), flap: el.querySelector(".lv-flap"), back: el.querySelector(".lv-back"), light: el.querySelector(".lv-flight"), li: el.querySelector(".lv-flight i") });
    el.classList.toggle("is-turning", k > 0.0005 && k < 0.9995);
    if (k <= 0.0005) { if (f.state !== 0) { f.state = 0; f.front.style.clipPath = ""; f.front.style.visibility = ""; f.flap.style.visibility = "hidden"; f.under.style.visibility = "hidden"; } return; }
    const W = (size || measure()).w, H = size.h;
    if (k >= 0.9995) {
      if (f.state !== 1) { f.state = 1; f.front.style.visibility = "hidden"; f.under.style.visibility = "hidden"; f.flap.style.visibility = "visible"; f.light.style.visibility = "hidden"; f.back.style.clipPath = ""; f.back.style.transform = `translateX(${-W}px)`; }
      return;
    }
    f.state = 2;
    // Le coin attrapé (C) va en P : il part vers la reliure en se soulevant, puis se repose de l'autre côté.
    const top = corner === "t", cx = W, cy = top ? 0 : H, s = Math.sin(Math.PI * k);
    let px = W * (1 - 2 * k), py = cy + H * 0.2 * Math.pow(s, 0.6) * (top ? 1 : -1) + bendY * s;
    // Le papier ne s'étire pas : le coin reste à une page de la reliure (des deux bouts).
    const lim = (ax, ay, r) => { const dx = px - ax, dy = py - ay, d = Math.hypot(dx, dy); if (d > r) { px = ax + (dx * r) / d; py = ay + (dy * r) / d; } };
    lim(0, cy, W); lim(0, H - cy, Math.hypot(W, H));
    const nx = cx - px, ny = cy - py, nn = Math.hypot(nx, ny) || 1e-6;
    const c = (cx * cx + cy * cy - px * px - py * py) / 2;
    const rect = RECT(W, H), front = cut(rect, nx, ny, c, -1), lifted = cut(rect, nx, ny, c, 1);
    // Pliure : u·X = d (u dirigé vers le coin). Reflet R(X) = X − 2(u·X − d)u, composé avec le miroir du dos (x → W − x).
    const ux = nx / nn, uy = ny / nn, d = c / nn;
    const a = 1 - 2 * ux * ux, b = -2 * ux * uy, e = 1 - 2 * uy * uy, tx = 2 * d * ux, ty = 2 * d * uy;
    const refl = (p) => { const t = 2 * (ux * p[0] + uy * p[1] - d); return [p[0] - t * ux, p[1] - t * uy]; };
    f.front.style.visibility = ""; f.front.style.clipPath = poly(front);
    f.flap.style.visibility = "visible"; f.under.style.visibility = "visible"; f.light.style.visibility = "visible";
    f.back.style.transform = `matrix(${-a},${-b},${b},${e},${a * W + tx},${b * W + ty})`;
    f.back.style.clipPath = poly(lifted.map((p) => [W - p[0], p[1]]));
    f.light.style.clipPath = poly(lifted.map(refl));
    f.under.style.clipPath = poly(lifted);
    // Ombre du pli sur la page suivante (côté coin) et reflet sur le rabat (côté opposé), perpendiculaires à la pliure.
    const fx = (cx + px) / 2, fy = (cy + py) / 2, ang = Math.atan2(uy, ux), depth = nn / 2;
    f.ui.style.width = `${Math.min(W * 0.5, depth * 0.9 + 14).toFixed(1)}px`;
    f.ui.style.transform = `translate(${fx.toFixed(1)}px,${fy.toFixed(1)}px) rotate(${ang.toFixed(4)}rad) translateY(-50%)`;
    f.ui.style.opacity = Math.min(1, s * 1.8).toFixed(3);
    f.li.style.width = `${Math.max(24, depth).toFixed(1)}px`;
    f.li.style.transform = `translate(${fx.toFixed(1)}px,${fy.toFixed(1)}px) rotate(${(ang + Math.PI).toFixed(4)}rad) translateY(-50%)`;
  }
  const maxPos = () => (pulled || DATE < 0 ? N - 1 : DATE);
  function render() {
    const base = Math.floor(pos + 1e-4);
    leaves.forEach((el, i) => {
      const k = clamp(pos - i, 0, 1);
      const near = i >= base - 1 && i <= base + 2;
      el.classList.toggle("is-off", !near);
      if (!near) return;
      el.style.setProperty("--k", k.toFixed(4));
      // Page suivante : la scène se déplie pendant que la page du dessus se soulève
      const u = clamp(pos - (i - 1), 0, 1);
      el.style.setProperty("--u", (i === 0 ? 1 : u).toFixed(4));
      const rise = i === 0 ? openRise : i <= base ? 1 : clamp(u * 1.25, 0, 1);
      el.style.setProperty("--rise", (REDUCE ? 1 : rise).toFixed(4));
      el.style.zIndex = !REDUCE && k > 0.0005 && k < 0.9995 ? "300" : k < 0.5 ? String(200 - i) : String(100 + i);
      if (!REDUCE) curl(el, k);
      el.classList.toggle("is-turned", k >= 0.5);
      el.classList.toggle("is-done", k >= 0.999);
      const cur = i === Math.round(pos);
      el.setAttribute("aria-hidden", String(!cur));
      el.inert = !cur;
    });
    const cur = Math.round(pos);
    q(".lv-num").textContent = V.page(cur + 1, N);
    q(".lv-ribbon").setAttribute("aria-label", V.pageAria(cur + 1, N));
    q(".lv-prev").disabled = cur <= 0;
    q(".lv-next").disabled = cur >= N - 1;
    lv.classList.toggle("is-gated", !pulled && cur >= DATE && DATE >= 0);
    lv.classList.toggle("at-start", pos < 0.5);
  }
  function goTo(target, dur) {
    cancelAnimationFrame(anim);
    target = clamp(target, 0, maxPos());
    const from = pos, dist = Math.abs(target - from);
    if (REDUCE || dist < 0.001) { pos = target; render(); settle(); return; }
    const ms = dur ?? Math.min(1100, 260 + dist * 720);
    if (dist > 0.3) rustle();
    const t0 = performance.now(), b0 = bendY;
    const step = (now) => { const k = Math.min(1, (now - t0) / ms); pos = from + (target - from) * ease(k); bendY = b0 * (1 - ease(k)); render(); if (k < 1 && alive) anim = requestAnimationFrame(step); else { anim = 0; settle(); } };
    anim = requestAnimationFrame(step);
  }
  /** Fin d'un tour : le texte de la nouvelle page repart du haut, et on prévient si la date bloque la suite. */
  function settle() { const el = leaves[Math.round(pos)]; const tx = el && el.querySelector(".lv-text"); if (tx && Math.abs(pos - Math.round(pos)) < 0.001 && tx.dataset.seen !== "1") { tx.scrollTop = 0; tx.dataset.seen = "1"; } }
  const go = (dir) => {
    const cur = Math.round(pos);
    if (dir > 0 && cur >= maxPos()) { nudgeGate(); return; }
    if (!anim) { corner = "b"; bendY = 0; }
    goTo(cur + dir);
  };
  function nudgeGate() {
    if (pulled || DATE < 0) return;
    const pl = leaves[DATE].querySelector(".lv-pull");
    pl.classList.remove("is-nudge"); void pl.offsetWidth; pl.classList.add("is-nudge");
    if (navigator.vibrate) navigator.vibrate(12);
  }
  q(".lv-prev").addEventListener("click", () => go(-1));
  q(".lv-next").addEventListener("click", () => go(1));

  /* ---------- Gestes : doigt (vertical ou horizontal), souris, molette, clavier ---------- */
  const W = () => stage.querySelector(".lv-book").getBoundingClientRect().width || innerWidth;
  const interactive = (t) => t.closest("input,textarea,select,button,a,label,.lv-pull,.wl");
  let tg = null;
  // Coin attrapé : celui du haut si on prend la page par le haut, sinon celui du bas.
  const grab = (y) => { const r = q(".lv-book").getBoundingClientRect(); measure(); corner = y - r.top < r.height * 0.42 ? "t" : "b"; bendY = 0; };
  const onResize = () => { size = null; leaves.forEach((el) => { if (el._f) el._f.state = -1; }); render(); };
  addEventListener("resize", onResize);
  const scrollerOf = (t) => { const s = t.closest(".lv-text"); return s && s.scrollHeight > s.clientHeight + 2 ? s : null; };
  function dragTo(d, dy = 0) {
    bendY = clamp(dy, -(size || measure()).h * 0.3, size.h * 0.3);
    // d > 0 : vers la suite. Au-delà de la page autorisée, la page résiste (élastique).
    let p = tg.base + d / (W() * 0.9);
    const hi = maxPos();
    if (p > hi) p = hi + Math.min(0.12, (p - hi) * 0.25);
    pos = clamp(p, 0, N - 1); cancelAnimationFrame(anim); render();
  }
  function release(vel) {
    const delta = pos - tg.base;
    const blocked = Math.round(tg.base) >= maxPos() && delta > 0;
    let target = tg.base;
    if (!blocked && (delta > 0.22 || vel > 0.45)) target = tg.base + 1;
    else if (delta < -0.22 || vel < -0.45) target = tg.base - 1;
    if (blocked && delta > 0.05) nudgeGate();
    tg = null; goTo(Math.round(target));
  }
  const onTouchStart = (e) => {
    if (e.touches.length !== 1 || anim) { tg = null; return; }
    const t = e.touches[0], sc = scrollerOf(e.target);
    grab(t.clientY);
    tg = { x: t.clientX, y: t.clientY, t: performance.now(), base: Math.round(pos), sc, top: !sc || sc.scrollTop <= 1, bottom: !sc || sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2, mode: null, ui: !!interactive(e.target), last: 0, lt: 0 };
  };
  const onTouchMove = (e) => {
    if (!tg) return;
    const t = e.touches[0], dx = t.clientX - tg.x, dy = t.clientY - tg.y;
    if (!tg.mode) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) { if (!tg.sc && e.cancelable) e.preventDefault(); return; }
      if (Math.abs(dx) > Math.abs(dy) * 1.15) tg.mode = "h";
      else if ((dy < 0 && tg.bottom) || (dy > 0 && tg.top)) tg.mode = "v";
      else { tg.mode = "native"; }
      if (tg.ui && tg.mode !== "native" && Math.hypot(dx, dy) < 14) { tg.mode = null; return; }
    }
    if (tg.mode === "native") return;
    if (e.cancelable) e.preventDefault();
    const d = tg.mode === "h" ? -dx : -dy;
    const now = performance.now(); tg.vel = (d - tg.last) / Math.max(1, now - tg.lt) ; tg.last = d; tg.lt = now;
    dragTo(d, dy);
  };
  const onTouchEnd = () => { if (!tg) return; if (!tg.mode || tg.mode === "native") { tg = null; return; } release((tg.vel || 0) * 1.4); };
  stage.addEventListener("touchstart", onTouchStart, { passive: true });
  stage.addEventListener("touchmove", onTouchMove, { passive: false });
  stage.addEventListener("touchend", onTouchEnd); stage.addEventListener("touchcancel", onTouchEnd);
  // Souris : on attrape la page et on la tourne (glisser horizontal)
  stage.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" || e.button !== 0 || interactive(e.target) || anim) return;
    grab(e.clientY);
    tg = { x: e.clientX, y: e.clientY, base: Math.round(pos), mode: null, last: 0, lt: performance.now() };
    const mv = (ev) => { if (!tg) return; const dx = ev.clientX - tg.x; if (!tg.mode && Math.abs(dx) < 6) return; tg.mode = "h"; const now = performance.now(); tg.vel = (-dx - tg.last) / Math.max(1, now - tg.lt); tg.last = -dx; tg.lt = now; dragTo(-dx, ev.clientY - tg.y); };
    const upm = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", upm); if (tg && tg.mode) release((tg.vel || 0) * 1.4); else tg = null; };
    addEventListener("pointermove", mv); addEventListener("pointerup", upm);
  });
  // Molette / pavé tactile : le texte défile d'abord, puis la page tourne
  let wheelAcc = 0, wheelLock = 0, wheelT = 0;
  const onWheel = (e) => {
    if (!lv.classList.contains("is-reading")) return;
    const sc = scrollerOf(e.target), dy = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (sc && ((dy > 0 && sc.scrollTop + sc.clientHeight < sc.scrollHeight - 2) || (dy < 0 && sc.scrollTop > 1))) { wheelAcc = 0; return; }
    e.preventDefault();
    const now = performance.now();
    if (now < wheelLock || anim) return;
    if (now - wheelT > 260) wheelAcc = 0;
    wheelT = now; wheelAcc += dy;
    if (Math.abs(wheelAcc) > 42) { const dir = Math.sign(wheelAcc); wheelAcc = 0; wheelLock = now + 650; go(dir); }
  };
  stage.addEventListener("wheel", onWheel, { passive: false });
  const onKey = (e) => {
    if (!lv.classList.contains("is-reading") || e.target.closest?.("input,textarea,select")) return;
    if (["ArrowRight", "PageDown"].includes(e.key)) { e.preventDefault(); go(1); }
    else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(-1); }
  };
  addEventListener("keydown", onKey);

  /* ---------- Profondeur : inclinaison du téléphone (si permise sans demande) ou position de la souris ---------- */
  let tiltX = 0, tiltY = 0, tiltF = 0;
  const applyTilt = () => { tiltF = 0; stage.style.setProperty("--px", tiltX.toFixed(3)); stage.style.setProperty("--py", tiltY.toFixed(3)); };
  const onOrient = (e) => { if (e.gamma == null) return; tiltX = clamp(e.gamma / 25, -1, 1); tiltY = clamp((e.beta - 45) / 30, -1, 1); if (!tiltF) tiltF = requestAnimationFrame(applyTilt); };
  const onMouse = (e) => { if (e.pointerType !== "mouse") return; tiltX = clamp((e.clientX / innerWidth - 0.5) * 2, -1, 1); tiltY = clamp((e.clientY / innerHeight - 0.5) * 2, -1, 1); if (!tiltF) tiltF = requestAnimationFrame(applyTilt); };
  if (!REDUCE && !LOW) {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission !== "function") addEventListener("deviceorientation", onOrient);
    addEventListener("pointermove", onMouse);
  }

  /* ---------- La tirette : on la fait glisser, la lune se lève et la date apparaît ---------- */
  const pull = DATE >= 0 ? leaves[DATE].querySelector(".lv-pull") : null;
  const dateLeaf = DATE >= 0 ? leaves[DATE] : null;
  const setPull = (k) => { dateLeaf.style.setProperty("--pull", k.toFixed(3)); pull.setAttribute("aria-valuenow", String(Math.round(k * 100))); };
  function revealDate(instant) {
    if (pulled && !instant) return;
    pulled = true; setPull(1); dateLeaf.classList.add("is-pulled"); pull.setAttribute("aria-valuetext", V.pulled);
    dateLeaf.querySelector(".lv-pull-note").textContent = V.pulled;
    if (!instant) { audio(); chime(); if (navigator.vibrate) navigator.vibrate(18); countUp(); }
    render();
  }
  if (pull) {
    if (pulled) revealDate(true); else setPull(0);
    let pd = null;
    const len = () => pull.getBoundingClientRect().width - pull.querySelector(".lv-pull-tab").getBoundingClientRect().width;
    pull.addEventListener("pointerdown", (e) => { if (pulled) return; e.stopPropagation(); audio(); pd = { x: e.clientX, k: parseFloat(dateLeaf.style.getPropertyValue("--pull")) || 0 }; pull.setPointerCapture?.(e.pointerId); pull.classList.add("is-drag"); });
    pull.addEventListener("pointermove", (e) => { if (!pd) return; const k = clamp(pd.k + (e.clientX - pd.x) / Math.max(60, len()), 0, 1); setPull(k); if (k > 0.92) { pd = null; pull.classList.remove("is-drag"); revealDate(false); } });
    const pup = () => { if (!pd) return; pd = null; pull.classList.remove("is-drag"); if (!pulled) { const k0 = parseFloat(dateLeaf.style.getPropertyValue("--pull")) || 0, t0 = performance.now(); const back = (now) => { const k = Math.min(1, (now - t0) / 320); setPull(k0 * (1 - ease(k))); if (k < 1 && alive && !pulled) requestAnimationFrame(back); }; requestAnimationFrame(back); } };
    pull.addEventListener("pointerup", pup); pull.addEventListener("pointercancel", pup);
    pull.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    pull.addEventListener("touchmove", (e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); }, { passive: false });
    pull.addEventListener("keydown", (e) => { if (["Enter", " ", "ArrowRight"].includes(e.key)) { e.preventDefault(); revealDate(false); } });
    pull.addEventListener("click", () => { if (!pulled && !pull.classList.contains("is-drag")) { /* un simple toucher ne suffit pas : on montre le geste */ pull.classList.remove("is-nudge"); void pull.offsetWidth; pull.classList.add("is-nudge"); } });
  }

  /* ---------- Compte à rebours ---------- */
  const remaining = () => { let s = Math.max(0, Math.floor((start - Date.now()) / 1000)); const dd = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; return [dd, hh, Math.floor(s / 60), s % 60]; };
  let counting = false;
  const setCount = (vals) => qa("[data-c]").forEach((b) => { const i = +b.dataset.c; b.textContent = isNaN(vals[i]) ? "–" : i === 0 ? vals[0] : String(vals[i]).padStart(2, "0"); });
  function countUp() { if (REDUCE) return setCount(remaining()); counting = true; const tgt = remaining(), t0 = performance.now(); const st = (now) => { const k = Math.min(1, (now - t0) / 1600); setCount(tgt.map((x) => Math.round(x * ease(k)))); if (k < 1 && alive) requestAnimationFrame(st); else counting = false; }; requestAnimationFrame(st); }
  setCount(remaining()); countI = setInterval(() => { if (!counting) setCount(remaining()); }, 1000);

  /* ---------- Ouverture : la couverture se soulève, la lumière s'allume, les plans se lèvent ---------- */
  let opening = false;
  function showCover(ending) {
    cancelAnimationFrame(anim); opening = false;
    cover.hidden = false; cover.classList.remove("is-out");
    lv.classList.toggle("is-end", !!ending);
    if (ending && !REDUCE) {
      // La couverture revient se poser sur le livre ouvert
      lv.classList.add("is-opening", "is-open-lid"); lv.classList.remove("is-reading");
      later(() => lv.classList.remove("is-open-lid"), 80);
      later(() => lv.classList.remove("is-opening"), 1400);
    } else lv.classList.remove("is-reading", "is-opening", "is-open-lid");
    if (!ending) { music.pause(); playing = false; }
  }
  function riseFirst(instant) {
    if (instant || REDUCE) { openRise = 1; render(); return; }
    openRise = 0; render();
    const t0 = performance.now();
    const st = (now) => { const k = Math.min(1, (now - t0) / 1500); openRise = ease(k); render(); if (k < 1 && alive) requestAnimationFrame(st); };
    requestAnimationFrame(st);
  }
  function openBook(instant) {
    lv.classList.add("is-reading"); lv.classList.remove("is-end");
    cover.classList.add("is-out"); later(() => { cover.hidden = true; }, instant ? 0 : 800);
    pos = 0; render(); riseFirst(instant);
    if (!instant && !playing) later(startMusic, 300);
  }
  lid.addEventListener("click", () => {
    if (opening) return; opening = true; audio(); rustle();
    if (lv.classList.contains("is-end")) { lv.classList.remove("is-end"); }
    lv.classList.add("is-opening");
    later(() => lv.classList.add("is-open-lid"), 30);
    later(() => openBook(false), REDUCE ? 200 : 1250);
  });

  /* ---------- Réponse ---------- */
  const rsvpBox = q(".lv-rsvp"), form = q(".lv-form"); let attending = true, guests = 1;
  form.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]"); if (a) { attending = a.dataset.a === "yes"; form.querySelectorAll("[data-a]").forEach((b) => b.setAttribute("aria-pressed", String(b === a))); q(".lv-guests").hidden = !attending; return; }
    const g = e.target.closest("[data-g]"); if (g) { guests = clamp(guests + +g.dataset.g, 1, 20); form.querySelector("output").textContent = guests; }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); const inp = form.querySelector("input[name=name]"), name = inp.value.trim();
    if (!name) { inp.focus(); inp.placeholder = C.nameMissing; return; }
    // Pronostics (facultatifs) en tête du message, comme les allergies des anniversaires : pas de nouvelle colonne.
    const gv = (n) => { const el = q(`.lv-guess [name=${n}]`); return el ? el.value.trim() : ""; };
    let gdate = gv("gdate");
    if (gdate) { try { gdate = new Intl.DateTimeFormat(LANG_LOCALE[lang], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${gdate}T12:00:00Z`)); } catch (x) {} }
    const sep = lang === "fr" ? " : " : ": ";
    const guess = [gv("gname") && V.gName + sep + gv("gname"), gdate && V.gDate + sep + gdate, gv("gweight") && V.gWeight + sep + gv("gweight")].filter(Boolean);
    const note = form.querySelector("textarea").value.trim();
    const msg = [guess.length ? V.guessPrefix + guess.join(" · ") : "", note].filter(Boolean).join("\n").slice(0, 1000);
    const btn = form.querySelector(".lv-send"), err = form.querySelector(".lv-err");
    err.hidden = true;
    if (OPTS.onRsvp) { btn.disabled = true; btn.textContent = C.sending; try { await OPTS.onRsvp({ name, attending, guests: attending ? guests : 0, message: msg }); } catch (x) { btn.disabled = false; btn.textContent = V.send; err.hidden = false; return; } }
    const first = esc(name.split(" ")[0]);
    form.outerHTML = `<div class="lv-thanks"><small>${esc(C.thanks(first))}</small><h3>${attending ? V.yesTitle : V.noTitle}</h3><p>${esc(attending ? C.noted(String(guests)) : C.missYou)}</p>${OPTS.onRsvp ? "" : `<p class="lv-sub">${esc(C.previewOnly)}</p>`}<a class="lv-btn ghost" href="${calUrl}" target="_blank" rel="noopener noreferrer">${ICON.cal}${esc(C.addCal)}</a></div>`;
    rsvpBox.classList.add("is-sent"); chime();
    // Le livre se referme doucement sur « … à suivre »
    later(() => showCover(true), 3600);
  });
  q(".lv-replay").addEventListener("click", () => showCover(false));

  /* ---------- Démarrage ---------- */
  render();
  if (OPTS.skipIntro) { cover.hidden = true; openBook(true); }
  else showCover(false);

  return {
    replay() { pos = 0; showCover(false); },
    destroy() {
      alive = false; timers.forEach(clearTimeout); clearInterval(countI); cancelAnimationFrame(anim); cancelAnimationFrame(raf); cancelAnimationFrame(tiltF);
      removeEventListener("keydown", onKey); removeEventListener("deviceorientation", onOrient); removeEventListener("pointermove", onMouse);
      removeEventListener("resize", onResize);
      document.body.classList.remove("lv-locked"); music.destroy(); try { actx && actx.close(); } catch (e) {} root.innerHTML = "";
    },
  };
}
