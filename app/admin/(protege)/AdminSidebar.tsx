"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import adminFr from "@/lib/i18n/admin-fr";

const items = [
  { href: "/admin/tableau-de-bord", label: adminFr.dashboard, icon: "▦" },
  { href: "/admin/statistiques", label: adminFr.statistics, icon: "⌁" },
  { href: "/admin/invitations", label: adminFr.invitations, icon: "✉" },
  { href: "/admin/clients", label: adminFr.clientManagement, icon: "♙" },
  { href: "/admin/prix", label: adminFr.priceTitle, icon: "€" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return <aside className="ad-sidebar">
    <p className="ad-sidebar-label">{adminFr.adminSection}</p>
    <nav aria-label={adminFr.navigation}>
      {items.map(({ href, label, icon }) => {
        const active = pathname === href || (href !== "/admin/tableau-de-bord" && pathname.startsWith(`${href}/`));
        return <Link key={href} href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
          <span className="ad-sidebar-icon" aria-hidden="true">{icon}</span>{label}
        </Link>;
      })}
    </nav>
  </aside>;
}
