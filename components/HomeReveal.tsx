"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/I18n";

/**
 * Accueil, section sous le héros : « Du papier à l'écran » (choisie par Glad le 9 nov. 2026).
 * Au défilement : l'enveloppe 3D E-carte Studio (sceau ES) s'illumine, la carte en sort,
 * passe dans un téléphone doré qui montre le modèle « Le domaine », avec compte à rebours et réponses qui arrivent.
 * Progression pilotée par des variables CSS (--a ouverture, --b carte, --c passage au téléphone, --d écran).
 * Mouvement réduit : état final fixe, sans section épinglée.
 */
const pad = (n: number) => String(n).padStart(2, "0");

export default function HomeReveal() {
  const t = useT();
  const h = t.home;
  const ref = useRef<HTMLElement>(null);
  // Compte à rebours fictif mais vivant : toujours ~120 jours devant, quelle que soit la date de visite.
  const [left, setLeft] = useState<number[] | null>(null);

  useEffect(() => {
    const el = ref.current!, stage = el.querySelector<HTMLElement>(".gl-stage")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = Date.now() + ((120 * 24 + 8) * 3600 + 45 * 60 + 12) * 1000;
    const tick = () => { let s = Math.max(0, Math.floor((target - Date.now()) / 1000)); const d = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; setLeft([d, hh, Math.floor(s / 60), s % 60]); };
    tick();
    let timer = 0, visible = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; clearInterval(timer); if (visible && !reduce) timer = window.setInterval(tick, 1000); });
    io.observe(el);
    if (reduce) { el.classList.add("is-still"); for (const k of ["--a", "--b", "--c", "--d"]) stage.style.setProperty(k, "1"); stage.classList.add("r1", "r2", "r3"); return () => io.disconnect(); }

    const cl = (x: number) => Math.min(1, Math.max(0, x));
    let ticking = false;
    const run = () => {
      ticking = false;
      const r = el.getBoundingClientRect(), span = r.height - innerHeight;
      // La scène démarre dès que la section entre par le bas : l'ouverture commence pendant qu'on quitte le héros.
      const p = cl((innerHeight * 0.55 - r.top) / (span + innerHeight * 0.55));
      const a = cl(p / 0.3), b = cl((p - 0.22) / 0.24), c = cl((p - 0.42) / 0.26), d = cl((p - 0.64) / 0.28);
      stage.style.setProperty("--a", a.toFixed(3)); stage.style.setProperty("--b", b.toFixed(3));
      stage.style.setProperty("--c", c.toFixed(3)); stage.style.setProperty("--d", d.toFixed(3));
      stage.classList.toggle("is-open", a > 0.5);
      stage.classList.toggle("r1", d > 0.35); stage.classList.toggle("r2", d > 0.62); stage.classList.toggle("r3", d > 0.88);
    };
    const sched = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
    addEventListener("scroll", sched, { passive: true }); addEventListener("resize", sched); run();
    return () => { io.disconnect(); clearInterval(timer); removeEventListener("scroll", sched); removeEventListener("resize", sched); };
  }, []);

  return (
    <section ref={ref} id="gl-pin" className="gl-pin" aria-label={h.pinAria}>
      <div className="gl-stick">
        <div className="gl-satin" aria-hidden />
        <div className="gl-stage" aria-hidden>
          <div className="gl-ring"><i /></div>
          <div className="gl-env">
            {/* Enveloppe 3D de marque (même dessin que l'aperçu des liens) : scripts/accueil-enveloppe.py */}
            <img className="gl-env-l" src="/img/accueil-env-back.webp" alt="" />
            <div className="gl-env-pocket">
              <div className="gl-env-card">
                <img src="/img/accueil-env-card.webp" alt="" />
                <div className="gl-env-txt"><small>{h.envKicker}</small><b>Léa &amp; Samuel</b><small>{h.envDate}</small></div>
              </div>
            </div>
            <img className="gl-env-l" src="/img/accueil-env-front.webp" alt="" />
          </div>
          <div className="gl-beam" />
          <div className="gl-phone">
            <div className="gl-phone-scr">
              <div className="gl-ph-status"><span>9:41</span><svg viewBox="0 0 66 12"><path d="M1 9h3v3H1zM6 6.5h3V12H6zM11 4h3v8h-3zM16 1.5h3V12h-3z" /><path d="M33 3.2a10 10 0 0 1 11.6 0l-1.5 1.7a7.6 7.6 0 0 0-8.6 0zM35.4 6a6 6 0 0 1 6.8 0l-1.6 1.8a3.6 3.6 0 0 0-3.6 0zM38.8 9.4l-1.3 1.5h2.6z" /><rect x="48.5" y="1.5" width="15" height="9" rx="2.6" fill="none" stroke="currentColor" strokeOpacity=".45" /><rect x="50" y="3" width="10" height="6" rx="1.4" /><path d="M64.6 4.6v2.8c.8-.3.8-2.5 0-2.8z" opacity=".45" /></svg></div>
              <div className="gl-ph-head"><small>{h.envKicker}</small><b>Léa &amp; Samuel</b><small>{h.envDate}</small></div>
              <div className="gl-ph-cd">{(left ?? [120, 8, 45, 12]).map((v, i) => <span key={i}><b>{i ? pad(v) : v}</b><small>{h.cdUnits[i]}</small></span>)}</div>
              <div className="gl-ph-rsvp">
                <p className="gl-ph-live"><i />{h.rsvpLive}</p>
                {h.rsvpDemo.map((r, i) => <div key={i} className={`gl-ph-msg m${i + 1}`}><span className="gl-ph-av">{r.n[0]}</span><span><b>{r.n}</b>{r.m}</span><em>✓</em></div>)}
              </div>
              <i className="gl-ph-glass" />
            </div>
          </div>
        </div>
        <div className="gl-pin-cap">
          <div className="gl-kicker">{h.scroll}</div>
          <h2>{h.pinTitle} <span className="gold-text">{h.pinTitleGold}</span></h2>
          <p>{h.pinLead}</p>
        </div>
      </div>
    </section>
  );
}
