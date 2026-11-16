import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import LegalLinks from "@/components/LegalLinks";
import { LangSwitch } from "@/components/I18n";
import { getLang, getT } from "@/lib/i18n/server";
import { getPrices, paymentsOn } from "@/lib/payment";
import { DEFAULT_PRICES, money, separateTotal } from "@/lib/prices";
import "./offres.css";

/* Page « Offres » (proposition A choisie par Glad le 16 nov. 2026, maquette docs/maquettes/offres.*) :
   trois cartes de papeterie (le pack au centre en encre et dorure), puis le tableau des fonctionnalités.
   Prix lus dans l'admin (settings.prices) ; tant que les paiements sont coupés, une note dit que la publication est offerte. */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.offers.meta, description: t.offers.metaDesc, alternates: { canonical: "/offres" } };
}

const STD_START = "/creer?t=std-nuit-doree";

const ICONS = {
  std: <><rect x="5" y="7" width="22" height="20" rx="2" /><path d="M5 13h22M11 4v6M21 4v6" /><path d="M16 23.5c-2.6-1.7-4-3-4-4.6a2 2 0 0 1 4-.6 2 2 0 0 1 4 .6c0 1.6-1.4 2.9-4 4.6Z" /></>,
  inv: <><rect x="4" y="8" width="24" height="17" rx="1.5" /><path d="m4.5 9 11.5 9 11.5-9" /><circle cx="16" cy="18" r="2.6" /></>,
  pack: <><rect x="3" y="11" width="18" height="16" rx="1.5" /><path d="M3.5 12l8.5 7 8.5-7" /><rect x="12" y="4" width="17" height="15" rx="1.5" /><path d="M12 9h17M16 2.5v4M25 2.5v4" /></>,
};
const Icon = ({ k }: { k: keyof typeof ICONS }) => <svg className="of-ic" viewBox="0 0 32 32" aria-hidden="true">{ICONS[k]}</svg>;

function Mark({ on, label }: { on: boolean; label: string }) {
  return on
    ? <span className="of-ok" role="img" aria-label={label}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" /><path d="M8.2 12.2l2.6 2.6 5-5.4" /></svg></span>
    : <span className="of-no" role="img" aria-label={label} />;
}

