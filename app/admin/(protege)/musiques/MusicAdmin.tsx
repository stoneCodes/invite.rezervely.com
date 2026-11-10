"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import adminFr from "@/lib/i18n/admin-fr";
import { MUSIC_BASE_VOLUME, type SoundLevels } from "@/lib/music";

type Track = { id: string; title: string; src: string; start: number; active: boolean; uploaded: boolean };
type Msg = { ok: boolean; text: string } | null;
const A = adminFr;

async function post(body: unknown) {
  const res = body instanceof FormData
    ? await fetch("/api/admin/musiques", { method: "POST", body })
    : await fetch("/api/admin/musiques", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || A.actionFailed);
}
const errText = (e: unknown) => (e instanceof Error ? e.message : A.actionFailed);

export default function MusicAdmin({ tracks, defaults, levels: initialLevels, categories, ready }: { tracks: Track[]; defaults: Record<string, string | undefined>; levels: SoundLevels; categories: { id: string; label: string }[]; ready: boolean }) {
  const router = useRouter();
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => audio.current?.pause(), []);
  function listen(t: { id: string; src: string; start: number }) {
    const a = audio.current ?? (audio.current = new Audio());
    if (playing === t.id) { a.pause(); setPlaying(null); return; }
    a.volume = MUSIC_BASE_VOLUME * (levels.music / 100); // comme dans les invitations
    a.src = t.src; a.onended = () => setPlaying(null);
    a.onloadedmetadata = () => { try { a.currentTime = t.start; } catch {} };
    a.play().then(() => setPlaying(t.id)).catch(() => setPlaying(null));
  }

  // Volume général (musique, effets), enregistré au relâchement du curseur
  const [levels, setLevels] = useState(initialLevels);
  const [lvMsg, setLvMsg] = useState<Msg>(null);
  const savedLevels = useRef(initialLevels);
  useEffect(() => { if (audio.current) audio.current.volume = MUSIC_BASE_VOLUME * (levels.music / 100); }, [levels.music]);
  async function saveLevels(next: SoundLevels) {
    if (next.music === savedLevels.current.music && next.effects === savedLevels.current.effects) return;
    setLvMsg(null);
    try { await post({ action: "levels", levels: next }); savedLevels.current = next; setLvMsg({ ok: true, text: A.musicDone }); }
    catch (e) { setLvMsg({ ok: false, text: errText(e) }); }
  }
  const slider = (key: keyof SoundLevels, label: string) => <label className="ad-level">
    <span>{label}<b>{levels[key] === 0 ? A.levelsMuted : `${levels[key]} %`}</b></span>
    <input type="range" min={0} max={100} step={5} value={levels[key]}
      onChange={(e) => setLevels((l) => ({ ...l, [key]: Number(e.target.value) }))}
      onPointerUp={() => void saveLevels(levels)} onKeyUp={() => void saveLevels(levels)} onBlur={() => void saveLevels(levels)} />
  </label>;

  // Musique par défaut de chaque catégorie
  const active = tracks.filter((t) => t.active);
  const [defs, setDefs] = useState(defaults);
  const [saved, setSaved] = useState<{ cat: string; msg: Msg } | null>(null);
  const [busy, setBusy] = useState(false);
  /** Enregistre aussitôt la musique par défaut d'une catégorie. */
  async function saveDefault(cat: string, id: string) {
    const next = { ...defs, [cat]: id };
    setDefs(next); setBusy(true); setSaved(null);
    try { await post({ action: "defaults", defaults: next }); setSaved({ cat, msg: { ok: true, text: A.musicDone } }); router.refresh(); }
    catch (e) { setDefs(defs); setSaved({ cat, msg: { ok: false, text: errText(e) } }); } finally { setBusy(false); }
  }

  // Ajout d'un son
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [start, setStart] = useState("0");
  const [addMsg, setAddMsg] = useState<Msg>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name.trim()) return;
    if (file.size > 15 * 1024 * 1024) { setAddMsg({ ok: false, text: A.musicTooBig }); return; }
    setBusy(true); setAddMsg(null);
    const fd = new FormData(); fd.append("file", file); fd.append("title", name); fd.append("start", start);
    try {
      await post(fd);
      setAddMsg({ ok: true, text: A.musicDone }); setFile(null); setName(""); setStart("0");
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } catch (err) { setAddMsg({ ok: false, text: errText(err) }); } finally { setBusy(false); }
  }

  return <div className="ad-music">
    <section className="ad-panel">
      <h2>{A.levelsTitle}</h2>
      <p className="ad-music-help">{A.levelsHelp}</p>
      <div className="ad-levels">
        {slider("music", A.levelsMusic)}
        {slider("effects", A.levelsEffects)}
      </div>
      {lvMsg && <small role={lvMsg.ok ? "status" : "alert"} className={`ad-music-msg ${lvMsg.ok ? "ok" : "err"}`}>{lvMsg.ok ? "✓ " : ""}{lvMsg.text}</small>}
    </section>

    <section className="ad-panel">
      <h2>{A.musicDefaultsTitle}</h2>
      <p className="ad-music-help">{A.musicDefaultsHelp}</p>
      <div className="ad-music-defs">
        {categories.map((c) => <div key={c.id} className="ad-music-def">
          <label htmlFor={`def-${c.id}`}>{c.label}</label>
          <select id={`def-${c.id}`} value={defs[c.id] ?? ""} disabled={!ready || busy} onChange={(e) => void saveDefault(c.id, e.target.value)}>
            {active.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          {saved?.cat === c.id && saved.msg && <small role={saved.msg.ok ? "status" : "alert"} className={saved.msg.ok ? "ok" : "err"}>{saved.msg.ok ? "✓ " : ""}{saved.msg.text}</small>}
        </div>)}
      </div>
    </section>

    <section className="ad-panel">
      <h2>{A.musicLibraryTitle}</h2>
      {tracks.length === 0 ? <p>{A.musicEmpty}</p> : <ul className="ad-music-list">
        {tracks.map((t) => <TrackRow key={t.id + t.title + t.start + t.active} t={t} ready={ready} playing={playing === t.id} onListen={() => listen(t)} onDone={() => router.refresh()} />)}
      </ul>}
    </section>

    <section className="ad-panel">
      <h2>{A.musicAddTitle}</h2>
      <p className="ad-music-help">{A.musicAddHelp}</p>
      <form className="ad-music-add" onSubmit={(e) => void add(e)}>
        <label>{A.musicFile}
          <input ref={fileInput} type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/ogg,audio/wav,.mp3,.m4a,.aac,.ogg,.wav" required disabled={!ready || busy}
            onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); setAddMsg(null); if (f && !name) setName(f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim()); }} />
        </label>
        <label>{A.musicName}<input value={name} maxLength={80} required disabled={!ready || busy} onChange={(e) => setName(e.target.value)} /></label>
        <label>{A.musicStart}<input type="number" min={0} max={599} step={0.5} inputMode="decimal" value={start} disabled={!ready || busy} onChange={(e) => setStart(e.target.value)} /></label>
        <div className="ad-music-actions">
          <button type="submit" className="ad-music-main" disabled={!ready || busy || !file || !name.trim()}>{busy && file ? A.musicAdding : A.musicAdd}</button>
          {addMsg && <small role={addMsg.ok ? "status" : "alert"} className={addMsg.ok ? "ok" : "err"}>{addMsg.text}</small>}
        </div>
      </form>
    </section>
  </div>;
}

