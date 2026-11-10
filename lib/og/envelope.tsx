import "server-only";
import { ImageResponse } from "next/og";
import { ES_BARS, ES_S } from "@/components/Logo";
import { ogFonts, photoDataUrl } from "./assets";
import { OG_BACK, OG_FRONT } from "./layers";

/** Taille servie : la scène est dessinée en 1200 × 630 puis réduite (PNG plus léger : WhatsApp boude les aperçus trop lourds). */
const OUT = 0.75;
export const OG_SIZE = { width: 1200 * OUT, height: 630 * OUT };

export type EnvelopeCard = {
  kicker: string;   // « NOUS NOUS MARIONS », « JOYEUX ANNIVERSAIRE »…
  names: string;    // prénoms
  date: string;     // « Samedi 14 juin 2027 » (vide si inconnue)
  photo?: string | null; // URL publique de la photo (JPEG/PNG)
  brand: string;    // « E-CARTE STUDIO »
};

/* Enveloppe de marque E-carte Studio (10 nov. 2026, demandée par Glad, version « 3D et plus réelle ») :
   aperçu des liens (WhatsApp, iMessage…) et image cliquable de l'e-mail « invitation en ligne ».

   Deux calques fixes, fabriqués une fois pour toutes (grain du papier, ombres floues, relief du sceau : trop coûteux
   à calculer à chaque requête sur Cloudflare) puis rangés dans layers.ts :
   - OG_BACK  : table en lin, ombres, dos de l'enveloppe, rabat ouvert, carte vierge (JPEG) ;
   - OG_FRONT : poche avant, rabats, sceau de cire au monogramme ES, marque (PNG transparent).
   À chaque requête, on ne pose que la photo et les textes entre les deux, inclinés comme la scène.
   Pour refaire les calques : `node scripts/og-layers.mjs` avec `npm run dev` lancé (voir ce script). */
const W = 1200, H = 630;
const TILT = -3;                                        // inclinaison de toute la scène (degrés)
const ENV = { x: 250, y: 236, w: 700, h: 372 };       // corps de l'enveloppe
const CARD = { x: 318, y: 46, w: 564, h: 420 };        // carte (le bas est caché par la poche)
const POCKET_TOP = 318;                                 // haut de la poche sur les côtés
const SEAL = { x: 600, y: 470, r: 56 };                // sceau à la pointe du rabat de la poche
const GOLD = "#A8884F", INK = "#2B2419";
const L = ENV.x, R = ENV.x + ENV.w, B = ENV.y + ENV.h;
const tilt = { transform: `rotate(${TILT}deg)`, transformOrigin: "50% 50%" } as const;

