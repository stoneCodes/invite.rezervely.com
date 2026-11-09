"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Vidéos du haut de l'accueil, enchaînées en fondu (mariage → baby shower → anniversaire).
 * Mobile (< 768 px) : versions recadrées en hauteur (576 × 720, sujet centré) ; ordinateur : 1280 × 720.
 * Sans son, lecture en ligne, pause hors écran et onglet caché. Si la lecture automatique est refusée
 * (mode économie d'énergie iPhone, économiseur de données) ou si l'utilisateur réduit les animations,
 * on garde les images fixes (affiches), qui défilent en fondu sauf en « mouvement réduit ».
 */
const CLIPS = [
  { id: "mariage" },
  { id: "baby" },
  { id: "anniv" },
] as const;
const FADE = 0.9; // secondes de fondu avant la fin d'une vidéo
const STILL_MS = 6000; // durée d'une image fixe quand la vidéo ne peut pas jouer

export default function HeroReel() {
  const [cur, setCur] = useState(0);
  const [mobile, setMobile] = useState<boolean | null>(null); // null = pas encore monté (rendu serveur)
  const [stills, setStills] = useState(false); // vrai si on reste en images fixes
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const curRef = useRef(0);
  const visible = useRef(true);

  useEffect(() => {
    const mq = matchMedia("(max-width: 767px)");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setMobile(mq.matches);
    if (reduce || saveData) setStills(true);
    const onMq = () => setMobile(mq.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  const go = (i: number) => {
    const n = (i + CLIPS.length) % CLIPS.length;
    curRef.current = n;
    setCur(n);
    if (stills) return;
    const v = vids.current[n];
    if (!v) return;
    try { v.currentTime = 0; } catch {}
    if (visible.current && !document.hidden) v.play().catch(() => setStills(true));
    // Prépare la suivante pendant que celle-ci joue.
    const nx = vids.current[(n + 1) % CLIPS.length];
    if (nx && nx.preload !== "auto") { nx.preload = "auto"; nx.load(); }
  };

  // Lecture : démarre la 1re vidéo, puis enchaîne un peu avant la fin de chacune.
  useEffect(() => {
    if (mobile === null || stills) return;
    const els = vids.current;
    const onTime = (e: Event) => {
      const v = e.currentTarget as HTMLVideoElement;
      if (els[curRef.current] !== v || !v.duration) return;
      if (v.duration - v.currentTime < FADE) go(curRef.current + 1);
    };
    const onEnded = (e: Event) => { if (els[curRef.current] === e.currentTarget) go(curRef.current + 1); };
    els.forEach((v) => { v?.addEventListener("timeupdate", onTime); v?.addEventListener("ended", onEnded); });
    const first = els[curRef.current];
    if (first) { first.preload = "auto"; first.play().catch(() => setStills(true)); }

    // Pause hors écran / onglet caché (batterie et données).
    const sync = () => {
      const v = els[curRef.current];
      if (!v) return;
      if (visible.current && !document.hidden) v.play().catch(() => {}); else v.pause();
    };
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; sync(); }, { threshold: 0.05 });
    if (root.current) io.observe(root.current);
    document.addEventListener("visibilitychange", sync);
    return () => {
      els.forEach((v) => { v?.removeEventListener("timeupdate", onTime); v?.removeEventListener("ended", onEnded); v?.pause(); });
      io.disconnect(); document.removeEventListener("visibilitychange", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, stills]);

  // Images fixes : fondu toutes les 6 s (sauf mouvement réduit, où l'on reste sur la 1re).
  useEffect(() => {
    if (!stills || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    vids.current.forEach((v) => v?.pause());
    const id = setInterval(() => { curRef.current = (curRef.current + 1) % CLIPS.length; setCur(curRef.current); }, STILL_MS);
    return () => clearInterval(id);
  }, [stills]);

  const sfx = mobile ? "-m" : "";
  return (
    <div ref={root} className={`gl-reel${stills ? " is-stills" : ""}`}>
      {CLIPS.map((c, i) => (
        <div key={c.id} className={`gl-reel-clip gl-reel-${c.id}${i === cur ? " is-on" : ""}`}>
          {mobile === null || stills ? (
            // eslint-disable-next-line @next/next/no-img-element
            <picture>
              <source media="(max-width: 767px)" srcSet={`/img/hero-${c.id}-m.webp`} />
              <img src={`/img/hero-${c.id}.webp`} alt="" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
            </picture>
          ) : (
            <video
              ref={(el) => { vids.current[i] = el; }}
              key={sfx}
              src={`/video/hero-${c.id}${sfx}.mp4`}
              poster={`/img/hero-${c.id}${sfx}.webp`}
              muted
              playsInline
              loop={false}
              preload={i === 0 ? "auto" : "none"}
              disablePictureInPicture
              aria-hidden
              tabIndex={-1}
            />
          )}
        </div>
      ))}
      <div className="gl-reel-veil" aria-hidden />
    </div>
  );
}
