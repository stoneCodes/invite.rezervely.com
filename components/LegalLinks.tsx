"use client";
import { useT } from "@/components/I18n";

/** Liens vers les pages juridiques (pied de page de l'accueil, de l'éditeur, de l'espace…). */
export default function LegalLinks({ className = "" }: { className?: string }) {
  const l = useT().legal;
  return (
    <nav className={`legal-links ${className}`} aria-label={l.nav}>
      <a href="/mentions-legales">{l.mentions}</a>
      <a href="/cgv">{l.cgv}</a>
      <a href="/confidentialite">{l.privacy}</a>
    </nav>
  );
}