export default async function Offres() {
  const [lang, t, enabled] = await Promise.all([getLang(), getT(), paymentsOn().catch(() => false)]);
  const p = await getPrices().catch(() => DEFAULT_PRICES);
  const o = t.offers;
  const eur = (c: number) => money(lang, c);
  const sum = separateTotal(p);
  return (
    <main className="site of-page">
      <nav className="of-nav wrap-site">
        <Link href="/" className="ed-home" aria-label={t.common.backHome}><span aria-hidden="true">←</span> <Logo height={28} /></Link>
        <div className="of-nav-r">
          <Link href="/#faq" className="of-navlink">{t.home.navFaq}</Link>
          <LangSwitch />
          <Link className="btn-s ghost" href="/creer">{t.home.create}</Link>
        </div>
      </nav>

      <div className="wrap-site of-wrap">
        <header className="of-head">
          <p className="of-eyebrow">{o.kicker}</p>
          <h1>{o.title}<em>{o.titleScript}</em></h1>
          <p className="of-lead">{o.lead}</p>
          {!enabled && <p className="of-launch">{o.launchFree}</p>}
        </header>

        <section className="of-cards" aria-label={o.kicker}>
          <article className="of-card">
            <span className="of-num" aria-hidden="true">I</span>
            <h2>{o.stdName}</h2>
            <span className="of-for">{o.stdFor}</span>
            <i className="of-rule" aria-hidden="true" />
            <p className="of-price"><b>{eur(p.std)}</b></p>
            <span className="of-ttc">{o.ttc}</span>
            <p className="of-text">{o.stdText}</p>
            <Link className="of-btn" href={STD_START}>{o.stdCta}</Link>
          </article>

          <article className="of-card is-star">
            <span className="of-ribbon">{o.packRibbon}</span>
            <span className="of-num" aria-hidden="true">I + II</span>
            <h2>{o.packName}</h2>
            <span className="of-for">{o.packFor}</span>
            <i className="of-rule" aria-hidden="true" />
            <p className="of-price">{sum > p.pack && <s><span className="of-sr">{o.insteadOf} </span>{eur(sum)}</s>}<b>{eur(p.pack)}</b></p>
            <span className="of-ttc">{o.ttc}</span>
            <p className="of-text">{o.packText}</p>
            <Link className="of-btn" href={STD_START}>{o.packCta}</Link>
          </article>

          <article className="of-card">
            <span className="of-num" aria-hidden="true">II</span>
            <h2>{o.invName}</h2>
            <span className="of-for">{o.invFor}</span>
            <i className="of-rule" aria-hidden="true" />
            <p className="of-price"><b>{eur(p.invitation)}</b></p>
            <span className="of-ttc">{o.ttc}</span>
            <p className="of-text">{o.invText}</p>
            <Link className="of-btn" href="/creer">{o.invCta}</Link>
          </article>
        </section>

        <section className="of-cmp" aria-labelledby="of-cmp-t">
          <p className="of-eyebrow">{o.detailKicker}</p>
          <h2 id="of-cmp-t">{o.detailTitle}</h2>
          <p className="of-lead">{o.detailLead}</p>
          {/* Grille d'orfèvre (proposition A, 16 nov. 2026) : carte ivoire à double filet, la colonne du pack est un
              ruban doré continu posé derrière toutes les lignes (.of-ribbon-col), les groupes traversent toute la largeur. */}
          <div className="of-grid-card">
            <div className="of-grid-in">
              <i className="of-ribbon-col" aria-hidden="true" />
              <table className="of-tbl">
                <colgroup><col /><col className="of-c" /><col className="of-c" /><col className="of-cp" /></colgroup>
                <thead>
                  <tr>
                    <th scope="col" className="of-cmp-lab"><span>{o.compare}</span></th>
                    <th scope="col"><Icon k="std" /><span className="of-ct">{o.colStd}</span><small>{eur(p.std)}</small></th>
                    <th scope="col"><Icon k="inv" /><span className="of-ct">{o.colInv}</span><small>{eur(p.invitation)}</small></th>
                    <th scope="col" className="pk"><span className="of-crown">{o.packRibbon}</span><Icon k="pack" /><span className="of-ct">{o.colPack}</span><small>{sum > p.pack && <s><span className="of-sr">{o.insteadOf} </span>{eur(sum)}</s>}{eur(p.pack)}</small></th>
                  </tr>
                </thead>
                {o.groups.map(([g, rows]) => (
                  <tbody key={g}>
                    <tr className="grp"><th scope="colgroup" colSpan={4}><span>{g}</span></th></tr>
                    {rows.map(([name, s, i]) => (
                      <tr key={name}>
                        <th scope="row">{name}</th>
                        <td><Mark on={!!s} label={s ? o.yes : o.no} /></td>
                        <td><Mark on={!!i} label={i ? o.yes : o.no} /></td>
                        <td><Mark on label={o.yes} /></td>
                      </tr>
                    ))}
                  </tbody>
                ))}
                <tfoot><tr><td colSpan={3} /><td className="of-together">{o.together}</td></tr></tfoot>
              </table>
            </div>
          </div>
          <p className="of-other">{o.otherEvents}</p>
          <ul className="of-reass">{o.reassure.map((r) => <li key={r}>{r}</li>)}</ul>
        </section>

        <section className="of-final">
          <h2>{o.finalTitle}</h2>
          <div className="of-final-btns">
            <Link className="btn-s" href="/creer">{o.finalCta}</Link>
            <Link className="btn-s ghost" href="/#faq">{o.faqLink}</Link>
          </div>
        </section>
        <LegalLinks />
      </div>
    </main>
  );
}
