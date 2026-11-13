"use client";
import LegalLinks from "@/components/LegalLinks";
import "./home.css";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { type TemplateId } from "@/lib/types";
import { cycleTemplate } from "@/lib/templateOrder";
import TemplateRows from "@/components/TemplateRows";
import HeroReel from "@/components/HeroReel";
import HomeReveal from "@/components/HomeReveal";
import { HomeDashboard, HomeFaq, HomeFeatures, HomeReviews, type HomeReview } from "@/components/HomeExtras";
import { lockScroll } from "@/lib/scrollLock";
import { LangSwitch, useLang, useT } from "@/components/I18n";
import { getLastInvite, spaceHref, type LastInvite } from "@/lib/lastInvite";

/** Page d'accueil « Nuit de gala » : poussière d'or, enveloppe qui s'ouvre au défilement, modèles en défilement horizontal. */
/* Pictogrammes au trait des 4 étapes : modèle, crayon, envoi, réponses. */
const STEP_ICONS: React.ReactNode[] = [
  <><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M10 5.5h4M9.5 12.5l2 2 3.5-4" /></>,
  <><path d="M4 20l4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20z" /><path d="M14.5 6.5l3 3" /></>,
  <><path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3z" /></>,
  <><path d="M4 5h16v11H9l-5 4z" /><path d="m8.5 10.5 2.2 2.2 4.8-4.7" /></>,
];

