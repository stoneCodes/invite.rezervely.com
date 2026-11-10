"use client";
import { BUILTIN_DEFAULTS, BUILTIN_TRACKS, DEFAULT_LEVELS, normalizeLevels, resolveTrack, type MusicLibrary } from "@/lib/music";
import type { TrackRef } from "@/components/invitation/music";

let pending: Promise<MusicLibrary> | null = null;

/** Bibliothèque de musiques (une seule requête par page ; morceaux intégrés si l'API ne répond pas). */
export function loadMusicLibrary(): Promise<MusicLibrary> {
  if (!pending) {
    pending = fetch("/api/musiques")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("musiques"))))
      .then((lib: MusicLibrary) => (Array.isArray(lib?.tracks) ? lib : Promise.reject(new Error("musiques"))))
      .then((lib) => ({ ...lib, levels: normalizeLevels(lib.levels) }))
      .catch(() => { pending = null; return { tracks: BUILTIN_TRACKS, defaults: BUILTIN_DEFAULTS, levels: DEFAULT_LEVELS }; });
  }
  return pending;
}

/** Référence remplie dès que la bibliothèque est chargée ; le moteur la lit au moment de lancer la musique. */
export function trackRefFor(choice: string | undefined, template: string): TrackRef {
  const ref: TrackRef = { src: null, start: 0, volume: 1, fx: 1 };
  ref.ready = loadMusicLibrary().then((lib) => {
    const lv = lib.levels ?? DEFAULT_LEVELS;
    ref.volume = lv.music / 100; ref.fx = lv.effects / 100;
    const t = resolveTrack(lib, choice, template);
    if (t) { ref.src = t.src; ref.start = t.start; }
  });
  return ref;
}
