"use client";
import { useState } from "react";
import adminFr from "@/lib/i18n/admin-fr";
import "./admin.css";

/** Connexion : mot de passe (si ADMIN_PASSWORD est configuré, proposé en premier) ou code à 6 chiffres reçu par e-mail. */
export default function Login({ password: hasPassword = false }: { password?: boolean }) {
  const [mode, setMode] = useState<"password" | "code">(hasPassword ? "password" : "code");
  const [email, setEmail] = useState(""); const [code, setCode] = useState(""); const [pw, setPw] = useState("");
  const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(action: "send" | "verify" | "password") {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/admin/connexion", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, email, code, password: pw }) });
      if (!r.ok) throw new Error();
      if (action === "send") setSent(true); else location.assign("/admin/tableau-de-bord");
    } catch {
      setError(action === "send" ? adminFr.genericSent : action === "password" ? adminFr.passwordError : adminFr.loginError);
      if (action === "send") setSent(true);
    } finally { setBusy(false); }
  }
  const pick = (m: "password" | "code") => { setMode(m); setError(""); };
  return <main className="site ad-shell"><section className="ad-card"><p className="ad-kicker">{adminFr.brand}</p><h1>{adminFr.loginTitle}</h1>
    {hasPassword && <div className="ad-login-tabs" role="group">
      <button type="button" aria-pressed={mode === "password"} onClick={() => pick("password")}>{adminFr.passwordTab}</button>
      <button type="button" aria-pressed={mode === "code"} onClick={() => pick("code")}>{adminFr.codeTab}</button>
    </div>}
    <form onSubmit={(e) => { e.preventDefault(); void submit(mode === "password" ? "password" : sent ? "verify" : "send"); }}>
      <label>{adminFr.email}<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      {mode === "password" ? <label>{adminFr.password}<input type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        : sent && <><p className="ad-note" role="status">{adminFr.genericSent}</p><label>{adminFr.code}<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} /></label></>}
      {error && <p role="alert" className="ad-error">{error}</p>}
      <button disabled={busy}>{busy ? adminFr.busy : mode === "password" || sent ? adminFr.signIn : adminFr.sendCode}</button>
    </form></section></main>;
}
