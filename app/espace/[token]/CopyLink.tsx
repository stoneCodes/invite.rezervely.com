"use client";
import { useEffect, useState } from "react";
import { useT } from "@/components/I18n";

type Share = { wa: string; other: string; msg: string };

/* Lien de l'invitation + envoi direct : WhatsApp (message déjà écrit avec le lien propre)
   et, sur téléphone, la feuille de partage du système (SMS, Messenger, e-mail…). */
export default function CopyLink({ url, share }: { url: string; share?: Share }) {
  const [done, setDone] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const t = useT();
  useEffect(() => { setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"); }, []);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} style={{ flex: "1 1 240px", minWidth: 0, font: "inherit", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--field)", color: "var(--ink)" }} />
        <button className="btn-s" type="button" onClick={() => navigator.clipboard.writeText(url).then(() => { setDone(true); setTimeout(() => setDone(false), 2000); }).catch(() => {})}>
          {done ? t.space.copied : t.space.copy}
        </button>
      </div>
      {share && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="btn-s" href={`https://wa.me/?text=${encodeURIComponent(share.msg)}`} target="_blank" rel="noopener noreferrer">{share.wa}</a>
          {canShare && (
            <button className="btn-s ghost" type="button" onClick={() => navigator.share({ text: share.msg }).catch(() => {})}>{share.other}</button>
          )}
        </div>
      )}
    </div>
  );
}
