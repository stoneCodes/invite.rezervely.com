import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getMusicDefaults, getSoundLevels, listTrackRows } from "@/lib/admin/music";
import { BUILTIN_TRACKS } from "@/lib/music";
import { CATEGORIES } from "@/lib/types";
import { fr as siteFr } from "@/lib/i18n/site-fr";
import adminFr from "@/lib/i18n/admin-fr";
import MusicAdmin from "./MusicAdmin";

export const dynamic = "force-dynamic";

/** Bibliothèque de musiques : ajout de sons, réglages, musique par défaut de chaque catégorie. */
export default async function MusicPage() {
  if (!await requireAdmin()) notFound();
  const [rows, defaults, levels] = await Promise.all([listTrackRows(), getMusicDefaults(), getSoundLevels()]);
  const tracks = rows
    ? rows.map((r) => ({ id: r.id, title: r.title, src: r.src, start: Number(r.start_sec) || 0, active: r.active, uploaded: !!r.storage_path }))
    : BUILTIN_TRACKS.map((t) => ({ ...t, active: true, uploaded: false }));
  const categories = CATEGORIES.map(({ id }) => ({ id, label: siteFr.gallery.rows[id] }));
  return <main className="ad-main ad-music-page">
    <div className="ad-price-intro"><div><span className="ad-price-kicker">{adminFr.musicKicker}</span><h1>{adminFr.musicTitle}</h1><p>{adminFr.musicDescription}</p></div></div>
    {!rows && <p className="ad-panel ad-music-warn" role="alert">{adminFr.musicMigration}</p>}
    <MusicAdmin tracks={tracks} defaults={defaults} levels={levels} categories={categories} ready={!!rows} />
  </main>;
}
