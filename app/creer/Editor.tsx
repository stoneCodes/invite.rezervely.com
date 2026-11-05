"use client";
import "./editor.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { sampleData } from "@/lib/sample";
import { TEMPLATES, type InvitationData, type TemplateId } from "@/lib/types";

/* ---------- Dates : l'éditeur saisit l'heure de Paris, on stocke un ISO avec décalage ---------- */
function toParisISO(local: string) {
  if (!local) return "";
  const guess = new Date(`${local}:00Z`);
  const tzn = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", timeZoneName: "longOffset" }).formatToParts(guess).find((p) => p.type === "timeZoneName")?.value ?? "GMT+01:00";
  const off = tzn.replace("GMT", "") || "+00:00";
  return `${local}:00${off}`;
}
function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = Object.fromEntries(new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
}

/* ---------- Photo : redimensionnée dans le navigateur avant envoi ---------- */
async function shrink(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const k = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("photo"))), "image/jpeg", 0.85));
}

/** Modèle suivant / précédent dans le catalogue (en boucle). */
function cycle(id: TemplateId, step: number): TemplateId {
  const i = TEMPLATES.findIndex((t) => t.id === id);
  return TEMPLATES[(i + step + TEMPLATES.length) % TEMPLATES.length].id as TemplateId;
}

const VERSE_HINTS = {
  bible: { text: "Ex. L'amour excuse tout, il croit tout, il espère tout…", ref: "Ex. 1 Corinthiens 13:7" },
  coran: { text: "Traduction en français (facultatif)", ref: "Ex. Sourate Ar-Rûm, 30:21" },
  autre: { text: "Citation, poème, phrase qui vous ressemble…", ref: "Auteur ou source" },
};

