"use client";
import { useEffect, useRef, useState } from "react";
import { useLang, useT } from "@/components/I18n";
import { LOCALE } from "@/lib/i18n";
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
/** Bloc « Tableau de bord » (12 nov. 2026, demandé par Glad d'après reveliastudio.com) : capture de l'espace des mariés
 *  dans une fenêtre, page du PDF posée devant, deux pastilles de chiffres, liste des atouts. Captures dans
 *  public/img/accueil-tableau.webp et accueil-pdf.webp (provisoires : images-source/accueil/captures.py). */
export function HomeDashboard() {
  const h = useT().home;
  return (
    <section className="gl-dash gl-wave" aria-labelledby="gl-dash-t"><div className="wrap-site gl-dash-in">
      <div className="gl-dash-head">
        <div className="gl-kicker">{h.dashKicker}</div>
        <h2 id="gl-dash-t">{h.dashTitle} <span className="gold-text">{h.dashGold}</span></h2>
        <p className="gl-dash-text">{h.dashText}</p>
      </div>
      <div className="gl-dash-visual gl-rv">
        <figure className="gl-dash-shot">
          <span className="gl-dash-bar" aria-hidden="true"><i /><i /><i /></span>
          <img src="/img/accueil-tableau.webp" width={1520} height={1120} alt={h.dashShotAlt} loading="lazy" decoding="async" />
        </figure>
        <figure className="gl-dash-pdf">
          <img src="/img/accueil-pdf.webp" width={1000} height={1414} alt={h.dashPdfAlt} loading="lazy" decoding="async" />
          <span className="gl-dash-pdftag" aria-hidden="true">PDF</span>
        </figure>
        <span className="gl-dash-chip is-yes" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 12.5 4 4 8-9" /></svg><b>112</b>{h.dashYes}</span>
        <span className="gl-dash-chip is-no" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17" /></svg><b>9</b>{h.dashNo}</span>
      </div>
      <div className="gl-dash-side">
        <ul className="gl-dash-list">
          {h.dashPoints.map((p) => <li key={p}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12.5 4 4 8-9" /></svg>{p}</li>)}
        </ul>
        <a className="btn-s gl-dash-cta" href="/creer">{h.create} <span aria-hidden="true">→</span></a>
      </div>
    </div></section>
  );
}

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

export type HomeReview = { id: string; rating: number; body: string; display_name: string; kind: string; event_date: string | null; created_at: string };

/** Avis publiés depuis /admin/avis. Section absente tant qu'aucun avis n'est publié ; note moyenne à partir de 5 avis.
    Mentions obligatoires (avis en ligne) : date de l'avis, date de l'événement, modération expliquée. */
export function HomeReviews({ reviews, stats }: { reviews: HomeReview[]; stats: { count: number; avg: number } }) {
  const h = useT().home;
  const lang = useLang();
  if (!reviews.length) return null;
  const day = new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: "long", timeZone: "Europe/Paris" });
  const month = new Intl.DateTimeFormat(LOCALE[lang], { month: "long", year: "numeric", timeZone: "UTC" });
  const avg = new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: 1 }).format(stats.avg);
  return (
    <section className="gl-rev gl-wave" aria-labelledby="gl-rev-t"><div className="wrap-site">
      <div className="gl-kicker">{h.reviewsKicker}</div>
      <h2 id="gl-rev-t">{h.reviewsTitle} <span className="gold-text">{h.reviewsGold}</span></h2>
      {stats.count >= 5 && <p className="gl-rev-avg"><span aria-hidden="true">★</span> {h.reviewsAvg(avg, stats.count)}</p>}
      <ul className={`gl-rev-list${reviews.length > 3 ? " is-rail" : ""}`}>
        {reviews.map((r) => (
          <li key={r.id} className="gl-rev-card">
            <span className="gl-rev-stars" role="img" aria-label={h.reviewStars(r.rating)}>{"★".repeat(r.rating)}<i>{"★".repeat(5 - r.rating)}</i></span>
            <blockquote>{r.body}</blockquote>
            <div className="gl-rev-who">
              <b>{r.display_name}</b>
              <small>{h.reviewKind[r.kind] ?? r.kind}{r.event_date ? ` · ${month.format(new Date(r.event_date))}` : ""}</small>
              <small>{h.reviewPosted(day.format(new Date(r.created_at)))}</small>
            </div>
          </li>
        ))}
      </ul>
      <p className="gl-rev-note">{h.reviewsNote}</p>
    </div></section>
  );
}
