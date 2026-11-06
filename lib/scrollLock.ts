/**
 * Bloque le défilement de la page derrière une pop-up plein écran.
 * Sur iPhone, `overflow:hidden` sur body ne suffit pas (la page derrière défile et la barre
 * de Safari bouge) : on fige donc body à sa position, puis on la restaure à la fermeture.
 */
export function lockScroll(): () => void {
  const b = document.body, y = window.scrollY;
  const prev = { position: b.style.position, top: b.style.top, width: b.style.width, overflow: b.style.overflow };
  Object.assign(b.style, { position: "fixed", top: `-${y}px`, width: "100%", overflow: "hidden" });
  return () => {
    Object.assign(b.style, prev);
    window.scrollTo(0, y);
  };
}
