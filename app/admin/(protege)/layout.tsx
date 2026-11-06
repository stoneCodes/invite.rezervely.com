import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import adminFr from "@/lib/i18n/admin-fr";
import AdminSidebar from "./AdminSidebar";
import "../admin.css";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  if (!email) notFound();
  return <div className="site ad-app"><header className="ad-header"><a href="/admin/tableau-de-bord">{adminFr.brand}</a><div className="ad-account"><span>{email}</span><form action="/api/admin/deconnexion" method="post"><button>{adminFr.logout}</button></form></div></header><div className="ad-layout"><AdminSidebar />{children}</div></div>;
}
