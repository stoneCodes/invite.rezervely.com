import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Login from "./login";
import { localDevAdmin, passwordLoginEnabled } from "@/lib/admin/auth";
export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Administration" };
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  // En local (npm run dev sur localhost), pas de connexion : on va directement au tableau de bord.
  if (await localDevAdmin()) redirect("/admin/tableau-de-bord");
  return <Login password={passwordLoginEnabled()} />;
}
