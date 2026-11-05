"use client";
import { useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} style={{ flex: "1 1 240px", minWidth: 0, font: "inherit", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--field)", color: "var(--ink)" }} />
      <button className="btn-s" type="button" onClick={() => navigator.clipboard.writeText(url).then(() => { setDone(true); setTimeout(() => setDone(false), 2000); }).catch(() => {})}>
        {done ? "Copié" : "Copier"}
      </button>
    </div>
  );
}
