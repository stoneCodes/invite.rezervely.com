"use client";
import { useState } from "react";
import { useT } from "@/components/I18n";

export default function FindForm() {
  const t = useT().find;
  const [state, setState] = useState<"idle" | "busy" | "done" | "invalid" | "fail">("idle");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setState("invalid");
    setState("busy");
    try {
      const res = await fetch("/api/espace/lien", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, website: f.get("website") }) });
      setState(res.ok ? "done" : res.status === 400 ? "invalid" : "fail");
    } catch { setState("fail"); }
  }
  if (state === "done") return <p className="card-s" role="status" style={{ padding: 20, margin: 0 }}>{t.done}</p>;
  return (
    <form className="card-s" onSubmit={submit} noValidate style={{ padding: 20, display: "grid", gap: 14 }}>
      <label style={{ display: "grid", gap: 6 }}>{t.email}
        <input name="email" type="email" autoComplete="email" required maxLength={200} className="ed-input" />
      </label>
      {/* Piège à robots : invisible pour les humains */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
      {(state === "invalid" || state === "fail") && <p role="alert" style={{ margin: 0, color: "var(--err)" }}>{state === "invalid" ? t.invalid : t.fail}</p>}
      <button className="btn-s" type="submit" disabled={state === "busy"}>{state === "busy" ? t.sending : t.send}</button>
    </form>
  );
}
