"use client";

import { useLang, useT } from "./I18n";
import { formatOf, type TemplateId } from "@/lib/types";
import { money, separateTotal, singlePrice, type Plan, type Prices } from "@/lib/prices";

/** Choix de la formule au moment de publier : l'article seul, ou le pack save the date + invitation
    (total des deux barré, prix du pack à côté). Affiché seulement quand le pack est possible pour ce modèle. */
export default function PlanChoice({ template, prices, plan, onChange }: { template: TemplateId; prices: Prices; plan: Plan; onChange: (p: Plan) => void }) {
  const t = useT().pay;
  const lang = useLang();
  const std = formatOf(template) === "std";
  const sum = separateTotal(prices);
  const opts: { id: Plan; label: string; price: number; was?: number; hint?: string }[] = [
    { id: "single", label: std ? t.singleStd : t.singleInv, price: singlePrice(prices, template) },
    { id: "pack", label: t.pack, price: prices.pack, was: sum > prices.pack ? sum : undefined, hint: t.packHint },
  ];
  return (
    <fieldset className="pl-choice">
      <legend>{t.planTitle}</legend>
      {opts.map((o) => (
        <label key={o.id} className={`pl-opt${plan === o.id ? " is-on" : ""}`}>
          <input type="radio" name="plan" value={o.id} checked={plan === o.id} onChange={() => onChange(o.id)} />
          <span className="pl-dot" aria-hidden="true" />
          <span className="pl-txt">
            <span className="pl-name">{o.label}</span>
            {o.hint && <span className="pl-hint">{o.hint}</span>}
          </span>
          <span className="pl-price">
            {o.was && <s><span className="pl-sr">{t.insteadOf} </span>{money(lang, o.was)}</s>}
            <b>{money(lang, o.price)}</b>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
