"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "./Loader";
import { useT } from "./I18n";

const KEY = "je-splash";
const SHOW_MS = 2300; // le temps que la poussière se rassemble, que l'étincelle naisse et que le logo apparaisse
const FADE_MS = 500;

/** Pages du site (pas les invitations, démos ni aperçus, qui ont leur propre ouverture). */
function isSitePage(p: string) {
  return p === "/" || p.startsWith("/creer") || (p.startsWith("/espace") && !p.endsWith("/voir"));
}

/**
 * Écran d'accueil animé « Poussière d'or » : une fois par visite (onglet), sur les pages du site.
 * Présent dans le HTML dès le départ (pas de flash de la page) ; un petit script le masque tout de suite
 * s'il a déjà été vu ou si la page est dans une iframe. Toucher l'écran le passe.
 */
export default function Splash() {
  const pathname = usePathname();
  const t = useT();
  const [state, setState] = useState<"on" | "out" | "off">("on");

  useEffect(() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem(KEY); sessionStorage.setItem(KEY, "1"); } catch {}
    if (seen || window.self !== window.top) { setState("off"); return; }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = setTimeout(() => setState("out"), reduce ? 700 : SHOW_MS);
    const t2 = setTimeout(() => setState("off"), (reduce ? 700 : SHOW_MS) + FADE_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (state === "off" || !isSitePage(pathname)) return null;
  return (
    <>
      <div
        id="je-splash"
        className={state === "out" ? "je-splash out" : "je-splash"}
        onClick={() => setState("out")}
        suppressHydrationWarning
      >
        <Loader label={t.common.loading} />
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem("${KEY}")||window.self!==window.top){var s=document.getElementById("je-splash");s.style.display="none";s.setAttribute("data-skip","")}}catch(e){}`,
        }}
      />
    </>
  );
}
