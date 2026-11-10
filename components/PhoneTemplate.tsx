"use client";

import { useState, type CSSProperties } from "react";
import { useT } from "@/components/I18n";
import { TEMPLATES, isBirthday, type TemplateId } from "@/lib/types";
import { birthdaySample } from "@/lib/sample";
import type { Lang } from "@/lib/i18n";

export default function PhoneTemplate({ template, names, lang, compact = false }: {
  template: TemplateId;
  names: [string, string];
  lang: Lang;
  compact?: boolean;
}) {
  const t = useT();
  const model = TEMPLATES.find((item) => item.id === template)!;
  const [image, setImage] = useState<string>(model.phone.screen);
  const initials = names.map((name) => ([...name.trim()][0] ?? "?").toUpperCase()).join("&");
  // Anniversaire : un seul prénom (celui des données si c'est déjà un anniversaire, sinon l'exemple du modèle).
  const bday = isBirthday(template);
  const who = bday ? (names[1] ? birthdaySample(template, lang).partner1 : names[0]) : "";
  return (
    <div className={`ph-device${compact ? " is-compact" : ""}`} role="img" aria-label={bday || !names[1] ? t.gallery.phoneAriaOne(t.templates[template].name, bday ? who : names[0]) : t.gallery.phoneAria(t.templates[template].name, names[0], names[1])} lang={lang}>
      <div className={`ph-frame${"scrim" in model.phone && model.phone.scrim ? " has-scrim" : ""}`}>
        <img className="ph-screen" src={image} alt="" loading="lazy" onError={() => setImage(model.cover)} />
        <span className="ph-island" aria-hidden="true" />
        {model.phone.seal && <span className="ph-seal" aria-hidden="true" style={{ top: `calc(50% + (${model.phone.seal.top} - 50) * var(--sy, 1) * 1%)`, left: `${model.phone.seal.left}%`, width: `${model.phone.seal.d}%`, color: model.phone.seal.ink, "--d": model.phone.seal.d } as CSSProperties}>{initials}</span>}
        <span className={`ph-names ${model.phone.font}`} style={{ top: `calc(50% + (${model.phone.names.top} - 50) * var(--sy, 1) * 1%)`, "--name-scale": model.phone.names.size, color: model.phone.ink } as CSSProperties}>{bday ? who : names[1] ? <>{names[0]} <i>&amp;</i> {names[1]}</> : names[0]}</span>
        <span className="ph-hint" style={{ top: `calc(50% + (${model.phone.hint.top} - 50) * var(--sy, 1) * 1%)`, color: ("ink" in model.phone.hint && model.phone.hint.ink) || model.phone.ink }}>{t.gallery.hints[template]}</span>
        <span className="ph-home-indicator" aria-hidden="true" />
      </div>
    </div>
  );
}
