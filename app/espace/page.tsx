import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import { LangSwitch } from "@/components/I18n";
import { getT } from "@/lib/i18n/server";
import FindForm from "./FindForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).find.title, robots: { index: false } };
}

/** « Retrouver mon espace » : renvoi des liens par e-mail. */
export default async function Retrouver() {
  const t = await getT();
  return (
    <main className="site">
      <div className="wrap-site" style={{ paddingBlock: "40px 64px", maxWidth: 560, display: "grid", gap: 22 }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Link href="/" className="ed-home" aria-label={t.common.backHome}><span aria-hidden="true">←</span> <Logo height={22} /></Link>
          <LangSwitch />
        </nav>
        <header>
          <h1 style={{ fontSize: "2.4rem", margin: ".2em 0" }}>{t.find.title}</h1>
          <p className="muted" style={{ margin: 0 }}>{t.find.lead}</p>
        </header>
        <FindForm />
      </div>
    </main>
  );
}
