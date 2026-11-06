"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import adminFr from "@/lib/i18n/admin-fr";

export default function DeleteInvitationButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (!window.confirm(adminFr.confirmDelete)) return;
    if (window.prompt(adminFr.deleteWord) !== "SUPPRIMER") { setError(adminFr.deleteMustType); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/invitations/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", confirmation: "SUPPRIMER" }) });
      const data = await response.json();
      if (!response.ok || !data.deleted) throw new Error(data.error || adminFr.actionFailed);
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : adminFr.actionFailed); }
    finally { setBusy(false); }
  }
  return <div className="ad-list-delete"><button type="button" className="ad-mini-danger" disabled={busy} onClick={() => void remove()}>{busy ? adminFr.actionWorking : adminFr.deleteFromDashboard}</button>{error && <small role="alert">{error}</small>}</div>;
}
