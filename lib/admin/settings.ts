import "server-only";
import { db } from "@/lib/supabase";

const CACHE_MS = 60_000;
const cache = new Map<string, { expires: number; value: unknown }>();

export async function getAdminSetting<T>(key: string): Promise<T | null> {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.value as T;
  const { data, error } = await db().from("settings").select("value").eq("key", key).maybeSingle();
  if (error) {
    console.error("admin.settings.read", key, error.message);
    return null;
  }
  if (!data) {
    cache.set(key, { value: null, expires: Date.now() + CACHE_MS });
    return null;
  }
  cache.set(key, { value: data.value, expires: Date.now() + CACHE_MS });
  return data.value as T;
}

export async function setAdminSetting(key: string, value: unknown) {
  const { error } = await db().from("settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
  cache.set(key, { value, expires: Date.now() + CACHE_MS });
}
