"use client";
import LegalLinks from "@/components/LegalLinks";
import "./home.css";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { TEMPLATES, type TemplateId } from "@/lib/types";
import { lockScroll } from "@/lib/scrollLock";
import { LangSwitch, useT } from "@/components/I18n";
import { getLastInvite, spaceHref, type LastInvite } from "@/lib/lastInvite";

/** Page d'accueil « Nuit de gala » : poussière d'or, enveloppe qui s'ouvre au défilement, modèles en défilement horizontal. */
export default function HomeClient({publicPromo}:{publicPromo?:{code:string;label:string}}) {
  const router = useRouter();
  const t = useT();
  const h = t.home;
  const TITLE = h.title;
  // Dernière invitation créée sur cet appareil (lu après le montage : le stockage n'existe pas côté serveur).
  const [last, setLast] = useState<LastInvite | null>(null);
  useEffect(() => { setLast(getLastInvite()); }, []);
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
        const side = Math.max(-1.25, Math.min(1.25, d));
        const focus = Math.max(0, Math.min(1, 1 - Math.abs(d) * 1.7));
        c.style.setProperty("--focus", reduce ? "1" : String(focus));
        c.style.setProperty("--ry", reduce ? "0deg" : `${side * -38}deg`);
        c.style.setProperty("--scale", reduce ? "1" : String(0.68 + focus * 0.55));
        c.style.setProperty("--depth", reduce ? "0px" : `${focus * 220 - 130}px`);
        c.style.setProperty("--lift", reduce ? "0px" : `${(1 - focus) * 30}px`);
        c.classList.toggle("is-focused", !reduce && focus > 0.72);
        c.querySelector("img")?.style.setProperty("--px", reduce ? "0px" : `${side * -80}px`);
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

  /* Démo en pop-up plein écran, sans quitter l'accueil (plus de nouvel onglet). */
  const [demo, setDemo] = useState<TemplateId | null>(null);
  const cycle = (id: TemplateId, step: number) => {
    const i = TEMPLATES.findIndex((t) => t.id === id);
    return TEMPLATES[(i + step + TEMPLATES.length) % TEMPLATES.length].id as TemplateId;
  };
  useEffect(() => {
    if (!demo) return;
    const unlock = lockScroll();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDemo(null);
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") setDemo((d) => (d ? cycle(d, e.key === "ArrowRight" ? 1 : -1) : d));
    };
    window.addEventListener("keydown", key);
    return () => { unlock(); window.removeEventListener("keydown", key); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo !== null]);
  const shown = demo ? { id: demo, ...t.templates[demo] } : null;
  const advanceTemplate = () => {
    const section = document.getElementById("gl-hz");
    if (!section) return;
    const step = Math.max(240, (section.offsetHeight - window.innerHeight) / Math.max(1, TEMPLATES.length));
    window.scrollBy({ top: step, behavior: "smooth" });
  };

  return (
    <main className="site gl">
      <canvas id="gl-dust" className="gl-canvas gl-dust" aria-hidden />
      <canvas id="gl-fw" className="gl-canvas gl-fw" aria-hidden />

      <nav id="gl-nav" className="gl-nav">
        <Link href="/" className="gl-logo" aria-label={t.common.homeAria}><Logo height={26} /></Link>
        <div className="gl-nav-r"><Link className="gl-space" href={spaceHref(last)}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg><span>{t.find.mySpace}</span></Link><LangSwitch /><Link className="btn-s ghost" href="/creer">{h.create}</Link></div>
      </nav>

      {publicPromo&&<aside className="gl-promo" role="status"><span>{h.promoLine(publicPromo.label)}</span><strong>{publicPromo.code}</strong></aside>}

      <section className="gl-hero">
        <div>
          <div className="gl-kicker">{h.kicker}</div>
          <h1 aria-label={`${h.title} ${h.titleScript}`}>
            <span aria-hidden>
              {[...TITLE].map((ch, i) => (
                <span key={i} className="gl-letter" style={{ animationDelay: `${i * 45}ms` }}>{ch === " " ? " " : ch}</span>
              ))}
              <span className="gl-script gold-text gl-rise" style={{ animationDelay: `${TITLE.length * 45 + 200}ms, 0s` }}>{h.titleScript}</span>
            </span>
          </h1>
          <p>{h.lead}</p>
          <div className="gl-ctas">
            <a className="btn-s" href="/creer" onClick={celebrate("/creer")}>{h.ctaCreate}</a>
            <a className="btn-s ghost" href="#gl-hz">{h.ctaModels}</a>
          </div>
          <p className="gl-back">{last ? <Link href={spaceHref(last)}>{t.find.resume(last.names)} →</Link> : <>{t.editor.already} <Link href="/espace">{t.find.title}</Link></>}</p>
        </div>
        <div className="gl-cue" aria-hidden />
      </section>

      <section id="gl-pin" className="gl-pin" aria-label={h.pinAria}>
        <div className="gl-stick">
          <div id="gl-env" className="gl-env" aria-hidden>
            <div className="gl-env-back" />
            <div className="gl-env-card"><div><small>{h.envKicker}</small><b>Léa &amp; Samuel</b><small>{h.envDate}</small></div></div>
            <div className="gl-env-front" /><div className="gl-env-flap" /><div className="gl-env-seal">L&amp;S</div>
          </div>
          <div className="gl-pin-cap"><div className="gl-kicker">{h.scroll}</div><h2>{h.pinTitle} <span className="gold-text">{h.pinTitleGold}</span></h2></div>
        </div>
      </section>

      <div className="gl-marq" aria-hidden>
        <div>
          {[0, 1].map((k) => (
            <span key={k}>{h.marquee.map((w) => (<span key={w}>{w} <i>&amp;</i> </span>))}</span>
          ))}
        </div>
      </div>

      <section id="gl-hz" className="gl-hz">
        <div className="gl-stick">
          <div className="gl-hz-head"><div className="gl-kicker">{h.worlds(TEMPLATES.length)}</div><h2>{h.chooseTitle} <span className="gold-text">{h.chooseGold}</span></h2></div>
          <button className="gl-hz-next" type="button" onClick={advanceTemplate} aria-label={h.nextTemplate}><span aria-hidden="true">↓</span><span>{h.nextTemplate}</span></button>
          <div id="gl-track" className="gl-track">
            {TEMPLATES.map((tp, i) => (
              <article key={tp.id} className="gl-tpl">
                <img src={tp.cover} alt="" loading="lazy" />
                <span className="gl-num">0{i + 1}</span>
                <div className="gl-tpl-ov">
                  <h3>{t.templates[tp.id].name}</h3>
                  <p>{t.templates[tp.id].tagline}</p>
                  <div className="gl-row">
                    <a className="btn-s" href={`/creer?t=${tp.id}`} onClick={celebrate(`/creer?t=${tp.id}`)}>{h.createMine}</a>
                    <a className="btn-s ghost" href={`/demo/${tp.id}`} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); setDemo(tp.id as TemplateId); }}>{h.demo}</a>
                  </div>
                </div>
              </article>
            ))}
            <article className="gl-tpl is-end"><div><div className="gl-kicker">{h.soon}</div><h3 style={{ marginTop: 12 }}>{h.soonTitle}</h3><p>{h.soonText}</p></div></article>
          </div>
        </div>
      </section>

      <section className="wrap-site gl-steps">
        {h.steps.map(([n, st, p]) => (
          <div key={n} className="gl-step gl-rv"><div className="gl-n gold-text">{n}</div><div><h3>{st}</h3><p>{p}</p></div></div>
        ))}
      </section>

      <section className="gl-final">
        <div className="gl-kicker">{h.ready}</div>
        <h2>{h.finalTitle} <span className="gold-text">{h.finalGold}</span></h2>
        <a className="btn-s" href="/creer" onClick={celebrate("/creer")}>{h.ctaCreate}</a>
      </section>
      <footer>{h.footer} · <a href="/espace">{t.find.title}</a><LegalLinks className="gl-legal" /></footer>

      {demo && shown && (
        <div className="ed-full" role="dialog" aria-modal="true" aria-label={t.common.demoOf(shown.name)}>
          <div className="ed-full-bar">
            <button type="button" className="ed-full-back" onClick={() => setDemo(null)}><span aria-hidden="true">←</span> <span>{t.common.backHome}</span></button>
            <div className="ed-full-nav">
              <button type="button" aria-label={t.common.prevTpl} onClick={() => setDemo(cycle(demo, -1))}>‹</button>
              <div className="ed-full-name">
                <strong>{shown.name}</strong>
                <small>{t.common.tplOf(TEMPLATES.findIndex((x) => x.id === demo) + 1, TEMPLATES.length)} · {h.demoSub}</small>
              </div>
              <button type="button" aria-label={t.common.nextTpl} onClick={() => setDemo(cycle(demo, 1))}>›</button>
            </div>
            <a className="btn-s" href={`/creer?t=${demo}`} onClick={celebrate(`/creer?t=${demo}`)}><span className="lbl-lg">{h.createWith}</span><span className="lbl-sm">{h.create}</span></a>
          </div>
          {/* key : chaque modèle recharge la démo, qui rejoue son ouverture. */}
          <iframe key={demo} src={`/demo/${demo}?integre=1`} title={t.common.demoOf(shown.name)} allow="accelerometer; gyroscope" />
        </div>
      )}
    </main>
  );
}