/** Un morceau : titre, début, visible ou masqué, écouter, enregistrer, supprimer. */
function TrackRow({ t, ready, playing, onListen, onDone }: { t: Track; ready: boolean; playing: boolean; onListen: () => void; onDone: () => void }) {
  const [title, setTitle] = useState(t.title);
  const [start, setStart] = useState(String(t.start));
  const [active, setActive] = useState(t.active);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const dirty = title.trim() !== t.title || Number(start) !== t.start || active !== t.active;
  async function run(body: unknown) {
    setBusy(true); setMsg(null);
    try { await post(body); setMsg({ ok: true, text: A.musicDone }); onDone(); }
    catch (e) { setMsg({ ok: false, text: errText(e) }); } finally { setBusy(false); }
  }
  return <li className={active ? "" : "is-hidden"}>
    <details>
      <summary>
        <button type="button" className="ad-music-play" aria-pressed={playing} onClick={(e) => { e.preventDefault(); onListen(); }} aria-label={`${playing ? A.musicStop : A.musicListen} : ${t.title}`}>{playing ? "■" : "▶"}</button>
        <span className="ad-music-title">{t.title}{!t.active && <small>{A.musicHidden}</small>}</span>
        <span className="ad-music-chev" aria-hidden="true" />
      </summary>
      <div className="ad-music-body">
        <label>{A.musicName}<input value={title} maxLength={80} disabled={!ready || busy} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>{A.musicStart}<input type="number" min={0} max={599} step={0.5} inputMode="decimal" value={start} disabled={!ready || busy} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="ad-music-vis"><input type="checkbox" checked={active} disabled={!ready || busy} onChange={(e) => setActive(e.target.checked)} />{A.musicVisible}</label>
        <small className="ad-music-origin">{t.uploaded ? A.musicUploaded : A.musicBuiltin}</small>
        <span className="ad-music-row-actions">
          <button type="button" className="ad-music-main" disabled={!ready || busy || !dirty || !title.trim()} onClick={() => void run({ action: "update", id: t.id, title, start: Number(start) || 0, active })}>{A.musicSave}</button>
          <button type="button" className="ad-music-del" disabled={!ready || busy} onClick={() => { if (window.confirm(A.musicConfirmDelete(t.title))) void run({ action: "delete", id: t.id }); }}>{A.musicDelete}</button>
        </span>
        {msg && <small role={msg.ok ? "status" : "alert"} className={`ad-music-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</small>}
      </div>
    </details>
  </li>;
}
