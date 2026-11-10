import "server-only";
import { db } from "@/lib/supabase";
import { getAdminSetting } from "@/lib/admin/settings";
import { BUILTIN_DEFAULTS, BUILTIN_TRACKS, MUSIC_DEFAULTS_KEY, SOUND_LEVELS_KEY, normalizeLevels, type MusicDefaults, type MusicLibrary, type SoundLevels, type Track } from "@/lib/music";

export type TrackRow = { id: string; title: string; src: string; storage_path: string | null; start_sec: number; sort: number; active: boolean; created_at: string };

/** Toutes les lignes de la table `tracks` (admin). null = table absente (migration 012 pas encore appliquée). */
export async function listTrackRows(): Promise<TrackRow[] | null> {
  const { data, error } = await db().from("tracks").select("id,title,src,storage_path,start_sec,sort,active,created_at").order("sort").order("created_at");
  if (error) { console.error("music.list", error.message); return null; }
  return data as TrackRow[];
}

export async function getMusicDefaults(): Promise<MusicDefaults> {
  const saved = await getAdminSetting<MusicDefaults>(MUSIC_DEFAULTS_KEY).catch(() => null);
  return saved && typeof saved === "object" ? { ...BUILTIN_DEFAULTS, ...saved } : BUILTIN_DEFAULTS;
}

/** Volumes généraux (musique, effets), 100 % par défaut. */
export async function getSoundLevels(): Promise<SoundLevels> {
  return normalizeLevels(await getAdminSetting<SoundLevels>(SOUND_LEVELS_KEY).catch(() => null));
}

/** Bibliothèque publique : morceaux actifs + musique par défaut de chaque catégorie. */
export async function getMusicLibrary(): Promise<MusicLibrary> {
  const [rows, defaults, levels] = await Promise.all([listTrackRows(), getMusicDefaults(), getSoundLevels()]);
  const tracks: Track[] = rows ? rows.filter((r) => r.active).map((r) => ({ id: r.id, title: r.title, src: r.src, start: Number(r.start_sec) || 0 })) : BUILTIN_TRACKS;
  return { tracks, defaults, levels };
}
