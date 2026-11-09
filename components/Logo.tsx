/**
 * Monogramme « ES lié » (choisi par Glad le 9 nov. 2026) : un E en trois traits sans fût, dont le trait du bas
 * est la queue du S, tracé d'un seul geste. Dessiné en SVG en ligne (pas de fichier à charger, net à toutes les tailles).
 * onLight = sur fond clair (encre + or) ; sinon version claire (ivoire + or clair) pour fonds sombres.
 */
export const ES_BARS = "M24 30h22M24 50h16";
export const ES_S = "M76 33c-3-4-8-5-12-5-7 0-11 4-11 9 0 12 24 8 24 22 0 7-6 11-14 11H24";
/** Cadre serré autour du tracé (marge pour les bouts arrondis). */
export const ES_VIEWBOX = "18 22 64 54";
export const ES_INK = { light: "#2B2419", dark: "#F3EBDC" };
export const ES_GOLD = { light: "#A8884F", dark: "#D2B67F" };

/** Épaisseur adaptée à la taille : plus épais en petit pour rester lisible, fin et élégant en grand. */
const weight = (h: number) => Math.min(4.6, Math.max(2.4, 112 / h));

export default function Logo({ height = 24, className, onLight = true, label = "E-carte Studio" }: { height?: number; className?: string; onLight?: boolean; label?: string }) {
  const k = onLight ? "light" : "dark";
  const sw = weight(height);
  return (
    <svg viewBox={ES_VIEWBOX} height={height} width={Math.round((height * 64) / 54)} className={className} role="img" aria-label={label} style={{ display: "block", overflow: "visible" }}>
      <path d={ES_BARS} fill="none" stroke={ES_INK[k]} strokeWidth={sw} strokeLinecap="round" />
      <path d={ES_S} fill="none" stroke={ES_GOLD[k]} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
