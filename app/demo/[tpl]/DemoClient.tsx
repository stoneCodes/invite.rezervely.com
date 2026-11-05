"use client";
import Link from "next/link";
import Invitation from "@/components/invitation/Invitation";
import { sampleData } from "@/lib/sample";
import type { TemplateId } from "@/lib/types";

export default function DemoClient({ template }: { template: TemplateId }) {
  return (
    <>
      <Invitation data={sampleData()} template={template} />
      {/* Sortie de la démo : toujours visible, au-dessus des ouvertures plein écran. */}
      <Link href="/" className="demo-exit" aria-label="Quitter la démo et revenir à l'accueil">
        <span aria-hidden="true">←</span> Accueil
      </Link>
    </>
  );
}
