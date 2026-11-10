"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import adminFr from "@/lib/i18n/admin-fr";

/** Pictogrammes au trait (24×24), couleur du texte. */
const I = {
  dash: <><rect x="3.5" y="3.5" width="7" height="8" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="5" rx="1.5" /><rect x="13.5" y="11.5" width="7" height="9" rx="1.5" /><rect x="3.5" y="14.5" width="7" height="6" rx="1.5" /></>,
  stats: <><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></>,
  mail: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
  people: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><path d="M15.5 5.6a3 3 0 0 1 0 5.8M17.5 14.3c1.6.6 2.6 2.2 3 4.7" /></>,
  phone: <><rect x="7" y="2.5" width="10" height="19" rx="2.2" /><path d="M10.5 18.5h3" /></>,
  music: <><path d="M9 18V5.5l11-2V16" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
  euro: <><path d="M17.5 6.5A6.5 6.5 0 1 0 17.5 17.5M4 10.5h9M4 13.5h9" /></>,
  star: <><path d="m12 3.6 2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.5l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
};
const Icon = ({ d }: { d: React.ReactNode }) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;

const items = [
  { href: "/admin/tableau-de-bord", label: adminFr.dashboard, short: adminFr.navShortDashboard, icon: I.dash, main: true },
  { href: "/admin/statistiques", label: adminFr.statistics, short: adminFr.navShortStats, icon: I.stats, main: false },
  { href: "/admin/invitations", label: adminFr.invitations, short: adminFr.invitations, icon: I.mail, main: true },
  { href: "/admin/clients", label: adminFr.clientManagement, short: adminFr.navShortClients, icon: I.people, main: true },
  { href: "/admin/modeles", label: adminFr.templatesNav, short: adminFr.templatesNav, icon: I.phone, main: false },
  { href: "/admin/musiques", label: adminFr.musicNav, short: adminFr.musicNav, icon: I.music, main: true },
  { href: "/admin/avis", label: adminFr.reviewsNav, short: adminFr.reviewsNav, icon: I.star, main: false },
  { href: "/admin/prix", label: adminFr.priceTitle, short: adminFr.navShortPrice, icon: I.euro, main: false },
];

/**
 * Navigation admin : barre latérale sur grand écran ; sur mobile (≤ 800 px), barre fixe en bas
 * (4 pages principales + « Menu » qui ouvre la liste complète), demandée par Glad le 10 nov. 2026.
 */
export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", esc); return () => removeEventListener("keydown", esc);
  }, [open]);
  const isActive = (href: string) => pathname === href || (href !== "/admin/tableau-de-bord" && pathname.startsWith(`${href}/`));
  const otherActive = items.some((i) => !i.main && isActive(i.href));
  const link = ({ href, label, icon }: typeof items[number]) => {
    const active = isActive(href);
    return <Link key={href} href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
      <span className="ad-sidebar-icon"><Icon d={icon} /></span>{label}
    </Link>;
  };
  return <>
    <aside className="ad-sidebar">
      <p className="ad-sidebar-label">{adminFr.adminSection}</p>
      <nav aria-label={adminFr.navigation}>{items.map(link)}</nav>
    </aside>

    <nav className="ad-tabbar" aria-label={adminFr.navigation}>
      {items.filter((i) => i.main).map(({ href, short, icon }) => {
        const active = isActive(href);
        return <Link key={href} href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}><Icon d={icon} /><span>{short}</span></Link>;
      })}
      <button type="button" className={otherActive ? "active" : undefined} aria-expanded={open} aria-controls="ad-sheet" onClick={() => setOpen((o) => !o)}><Icon d={I.menu} /><span>{adminFr.navMenu}</span></button>
    </nav>
    {open && <>
      <div className="ad-sheet-veil" onClick={() => setOpen(false)} />
      <div className="ad-sheet" id="ad-sheet" role="dialog" aria-label={adminFr.navigation}>
        <p className="ad-sidebar-label">{adminFr.adminSection}</p>
        <nav>{items.map(link)}</nav>
      </div>
    </>}
  </>;
}
