"use client";
import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { LANGS, LANG_COOKIE, type Lang } from "@/lib/i18n";
import { siteDict, type SiteDict } from "@/lib/i18n/site";

const Ctx = createContext<Lang>("fr");

/** Fournit la langue du site (choisie côté serveur) aux composants clients. */
export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}
export const useLang = () => useContext(Ctx);
export const useT = (): SiteDict => siteDict(useContext(Ctx));

/** Bouton FR / EN : mémorise le choix (1 an) et recharge la page dans la langue choisie. */
export function LangSwitch({ className = "" }: { className?: string }) {
  const lang = useLang();
  const t = useT();
  const router = useRouter();
  const pick = (l: Lang) => {
    if (l === lang) return;
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t.common.lang}>
      {LANGS.map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={l === lang} aria-label={t.common.langNames[l]} onClick={() => pick(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
