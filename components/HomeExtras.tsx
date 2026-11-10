"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/I18n";
import { LEGAL } from "@/lib/legal";
import { loadMusicLibrary } from "@/lib/musicClient";
import { defaultTrack, MUSIC_BASE_VOLUME } from "@/lib/music";

/* Pictogrammes au trait doré (24 × 24) pour le bloc « Ce que contient votre invitation ». */
const ICONS: Record<string, React.ReactNode> = {
  music: <><path d="M9 18V6l11-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
  rsvp: <><path d="M4 5h16v11H9l-5 4z" /><path d="m8.5 10.5 2.2 2.2 4.8-4.7" /></>,
  gift: <><rect x="3.5" y="8.5" width="17" height="4" rx="1" /><path d="M5 12.5V20h14v-7.5M12 8.5V20" /><path d="M12 8.5C10.5 5 7 4.5 7 6.8 7 8.5 12 8.5 12 8.5zM12 8.5c1.5-3.5 5-4 5-1.7 0 1.7-5 1.7-5 1.7z" /></>,
  map: <><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
  pdf: <><path d="M6 3h8.5L19 7.5V21H6z" /><path d="M14 3v5h5M9 12.5h7M9 16h7" /></>,
  envelope: <><rect x="3" y="6" width="18" height="13" rx="1.5" /><path d="m3.5 7 8.5 6.5L20.5 7" /><circle cx="12" cy="13.5" r="1.6" /></>,
};

const SAMPLE_SECONDS = 25;

/** Bloc « Ce que contient votre invitation » : 6 atouts, dont la musique avec un extrait à écouter. */
export function HomeFeatures() {
  const h = useT().home;
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const stop = () => {
    window.clearTimeout(timer.current);
    audio.current?.pause();
    setPlaying(false);
  };
  useEffect(() => () => { window.clearTimeout(timer.current); audio.current?.pause(); }, []);

  const toggle = async () => {
    if (playing) return stop();
    setPlaying(true);
    const lib = await loadMusicLibrary();
    const track = defaultTrack(lib, "cygnes") ?? lib.tracks[0];
    if (!track) return setPlaying(false);
    const a = audio.current ?? (audio.current = new Audio());
    if (a.src !== new URL(track.src, location.href).href) { a.src = track.src; a.currentTime = track.start || 0; }
    a.volume = MUSIC_BASE_VOLUME * ((lib.levels?.music ?? 100) / 100); // même volume que dans les invitations
    a.onended = stop;
    try { await a.play(); } catch { return setPlaying(false); }
    timer.current = window.setTimeout(stop, SAMPLE_SECONDS * 1000);
  };

  return (
    <section className="gl-feat gl-wave" aria-labelledby="gl-feat-t"><div className="wrap-site">
      <div className="gl-kicker">{h.featKicker}</div>
      <h2 id="gl-feat-t">{h.featTitle} <span className="gold-text">{h.featGold}</span></h2>
      <ul className="gl-feat-grid">
        {h.features.map(([id, title, text]) => (
          <li key={id} className={`gl-feat-card gl-rv${id === "music" ? " is-music" : ""}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[id]}</svg>
            <h3>{title}</h3>
            <p>{text}</p>
            {id === "music" && (
              <button type="button" className={`gl-listen${playing ? " is-on" : ""}`} onClick={toggle} aria-pressed={playing}>
                <span className="gl-listen-i" aria-hidden="true">{playing ? <i /> : "▶"}</span>
                {playing ? h.listenStop : h.listen}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div></section>
  );
}

/** Questions fréquentes (prix selon le réglage de l'admin : null = gratuit pour le moment). */
export function HomeFaq({ price }: { price: string | null }) {
  const h = useT().home;
  return (
    <section id="faq" className="gl-faq gl-wave" aria-labelledby="gl-faq-t"><div className="wrap-site">
      <div className="gl-kicker">{h.faqKicker}</div>
      <h2 id="gl-faq-t">{h.faqTitle} <span className="gold-text">{h.faqGold}</span></h2>
      <div className="gl-faq-list">
        {h.faq(price).map(([q, a], i) => (
          <details key={i} className="gl-faq-item">
            <summary>{q}<span className="gl-faq-plus" aria-hidden="true" /></summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      <p className="gl-faq-more">{h.faqMore} <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></p>
    </div></section>
  );
}
