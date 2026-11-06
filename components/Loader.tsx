import Logo from "./Logo";
import "./loader.css";

const SPARK = "M0,-20 C1.6,-4.5 4.5,-1.6 20,0 C4.5,1.6 1.6,4.5 0,20 C-1.6,4.5 -4.5,1.6 -20,0 C-4.5,-1.6 -1.6,-4.5 0,-20Z";

// Grains d'or (et quelques roses) répartis autour du centre, calculés une fois pour toutes.
const DOTS = Array.from({ length: 22 }, (_, i) => ({
  a: Math.round((360 / 22) * i + (i % 3) * 7),
  r: 70 + ((i * 37) % 60),
  s: 3 + ((i * 5) % 4),
  d: +((i * 0.053) % 0.45).toFixed(2),
  rose: i % 5 === 0,
}));

/** Loader « Poussière d'or » : les grains se rassemblent, l'étincelle naît, le nom apparaît. Sans JavaScript. */
export default function Loader() {
  return (
    <div className="je-loader" role="status" aria-live="polite">
      <span className="je-sr">Chargement…</span>
      <div className="je-l-in" aria-hidden="true">
        <div className="je-l-core">
          {DOTS.map((p, i) => (
            <i
              key={i}
              className={p.rose ? "je-l-dot rose" : "je-l-dot"}
              style={{ "--a": `${p.a}deg`, "--r": `${p.r}px`, "--s": `${p.s}px`, "--d": `${p.d}s` } as React.CSSProperties}
            />
          ))}
          <div className="je-l-ring" />
          <div className="je-l-star">
            <svg viewBox="-24 -24 48 48">
              <defs>
                <linearGradient id="je-l-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#F6E3B0" />
                  <stop offset=".45" stopColor="#D4A85A" />
                  <stop offset=".75" stopColor="#F0D49A" />
                  <stop offset="1" stopColor="#B98A3E" />
                </linearGradient>
              </defs>
              <path d={SPARK} fill="url(#je-l-gold)" />
              <path d={SPARK} transform="translate(17,-15) scale(.32)" fill="#E7A6B6" />
            </svg>
          </div>
        </div>
        <div className="je-l-word"><Logo height={42} /></div>
      </div>
    </div>
  );
}