export default function HomeClient({publicPromo,order,price,reviews,reviewStats}:{publicPromo?:{code:string;label:string};order:TemplateId[];price:string|null;reviews:HomeReview[];reviewStats:{count:number;avg:number}}) {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
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
    const n = innerWidth < 640 ? 56 : 88;
    const P = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 3 + 1.4, s: Math.random() * 0.0004 + 0.0001, t: Math.random() * 6 }));
    const drawDust = (t: number) => {
      if (!alive) return;
      dx.clearRect(0, 0, W, H);
      for (const p of P) {
        p.y -= p.s; if (p.y < -0.02) p.y = 1.02;
        const y = (((p.y - scrollY0 * 0.00008) % 1) + 1) % 1;
        const x = p.x * W, py = y * H, radius = p.r * dpr;
        const alpha = 0.24 + 0.28 * (0.5 + 0.5 * Math.sin(t / 700 + p.t));
        dx.fillStyle = `rgba(143,108,54,${alpha})`;
        dx.beginPath(); dx.arc(x, py, radius, 0, 7); dx.fill();
        dx.fillStyle = `rgba(255,255,255,${alpha * 0.62})`;
        dx.beginPath(); dx.arc(x - radius * 0.3, py - radius * 0.32, radius * 0.3, 0, 7); dx.fill();
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

    // Défilement : barre de navigation (l'enveloppe est dans HomeReveal)
    const nav = document.getElementById("gl-nav")!;
    let ticking = false;
    const onScroll = () => {
      ticking = false; scrollY0 = scrollY;
      nav.classList.toggle("is-scrolled", scrollY > 40);
    };
    const sched = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
    const onResize = () => { resize(); sched(); };
    addEventListener("scroll", sched, { passive: true });
    addEventListener("resize", onResize);
    onScroll();

    // Titres des sections : apparition (sur-titre qui se resserre, titre qui monte du flou).
    document.querySelectorAll(".gl-wave :is(.gl-kicker, h2)").forEach((e) => { if (!e.closest(".gl-rv")) e.classList.add("gl-rv", "gl-rv-h"); });
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("is-on")), { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".gl-rv").forEach((e) => io.observe(e));

    // Fil doré des étapes : se remplit au fil du défilement.
    const steps = document.getElementById("gl-steps");
    let stepsTick = false;
    const fill = () => {
      stepsTick = false;
      if (!steps) return;
      const r = steps.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.62 - r.top) / Math.max(1, r.height)));
      steps.style.setProperty("--p", p.toFixed(3));
    };
    const onFill = () => { if (!stepsTick) { stepsTick = true; requestAnimationFrame(fill); } };
    addEventListener("scroll", onFill, { passive: true });
    fill();

    // Cartes en relief : s'inclinent vers la souris, reflet qui suit le pointeur (souris seulement, pas si animations réduites).
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tiltMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(".gl-tilt") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--rx", `${((0.5 - y) * 9).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * 11).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      el.classList.add("is-tilt");
    };
    const tiltOut = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(".gl-tilt") as HTMLElement | null;
      if (!el || (e.relatedTarget instanceof Node && el.contains(e.relatedTarget))) return;
      el.classList.remove("is-tilt"); el.style.removeProperty("--rx"); el.style.removeProperty("--ry");
    };
    if (fine) { document.addEventListener("pointermove", tiltMove, { passive: true }); document.addEventListener("pointerout", tiltOut); }

    return () => {
      alive = false; cancelAnimationFrame(raf); io.disconnect();
      removeEventListener("scroll", onFill);
      document.removeEventListener("pointermove", tiltMove); document.removeEventListener("pointerout", tiltOut);
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

  /* Démo en pop-up dans un téléphone, sans quitter l'accueil (plus de nouvel onglet). */
  const [demo, setDemo] = useState<TemplateId | null>(null);
  const cycle = (id: TemplateId, step: number) => cycleTemplate(order, id, step);
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
  return (
    <main className="site gl">
      <canvas id="gl-dust" className="gl-canvas gl-dust" aria-hidden />
      <canvas id="gl-fw" className="gl-canvas gl-fw" aria-hidden />

      <nav id="gl-nav" className="gl-nav">
        <Link href="/" className="gl-logo" aria-label={t.common.homeAria}><Logo height={32} onLight className="gl-logo-d" /><Logo height={32} onLight={false} className="gl-logo-l" /></Link>
        <div className="gl-nav-r"><a className="gl-navfaq" href="#faq">{h.navFaq}</a><Link className="gl-space" href={spaceHref(last)}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg><span>{t.find.mySpace}</span></Link><LangSwitch /><Link className="btn-s ghost" href="/creer">{h.create}</Link></div>
      </nav>

      {publicPromo&&<aside className="gl-promo" role="status"><span>{h.promoLine(publicPromo.label)}</span><strong>{publicPromo.code}</strong></aside>}

      <section className="gl-hero">
        <HeroReel />
        <div className="gl-hero-in">
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
          <div className="gl-back">{last ? <Link className="gl-back-link" href={spaceHref(last)}>{t.find.resume(last.names)} <span aria-hidden="true">→</span></Link> : <><span className="gl-back-label">{t.editor.already}</span><Link className="gl-back-link" href="/espace">{t.find.title} <span aria-hidden="true">→</span></Link></>}</div>
        </div>
        <div className="gl-cue" aria-hidden />
      </section>

      <HomeReveal />

      <section id="gl-hz" className="gl-hz gl-wave is-b">
        <div className="gl-hz-head"><h2>{h.chooseTitle} <span className="gold-text">{h.chooseGold}</span></h2></div>
        <TemplateRows marquee paused={demo !== null} names={["Léa", "Samuel"]} lang={lang} order={order} onPreview={setDemo} onCreate={(id, event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return; celebrate(`/creer?t=${id}`)(event); }} />
      </section>

      <HomeFeatures />
      <HomeDashboard />

      {/* « Comment ça marche » (refait le 13 nov. 2026, demandé par Glad) : en-tête, 4 étapes sur un fil doré qui se remplit
          au défilement, médaillons numérotés, cartes en relief qui arrivent de côté et s'inclinent sous la souris. */}
      <section className="gl-steps-band gl-wave is-b" aria-labelledby="gl-steps-t"><div className="wrap-site">
        <header className="gl-sec-head gl-rv">
          <div className="gl-kicker">{h.stepsKicker}</div>
          <h2 id="gl-steps-t">{h.stepsTitle} <span className="gold-text">{h.stepsGold}</span></h2>
          <p>{h.stepsSub}</p>
        </header>
        <ol className="gl-steps" id="gl-steps">
          <li className="gl-steps-line" aria-hidden="true"><i /></li>
          {h.steps.map(([n, st, p], i) => (
            <li key={n} className="gl-step gl-rv" style={{ "--i": i } as React.CSSProperties}>
              <div className="gl-step-n" aria-hidden="true"><span>{n}</span></div>
              <div className="gl-step-card gl-tilt">
                <span className="gl-step-ghost" aria-hidden="true">{n}</span>
                <span className="gl-step-ico" aria-hidden="true"><svg viewBox="0 0 24 24">{STEP_ICONS[i]}</svg></span>
                <h3>{st}</h3>
                <p>{p}</p>
                <span className="gl-shine" aria-hidden="true" />
              </div>
            </li>
          ))}
        </ol>
      </div></section>

      <HomeReviews reviews={reviews} stats={reviewStats} />
      <HomeFaq price={price} />

      <section className="gl-final gl-wave is-b">
        <div className="gl-kicker">{h.ready}</div>
        <h2>{h.finalTitle} <span className="gold-text">{h.finalGold}</span></h2>
        <a className="btn-s" href="/creer" onClick={celebrate("/creer")}>{h.ctaCreate}</a>
      </section>
      <footer className="gl-wave">{h.footer} · <a href="/espace">{t.find.title}</a><LegalLinks className="gl-legal" /></footer>

      {demo && shown && (
        /* Démo dans un téléphone, en pop-up par-dessus l'accueil (comme reveliastudio.com) : on la ferme et on reste où on était. */
        <div className="gl-demo" role="dialog" aria-modal="true" aria-label={t.common.demoOf(shown.name)} onClick={(e) => { if (e.target === e.currentTarget) setDemo(null); }}>
          <div className="gl-demo-panel">
            <button type="button" className="gl-demo-close" aria-label={h.demoClose} onClick={() => setDemo(null)}><span aria-hidden="true">×</span></button>
            <h2 className="gl-demo-title">{shown.name}</h2>
            <p className="gl-demo-hint">{h.demoHint}</p>
            <div className="gl-demo-row">
              <button type="button" className="gl-demo-arrow" aria-label={t.common.prevTpl} onClick={() => setDemo(cycle(demo, -1))}><span aria-hidden="true">‹</span></button>
              <DemoPhone id={demo} title={t.common.demoOf(shown.name)} />
              <button type="button" className="gl-demo-arrow" aria-label={t.common.nextTpl} onClick={() => setDemo(cycle(demo, 1))}><span aria-hidden="true">›</span></button>
            </div>
            <a className="btn-s gl-demo-cta" href={`/creer?t=${demo}`} onClick={celebrate(`/creer?t=${demo}`)}>{h.createWith}</a>
          </div>
        </div>
      )}
    </main>
  );
}

/** Écran du téléphone de la démo : l'invitation est affichée en vrai format iPhone (390 × 844) puis réduite à la taille
 *  du cadre, comme sur reveliastudio.com. Sinon elle se croit sur un tout petit écran court et ses éléments se décalent. */
const PHONE_W = 390, PHONE_H = 844;
function DemoPhone({ id, title }: { id: TemplateId; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / PHONE_W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div className="gl-demo-phone">
    <span className="gl-demo-island" aria-hidden="true" />
    <div className="gl-demo-screen" ref={ref}>
      {/* key : chaque modèle recharge la démo, qui rejoue son ouverture. */}
      {scale > 0 && <iframe key={id} src={`/demo/${id}?integre=1`} title={title} allow="accelerometer; gyroscope; autoplay"
        style={{ width: PHONE_W, height: PHONE_H, transform: `scale(${scale})` }} />}
    </div>
  </div>;
}
