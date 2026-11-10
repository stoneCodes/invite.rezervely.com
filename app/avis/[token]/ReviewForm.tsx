"use client";
import { useState } from "react";
import { useT } from "@/components/I18n";

const ERR: Record<string, "errRating" | "errBody" | "errName" | "errConsent"> = { rating: "errRating", body: "errBody", name: "errName", consent: "errConsent" };

export default function ReviewForm({ token, defaultName }: { token: string; defaultName: string }) {
  const t = useT();
  const r = t.review;
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<"idle" | "busy" | "done" | "already">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = String(f.get("body") ?? "").trim(), name = String(f.get("name") ?? "").trim(), consent = f.get("consent") === "on";
    const local = !rating ? "rating" : body.length < 10 ? "body" : !name ? "name" : !consent ? "consent" : null;
    if (local) return setErr(r[ERR[local]]);
    setErr(null); setState("busy");
    try {
      const res = await fetch("/api/avis", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, rating, body, name, consent, website: f.get("website") }) });
      if (res.ok) return setState("done");
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) return setState("already");
      setErr(ERR[data.error] ? r[ERR[data.error]] : r.fail); setState("idle");
    } catch { setErr(r.fail); setState("idle"); }
  }

  if (state === "done") return <p className="card-s" role="status" style={{ padding: 20, margin: 0 }}>{r.thanks}</p>;
  if (state === "already") return <p className="card-s" role="status" style={{ padding: 20, margin: 0 }}>{r.already}</p>;
  const shown = hover || rating;
  return (
    <form className="card-s" onSubmit={submit} noValidate style={{ padding: 20, display: "grid", gap: 16 }}>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 6 }}>
        <legend style={{ padding: 0, marginBottom: 6 }}>{r.rating}</legend>
        <div className="rv-stars" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" className={n <= shown ? "on" : undefined} aria-label={t.home.reviewStars(n)} aria-pressed={rating === n}
              onMouseEnter={() => setHover(n)} onFocus={() => setHover(n)} onBlur={() => setHover(0)} onClick={() => setRating(n)}>★</button>
          ))}
        </div>
      </fieldset>
      <label style={{ display: "grid", gap: 6 }}>{r.body}
        <textarea name="body" rows={5} maxLength={1500} className="ed-input" placeholder={r.bodyHint} required />
      </label>
      <label style={{ display: "grid", gap: 6 }}>{r.name}
        <input name="name" defaultValue={defaultName} maxLength={60} className="ed-input" required />
        <small className="muted">{r.nameHint}</small>
      </label>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: ".92rem" }}>
        <input type="checkbox" name="consent" style={{ marginTop: 4 }} />
        <span>{r.consent}</span>
      </label>
      {/* Piège à robots : invisible pour les humains */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
      {err && <p role="alert" style={{ margin: 0, color: "var(--err)" }}>{err}</p>}
      <button className="btn-s" type="submit" disabled={state === "busy"}>{state === "busy" ? r.sending : r.send}</button>
      <small className="muted">{r.moderation}</small>
    </form>
  );
}

/** Confirmation du désabonnement (bouton : un lien ouvert par un robot ne désabonne pas). */
export function StopForm({ token }: { token: string }) {
  const r = useT().review;
  const [state, setState] = useState<"idle" | "busy" | "done" | "fail">("idle");
  async function stop() {
    setState("busy");
    try {
      const res = await fetch("/api/avis/stop", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
      setState(res.ok ? "done" : "fail");
    } catch { setState("fail"); }
  }
  if (state === "done") return <p className="card-s" role="status" style={{ padding: 20, margin: 0 }}>{r.stopDone}</p>;
  return (
    <div className="card-s" style={{ padding: 20, display: "grid", gap: 12 }}>
      {state === "fail" && <p role="alert" style={{ margin: 0, color: "var(--err)" }}>{r.fail}</p>}
      <button className="btn-s" type="button" onClick={() => void stop()} disabled={state === "busy"}>{r.stopBtn}</button>
    </div>
  );
}
