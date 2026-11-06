"use client";

import { useState } from "react";
import { slugPart } from "@/lib/slug";

type Copy = { download: string; reserved: string; preparing: string; error: string };
export default function PdfDownloadButton({ token, allowed, partner1, partner2, dateISO, copy }: {
  token: string; allowed: boolean; partner1: string; partner2: string; dateISO: string; copy: Copy;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function download() {
    if (!allowed || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/espace/${encodeURIComponent(token)}/pdf`, { cache: "no-store" });
      if (response.status === 403) { setMessage(copy.reserved); return; }
      if (!response.ok) throw new Error("pdf_unavailable");
      const pdfData = await response.json();
      const { buildGuestListPdf } = await import("@/lib/pdf/build");
      const bytes = await buildGuestListPdf(pdfData);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `invites-${slugPart([partner1, partner2].filter(Boolean).join("-"))}-${dateISO.slice(0, 10)}.pdf`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch {
      setMessage(copy.error);
    } finally { setBusy(false); }
  }
  return <span className="space-pdf-action">
    <button type="button" className="btn-s ghost" disabled={!allowed || busy} onClick={() => void download()}>{busy ? copy.preparing : copy.download}</button>
    {!allowed && <small>{copy.reserved}</small>}
    {message && <small role="status">{message}</small>}
  </span>;
}
