"use client";
import "./home.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";
import { TEMPLATES } from "@/lib/types";

const TITLE = "Faites briller";

/** Page d'accueil « Nuit de gala » : poussière d'or, enveloppe qui s'ouvre au défilement, modèles en défilement horizontal. */
export default function HomeClient() {
  const router = useRouter();
  const burstRef = useRef<(x: number, y: number) => void>(() => {});

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const dust = document.getElementById("gl-dust") as HTMLCanvasElement;
    const fw = document.getElementById("gl-fw") as HTMLCanvasElement;
    const dx = dust.getContext("2d")!, fx = fw.getContext("2d")!;
    let W = 0, H = 0, raf = 0, alive = true, scrollY0 = 0;
    const resize = () => { W = dust.width = fw.width = innerWidth * dpr; H = dust.height = fw.height = innerHeight * dpr; };
    resize();

    // Poussière d'or (moins de particules sur les petits écrans)
    const n = innerWidth < 640 ? 40 : 70;
    const P = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + 0.4, s: Math.random() * 0.0004 + 0.0001, t: Math.random() * 6 }));
    const drawDust = (t: number) => {
      if (!alive) return;
      dx.clearRect(0, 0, W, H);
      for (const p of P) {
        p.y -= p.s; if (p.y < -0.02) p.y = 1.02;
        const y = (((p.y - scrollY0 * 0.00008) % 1) + 1) % 1;
        dx.fillStyle = `rgba(243,215,155,${0.35 + 0.35 * Math.sin(t / 700 + p.t)})`;
        dx.beginPath(); dx.arc(p.x * W, y * H, p.r * dpr, 0, 7); dx.fill();
      }
      if (!reduce && !document.hidden) raf = requestAnimationFrame(drawDust);
    };
    raf = requestAnimationFrame(drawDust);
    const onVis = () => { if (!document.hidden && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(drawDust); } };
    document.addEventListener("visibilitychange", onVis);

    // Feu d'artifice doré
    let S: { x: number; y: number; vx: number; vy: number; l: number; c: string }[] = [];
    const loop = () => {
      fx.clearRect(0, 0, W, H);
      S = S.filter((s) => s.l > 0);
      for (const s of S) { s.x += s.vx; s.y += s.vy; s.vy += 0.15; s.vx *= 0.98; s.l -= 0.012; fx.fillStyle = `rgba(${s.c},${s.l})`; fx.fillRect(s.x, s.y, 3 * dpr, 3 * dpr); }
      if (S.length && alive) requestAnimationFrame(loop);
    };
    burstRef.current = (x, y) => {
      if (reduce) return;
      const was = S.length;
      for (let i = 0; i < 90; i++) { const a = Math.random() * Math.PI * 2, v = (Math.random() * 7 + 2) * dpr / 1.5; S.push({ x: x * dpr, y: y * dpr, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, l: 1, c: Math.random() < 0.7 ? "243,215,155" : "231,166,182" }); }
      if (!was) loop();
    };

    // Défilement : enveloppe, défilement horizontal, barre de navigation
    const nav = document.getElementById("gl-nav")!, pin = document.getElementById("gl-pin")!, env = document.getElementById("gl-env")!;
    const hz = document.getElementById("gl-hz")!, track = document.getElementById("gl-track")!;
    const cards = [...track.querySelectorAll<HTMLElement>(".gl-tpl")];
    const prog = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };
    let ticking = false;
    const onScroll = () => {
      ticking = false; scrollY0 = scrollY;
      nav.classList.toggle("is-scrolled", scrollY > 40);
      const p = prog(pin), p1 = Math.min(1, p / 0.45), p2 = Math.max(0, Math.min(1, (p - 0.4) / 0.45));
      env.style.setProperty("--p1", String(p1)); env.style.setProperty("--p2", String(p2)); env.style.setProperty("--z", p1 > 0.5 ? "3" : "0");
      const max = track.scrollWidth - innerWidth;
      track.style.transform = `translateX(${-prog(hz) * Math.max(0, max)}px)`;
      for (const c of cards) {
        const r = c.getBoundingClientRect(), d = (r.left + r.width / 2 - innerWidth / 2) / innerWidth;
        c.style.setProperty("--ry", `${d * -14}deg`);
        c.querySelector("img")?.style.setProperty("--px", `${d * -30}px`);
      }
    };
    const sched = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
    const onResize = () => { resize(); sched(); };
    addEventListener("scroll", sched, { passive: true });
    addEventListener("resize", onResize);
    onScroll();

    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("is-on")), { threshold: 0.3 });
    document.querySelectorAll(".gl-rv").forEach((e) => io.observe(e));

    return () => {
      alive = false; cancelAnimationFrame(raf); io.disconnect();
      removeEventListener("scroll", sched); removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  /** Petit feu d'artifice puis navigation (immédiate si l'utilisateur réduit les animations). */
  const celebrate = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    burstRef.current(r.left + r.width / 2, r.top);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => router.push(href), reduce ? 0 : 550);
  };

  return (
    <main className="site gl">
      <canvas id="gl-dust" className="gl-canvas gl-dust" aria-hidden />
      <canvas id="gl-fw" className="gl-canvas gl-fw" aria-hidden />

      <nav id="gl-nav" className="gl-nav">
        <Link href="/" className="gl-logo gold-text">Rezervely</Link>
        <Link className="btn-s ghost" href="/creer">Créer</Link>
      </nav>

      <section className="gl-hero">
        <div>
          <div className="gl-kicker">Invitations de mariage animées</div>
          <h1 aria-label="Faites briller votre oui">
            <span aria-hidden>
              {[...TITLE].map((ch, i) => (
                <span key={i} className="gl-letter" style={{ animationDelay: `${i * 45}ms` }}>{ch === " " ? " " : ch}</span>
              ))}
              <span className="gl-script gold-text gl-rise" style={{ animationDelay: `${TITLE.length * 45 + 200}ms, 0s` }}>votre oui</span>
            </span>
          </h1>
          <p>Une enveloppe qui s'ouvre, une pluie d'or, une date qu'on gratte du bout du doigt. Vos invités ne l'oublieront pas.</p>
          <div className="gl-ctas">
            <a className="btn-s" href="/creer" onClick={celebrate("/creer")}>Créer mon invitation</a>
            <a className="btn-s ghost" href="#gl-hz">Voir les modèles</a>
          </div>
        </div>
        <div className="gl-cue" aria-hidden />
      </section>

      <section id="gl-pin" className="gl-pin" aria-label="Aperçu de l'ouverture">
        <div className="gl-stick">
          <div id="gl-env" className="gl-env" aria-hidden>
            <div className="gl-env-back" />
            <div className="gl-env-card"><div><small>Nous nous marions</small><b>Léa &amp; Samuel</b><small>13 juin 2027</small></div></div>
            <div className="gl-env-front" /><div className="gl-env-flap" /><div className="gl-env-seal">L&amp;S</div>
          </div>
          <div className="gl-pin-cap"><div className="gl-kicker">Défilez</div><h2>Elle s'ouvre <span className="gold-text">sous leurs yeux</span></h2></div>
        </div>
      </section>

      <div className="gl-marq" aria-hidden>
        <div>
          {[0, 1].map((k) => (
            <span key={k}>{["Lac aux cygnes", "Nuit dorée", "Jardin de nuit", "Date à gratter", "Réponses en direct"].map((w) => (<span key={w}>{w} <i>&amp;</i> </span>))}</span>
          ))}
        </div>
      </div>

      <section id="gl-hz" className="gl-hz">
        <div className="gl-stick">
          <div className="gl-hz-head"><div className="gl-kicker">Trois univers</div><h2>Choisissez <span className="gold-text">votre soirée</span></h2></div>
          <div id="gl-track" className="gl-track">
            {TEMPLATES.map((t, i) => (
              <article key={t.id} className="gl-tpl">
                <img src={t.cover} alt="" loading="lazy" />
                <span className="gl-num">0{i + 1}</span>
                <div className="gl-tpl-ov">
                  <h3>{t.name}</h3>
                  <p>{t.tagline}</p>
                  <div className="gl-row">
                    <a className="btn-s" href={`/creer?t=${t.id}`} onClick={celebrate(`/creer?t=${t.id}`)}>Créer la mienne</a>
                    <Link className="btn-s ghost" href={`/demo/${t.id}`} target="_blank">Démo</Link>
                  </div>
                </div>
              </article>
            ))}
            <article className="gl-tpl is-end"><div><div className="gl-kicker">Bientôt</div><h3 style={{ marginTop: 12 }}>D'autres univers arrivent</h3><p>Le catalogue s'agrandit.</p></div></article>
          </div>
        </div>
      </section>

      <section className="wrap-site gl-steps">
        {[
          ["01", "Votre style, vos mots", "Prénoms, date, photo, verset, dress code : l'aperçu se met à jour pendant que vous écrivez."],
          ["02", "Un lien, sur WhatsApp", "Pas d'appli à installer. Vos invités ouvrent le lien et l'invitation prend vie."],
          ["03", "Les réponses arrivent", "Présents, absents, nombre de personnes, petits mots : tout est dans votre espace, exportable."],
        ].map(([n, h, p]) => (
          <div key={n} className="gl-step gl-rv"><div className="gl-n gold-text">{n}</div><div><h3>{h}</h3><p>{p}</p></div></div>
        ))}
      </section>

      <section className="gl-final">
        <div className="gl-kicker">Prêts ?</div>
        <h2>Que la fête <span className="gold-text">commence</span></h2>
        <a className="btn-s" href="/creer" onClick={celebrate("/creer")}>Créer mon invitation</a>
      </section>
      <footer>Rezervely · Invitations de mariage animées</footer>
    </main>
  );
}
