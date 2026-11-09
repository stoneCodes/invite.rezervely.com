"use client";

import { useEffect, useRef, useState } from "react";
import PhoneTemplate from "@/components/PhoneTemplate";
import { useT } from "@/components/I18n";
import { CATEGORIES, TEMPLATES, type CategoryId, type TemplateId } from "@/lib/types";
import type { Lang } from "@/lib/i18n";

export default function TemplateRows({ names, lang, compact = false, selected, onPreview, onSelect, onCreate }: {
  names: [string, string];
  lang: Lang;
  compact?: boolean;
  selected?: TemplateId;
  onPreview: (id: TemplateId) => void;
  onSelect?: (id: TemplateId) => void;
  onCreate?: (id: TemplateId, event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const t = useT();
  const [filter, setFilter] = useState<CategoryId | "all">("all");
  const ordered = (ids: TemplateId[]) => selected && ids.includes(selected) ? [selected, ...ids.filter((id) => id !== selected)] : ids;
  const idsFor = (category: CategoryId) => ordered(TEMPLATES.filter((item) => (item.categories as readonly CategoryId[]).includes(category)).map((item) => item.id));

  const row = (title: string, ids: TemplateId[], key: string) => (
    <section className="ph-section" key={key} aria-label={title}>
      <div className="ph-row-title"><h3>{title}</h3><span>{t.gallery.modelCount(ids.length)}</span></div>
      <Rail count={ids.length} labels={{ prev: t.gallery.prev, next: t.gallery.next, position: t.gallery.position }}>
        {ids.map((id) => <article key={id} className={`ph-card${selected === id ? " is-selected" : ""}`}>
          {selected === id && <span className="ph-selected">{t.editor.yourModel}</span>}
          <button className="ph-preview" type="button" aria-label={t.common.demoOf(t.templates[id].name)} onClick={() => { onSelect?.(id); onPreview(id); }}>
            <PhoneTemplate template={id} names={names} lang={lang} compact={compact} />
            <span className="ph-model-name">{t.templates[id].name}</span>
          </button>
          {!compact && <div className="ph-actions">
            <button type="button" className="btn-s ghost" onClick={() => onPreview(id)}>{t.home.demo}</button>
            <a className="btn-s" href={`/creer?t=${id}`} onClick={(event) => onCreate?.(id, event)}>{t.home.createMine}</a>
          </div>}
        </article>)}
        {ids.length === 0 && <>
          {[0, 1].map((n) => <div className="ph-card ph-soon" key={n}><div className="ph-soon-screen"><span aria-hidden="true">✦</span><strong>{t.gallery.soon}</strong></div><span className="ph-model-name">{t.gallery.soon}</span></div>)}
        </>}
      </Rail>
    </section>
  );

  // « Tout » : une rangée par catégorie (plus de « coups de cœur », qui répétaient les modèles). Sinon la seule catégorie choisie.
  const shown = filter === "all" ? CATEGORIES.map(({ id }) => id) : [filter];
  const total = TEMPLATES.length;
  return <div className={`ph-gallery${compact ? " is-compact" : ""}`}>
    <div className="ph-filters" role="group" aria-label={t.gallery.filtersLabel}>
      <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
        <span className="ph-ico" aria-hidden="true">{ICONS.all}</span><span className="ph-lbl">{t.gallery.filters.all}</span><span className="ph-n">{total}</span>
      </button>
      {CATEGORIES.map(({ id }) => {
        const n = idsFor(id).length;
        return <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
          <span className="ph-ico" aria-hidden="true">{ICONS[id]}</span><span className="ph-lbl">{t.gallery.filters[id]}</span><span className={`ph-n${n ? "" : " is-soon"}`}>{n || t.gallery.soon}</span>
        </button>;
      })}
    </div>
    {shown.map((id) => row(t.gallery.rows[id], idsFor(id), id))}
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
