"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/I18n";
import { loadMusicLibrary } from "@/lib/musicClient";
import { defaultTrack, MUSIC_BASE_VOLUME, NO_MUSIC, resolveTrack, type MusicLibrary } from "@/lib/music";

/** Choix de la musique dans l'éditeur : morceau de la bibliothèque, musique par défaut du modèle, ou sans musique ; bouton pour écouter. */
export default function MusicPicker({ value, template, onChange }: { value?: string; template: string; onChange: (v: string | undefined) => void }) {
  const e_ = useT().editor;
  const [lib, setLib] = useState<MusicLibrary | null>(null);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => { let on = true; loadMusicLibrary().then((l) => on && setLib(l)); return () => { on = false; audio.current?.pause(); }; }, []);
  const stop = () => { audio.current?.pause(); setPlaying(false); };
  // Changer de morceau ou de modèle arrête l'écoute en cours.
  useEffect(stop, [value, template]);
  const current = lib ? resolveTrack(lib, value, template) : null;
  const fallback = lib ? defaultTrack(lib, template) : null;
  const known = !value || value === NO_MUSIC || !!lib?.tracks.some((t) => t.id === value);
  function toggle() {
    if (playing || !current) return stop();
    const a = audio.current ?? (audio.current = new Audio());
    if (a.src !== new URL(current.src, location.href).href) { a.src = current.src; a.currentTime = current.start; }
    a.volume = MUSIC_BASE_VOLUME * ((lib?.levels?.music ?? 100) / 100); // même volume que dans l'invitation
    a.onended = () => setPlaying(false);
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }
  return <>
    <label>{e_.music}
      <span className="ed-music">
        <select id="music" value={known ? value ?? "" : ""} onChange={(e) => onChange(e.target.value || undefined)} disabled={!lib}>
          <option value="">{e_.musicDefault(fallback?.title ?? "…")}</option>
          {lib?.tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          <option value={NO_MUSIC}>{e_.musicNone}</option>
        </select>
        <button type="button" className="ed-music-play" onClick={toggle} disabled={!current} aria-pressed={playing}>
          <span aria-hidden="true">{playing ? "■" : "▶"}</span> {playing ? e_.musicStop : e_.musicListen}
        </button>
      </span>
    </label>
    <p className="ed-help">{e_.musicHelp}</p>
  </>;
}
