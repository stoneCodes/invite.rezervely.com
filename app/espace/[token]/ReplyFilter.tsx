"use client";
import { useRef, useState } from "react";

type F = "all" | "yes" | "no";

/* Filtre des réponses : pose data-f sur la section, le CSS masque les lignes qui ne correspondent pas
   (le tableau reste rendu côté serveur). */
export default function ReplyFilter({ counts, labels }: {
  counts: Record<F, number>;
  labels: { all: string; yes: string; no: string; aria: string };
}) {
  const [f, setF] = useState<F>("all");
  const ref = useRef<HTMLDivElement>(null);
  const pick = (v: F) => {
    setF(v);
    const sec = ref.current?.closest("section");
    if (sec) sec.setAttribute("data-f", v);
  };
  return (
    <div ref={ref} className="sp-filter" role="radiogroup" aria-label={labels.aria}>
      {(["all", "yes", "no"] as F[]).map((v) => (
        <button key={v} type="button" role="radio" aria-checked={f === v}
          className={`sp-chip is-${v}${f === v ? " is-on" : ""}`}
          disabled={v !== "all" && counts[v] === 0}
          onClick={() => pick(v)}>
          {labels[v]} <span className="sp-chip-n">{counts[v]}</span>
        </button>
      ))}
    </div>
  );
}
