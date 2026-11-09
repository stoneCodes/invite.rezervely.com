import { ES_S, ES_VIEWBOX, ES_INK, ES_GOLD } from "./Logo";
import "./loader.css";

/**
 * Loader « Trait d'or » (monogramme ES lié, 9 nov. 2026) : les deux traits d'encre du E se tracent,
 * puis le S d'or se dessine d'un seul geste jusqu'au trait du bas ; un reflet le parcourt, puis on recommence.
 * Sans JavaScript. Dans l'écran d'accueil (Splash), le tracé se joue une seule fois et reste affiché.
 */
export default function Loader({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="je-loader" role="status" aria-live="polite">
      <span className="je-sr">{label}</span>
      <div className="je-l-in" aria-hidden="true">
        <div className="je-l-halo" />
        <svg className="je-l-mark" viewBox={ES_VIEWBOX}>
          <path className="je-l-bar b1" d="M24 30h22" pathLength={1} stroke={ES_INK.light} />
          <path className="je-l-bar b2" d="M24 50h16" pathLength={1} stroke={ES_INK.light} />
          <path className="je-l-s" d={ES_S} pathLength={1} stroke={ES_GOLD.light} />
          <path className="je-l-glint" d={ES_S} pathLength={1} />
        </svg>
      </div>
    </div>
  );
}
