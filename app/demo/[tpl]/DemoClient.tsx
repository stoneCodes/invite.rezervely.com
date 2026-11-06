"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Invitation from "@/components/invitation/Invitation";
import { sampleData } from "@/lib/sample";
import type { TemplateId } from "@/lib/types";

export default function DemoClient({ template, embedded = false }: { template: TemplateId; embedded?: boolean }) {
  // Dès qu'on défile, le bouton se réduit à une pastille « ← » pour ne pas masquer les titres.
  const [mini, setMini] = useState(false);
  useEffect(() => {
    if (embedded) return;
    const on = () => setMini(window.scrollY > 60);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [embedded]);
  return (
    <>
      <Invitation data={sampleData()} template={template} />
      {/* Sortie de la démo : toujours visible, au-dessus des ouvertures plein écran (sauf dans la pop-up de l'accueil). */}
      {!embedded && (
        <Link href="/" className={`demo-exit${mini ? " is-mini" : ""}`} aria-label="Quitter la démo et revenir à l'accueil">
          <span aria-hidden="true">←</span><span className="demo-exit-txt"> Accueil</span>
        </Link>
      )}
    </>
  );
}
