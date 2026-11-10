"use client";
import LegalLinks from "@/components/LegalLinks";
import "./editor.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter, useSearchParams } from "next/navigation";
import { sampleFor } from "@/lib/sample";
import { PLACES, TEMPLATES, displayNames, isBirthday, isKids, PALETTES, type InvitationData, type PlaceId, type TemplateId } from "@/lib/types";
import { lockScroll } from "@/lib/scrollLock";
import { LangSwitch, useLang, useT } from "@/components/I18n";
import { invitePath } from "@/lib/slug";
import { getLastInvite, setLastInvite, spaceHref, type LastInvite } from "@/lib/lastInvite";
import { LANGS } from "@/lib/i18n";
import TemplateRows from "@/components/TemplateRows";
import MusicPicker from "@/components/MusicPicker";
import { cycleTemplate } from "@/lib/templateOrder";

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
/** Décode la photo ; repli par <img> pour les navigateurs où createImageBitmap échoue (certains iPhone). */
async function decode(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  try { return await createImageBitmap(file); } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image(); img.src = url; await img.decode();
      return Object.assign(img, { width: img.naturalWidth, height: img.naturalHeight });
    } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
}

async function shrink(file: File): Promise<Blob> {
  const img = await decode(file);
  const k = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("photo"))), "image/jpeg", 0.85));
}


