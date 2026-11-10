/**
 * Musique de fond choisie par les mariés (fichier audio de la bibliothèque, /api/musiques), partagée par tous les moteurs.
 * Remplace les mélodies synthétisées (retirées le 10 nov. 2026 à la demande de Glad) ; les petits effets sonores restent dans chaque moteur.
 *
 * `track` = { src, start, ready } rempli par Invitation.tsx (src null = sans musique ; ready = promesse de résolution).
 * iPhone : un élément audio ne peut démarrer qu'après un geste. `unlock()` est appelé dans le geste d'ouverture
 * (lecture puis pause immédiate), ce qui autorise ensuite `play()` depuis un minuteur.
 */
const VOLUME = 0.55;

export function createMusic(track) {
  let el = null, on = false, dead = false, unlocked = false, fadeT = 0;
  const startAt = () => Math.max(0, Number(track && track.start) || 0);
  const ensure = () => {
    if (el || dead || !track || !track.src) return el;
    el = new Audio();
    el.preload = "auto";
    el.src = track.src;
    // Boucle manuelle : on repart du point de départ (pas de 0), pour garder la coupe choisie dans l'admin.
    el.addEventListener("ended", () => { if (on && !dead) { try { el.currentTime = startAt(); } catch (e) {} el.play().catch(() => {}); } });
    el.addEventListener("loadedmetadata", () => { if (startAt() && el.currentTime < startAt()) try { el.currentTime = startAt(); } catch (e) {} }, { once: true });
    return el;
  };
  const fadeIn = () => {
    cancelAnimationFrame(fadeT);
    if (!el) return;
    const t0 = performance.now();
    const step = (t) => { if (!el || !on) return; const k = Math.min(1, (t - t0) / 1600); el.volume = VOLUME * k; if (k < 1) fadeT = requestAnimationFrame(step); };
    el.volume = 0; fadeT = requestAnimationFrame(step);
  };
  const go = () => {
    const a = ensure();
    if (!a || !on || dead) return;
    if (!a.paused && !a.muted) return; // déjà en lecture
    a.muted = false;
    if (a.readyState >= 1 && startAt() && a.currentTime < startAt()) try { a.currentTime = startAt(); } catch (e) {}
    const p = a.play();
    if (p && p.then) p.then(fadeIn).catch(() => {}); else fadeIn();
  };
  return {
    get on() { return on; },
    /** À appeler dans un geste (toucher, clic) : prépare l'élément audio pour iPhone. */
    unlock() {
      if (unlocked || dead) return;
      const a = ensure();
      if (!a) { if (track && track.ready) track.ready.then(() => { if (!dead && !unlocked && on) go(); }); return; }
      unlocked = true;
      if (on) return go();
      a.muted = true; // pas de bruit pendant la préparation
      const p = a.play();
      const done = () => { if (!on) { a.pause(); a.muted = false; } };
      if (p && p.then) p.then(done).catch(() => { a.muted = false; }); else done();
    },
    play() {
      on = true;
      if (ensure()) return go();
      if (track && track.ready) track.ready.then(() => { if (on && !dead) go(); });
    },
    pause() { on = false; cancelAnimationFrame(fadeT); if (el) el.pause(); },
    destroy() { dead = true; on = false; cancelAnimationFrame(fadeT); if (el) { el.pause(); el.removeAttribute("src"); try { el.load(); } catch (e) {} el = null; } },
  };
}
