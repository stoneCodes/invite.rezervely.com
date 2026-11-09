"use client";

import { useState } from "react";
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
  const [showAll, setShowAll] = useState(false);
  const ordered = (ids: TemplateId[]) => selected && ids.includes(selected) ? [selected, ...ids.filter((id) => id !== selected)] : ids;
  const idsFor = (category: CategoryId) => ordered(TEMPLATES.filter((item) => (item.categories as readonly CategoryId[]).includes(category)).map((item) => item.id));
  const featured = ordered(TEMPLATES.filter((item) => item.featured).map((item) => item.id));
  const remaining = (category: CategoryId) => idsFor(category).filter((id) => !featured.includes(id));

  const row = (title: string, ids: TemplateId[], key: string) => (
    <section className="ph-section" key={key} aria-label={title}>
      <div className="ph-row-title"><h3>{title}</h3><span>{t.gallery.modelCount(ids.length)}</span></div>
      <div className="ph-rail">
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
      </div>
    </section>
  );

  return <div className={`ph-gallery${compact ? " is-compact" : ""}`}>
    <div className="ph-filters" role="group" aria-label={t.gallery.rows.featured}>
      <button type="button" aria-pressed={filter === "all"} onClick={() => { setFilter("all"); setShowAll(false); }}>{t.gallery.filters.all}</button>
      {CATEGORIES.map(({ id }) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => { setFilter(id); setShowAll(false); }}>{t.gallery.filters[id]}</button>)}
    </div>
    {filter === "all" ? <>
      {showAll
        ? <>{row(t.gallery.rows.mariage, idsFor("mariage"), "all-models")}{row(t.gallery.rows.anniversaire, idsFor("anniversaire"), "anniversaire")}{row(t.gallery.rows["baby-shower"], idsFor("baby-shower"), "baby-shower")}</>
        : <>{row(t.gallery.rows.featured, featured, "featured")}{row(t.gallery.rows.mariage, remaining("mariage"), "mariage")}{row(t.gallery.rows.anniversaire, idsFor("anniversaire"), "anniversaire")}{row(t.gallery.rows["baby-shower"], idsFor("baby-shower"), "baby-shower")}</>}
      {!compact && <div className="ph-view-all"><button type="button" className="btn-s ghost" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)}>{showAll ? t.gallery.collapse : t.gallery.viewAll}</button></div>}
    </> : row(t.gallery.rows[filter], idsFor(filter), filter)}
  </div>;
}
