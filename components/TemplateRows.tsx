"use client";

import { useEffect, useRef, useState } from "react";
import PhoneTemplate from "@/components/PhoneTemplate";
import { useT } from "@/components/I18n";
import { CATEGORIES, TEMPLATES, type CategoryId, type TemplateId } from "@/lib/types";
import type { Lang } from "@/lib/i18n";

export default function TemplateRows({ names, lang, compact = false, noAll = false, marquee = false, paused = false, selected, order, onPreview, onSelect, onCreate }: {
  names: [string, string];
  /** Ordre des modèles choisi dans l'admin (/admin/modeles) ; ordre du catalogue sinon. */
  order?: readonly TemplateId[];
  lang: Lang;
  compact?: boolean;
  /** Sans l'onglet « Tout » (éditeur) : on part de la catégorie du modèle choisi. */
  noAll?: boolean;
  /** Accueil : chaque rangée défile en continu de droite à gauche (comme un bandeau), pause au survol ou au toucher. */
  marquee?: boolean;
  /** Arrête le défilement (pop-up de démo ouverte). */
  paused?: boolean;
  selected?: TemplateId;
  onPreview: (id: TemplateId) => void;
  onSelect?: (id: TemplateId) => void;
  onCreate?: (id: TemplateId, event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const t = useT();
  const [filter, setFilter] = useState<CategoryId | "all">(() => {
    if (!noAll) return "all";
    const own = TEMPLATES.find((item) => item.id === selected)?.categories[0] as CategoryId | undefined;
    return own ?? CATEGORIES[0].id;
  });
  const ordered = (ids: TemplateId[]) => selected && ids.includes(selected) ? [selected, ...ids.filter((id) => id !== selected)] : ids;
  const rank = (id: TemplateId) => { const i = order ? order.indexOf(id) : -1; return i < 0 ? 999 + TEMPLATES.findIndex((item) => item.id === id) : i; };
  const idsFor = (category: CategoryId) => ordered(TEMPLATES.filter((item) => (item.categories as readonly CategoryId[]).includes(category)).map((item) => item.id as TemplateId).sort((a, b) => rank(a) - rank(b)));

  const card = (id: TemplateId, key: string, clone = false) => (
    <article key={key} className={`ph-card${selected === id ? " is-selected" : ""}`} aria-hidden={clone || undefined}>
      {selected === id && <span className="ph-selected">{t.editor.yourModel}</span>}
      <button className="ph-preview" type="button" tabIndex={clone ? -1 : undefined} aria-label={t.common.demoOf(t.templates[id].name)} onClick={() => { onSelect?.(id); onPreview(id); }}>
        <PhoneTemplate template={id} names={names} lang={lang} compact={compact} />
        <span className="ph-model-name">{t.templates[id].name}</span>
      </button>
      {!compact && <div className="ph-actions">
        <button type="button" className="btn-s ghost" tabIndex={clone ? -1 : undefined} onClick={() => onPreview(id)}>{t.home.demo}</button>
        <a className="btn-s" tabIndex={clone ? -1 : undefined} href={`/creer?t=${id}`} onClick={(event) => onCreate?.(id, event)}>{t.home.createMine}</a>
      </div>}
    </article>
  );
  const soon = [0, 1].map((n) => <div className="ph-card ph-soon" key={n}><div className="ph-soon-screen"><span aria-hidden="true">✦</span><strong>{t.gallery.soon}</strong></div><span className="ph-model-name">{t.gallery.soon}</span></div>);

  const row = (title: string, ids: TemplateId[], key: string) => (
    <section className="ph-section" key={key} aria-label={title}>
      <div className="ph-row-title"><h3>{title}</h3><span>{t.gallery.modelCount(ids.length)}</span></div>
      <Rail count={ids.length} labels={{ prev: t.gallery.prev, next: t.gallery.next, position: t.gallery.position }}>
        {ids.map((id) => card(id, id))}
        {ids.length === 0 && soon}
      </Rail>
    </section>
  );

  // « Tout » : une rangée par catégorie (plus de « coups de cœur », qui répétaient les modèles). Sinon la seule catégorie choisie.
  const shown = filter === "all" ? CATEGORIES.map(({ id }) => id) : [filter];
  const total = TEMPLATES.length;
  return <div className={`ph-gallery${compact ? " is-compact" : ""}`}>
    <div className="ph-filters" role="group" aria-label={t.gallery.filtersLabel}>
      {!noAll && <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
        <span className="ph-ico" aria-hidden="true">{ICONS.all}</span><span className="ph-lbl">{t.gallery.filters.all}</span><span className="ph-n">{total}</span>
      </button>}
      {CATEGORIES.map(({ id }) => {
        const n = idsFor(id).length;
        return <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
          <span className="ph-ico" aria-hidden="true">{ICONS[id]}</span><span className="ph-lbl">{t.gallery.filters[id]}</span><span className={`ph-n${n ? "" : " is-soon"}`}>{n || t.gallery.soon}</span>
        </button>;
      })}
    </div>
    {marquee
      // Accueil : une seule bande, qui ne fait défiler que la catégorie choisie (tous les modèles dans « Tout »).
      ? (() => {
        const ids = filter === "all" ? [...new Set(CATEGORIES.flatMap(({ id }) => idsFor(id)))] : idsFor(filter);
        const title = filter === "all" ? t.gallery.filters.all : t.gallery.rows[filter];
        return <section className="ph-section" aria-label={title}>
          {ids.length > 0
            ? <Marquee key={filter} paused={paused} ids={ids} render={card} labels={{ prev: t.gallery.prev, next: t.gallery.next }} />
            : <Rail count={0} labels={{ prev: t.gallery.prev, next: t.gallery.next, position: t.gallery.position }}>{soon}</Rail>}
        </section>;
      })()
      : shown.map((id) => row(t.gallery.rows[id], idsFor(id), id))}
  </div>;
}

/** Pictogrammes des catégories (trait fin, couleur du texte). */
const svg = (d: React.ReactNode) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const ICONS: Record<CategoryId | "all", React.ReactNode> = {
  all: svg(<><path d="M12 3c.6 4.2 1.8 5.4 6 6-4.2.6-5.4 1.8-6 6-.6-4.2-1.8-5.4-6-6 4.2-.6 5.4-1.8 6-6z" /><path d="M19 15.5c.25 1.6.75 2.1 2.3 2.3-1.55.25-2.05.75-2.3 2.3-.25-1.55-.75-2.05-2.3-2.3 1.55-.2 2.05-.7 2.3-2.3z" /></>),
  mariage: svg(<><circle cx="9" cy="14" r="5.2" /><circle cx="15" cy="14" r="5.2" /><path d="M13.2 6.2 15 4l1.8 2.2L15 8.4z" /></>),
  anniversaire: svg(<><path d="M4.5 20.5h15M5.5 20.5v-6.5a1.5 1.5 0 0 1 1.5-1.5h10a1.5 1.5 0 0 1 1.5 1.5v6.5" /><path d="M5.5 16.2c1.2 1 2.4 1 3.6 0s2.4-1 3.6 0 2.4 1 3.6 0 1.8-.9 2.2-.4" /><path d="M12 12.5V9.3" /><path d="M12 4.2c.9 1 1.2 1.8.9 2.5a1 1 0 0 1-1.8 0c-.3-.7 0-1.5.9-2.5z" /></>),
  "baby-shower": svg(<><path d="M10 4.5h4M10.5 4.5V7M13.5 4.5V7" /><path d="M9 7h6l.6 2.2a4 4 0 0 1 .4 1.8v8a2.5 2.5 0 0 1-2.5 2.5h-3A2.5 2.5 0 0 1 8 19v-8a4 4 0 0 1 .4-1.8z" /><path d="M8 13h3M8 16h2" /></>),
};
/** Rangée de modèles. Sur mobile : un téléphone par écran, glissement au doigt et flèches précédent / suivant. */
function Rail({ count, labels, children }: { count: number; labels: { prev: string; next: string; position: (i: number, n: number) => string }; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  const go = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: (index + dir) * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };
  const nav = count > 1;
  return <div className="ph-rail-wrap">
    <div className="ph-rail" ref={ref}>{children}</div>
    {nav && <>
      <button type="button" className="ph-arrow prev" aria-label={labels.prev} disabled={index <= 0} onClick={() => go(-1)}><span aria-hidden="true">‹</span></button>
      <button type="button" className="ph-arrow next" aria-label={labels.next} disabled={index >= count - 1} onClick={() => go(1)}><span aria-hidden="true">›</span></button>
      <p className="ph-count" aria-live="polite">{labels.position(Math.min(index, count - 1) + 1, count)}</p>
    </>}
  </div>;
}

/** Bandeau qui défile en continu (36 px/s, comme le site de référence), de droite à gauche.
 *  La liste est répétée pour remplir l'écran puis doublée : quand on a parcouru une moitié, on revient au début sans que ça se voie.
 *  On peut aussi le faire glisser au doigt ou à la molette, ou avancer d'un modèle avec les flèches ‹ › ; il s'arrête au survol,
 *  au toucher (reprend 2,5 s après), au clavier, hors de l'écran, onglet caché, pop-up ouverte, et ne bouge pas tout seul
 *  si l'utilisateur réduit les animations. */
const SPEED = 36;
type MarqueeState = { pos: number; hold: number; nudge: { from: number; d: number; t0: number } | null };
function Marquee({ ids, render, paused, labels }: { ids: TemplateId[]; render: (id: TemplateId, key: string, clone?: boolean) => React.ReactNode; paused: boolean; labels: { prev: string; next: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const S = useRef<MarqueeState>({ pos: 0, hold: 0, nudge: null });
  const reps = Math.max(1, Math.ceil(8 / ids.length));
  const set = Array.from({ length: reps }, (_, r) => ids.map((id) => ({ id, r }))).flat();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = S.current;
    s.pos = el.scrollLeft; s.hold = 0; s.nudge = null;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const half = () => {
      const a = el.children[0] as HTMLElement | undefined, b = el.children[set.length] as HTMLElement | undefined;
      return a && b ? b.offsetLeft - a.offsetLeft : el.scrollWidth / 2;
    };
    let last = 0, hover = false, focus = false, seen = true, raf = 0, ours = false;
    const wrap = () => {
      const L = half();
      if (L <= 0) return;
      const shift = s.pos >= L ? -L : s.pos < 0 ? L : 0;
      if (!shift) return;
      s.pos += shift;
      if (s.nudge) s.nudge.from += shift;
    };
    const ease = (k: number) => 1 - Math.pow(1 - k, 3);
    const tick = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 0;
      last = now;
      let moved = false;
      if (s.nudge) {
        const k = Math.min(1, (now - s.nudge.t0) / 450);
        s.pos = s.nudge.from + s.nudge.d * ease(k);
        if (k >= 1) s.nudge = null;
        moved = true;
      } else if (!reduce && !pausedRef.current && !hover && !focus && seen && !document.hidden && now > s.hold) {
        s.pos += (SPEED * dt) / 1000;
        moved = true;
      }
      if (moved) { wrap(); ours = true; el.scrollLeft = s.pos; }
      raf = requestAnimationFrame(tick);
    };
    // Défilement de l'utilisateur (doigt, molette) : on reprend sa position et on attend un peu avant de repartir.
    const onScroll = () => {
      if (ours) { ours = false; return; }
      if (s.nudge) return;
      s.pos = el.scrollLeft;
      const L = half();
      if (L > 0 && (s.pos >= L || s.pos <= 0)) { s.pos = s.pos <= 0 ? s.pos + L : s.pos - L; ours = true; el.scrollLeft = s.pos; }
      s.hold = Math.max(s.hold, performance.now() + 1500);
    };
    const touch = () => { s.hold = performance.now() + 2500; s.nudge = null; };
    const enter = (e: PointerEvent) => { if (e.pointerType === "mouse") hover = true; };
    const leave = (e: PointerEvent) => { if (e.pointerType === "mouse") hover = false; };
    const fin = () => { focus = el.matches(":focus-within"); };
    const fout = () => setTimeout(fin, 0);
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; });
    io.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerdown", touch, { passive: true });
    el.addEventListener("wheel", touch, { passive: true });
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("focusin", fin);
    el.addEventListener("focusout", fout);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      el.removeEventListener("scroll", onScroll); el.removeEventListener("pointerdown", touch); el.removeEventListener("wheel", touch);
      el.removeEventListener("pointerenter", enter); el.removeEventListener("pointerleave", leave);
      el.removeEventListener("focusin", fin); el.removeEventListener("focusout", fout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);
  // Flèches : avance ou recule d'un modèle (on peut cliquer plusieurs fois de suite), puis le défilement reprend 2,5 s plus tard.
  const go = (dir: number) => {
    const el = ref.current, s = S.current;
    if (!el) return;
    const a = el.children[0] as HTMLElement | undefined, b = el.children[1] as HTMLElement | undefined;
    const step = a && b ? b.offsetLeft - a.offsetLeft : 240;
    const now = performance.now();
    const target = (s.nudge ? s.nudge.from + s.nudge.d : s.pos) + dir * step;
    s.nudge = { from: s.pos, d: target - s.pos, t0: now };
    s.hold = now + 2500;
  };
  return <div className="ph-marquee-wrap">
    <div className="ph-marquee" ref={ref}>
      {set.map(({ id, r }) => render(id, `a${r}-${id}`, r > 0))}
      {set.map(({ id, r }) => render(id, `b${r}-${id}`, true))}
    </div>
    <button type="button" className="ph-marquee-arrow prev" aria-label={labels.prev} onClick={() => go(-1)}><span aria-hidden="true">‹</span></button>
    <button type="button" className="ph-marquee-arrow next" aria-label={labels.next} onClick={() => go(1)}><span aria-hidden="true">›</span></button>
  </div>;
}
