import Link from "next/link";
import Logo from "@/components/Logo";
import { LangSwitch } from "@/components/I18n";
import LegalLinks from "@/components/LegalLinks";
import { getLang, getT } from "@/lib/i18n/server";
import { legalDict, type LegalDict } from "@/lib/i18n/legal";
import { LEGAL } from "@/lib/legal";

export type LegalKind = "mentions" | "cgv" | "privacy";

export async function legalTitle(kind: LegalKind) {
  return legalDict(await getLang())[kind].title;
}

/** Adresses e-mail cliquables dans le texte. */
function Para({ text }: { text: string }) {
  const parts = text.split(/([\w.+-]+@[\w-]+\.[\w.]+)/g);
  return <p>{parts.map((s, i) => (i % 2 ? <a key={i} href={`mailto:${s}`}>{s}</a> : s))}</p>;
}

/** Page juridique (mentions légales, CGV, confidentialité), même habillage que le reste du site. */
export default async function LegalPage({ kind }: { kind: LegalKind }) {
  const t = await getT();
  const d: LegalDict = legalDict(await getLang());
  const doc = d[kind];
  return (
    <main className="site">
      <div className="wrap-site legal">
        <nav className="legal-nav">
          <Link href="/" className="ed-home" aria-label={t.common.backHome}><span aria-hidden="true">←</span> <Logo height={28} /></Link>
          <LangSwitch />
        </nav>
        <header>
          <h1>{doc.title}</h1>
          <p className="muted">{d.updated(LEGAL.updated)}</p>
          {doc.lead && <p>{doc.lead}</p>}
        </header>
        {doc.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((p, i) => <Para key={i} text={p} />)}
          </section>
        ))}
        <LegalLinks />
      </div>
    </main>
  );
}
