"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Invitation from "@/components/invitation/Invitation";
import { demoMeal, demoWishlist, sampleFor } from "@/lib/sample";
import type { TemplateId } from "@/lib/types";
import { useLang, useT } from "@/components/I18n";

export default function DemoClient({ template, embedded = false }: { template: TemplateId; embedded?: boolean }) {
  // Dès qu'on défile, le bouton se réduit à une pastille « ← » pour ne pas masquer les titres.
  const [mini, setMini] = useState(false);
  const t = useT();
  const lang = useLang();
  useEffect(() => {
    // Démo intégrée (pop-up de l'accueil ou de l'éditeur) : pas de barre de défilement visible, comme sur un téléphone.
    if (embedded) { document.documentElement.classList.add("is-embedded"); return () => document.documentElement.classList.remove("is-embedded"); }
    const on = () => setMini(window.scrollY > 60);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [embedded]);
  return (
    <>
      <Invitation data={{ ...sampleFor(template, lang), wishlist: demoWishlist(template, lang), meal: demoMeal(template, lang) }} template={template} demoPhoto />
      {/* Sortie de la démo : toujours visible, au-dessus des ouvertures plein écran (sauf dans la pop-up de l'accueil). */}
      {!embedded && (
        <Link href="/" className={`demo-exit${mini ? " is-mini" : ""}`} aria-label={t.demo.exitAria}>
          <span aria-hidden="true">←</span><span className="demo-exit-txt"> {t.common.home}</span>
        </Link>
      )}
    </>
  );
}
