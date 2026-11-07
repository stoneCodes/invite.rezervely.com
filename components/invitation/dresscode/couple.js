/* Dress code réaliste : photo d'un couple en tenues gris neutre, recolorées dans le navigateur.
   Le masque (PNG) dit où recolorer : rouge = costume, vert = robe, bleu = cravate et pochette.
   La lumière de la photo (plis, ombres, reflets) est gardée : chaque pixel prend la couleur choisie,
   assombrie ou éclaircie selon sa luminosité par rapport au gris moyen de la zone.
   Fabrication des masques : images-source/dresscode-masque-*.py. */

export const COUPLES = {
  // Costume et robe seuls, sans personne : le visuel par défaut (choisi par Glad le 7 nov. 2026).
  tenues: { src: "/img/dresscode-tenues.webp", mask: "/img/dresscode-tenues-mask.png", w: 1082, h: 1454 },
  afro: { src: "/img/dresscode-afro.webp", mask: "/img/dresscode-afro-mask.png", w: 1024, h: 1536 },
};
export const DEFAULT_COUPLE = "tenues";
export const coupleId = (id) => (COUPLES[id] ? id : DEFAULT_COUPLE);

/** Balisage : deux canvas superposés pour un fondu d'une couleur à l'autre. */
export function coupleHtml(label = "", cls = "") {
  return `<div class="dcc ${cls}" role="img" aria-label="${label}"><canvas></canvas><canvas></canvas></div>`;
}

const hexRgb = (h) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "").trim());
  const n = m ? parseInt(m[1], 16) : 0xc9a46a;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const shade = (rgb, k) => rgb.map((v) => Math.round(v * k));
const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

const loadImg = (src) => new Promise((ok, ko) => { const i = new Image(); i.decoding = "async"; i.onload = () => ok(i); i.onerror = ko; i.src = src; });

/** Monte le couple dans `el` (rendu par coupleHtml). set(homme, femme) recolore ; les appels avant chargement sont gardés. */
export function mountCouple(el, id) {
  const C = COUPLES[coupleId(id)];
  const cvs = [...el.querySelectorAll("canvas")];
  el.style.aspectRatio = `${C.w} / ${C.h}`;
  let ready = false, pending = null, front = 0, alive = true, base, maskA, lum, refs, W, H, io;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  async function load() {
    try {
      const [img, msk] = await Promise.all([loadImg(C.src), loadImg(C.mask)]);
      if (!alive) return;
      // Résolution de travail : assez pour l'écran (densité comprise), pas plus.
      const want = Math.max(360, (el.clientWidth || 320) * Math.min(2.5, devicePixelRatio || 1));
      const k = Math.min(1, want / C.w);
      W = Math.round(C.w * k); H = Math.round(C.h * k);
      const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H;
      const t = tmp.getContext("2d", { willReadFrequently: true });
      t.drawImage(img, 0, 0, W, H); base = t.getImageData(0, 0, W, H).data;
      t.clearRect(0, 0, W, H); t.drawImage(msk, 0, 0, W, H); maskA = t.getImageData(0, 0, W, H).data;
      // Luminosité de chaque pixel et gris moyen de chaque zone (référence de l'éclairage).
      lum = new Float32Array(W * H); const sum = [0, 0, 0], cnt = [0, 0, 0];
      for (let p = 0, i = 0; p < lum.length; p++, i += 4) {
        const l = (0.299 * base[i] + 0.587 * base[i + 1] + 0.114 * base[i + 2]) / 255; lum[p] = l;
        for (let z = 0; z < 3; z++) if (maskA[i + z] > 200) { sum[z] += l; cnt[z]++; }
      }
      refs = sum.map((s, z) => (cnt[z] ? s / cnt[z] : 0.6));
      cvs.forEach((c) => { c.width = W; c.height = H; });
      ready = true; el.classList.add("is-ready");
      if (pending) set(...pending);
    } catch { el.classList.add("is-failed"); }
  }

  function paint(cols) {
    const out = new ImageData(W, H), d = out.data;
    for (let p = 0, i = 0; p < lum.length; p++, i += 4) {
      let r = base[i], g = base[i + 1], b = base[i + 2];
      for (let z = 0; z < 3; z++) {
        const m = maskA[i + z]; if (!m) continue;
        const s = lum[p] / refs[z], c = cols[z], a = m / 255;
        let tr, tg, tb;
        if (s <= 1) { const f = Math.pow(s, 1.15); tr = c[0] * f; tg = c[1] * f; tb = c[2] * f; }
        else { const f = Math.min(1, (s - 1) * 0.55); tr = c[0] + (255 - c[0]) * f; tg = c[1] + (255 - c[1]) * f; tb = c[2] + (255 - c[2]) * f; }
        r += (tr - r) * a; g += (tg - g) * a; b += (tb - b) * a;
      }
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = base[i + 3];
    }
    return out;
  }

  function set(men, women) {
    pending = [men, women];
    if (!ready || !alive) return;
    const m = hexRgb(men), w = hexRgb(women);
    // Cravate et pochette : couleur de la robe (tenues assorties), ou un ton plus soutenu si tout est de la même couleur.
    const tie = same(m, w) ? shade(m, 0.72) : w;
    const next = reduce ? front : 1 - front;
    cvs[next].getContext("2d").putImageData(paint([m, w, tie]), 0, 0);
    if (next !== front) { cvs[next].classList.add("on"); cvs[front].classList.remove("on"); front = next; }
    else cvs[front].classList.add("on");
  }

  // Chargement quand la section approche (les images pèsent ~300 Ko).
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: "900px 0px" });
    io.observe(el);
  } else load();

  return { el, set, destroy() { alive = false; io?.disconnect(); } };
}
