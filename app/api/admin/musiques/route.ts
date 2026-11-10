import { NextResponse } from "next/server";
import { requireAdmin, originAllowed } from "@/lib/admin/auth";
import { recordAdminEvent } from "@/lib/admin/audit";
import { setAdminSetting } from "@/lib/admin/settings";
import { listTrackRows } from "@/lib/admin/music";
import { MUSIC_DEFAULTS_KEY, SOUND_LEVELS_KEY, normalizeLevels } from "@/lib/music";
import { CATEGORIES } from "@/lib/types";
import { db } from "@/lib/supabase";
import adminFr from "@/lib/i18n/admin-fr";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac", "audio/ogg": "ogg", "audio/wav": "wav", "audio/x-wav": "wav", "audio/webm": "webm" };
const MIME: Record<string, string> = { mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg", wav: "audio/wav", webm: "audio/webm" };
const MAX = 15 * 1024 * 1024;
const fail = (error: string = adminFr.formError, status = 400) => NextResponse.json({ error }, { status });
const title = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, 80) : "");
const start = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n >= 0 && n < 600 ? Math.round(n * 10) / 10 : 0; };
const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "son";

/**
 * Musiques (admin) : ajout d'un son (multipart), réglages d'un morceau, suppression, musiques par défaut par catégorie.
 * Protégé par session admin + Origin ; chaque action est journalisée dans admin_events.
 */
export async function POST(req: Request) {
  const actor = await requireAdmin();
  if (!actor || !originAllowed(req)) return new NextResponse(null, { status: 404 });
  const isJson = (req.headers.get("content-type") || "").startsWith("application/json");
  const json = isJson ? await req.clone().json().catch(() => null) : null;
  // Volumes généraux : table settings (migration 007), indépendant de la table tracks.
  if (json?.action === "levels") {
    const levels = normalizeLevels(json.levels);
    await setAdminSetting(SOUND_LEVELS_KEY, levels);
    await recordAdminEvent({ actor, action: adminFr.musicAction, details: { stage: "completed", op: "levels", levels } });
    return NextResponse.json({ ok: true, levels });
  }
  const rows = await listTrackRows();
  if (!rows) return fail(adminFr.musicMigration, 409);

  // Ajout d'un fichier
  if ((req.headers.get("content-type") || "").startsWith("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    const name = title(form?.get("title"));
    if (!(file instanceof File) || !name) return fail();
    // Type déclaré par le navigateur, sinon extension du nom (Windows envoie parfois un type vide).
    const ext = TYPES[file.type] || Object.values(TYPES).find((e) => e === file.name.split(".").pop()?.toLowerCase());
    if (!ext) return fail(adminFr.musicBadType);
    const mime = MIME[ext];
    if (file.size > MAX) return fail(adminFr.musicTooBig, 413);
    const id = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const path = `${id}.${ext}`;
    const bucket = db().storage.from("musique");
    const { error: upErr } = await bucket.upload(path, file, { contentType: mime, upsert: false });
    if (upErr) { console.error("admin.music.upload", upErr.message); return fail(adminFr.actionFailed, 500); }
    const src = bucket.getPublicUrl(path).data.publicUrl;
    const sort = Math.max(0, ...rows.map((r) => r.sort)) + 10;
    const { error } = await db().from("tracks").insert({ id, title: name, src, storage_path: path, start_sec: start(form?.get("start")), sort });
    if (error) { await bucket.remove([path]); console.error("admin.music.insert", error.message); return fail(adminFr.actionFailed, 500); }
    await recordAdminEvent({ actor, action: adminFr.musicAction, details: { stage: "completed", op: "add", id, title: name, size: file.size } });
    return NextResponse.json({ ok: true, id });
  }

  let body: { action?: unknown; id?: unknown; title?: unknown; start?: unknown; active?: unknown; defaults?: unknown };
  try { body = await req.json(); } catch { return fail(); }

  if (body.action === "defaults") {
    const ids = new Set(rows.filter((r) => r.active).map((r) => r.id));
    const raw = (body.defaults && typeof body.defaults === "object" ? body.defaults : {}) as Record<string, unknown>;
    const defaults: Record<string, string> = {};
    for (const { id } of CATEGORIES) { const v = raw[id]; if (typeof v === "string" && ids.has(v)) defaults[id] = v; }
    await setAdminSetting(MUSIC_DEFAULTS_KEY, defaults);
    await recordAdminEvent({ actor, action: adminFr.musicAction, details: { stage: "completed", op: "defaults", defaults } });
    return NextResponse.json({ ok: true });
  }

  const row = rows.find((r) => r.id === body.id);
  if (!row) return fail();

  if (body.action === "update") {
    const name = title(body.title);
    if (!name || typeof body.active !== "boolean") return fail();
    const { error } = await db().from("tracks").update({ title: name, start_sec: start(body.start), active: body.active }).eq("id", row.id);
    if (error) { console.error("admin.music.update", error.message); return fail(adminFr.actionFailed, 500); }
    await recordAdminEvent({ actor, action: adminFr.musicAction, details: { stage: "completed", op: "update", id: row.id, title: name, active: body.active } });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    const { error } = await db().from("tracks").delete().eq("id", row.id);
    if (error) { console.error("admin.music.delete", error.message); return fail(adminFr.actionFailed, 500); }
    if (row.storage_path) await db().storage.from("musique").remove([row.storage_path]);
    await recordAdminEvent({ actor, action: adminFr.musicAction, details: { stage: "completed", op: "delete", id: row.id, title: row.title } });
    return NextResponse.json({ ok: true });
  }
  return fail();
}
