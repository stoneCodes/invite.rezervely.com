"use client";
import { useState } from "react";
import adminFr from "@/lib/i18n/admin-fr";
import "./admin.css";
export default function Login() {
  const [email,setEmail]=useState(""); const [code,setCode]=useState(""); const [sent,setSent]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function submit(action: "send"|"verify") {
    setBusy(true); setError("");
    try { const r=await fetch("/api/admin/connexion",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,email,code})});
      if (!r.ok) throw new Error();
      if (action==="send") setSent(true); else location.assign("/admin/tableau-de-bord");
    } catch { setError(action==="send"?adminFr.genericSent:adminFr.loginError); if(action==="send")setSent(true); } finally {setBusy(false);}
  }
  return <main className="site ad-shell"><section className="ad-card"><p className="ad-kicker">{adminFr.brand}</p><h1>{adminFr.loginTitle}</h1><form onSubmit={e=>{e.preventDefault();void submit(sent?"verify":"send")}}>
    <label>{adminFr.email}<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
    {sent&&<><p className="ad-note" role="status">{adminFr.genericSent}</p><label>{adminFr.code}<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e=>setCode(e.target.value)} /></label></>}
    {error&&<p role="alert" className="ad-error">{error}</p>}<button disabled={busy}>{busy?adminFr.busy:sent?adminFr.signIn:adminFr.sendCode}</button>
  </form></section></main>;
}