export async function renderEnvelope(c: EnvelopeCard) {
  const photo = await photoDataUrl(c.photo);
  const fonts = await ogFonts({ script: c.names, caps: c.kicker, serif: c.date });
  const has = (n: string) => fonts.some((f) => f.name === n);
  const script = has("Script") ? "Script" : "serif";
  const caps = has("Caps") ? "Caps" : "serif";
  const serif = has("Serif") ? "Serif" : "serif";
  const textW = photo ? 330 : 500;
  // Prénoms longs : coupés sur « & » (jamais au milieu d'un prénom composé).
  const amp = c.names.match(/^(.+?)\s+(&|and|et)\s+(.+)$/);
  const lines = amp && c.names.length > (photo ? 15 : 22) ? [amp[1], `${amp[2]} ${amp[3]}`] : [c.names];
  const len = Math.max(...lines.map((l) => l.length));
  const nameSize = photo ? (len <= 14 ? 56 : len <= 18 ? 48 : len <= 24 ? 40 : 34) : (len <= 16 ? 84 : len <= 22 ? 70 : len <= 30 ? 56 : 46);

  return new ImageResponse(
    (
      <div style={{ width: W * OUT, height: H * OUT, display: "flex", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, display: "flex", background: "#E9DFCE", transform: `translate(${(-(1 - OUT) * W) / 2}px, ${(-(1 - OUT) * H) / 2}px) scale(${OUT})` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={OG_BACK} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
        {/* Contenu de la carte, incliné comme la scène */}
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, display: "flex", ...tilt }}>
          <div style={{ position: "absolute", left: CARD.x, top: CARD.y + 30, width: CARD.w, height: POCKET_TOP - CARD.y - 30, display: "flex", alignItems: "center", justifyContent: "center", gap: 34 }}>
            {photo && (
              <div style={{ width: 176, height: 176, display: "flex", borderRadius: 999, padding: 5, background: `linear-gradient(135deg,#E6D09A,${GOLD} 50%,#7E602C)`, boxShadow: "0 5px 12px rgba(60,42,20,.32), inset 0 1px 0 rgba(255,255,255,.5)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} width={166} height={166} style={{ borderRadius: 999, objectFit: "cover", width: 166, height: 166 }} alt="" />
              </div>
            )}
            <div style={{ width: textW, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ fontFamily: caps, fontSize: 19, letterSpacing: 5, color: GOLD }}>{c.kicker}</div>
              <div style={{ fontFamily: script, fontSize: nameSize, lineHeight: 1.05, color: INK, marginTop: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>{lines.map((l) => <span key={l}>{l}</span>)}</div>
              {c.date && <div style={{ fontFamily: serif, fontSize: 27, color: "#5C4E3C", marginTop: 12 }}>{c.date}</div>}
            </div>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={OG_FRONT} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} alt="" />
      </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined, headers: { "cache-control": "public, max-age=600, s-maxage=600" } }
  );
}

/* ───────────── Fabrication des calques (local seulement, /api/dev/og?layer=…) ─────────────
   Satori ne gère pas les filtres SVG (flou, grain) : il ne dessine ici que les formes nettes, chacune sur fond
   transparent ; scripts/og-layers.py ajoute ensuite la table en lin, les ombres floues et le grain du papier. */
export type OgLayer = "back" | "card" | "front" | "seal";

export async function renderLayer(which: OgLayer, brand = "E-CARTE STUDIO") {
  const fonts = which === "front" ? await ogFonts({ script: "", caps: brand, serif: "" }) : [];
  const caps = fonts.some((f) => f.name === "Caps") ? "Caps" : "serif";
  const pocket = `M${L} ${B} L${L} ${POCKET_TOP + 18} L${SEAL.x} ${SEAL.y} L${R} ${POCKET_TOP + 18} L${R} ${B} Z`;
  const sideL = `M${L} ${POCKET_TOP - 10} L${SEAL.x - 40} ${B - 150} L${L} ${B} Z`;
  const sideR = `M${R} ${POCKET_TOP - 10} L${SEAL.x + 40} ${B - 150} L${R} ${B} Z`;
  const g = (children: React.ReactNode, defs?: React.ReactNode) => (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>{defs}</defs>
      <g transform={`rotate(${TILT} ${W / 2} ${H / 2})`}>{children}</g>
    </svg>
  );
  const foil = <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E3CB92" /><stop offset="0.5" stopColor="#A8884F" /><stop offset="1" stopColor="#D9BE83" /></linearGradient>;

  const layers: Record<OgLayer, React.ReactNode> = {
    back: g(<g>
      <path d={`M${L} ${ENV.y} L${W / 2} 92 L${R} ${ENV.y} Z`} fill="url(#flapG)" stroke="#CDBA98" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x={L} y={ENV.y} width={ENV.w} height={ENV.h} rx="8" fill="url(#backG)" />
      <rect x={L} y={ENV.y} width={ENV.w} height={130} fill="url(#inside)" />
    </g>, <g>
      <linearGradient id="backG" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stopColor="#D6C4A6" /><stop offset="0.35" stopColor="#E7DAC3" /><stop offset="1" stopColor="#DECFB4" /></linearGradient>
      <linearGradient id="flapG" x1="0.2" y1="0" x2="0.6" y2="1"><stop offset="0" stopColor="#F4ECDD" /><stop offset="1" stopColor="#DCCCAF" /></linearGradient>
      <linearGradient id="inside" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5E4A2E" stopOpacity="0.42" /><stop offset="1" stopColor="#5E4A2E" stopOpacity="0" /></linearGradient>
    </g>),
    card: g(<g>
      <rect x={CARD.x + 1.5} y={CARD.y + 2.5} width={CARD.w} height={CARD.h} rx="5" fill="#D3C3A6" />
      <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx="5" fill="url(#cardG)" />
      <rect x={CARD.x + 14} y={CARD.y + 14} width={CARD.w - 28} height={CARD.h - 28} rx="3" fill="none" stroke="url(#foil)" strokeWidth="2" />
      <rect x={CARD.x + 20} y={CARD.y + 20} width={CARD.w - 40} height={CARD.h - 40} rx="2" fill="none" stroke="url(#foil)" strokeWidth="0.8" opacity="0.8" />
      <path d={`M${CARD.x + 4} ${CARD.y + 0.8} L${CARD.x + CARD.w - 4} ${CARD.y + 0.8}`} stroke="#FFFFFF" strokeWidth="1.4" />
    </g>, <g>
      {foil}
      <linearGradient id="cardG" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor="#FFFEFA" /><stop offset="1" stopColor="#F4EBDB" /></linearGradient>
    </g>),
    front: (
      <div style={{ width: W, height: H, display: "flex", position: "relative" }}>
        {g(<g>
          <path d={sideL} fill="url(#sideLG)" />
          <path d={sideR} fill="url(#sideRG)" />
          <path d={`M${L} ${POCKET_TOP + 12} L${SEAL.x} ${SEAL.y - 8} L${R} ${POCKET_TOP + 12} L${R} ${POCKET_TOP + 22} L${SEAL.x} ${SEAL.y + 2} L${L} ${POCKET_TOP + 22} Z`} fill="url(#edgeShade)" />
          <path d={pocket} fill="url(#pocketG)" />
          <path d={pocket} fill="url(#light)" />
          <path d={`M${L + 1} ${POCKET_TOP + 19} L${SEAL.x} ${SEAL.y + 1.5} L${R - 1} ${POCKET_TOP + 19}`} fill="none" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.85" />
          <path d={`M${L} ${POCKET_TOP + 18} L${SEAL.x} ${SEAL.y} L${R} ${POCKET_TOP + 18}`} fill="none" stroke="#C9B592" strokeWidth="1" />
          <path d={`M${L} ${POCKET_TOP - 10} L${L} ${B - 8} Q${L} ${B} ${L + 8} ${B} L${R - 8} ${B} Q${R} ${B} ${R} ${B - 8} L${R} ${POCKET_TOP - 10}`} fill="none" stroke="#C4B08C" strokeWidth="1.2" />
        </g>, <g>
          <linearGradient id="sideLG" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stopColor="#F3EADB" /><stop offset="1" stopColor="#E6D8BF" /></linearGradient>
          <linearGradient id="sideRG" x1="1" y1="0" x2="0" y2="0.3"><stop offset="0" stopColor="#DDCDB1" /><stop offset="1" stopColor="#EADFCA" /></linearGradient>
          <linearGradient id="pocketG" x1="0" y1="0" x2="0.15" y2="1"><stop offset="0" stopColor="#FAF4E9" /><stop offset="1" stopColor="#E6D8BF" /></linearGradient>
          <linearGradient id="light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.3" /><stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="1" stopColor="#3C2C14" stopOpacity="0.12" /></linearGradient>
          <linearGradient id="edgeShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3C2C14" stopOpacity="0" /><stop offset="1" stopColor="#3C2C14" stopOpacity="0.28" /></linearGradient>
        </g>)}
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, display: "flex", ...tilt }}>
          <div style={{ position: "absolute", left: 0, width: W, top: B - 54, display: "flex", justifyContent: "center", fontFamily: caps, fontSize: 17, letterSpacing: 7, color: "#9E7E45" }}>{brand}</div>
        </div>
      </div>
    ),
    seal: g(<g>
      <path d={waxEdge(SEAL.x, SEAL.y, SEAL.r)} fill="url(#wax)" />
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r * 0.74} fill="url(#waxIn)" />
      <circle cx={SEAL.x - 1} cy={SEAL.y - 1.5} r={SEAL.r * 0.74} fill="none" stroke="#5E4520" strokeOpacity="0.5" strokeWidth="2.5" />
      <circle cx={SEAL.x + 1} cy={SEAL.y + 1.5} r={SEAL.r * 0.74} fill="none" stroke="#F3DFAE" strokeOpacity="0.7" strokeWidth="1.6" />
      <g transform={`translate(${SEAL.x - 50} ${SEAL.y - 49})`}>
        <path d={ES_BARS} fill="none" stroke="#4E3815" strokeOpacity="0.6" strokeWidth="5.4" strokeLinecap="round" transform="translate(1.4 1.8)" />
        <path d={ES_S} fill="none" stroke="#4E3815" strokeOpacity="0.6" strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" transform="translate(1.4 1.8)" />
        <path d={ES_BARS} fill="none" stroke="url(#emboss)" strokeWidth="4.4" strokeLinecap="round" />
        <path d={ES_S} fill="none" stroke="url(#emboss)" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <ellipse cx={SEAL.x - 20} cy={SEAL.y - 26} rx="20" ry="10" fill="url(#spec)" transform={`rotate(-30 ${SEAL.x - 20} ${SEAL.y - 26})`} />
    </g>, <g>
      <radialGradient id="wax" cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#EED9A6" /><stop offset="0.35" stopColor="#C29E58" /><stop offset="0.75" stopColor="#8E6D33" /><stop offset="1" stopColor="#6A4F22" /></radialGradient>
      <radialGradient id="waxIn" cx="62%" cy="66%" r="70%"><stop offset="0" stopColor="#D2B06A" /><stop offset="0.7" stopColor="#A9863F" /><stop offset="1" stopColor="#8A6A30" /></radialGradient>
      <linearGradient id="emboss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FBF0D2" /><stop offset="1" stopColor="#E2C687" /></linearGradient>
      <radialGradient id="spec" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFF8E2" stopOpacity="0.75" /><stop offset="1" stopColor="#FFF8E2" stopOpacity="0" /></radialGradient>
    </g>),
  };

  return new ImageResponse(
    <div style={{ width: W, height: H, display: "flex" }}>{layers[which]}</div>,
    { width: W, height: H, fonts: fonts.length ? fonts : undefined }
  );
}

/** Contour de cire légèrement irrégulier (déterministe). */
function waxEdge(cx: number, cy: number, r: number) {
  const n = 36;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + 0.05 * Math.sin(i * 2.7) + 0.035 * Math.cos(i * 5.1) + (i % 9 === 4 ? 0.07 : 0);
    return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k];
  });
  return `M${pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L")} Z`;
}