export default function Editor({ payPrice = null, order }: { payPrice?: string | null; order: TemplateId[] }) {
  const cycle = (id: TemplateId, step: number) => cycleTemplate(order, id, step);
  const router = useRouter();
  const sp = useSearchParams();
  const t = useT();
  const e_ = t.editor;
  const pay = t.pay;
  const lg = t.legal;
  const siteLang = useLang();
  const [template, setTemplate] = useState<TemplateId>((TEMPLATES.find((t) => t.id === sp.get("t"))?.id ?? "jardin-nuit") as TemplateId);
  const [data, setData] = useState<InvitationData>(() => sampleFor((TEMPLATES.find((t) => t.id === sp.get("t"))?.id ?? "jardin-nuit") as TemplateId, siteLang));
  const bday = isBirthday(template), kids = isKids(template);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState(false);
  const [last, setLast] = useState<LastInvite | null>(null);
  useEffect(() => { setLast(getLastInvite()); }, []);
  const [token, setTokenState] = useState<string | null>(sp.get("edit"));
  // Copie synchrone du jeton : deux enregistrements enchaînés (photo) ne doivent pas créer deux invitations.
  const tokenRef = useRef<string | null>(sp.get("edit"));
  const setToken = (t: string) => { tokenRef.current = t; setTokenState(t); };
  const [slug, setSlug] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [paid, setPaid] = useState(false);
  // Paiement exigé à la première publication seulement (déjà payée ou déjà publiée : gratuit).
  const needPay = !!payPrice && !paid && status !== "published";
  const publishLabel = status === "published" ? e_.update : needPay ? t.pay.publish(payPrice!) : e_.publish;
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [agree, setAgree] = useState(false); // CGV + renonciation au droit de rétractation (avant paiement)
  const [tab, setTab] = useState<"form" | "preview">("form");
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  // Photo choisie mais pas encore envoyée : elle reste dans le navigateur (aperçu par URL locale)
  // et ne part sur le serveur qu'au moment d'« Enregistrer » ou « Publier ».
  const pendingPhoto = useRef<{ blob: Blob; url: string } | null>(null);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (pendingPhoto.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  /* Chargement d'une invitation existante */
  useEffect(() => {
    const t = sp.get("edit");
    if (!t) return;
    fetch(`/api/invitations/${t}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => { setTemplate(j.template); setData(j.data); setSlug(j.slug); setStatus(j.status); setPaid(!!j.paid); setEmail(j.email ?? ""); setToken(t); if (sp.get("paiement") === "annule") setMsg({ kind: "err", text: pay.canceled }); })
      .catch(() => setMsg({ kind: "err", text: e_.msgBadLink }));
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
    const unlock = lockScroll();
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(null);
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") setFull((f) => (f ? cycle(f, e.key === "ArrowRight" ? 1 : -1) : f));
    };
    window.addEventListener("keydown", esc);
    return () => { unlock(); window.removeEventListener("keydown", esc); };
  }, [full !== null]);

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "invite-preview-ready") return;
      const fw = fullFrame.current?.contentWindow;
      if (fw && e.source === fw) {
        fw.postMessage({ type: "invite-preview", data, template: full ?? template, replay: true, full: true, demoPhoto: !!full && full !== template }, window.location.origin);
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
  const bd = data.bday ?? { age: null, surprise: false, gifts: "", endTime: "", parentPhone: "", palette: "rose" as const };
  const wl = data.wishlist ?? { note: "", items: [], fund: "" };
  const setWl = (patch: Partial<NonNullable<InvitationData["wishlist"]>>) => set("wishlist", { ...wl, ...patch });
  const setBd = (patch: Partial<NonNullable<InvitationData["bday"]>>) => set("bday", { ...bd, ...patch });
  /** Changement de modèle : un exemple encore intact est remplacé par celui du nouveau modèle (mariage, velours, anniversaire) ;
   *  sinon les textes sont gardés, et un anniversaire reçoit ses champs propres. */
  const chooseTemplate = (id: TemplateId) => {
    const lang = data.lang ?? siteLang;
    if (!token && JSON.stringify(data) === JSON.stringify(sampleFor(template, lang))) setData(sampleFor(id, lang));
    else if (isBirthday(id) && !data.bday) setData((d) => ({ ...d, bday: sampleFor(id, lang).bday }));
    setTemplate(id);
  };

  async function save(d: InvitationData = data): Promise<string | null> {
    // E-mail obligatoire à l'enregistrement et à la publication (pas avant : on peut tout remplir, photo comprise, sans e-mail).
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailErr(true); setTab("form"); setMsg({ kind: "err", text: e_.emailRequired });
      requestAnimationFrame(() => { const el = document.getElementById("email") as HTMLInputElement | null; const sec = el?.closest("details"); if (sec) sec.open = true; el?.scrollIntoView({ block: "center", behavior: "smooth" }); el?.focus({ preventScroll: true }); });
      return null;
    }
    setBusy(true); setMsg(null);
    let tk = tokenRef.current;
    const write = async (token: string | null, body: InvitationData) => {
      const res = await fetch(token ? `/api/invitations/${token}` : "/api/invitations", { method: token ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ template, data: body, email }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      return j;
    };
    try {
      const pending = pendingPhoto.current;
      if (pending) {
        // 1re fois : on crée d'abord l'invitation (sans la photo locale) pour obtenir le jeton, puis on envoie la photo.
        if (!tk) { const j0 = await write(null, { ...d, photoUrl: null }); tk = j0.editToken as string; setToken(tk); setSlug(j0.slug); router.replace(`/creer?edit=${tk}`); }
        const fd = new FormData();
        fd.append("file", new File([pending.blob], "photo.jpg", { type: "image/jpeg" }));
        const up = await fetch(`/api/upload?token=${tk}`, { method: "POST", body: fd });
        const ju = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(ju.error || e_.msgPhotoFail);
        d = { ...d, photoUrl: ju.url };
        pendingPhoto.current = null; URL.revokeObjectURL(pending.url);
        setData((cur) => (cur.photoUrl === pending.url ? { ...cur, photoUrl: ju.url } : cur));
      }
      const j = await write(tk, d);
      setSlug(j.slug);
      if (!tk && j.editToken) { setToken(j.editToken); router.replace(`/creer?edit=${j.editToken}`); }
      setLastInvite({ token: tk ?? j.editToken, names: displayNames(d) });
      setMsg({ kind: "ok", text: e_.msgSaved });
      return tk ?? j.editToken;
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error && e.message ? e.message : e_.msgSaveFail });
      return null;
    } finally { setBusy(false); }
  }

  async function publish() {
    if (needPay && !agree) {
      setMsg({ kind: "err", text: lg.acceptRequired });
      document.getElementById("cgv-ok")?.focus();
      return;
    }
    const t = await save();
    if (!t) return;
    setBusy(true);
    const res = await fetch(`/api/invitations/${t}/publish`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ acceptTerms: agree }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg({ kind: "err", text: j.error ?? e_.msgPublishFail }); return; }
    // Paiement requis : on part sur la page sécurisée de Stripe ; la publication se fait au retour.
    if (j.checkoutUrl) { setMsg({ kind: "ok", text: pay.redirect }); setBusy(true); window.location.assign(j.checkoutUrl); return; }
    if (j.slug) setSlug(j.slug);
    setStatus("published");
    setMsg({ kind: "ok", text: e_.msgPublished });
  }

  /** Photo choisie : réduite dans le navigateur et affichée tout de suite ; envoyée seulement à l'enregistrement. */
  /** Photo facultative : on peut toujours la retirer (enregistré au prochain « Enregistrer »). */
  function removePhoto() {
    if (pendingPhoto.current) { URL.revokeObjectURL(pendingPhoto.current.url); pendingPhoto.current = null; }
    set("photoUrl", null);
    setMsg(null);
  }

  async function upload(file: File) {
    setMsg(null);
    try {
      const blob = await shrink(file);
      if (pendingPhoto.current) URL.revokeObjectURL(pendingPhoto.current.url);
      const url = URL.createObjectURL(blob);
      pendingPhoto.current = { blob, url };
      set("photoUrl", url);
      setMsg({ kind: "ok", text: e_.msgPhotoLocal });
    } catch {
      setMsg({ kind: "err", text: e_.msgPhotoFail });
    }
  }

  const vh = data.verse ? e_.verseHints[data.verse.kind] : null;
  const tplName = (id: TemplateId) => t.templates[id].name;

  return (
    <main className="site ed">
      <nav className="ed-top">
        <Link href="/" className="ed-home" aria-label={t.common.backHome}><span aria-hidden="true">←</span> <Logo height={28} /></Link>
        <LangSwitch />
      </nav>
      <div className="ed-tabs">
        <button type="button" aria-pressed={tab === "form"} onClick={() => setTab("form")}>{e_.editTab}</button>
        <button type="button" aria-pressed={tab === "preview"} onClick={() => setTab("preview")}>{e_.previewTab}</button>
      </div>

      <div className="ed-grid">
        <form noValidate className={`ed-form ${tab === "form" ? "" : "ed-hide-m"}`} onSubmit={async (e) => { e.preventDefault(); const tk = await save(); if (tk) router.push(`/espace/${tk}?enregistre=1`); }}>
          <h1>{e_.title}</h1>
          {!token && <p className="ed-help ed-back">{e_.already} {last ? <a href={spaceHref(last)}>{t.find.resume(last.names)}</a> : <a href="/espace">{t.find.title}</a>}</p>}

          <Sec open title={e_.style} meta={t.templates[template].name}>
            {/* Le modèle choisi passe en tête, en grand, avec un badge ; les autres restent disponibles mais en retrait. */}
            <TemplateRows compact noAll order={order} names={[data.partner1, bday ? "" : data.partner2]} lang={siteLang} selected={template} onSelect={chooseTemplate} onPreview={setFull} />
            <p className="ed-help">{e_.styleHelp}</p>
            <label>{e_.inviteLang}
              <select id="ilang" value={data.lang ?? "fr"} onChange={(e) => set("lang", e.target.value as InvitationData["lang"])}>
                {LANGS.map((l) => <option key={l} value={l}>{t.common.langNames[l]}</option>)}
              </select>
            </label>
            <p className="ed-help">{e_.inviteLangHelp}</p>
            <MusicPicker value={data.music} template={template} onChange={(v) => set("music", v)} />
          </Sec>

          <Sec title={bday ? e_.celebrant : e_.couple}>
            {bday ? (
              <div className="ed-row2">
                <label>{e_.firstName}<input id="p1" value={data.partner1} maxLength={40} onChange={(e) => set("partner1", e.target.value)} /></label>
                <label>{e_.age}<input id="age" type="number" inputMode="numeric" min={1} max={120} placeholder={e_.agePh} value={bd.age ?? ""} onChange={(e) => { const n = parseInt(e.target.value, 10); setBd({ age: n >= 1 && n <= 120 ? n : null }); }} /></label>
              </div>
            ) : (
              <div className="ed-row2">
                <label>{e_.first}<input id="p1" value={data.partner1} maxLength={40} onChange={(e) => set("partner1", e.target.value)} /></label>
                <label>{e_.second}<input id="p2" value={data.partner2} maxLength={40} onChange={(e) => set("partner2", e.target.value)} /></label>
              </div>
            )}
            <label>{e_.intro}<textarea id="intro" rows={2} maxLength={200} value={data.intro} onChange={(e) => set("intro", e.target.value)} /></label>
            <div className="ed-photo">
              {data.photoUrl ? <img src={data.photoUrl} alt="" /> : <span className="muted">{e_.noPhoto}</span>}
              <label className="btn-s ghost">
                {data.photoUrl ? e_.changePhoto : e_.addPhoto}
                <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { if (e.target.files?.[0]) upload(e.target.files[0]); e.target.value = ""; }} />
              </label>
              {data.photoUrl && <button type="button" className="btn-s ghost" onClick={removePhoto}>{e_.removePhoto}</button>}
            </div>
            <p className="ed-help">{bday && data.bday?.age ? e_.photoAge : e_.photoOptional}</p>
          </Sec>

          <Sec title={e_.dateVenue}>
            <label>{bday ? e_.partyDateTime : e_.dateTime}<input id="date" type="datetime-local" value={toLocalInput(data.dateISO)} onChange={(e) => e.target.value && set("dateISO", toParisISO(e.target.value))} /></label>
            <p className="ed-help">{e_.dateHelp}</p>
            <label>{e_.venueName}<input id="vname" value={data.venue.name} maxLength={120} onChange={(e) => set("venue", { ...data.venue, name: e.target.value })} /></label>
            <label>{e_.address}<input id="vaddr" value={data.venue.address} maxLength={200} onChange={(e) => set("venue", { ...data.venue, address: e.target.value })} /></label>
          </Sec>

          {bday && (
            <Sec title={e_.party}>
              {kids && (
                <div className="ed-palettes" role="radiogroup" aria-label={e_.palette}>
                  <p className="ed-sub">{e_.palette}</p>
                  {PALETTES.map((pl) => (
                    <button key={pl} type="button" role="radio" aria-checked={bd.palette === pl} className={`ed-pal ed-pal-${pl}`} onClick={() => setBd({ palette: pl })}>
                      <span aria-hidden="true" /><span aria-hidden="true" />{e_.palettes[pl]}
                    </button>
                  ))}
                </div>
              )}
              <label className="ed-check"><input type="checkbox" checked={bd.surprise} onChange={(e) => setBd({ surprise: e.target.checked })} /> {e_.surprise}</label>
              <label>{kids ? e_.endTimeKid : e_.endTime}<input id="endtime" maxLength={12} placeholder={e_.endPh} value={bd.endTime} onChange={(e) => setBd({ endTime: e.target.value })} /></label>
              {kids && <label>{e_.parentPhone}<input id="pphone" type="tel" maxLength={30} placeholder={e_.parentPhonePh} value={bd.parentPhone} onChange={(e) => setBd({ parentPhone: e.target.value })} /></label>}
              <label>{e_.gifts}<textarea id="gifts" rows={2} maxLength={300} placeholder={e_.giftsPh} value={bd.gifts} onChange={(e) => setBd({ gifts: e.target.value })} /></label>
            </Sec>
          )}

          {!bday && <Sec title={e_.verse}>
            <label>{e_.type}
              <select id="vkind" value={data.verse?.kind ?? "none"} onChange={(e) => {
                const k = e.target.value;
                set("verse", k === "none" ? null : { kind: k as "bible" | "coran" | "autre", text: data.verse?.text ?? "", ref: data.verse?.ref ?? "", orig: data.verse?.orig });
              }}>
                <option value="none">{e_.vNone}</option><option value="bible">{e_.vBible}</option><option value="coran">{e_.vCoran}</option><option value="autre">{e_.vOther}</option>
              </select>
            </label>
            {data.verse && (
              <>
                {data.verse.kind !== "bible" && (
                  <label>{e_.vOrig}
                    <textarea id="vorig" rows={2} dir="auto" maxLength={600} value={data.verse.orig ?? ""} onChange={(e) => set("verse", { ...data.verse!, orig: e.target.value })} />
                  </label>
                )}
                <label>{data.verse.kind === "coran" ? e_.vTranslation : e_.vText}
                  <textarea id="vtext" rows={3} maxLength={600} placeholder={vh?.text} value={data.verse.text} onChange={(e) => set("verse", { ...data.verse!, text: e.target.value })} />
                </label>
                <label>{e_.vRef}<input id="vref" maxLength={80} placeholder={vh?.ref} value={data.verse.ref} onChange={(e) => set("verse", { ...data.verse!, ref: e.target.value })} /></label>
                <p className="ed-help">{e_.vHelp}</p>
              </>
            )}
          </Sec>}

          <Sec title={e_.programme}>
            {data.programme.map((p, i) => (
              <div className="ed-item" key={i}>
                <input aria-label={e_.time} className="ed-time" value={p.t} maxLength={12} placeholder={e_.timePh} onChange={(e) => set("programme", data.programme.map((x, j) => (j === i ? { ...x, t: e.target.value } : x)))} />
                <input aria-label={e_.step} value={p.title} maxLength={60} placeholder={e_.stepPh} onChange={(e) => set("programme", data.programme.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                <input aria-label={e_.detail} value={p.note} maxLength={120} placeholder={e_.detailPh} onChange={(e) => set("programme", data.programme.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
                <button type="button" className="ed-x" aria-label={e_.removeStep} onClick={() => set("programme", data.programme.filter((_, j) => j !== i))}>×</button>
                {template === "boule-neige" && (
                  <select className="ed-place" aria-label={e_.place} value={p.place ?? ""} onChange={(e) => set("programme", data.programme.map((x, j) => (j === i ? { ...x, place: (e.target.value || undefined) as PlaceId | undefined } : x)))}>
                    <option value="">{e_.place} · {e_.placeAuto}</option>
                    {PLACES.map((pl) => <option key={pl} value={pl}>{e_.places[pl]}</option>)}
                  </select>
                )}
              </div>
            ))}
            {data.programme.length < 10 && <button type="button" className="ed-add" onClick={() => set("programme", [...data.programme, { t: "", title: "", note: "" }])}>{e_.addStep}</button>}
          </Sec>

          <Sec title={bday ? e_.dressTheme : e_.dress}>
            <label className="ed-check"><input type="checkbox" checked={dc.enabled} onChange={(e) => setDc({ enabled: e.target.checked })} /> {bday ? e_.showTheme : e_.showDress}</label>
            {dc.enabled && (
              <>
                <label>{e_.dTitle}<input id="dctitle" maxLength={60} value={dc.title} onChange={(e) => setDc({ title: e.target.value })} /></label>
                <label>{e_.dNote}<textarea id="dcnote" rows={2} maxLength={240} value={dc.note} onChange={(e) => setDc({ note: e.target.value })} /></label>
                <p className="ed-sub">{e_.colors}</p>
                {dc.colors.map((c, i) => {
                  const split = !!(c.men || c.women);
                  const upd = (patch: Partial<typeof c>) => setDc({ colors: dc.colors.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                  return (
                    <div className="ed-color" key={i}>
                      <div className="ed-item">
                        {!split && <input aria-label={e_.color} type="color" value={c.hex} onChange={(e) => upd({ hex: e.target.value })} />}
                        <input aria-label={e_.colorName} value={c.name} maxLength={30} placeholder={e_.colorPh} onChange={(e) => upd({ name: e.target.value })} />
                        <button type="button" className="ed-x" aria-label={e_.removeColor} onClick={() => setDc({ colors: dc.colors.filter((_, j) => j !== i) })}>×</button>
                      </div>
                      {!bday && <label className="ed-check"><input type="checkbox" checked={split} onChange={(e) => upd(e.target.checked ? { men: c.hex, women: c.hex } : { men: undefined, women: undefined })} /> {e_.split}</label>}
                      {split && (
                        <div className="ed-row2">
                          <label className="ed-inline">{e_.men} <input type="color" value={c.men ?? c.hex} onChange={(e) => upd({ men: e.target.value, hex: e.target.value })} /></label>
                          <label className="ed-inline">{e_.women} <input type="color" value={c.women ?? c.hex} onChange={(e) => upd({ women: e.target.value })} /></label>
                        </div>
                      )}
                    </div>
                  );
                })}
                {dc.colors.length < 4 && <button type="button" className="ed-add" onClick={() => setDc({ colors: [...dc.colors, { name: "", hex: "#C9A46A" }] })}>{e_.addColor}</button>}
                {!bday && <div className="ed-row2">
                  <label>{e_.menNote}<textarea rows={2} maxLength={160} value={dc.men.text} onChange={(e) => setDc({ men: { ...dc.men, text: e.target.value } })} /></label>
                  <label>{e_.womenNote}<textarea rows={2} maxLength={160} value={dc.women.text} onChange={(e) => setDc({ women: { ...dc.women, text: e.target.value } })} /></label>
                </div>}
              </>
            )}
          </Sec>

          {!bday && <Sec title={e_.story}>
            {data.story.map((s, i) => (
              <div className="ed-item" key={i}>
                <input aria-label={e_.year} className="ed-time" value={s.y} maxLength={12} placeholder="2019" onChange={(e) => set("story", data.story.map((x, j) => (j === i ? { ...x, y: e.target.value } : x)))} />
                <textarea aria-label={e_.memory} rows={2} maxLength={300} value={s.text} onChange={(e) => set("story", data.story.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
                <button type="button" className="ed-x" aria-label={e_.removeMemory} onClick={() => set("story", data.story.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            {data.story.length < 6 && <button type="button" className="ed-add" onClick={() => set("story", [...data.story, { y: "", text: "" }])}>{e_.addMemory}</button>}
          </Sec>}

          <Sec title={e_.wish}>
            <p className="ed-help">{e_.wishHelp}</p>
            <label>{e_.wishNote}<textarea id="wnote" rows={2} maxLength={240} placeholder={e_.wishNotePh} value={wl.note} onChange={(e) => setWl({ note: e.target.value })} /></label>
            {wl.items.map((w, i) => {
              const upd = (patch: Partial<typeof w>) => setWl({ items: wl.items.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
              return (
                <div className="ed-wish" key={i}>
                  <input aria-label={e_.wishName} value={w.name} maxLength={80} placeholder={e_.wishNamePh} onChange={(e) => upd({ name: e.target.value })} />
                  <input aria-label={e_.wishUrl} type="url" inputMode="url" value={w.url} maxLength={500} placeholder={e_.wishUrlPh} aria-invalid={!okLink(w.url) || undefined} className={okLink(w.url) ? undefined : "ed-invalid"} onChange={(e) => upd({ url: e.target.value })} onBlur={() => upd({ url: fixLink(w.url) })} />
                  <button type="button" className="ed-x" aria-label={e_.removeWish} onClick={() => setWl({ items: wl.items.filter((_, j) => j !== i) })}>×</button>
                  {!okLink(w.url) && <p className="ed-help ed-bad">{e_.badLink}</p>}
                </div>
              );
            })}
            {wl.items.length < 20 && <button type="button" className="ed-add" onClick={() => setWl({ items: [...wl.items, { name: "", url: "" }] })}>{e_.addWish}</button>}
            <label>{e_.fund}<input id="wfund" type="url" inputMode="url" maxLength={500} placeholder={e_.fundPh} value={wl.fund} aria-invalid={!okLink(wl.fund) || undefined} className={okLink(wl.fund) ? undefined : "ed-invalid"} onChange={(e) => setWl({ fund: e.target.value })} onBlur={() => setWl({ fund: fixLink(wl.fund) })} /></label>
            {okLink(wl.fund) ? <p className="ed-help">{e_.fundHelp}</p> : <p className="ed-help ed-bad">{e_.badLink}</p>}
          </Sec>

          <Sec title={e_.replies}>
            <label>{e_.rsvpLine}<input id="rsvpby" maxLength={120} value={data.rsvpBy} onChange={(e) => set("rsvpBy", e.target.value)} /></label>
            <label><span>{e_.email} <span aria-hidden="true">*</span></span><input id="email" type="email" required autoComplete="email" aria-invalid={emailErr || undefined} className={emailErr ? "ed-invalid" : undefined} maxLength={200} placeholder={e_.emailPh} value={email} onChange={(e) => { setEmail(e.target.value); setEmailErr(false); }} /></label>
            <p className="ed-help">{e_.emailHelp} <a href="/espace">{t.find.lost}</a></p>
          </Sec>

          <div className="ed-actions">
            {msg && <p className={`ed-msg ${msg.kind}`} role="status">{msg.text}</p>}
            <div className="ed-btns">
              <button className="btn-s ghost" type="button" onClick={() => setFull(template)}>{e_.seeRender}</button>
              <button className="btn-s ghost" type="submit" disabled={busy}>{e_.save}</button>
              <button className="btn-s" type="button" disabled={busy} onClick={publish}>{publishLabel}</button>
              {token && <a className="btn-s ghost" href={`/espace/${token}`}>{e_.mySpace}</a>}
            </div>
            {needPay && <p className="ed-help">{t.pay.note(payPrice!)}</p>}
            {needPay && <label className="ed-check ed-cgv"><input id="cgv-ok" type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setMsg(null); }} /> <span>{lg.accept} <a href="/cgv" target="_blank" rel="noopener">{lg.cgv}</a></span></label>}
            {!needPay && status !== "published" && <p className="ed-help">{lg.publishNote}</p>}
            {status === "published" && slug && <p className="ed-help">{e_.publicLink} <a href={invitePath(slug)} target="_blank" rel="noopener">{invitePath(slug)}</a></p>}
            <LegalLinks className="ed-legal" />
          </div>
        </form>

        <aside className={`ed-preview ${tab === "preview" ? "" : "ed-hide-m"}`}>
          <div className="ed-phone"><iframe ref={frame} src="/apercu" title={e_.previewTitle} onLoad={ping} /></div>
          <div className="ed-btns" style={{ justifyContent: "center" }}>
            <button type="button" className="btn-s" onClick={() => setFull(template)}>{e_.fullscreen}</button>
            <button type="button" className="btn-s ghost" onClick={() => { setTab("preview"); send(true); }}>{e_.replay}</button>
          </div>
        </aside>
      </div>

      {full && (() => {
        const shown = { id: full, name: tplName(full) };
        const idx = order.indexOf(full);
        const isMine = full === template;
        return (
          <div className="ed-full" role="dialog" aria-modal="true" aria-label={t.common.demoOf(shown.name)}>
            <div className="ed-full-bar">
              <button type="button" className="ed-full-back" onClick={() => setFull(null)}><span aria-hidden="true">←</span> <span>{e_.backEdit}</span></button>
              <div className="ed-full-nav">
                <button type="button" aria-label={t.common.prevTpl} onClick={() => setFull(cycle(full, -1))}>‹</button>
                <div className="ed-full-name">
                  <strong>{shown.name}</strong>
                  <small>{isMine ? e_.yourModel : t.common.tplOf(idx + 1, order.length)} · {e_.withYourInfo}</small>
                </div>
                <button type="button" aria-label={t.common.nextTpl} onClick={() => setFull(cycle(full, 1))}>›</button>
              </div>
              {isMine
                ? status !== "published" && <button type="button" className="btn-s" disabled={busy} onClick={() => { setFull(null); publish(); }}>{publishLabel}</button>
                : <button type="button" className="btn-s" onClick={() => { chooseTemplate(full); setFull(null); setMsg({ kind: "ok", text: e_.msgChosen(shown.name) }); }}><span className="lbl-lg">{e_.choose}</span><span className="lbl-sm">{e_.chooseShort}</span></button>}
            </div>
            {/* key : chaque modèle recharge l'iframe, qui rejoue son ouverture. */}
            <iframe key={full} ref={fullFrame} src="/apercu?plein=1" title={t.common.demoOf(shown.name)} allow="accelerometer; gyroscope" />
          </div>
        );
      })()}
    </main>
  );
}

/** Section repliable du formulaire : chacune s'ouvre et se ferme indépendamment et reste comme la personne l'a laissée. */
function Sec({ title, meta, open = false, children }: { title: string; meta?: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="ed-sec" open={open}>
      <summary><span>{title}</span>{meta && <em>{meta}</em>}</summary>
      <fieldset><legend>{title}</legend>{children}</fieldset>
    </details>
  );
}

/** Lien de souhait : vide accepté, sinon un domaine (https:// ajouté au besoin). */
const okLink = (v: string) => !v.trim() || /^(https?:\/\/)?[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/i.test(v.trim());
const fixLink = (v: string) => { const t = v.trim(); return t && okLink(t) && !/^https?:\/\//i.test(t) ? `https://${t}` : t; };