export default function Editor() {
  const router = useRouter();
  const sp = useSearchParams();
  const [template, setTemplate] = useState<TemplateId>((TEMPLATES.find((t) => t.id === sp.get("t"))?.id ?? "jardin-nuit") as TemplateId);
  const [data, setData] = useState<InvitationData>(sampleData);
  const [email, setEmail] = useState("");
  const [token, setTokenState] = useState<string | null>(sp.get("edit"));
  // Copie synchrone du jeton : deux enregistrements enchaînés (photo) ne doivent pas créer deux invitations.
  const tokenRef = useRef<string | null>(sp.get("edit"));
  const setToken = (t: string) => { tokenRef.current = t; setTokenState(t); };
  const [slug, setSlug] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"form" | "preview">("form");
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);

  /* Chargement d'une invitation existante */
  useEffect(() => {
    const t = sp.get("edit");
    if (!t) return;
    fetch(`/api/invitations/${t}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => { setTemplate(j.template); setData(j.data); setSlug(j.slug); setStatus(j.status); setEmail(j.email ?? ""); setToken(t); })
      .catch(() => setMsg({ kind: "err", text: "Ce lien de modification n'est pas valide." }));
  }, [sp]);

  /* Aperçu en direct */
  const send = useCallback((replay = false) => {
    if (!ready.current) return;
    frame.current?.contentWindow?.postMessage({ type: "invite-preview", data, template, replay }, window.location.origin);
  }, [data, template]);
  /* Rendu plein écran : l'invitation complète (ouverture, date à révéler…) avec les données en cours, même non enregistrées. */
  // Modèle affiché en plein écran (celui choisi, ou un autre qu'on découvre depuis les cartes).
  const [full, setFull] = useState<TemplateId | null>(null);
  const fullFrame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(null);
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") setFull((f) => (f ? cycle(f, e.key === "ArrowRight" ? 1 : -1) : f));
    };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [full !== null]);

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "invite-preview-ready") return;
      const fw = fullFrame.current?.contentWindow;
      if (fw && e.source === fw) {
        fw.postMessage({ type: "invite-preview", data, template: full ?? template, replay: true, full: true }, window.location.origin);
        return;
      }
      ready.current = true; send();
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [send, data, template, full]);
  /* L'iframe a pu annoncer « prête » avant que l'éditeur écoute : on lui redemande. */
  const ping = () => frame.current?.contentWindow?.postMessage({ type: "invite-preview-ping" }, window.location.origin);
  useEffect(() => { ping(); }, []);
  useEffect(() => { const id = setTimeout(() => send(), 450); return () => clearTimeout(id); }, [send]);

  const set = <K extends keyof InvitationData>(k: K, v: InvitationData[K]) => setData((d) => ({ ...d, [k]: v }));
  const dc = data.dressCode;
  const setDc = (patch: Partial<InvitationData["dressCode"]>) => set("dressCode", { ...dc, ...patch });

  async function save(d: InvitationData = data): Promise<string | null> {
    setBusy(true); setMsg(null);
    const tk = tokenRef.current;
    try {
      const res = await fetch(tk ? `/api/invitations/${tk}` : "/api/invitations", { method: tk ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ template, data: d, email }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setSlug(j.slug);
      if (!tk && j.editToken) { setToken(j.editToken); router.replace(`/creer?edit=${j.editToken}`); }
      setMsg({ kind: "ok", text: "Enregistré." });
      return tk ?? j.editToken;
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error && e.message ? e.message : "Enregistrement impossible. Réessayez." });
      return null;
    } finally { setBusy(false); }
  }

  async function publish() {
    const t = await save();
    if (!t) return;
    setBusy(true);
    const res = await fetch(`/api/invitations/${t}/publish`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg({ kind: "err", text: j.error ?? "Publication impossible." }); return; }
    setStatus("published");
    setMsg({ kind: "ok", text: "Invitation publiée. Retrouvez votre lien et vos réponses dans votre espace." });
  }

  async function upload(file: File) {
    const t = tokenRef.current ?? (await save());
    if (!t) return;
    setBusy(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", new File([await shrink(file)], "photo.jpg", { type: "image/jpeg" }));
      const res = await fetch(`/api/upload?token=${t}`, { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      // Enregistrement immédiat : sinon la photo est perdue si l'on quitte la page sans enregistrer.
      const next = { ...data, photoUrl: j.url };
      setData(next);
      setBusy(false);
      if (await save(next)) setMsg({ kind: "ok", text: "Photo ajoutée et enregistrée." });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error && e.message ? e.message : "Envoi de la photo impossible." });
    } finally { setBusy(false); }
  }

  const vh = data.verse ? VERSE_HINTS[data.verse.kind] : null;

  return (
    <main className="site ed">
      <nav className="ed-top">
        <Link href="/" className="ed-home" aria-label="Revenir à l'accueil"><span aria-hidden="true">←</span> <span className="gold-text">Rezervely</span></Link>
      </nav>
      <div className="ed-tabs">
        <button type="button" aria-pressed={tab === "form"} onClick={() => setTab("form")}>Modifier</button>
        <button type="button" aria-pressed={tab === "preview"} onClick={() => setTab("preview")}>Aperçu</button>
      </div>

      <div className="ed-grid">
        <form className={`ed-form ${tab === "form" ? "" : "ed-hide-m"}`} onSubmit={(e) => { e.preventDefault(); save(); }}>
          <h1>Votre invitation</h1>

          <fieldset>
            <legend>Style</legend>
            {/* Le modèle choisi passe en tête, en grand, avec un badge ; les autres restent disponibles mais en retrait. */}
            <div className="ed-tpls">
              {TEMPLATES.map((t) => (
                <button type="button" key={t.id} aria-pressed={template === t.id} aria-label={`${t.name} : voir la démo`} onClick={() => setFull(t.id)} style={{ backgroundImage: `url(${t.cover})` }}>
                  {template === t.id && <em className="ed-tpl-badge">✓ Votre modèle</em>}
                  <span>{t.name}{template === t.id && <small>{t.tagline}</small>}</span>
                </button>
              ))}
            </div>
            <p className="ed-help">Touchez un modèle pour voir sa démo avec vos informations, puis choisissez-le : vos textes sont conservés.</p>
          </fieldset>

          <fieldset>
            <legend>Le couple</legend>
            <div className="ed-row2">
              <label>Premier prénom<input id="p1" value={data.partner1} maxLength={40} onChange={(e) => set("partner1", e.target.value)} /></label>
              <label>Second prénom<input id="p2" value={data.partner2} maxLength={40} onChange={(e) => set("partner2", e.target.value)} /></label>
            </div>
            <label>Phrase d'invitation<textarea id="intro" rows={2} maxLength={200} value={data.intro} onChange={(e) => set("intro", e.target.value)} /></label>
            <div className="ed-photo">
              {data.photoUrl ? <img src={data.photoUrl} alt="" /> : <span className="muted">Aucune photo</span>}
              <label className="btn-s ghost">
                {data.photoUrl ? "Changer la photo" : "Ajouter votre photo"}
                <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Date et lieu</legend>
            <label>Date et heure de la cérémonie<input id="date" type="datetime-local" value={toLocalInput(data.dateISO)} onChange={(e) => e.target.value && set("dateISO", toParisISO(e.target.value))} /></label>
            <p className="ed-help">Elle sera révélée quand l'invité la grattera.</p>
            <label>Nom du lieu<input id="vname" value={data.venue.name} maxLength={120} onChange={(e) => set("venue", { ...data.venue, name: e.target.value })} /></label>
            <label>Adresse<input id="vaddr" value={data.venue.address} maxLength={200} onChange={(e) => set("venue", { ...data.venue, address: e.target.value })} /></label>
          </fieldset>

          <fieldset>
            <legend>Verset ou citation</legend>
            <label>Type
              <select id="vkind" value={data.verse?.kind ?? "none"} onChange={(e) => {
                const k = e.target.value;
                set("verse", k === "none" ? null : { kind: k as "bible" | "coran" | "autre", text: data.verse?.text ?? "", ref: data.verse?.ref ?? "", orig: data.verse?.orig });
              }}>
                <option value="none">Aucun</option><option value="bible">Bible</option><option value="coran">Coran</option><option value="autre">Autre citation</option>
              </select>
            </label>
            {data.verse && (
              <>
                {data.verse.kind !== "bible" && (
                  <label>Texte original (arabe, hébreu… facultatif)
                    <textarea id="vorig" rows={2} dir="auto" maxLength={600} value={data.verse.orig ?? ""} onChange={(e) => set("verse", { ...data.verse!, orig: e.target.value })} />
                  </label>
                )}
                <label>{data.verse.kind === "coran" ? "Traduction" : "Texte"}
                  <textarea id="vtext" rows={3} maxLength={600} placeholder={vh?.text} value={data.verse.text} onChange={(e) => set("verse", { ...data.verse!, text: e.target.value })} />
                </label>
                <label>Référence<input id="vref" maxLength={80} placeholder={vh?.ref} value={data.verse.ref} onChange={(e) => set("verse", { ...data.verse!, ref: e.target.value })} /></label>
                <p className="ed-help">Il s'affiche sous votre photo.</p>
              </>
            )}
          </fieldset>

          <fieldset>
            <legend>Programme du jour</legend>
            {data.programme.map((p, i) => (
              <div className="ed-item" key={i}>
                <input aria-label="Heure" className="ed-time" value={p.t} maxLength={12} placeholder="14h30" onChange={(e) => set("programme", data.programme.map((x, j) => (j === i ? { ...x, t: e.target.value } : x)))} />
                <input aria-label="Étape" value={p.title} maxLength={60} placeholder="Cérémonie" onChange={(e) => set("programme", data.programme.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                <input aria-label="Détail" value={p.note} maxLength={120} placeholder="Lieu ou précision" onChange={(e) => set("programme", data.programme.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
                <button type="button" className="ed-x" aria-label="Retirer cette étape" onClick={() => set("programme", data.programme.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            {data.programme.length < 10 && <button type="button" className="ed-add" onClick={() => set("programme", [...data.programme, { t: "", title: "", note: "" }])}>+ Ajouter une étape</button>}
          </fieldset>

          <fieldset>
            <legend>Dress code</legend>
            <label className="ed-check"><input type="checkbox" checked={dc.enabled} onChange={(e) => setDc({ enabled: e.target.checked })} /> Afficher un dress code</label>
            {dc.enabled && (
              <>
                <label>Titre<input id="dctitle" maxLength={60} value={dc.title} onChange={(e) => setDc({ title: e.target.value })} /></label>
                <label>Consigne générale<textarea id="dcnote" rows={2} maxLength={240} value={dc.note} onChange={(e) => setDc({ note: e.target.value })} /></label>
                <p className="ed-sub">Vos couleurs (jusqu'à 4)</p>
                {dc.colors.map((c, i) => {
                  const split = !!(c.men || c.women);
                  const upd = (patch: Partial<typeof c>) => setDc({ colors: dc.colors.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                  return (
                    <div className="ed-color" key={i}>
                      <div className="ed-item">
                        {!split && <input aria-label="Couleur" type="color" value={c.hex} onChange={(e) => upd({ hex: e.target.value })} />}
                        <input aria-label="Nom de la couleur" value={c.name} maxLength={30} placeholder="Ex. Vert sauge" onChange={(e) => upd({ name: e.target.value })} />
                        <button type="button" className="ed-x" aria-label="Retirer cette couleur" onClick={() => setDc({ colors: dc.colors.filter((_, j) => j !== i) })}>×</button>
                      </div>
                      <label className="ed-check"><input type="checkbox" checked={split} onChange={(e) => upd(e.target.checked ? { men: c.hex, women: c.hex } : { men: undefined, women: undefined })} /> Couleur différente pour les hommes et les femmes</label>
                      {split && (
                        <div className="ed-row2">
                          <label className="ed-inline">Hommes <input type="color" value={c.men ?? c.hex} onChange={(e) => upd({ men: e.target.value, hex: e.target.value })} /></label>
                          <label className="ed-inline">Femmes <input type="color" value={c.women ?? c.hex} onChange={(e) => upd({ women: e.target.value })} /></label>
                        </div>
                      )}
                    </div>
                  );
                })}
                {dc.colors.length < 4 && <button type="button" className="ed-add" onClick={() => setDc({ colors: [...dc.colors, { name: "", hex: "#C9A46A" }] })}>+ Ajouter une couleur</button>}
                <div className="ed-row2">
                  <label>Consigne hommes<textarea rows={2} maxLength={160} value={dc.men.text} onChange={(e) => setDc({ men: { ...dc.men, text: e.target.value } })} /></label>
                  <label>Consigne femmes<textarea rows={2} maxLength={160} value={dc.women.text} onChange={(e) => setDc({ women: { ...dc.women, text: e.target.value } })} /></label>
                </div>
              </>
            )}
          </fieldset>

          <fieldset>
            <legend>Notre histoire (facultatif)</legend>
            {data.story.map((s, i) => (
              <div className="ed-item" key={i}>
                <input aria-label="Année" className="ed-time" value={s.y} maxLength={12} placeholder="2019" onChange={(e) => set("story", data.story.map((x, j) => (j === i ? { ...x, y: e.target.value } : x)))} />
                <textarea aria-label="Souvenir" rows={2} maxLength={300} value={s.text} onChange={(e) => set("story", data.story.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
                <button type="button" className="ed-x" aria-label="Retirer ce souvenir" onClick={() => set("story", data.story.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            {data.story.length < 6 && <button type="button" className="ed-add" onClick={() => set("story", [...data.story, { y: "", text: "" }])}>+ Ajouter un souvenir</button>}
          </fieldset>

          <fieldset>
            <legend>Réponses et contact</legend>
            <label>Phrase pour les réponses<input id="rsvpby" maxLength={120} value={data.rsvpBy} onChange={(e) => set("rsvpBy", e.target.value)} /></label>
            <label>Votre e-mail<input id="email" type="email" maxLength={200} placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <p className="ed-help">Pour vous renvoyer le lien de votre espace si vous le perdez.</p>
          </fieldset>

          <div className="ed-actions">
            {msg && <p className={`ed-msg ${msg.kind}`} role="status">{msg.text}</p>}
            <div className="ed-btns">
              <button className="btn-s ghost" type="button" onClick={() => setFull(template)}>Voir le rendu</button>
              <button className="btn-s ghost" type="submit" disabled={busy}>Enregistrer</button>
              <button className="btn-s" type="button" disabled={busy} onClick={publish}>{status === "published" ? "Mettre à jour" : "Publier"}</button>
              {token && <a className="btn-s ghost" href={`/espace/${token}`}>Mon espace</a>}
            </div>
            {status === "published" && slug && <p className="ed-help">Lien public : <a href={`/i/${slug}`} target="_blank" rel="noopener">/i/{slug}</a></p>}
          </div>
        </form>

        <aside className={`ed-preview ${tab === "preview" ? "" : "ed-hide-m"}`}>
          <div className="ed-phone"><iframe ref={frame} src="/apercu" title="Aperçu de l'invitation" onLoad={ping} /></div>
          <div className="ed-btns" style={{ justifyContent: "center" }}>
            <button type="button" className="btn-s" onClick={() => setFull(template)}>Voir en plein écran</button>
            <button type="button" className="btn-s ghost" onClick={() => { setTab("preview"); send(true); }}>Rejouer l'ouverture</button>
          </div>
        </aside>
      </div>

      {full && (() => {
        const shown = TEMPLATES.find((t) => t.id === full)!;
        const idx = TEMPLATES.findIndex((t) => t.id === full);
        const isMine = full === template;
        return (
          <div className="ed-full" role="dialog" aria-modal="true" aria-label={`Démo du modèle ${shown.name}`}>
            <div className="ed-full-bar">
              <button type="button" className="ed-full-back" onClick={() => setFull(null)}><span aria-hidden="true">←</span> <span>Revenir à la modification</span></button>
              <div className="ed-full-nav">
                <button type="button" aria-label="Modèle précédent" onClick={() => setFull(cycle(full, -1))}>‹</button>
                <div className="ed-full-name">
                  <strong>{shown.name}</strong>
                  <small>{isMine ? "✓ Votre modèle" : `Modèle ${idx + 1} sur ${TEMPLATES.length}`} · avec vos informations</small>
                </div>
                <button type="button" aria-label="Modèle suivant" onClick={() => setFull(cycle(full, 1))}>›</button>
              </div>
              {isMine
                ? status !== "published" && <button type="button" className="btn-s" disabled={busy} onClick={() => { setFull(null); publish(); }}>Publier</button>
                : <button type="button" className="btn-s" onClick={() => { setTemplate(full); setFull(null); setMsg({ kind: "ok", text: `Modèle « ${shown.name} » choisi. Pensez à enregistrer.` }); }}>Choisir ce modèle</button>}
            </div>
            {/* key : chaque modèle recharge l'iframe, qui rejoue son ouverture. */}
            <iframe key={full} ref={fullFrame} src="/apercu?plein=1" title={`Démo du modèle ${shown.name}`} />
          </div>
        );
      })()}
    </main>
  );
}
