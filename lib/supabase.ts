import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { customAlphabet } from "nanoid";
import type { InvitationRow } from "./types";

let client: SupabaseClient | null = null;

/** Client serveur (clé service_role). Ne jamais importer côté navigateur. */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis (voir .env.example).");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

// Slug public court et lisible (sans caractères ambigus), jeton d'édition long et secret.
export const newSlug = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8);
export const newEditToken = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 32);

export async function getBySlug(slug: string): Promise<InvitationRow | null> {
  const { data } = await db().from("invitations").select("*").eq("slug", slug).maybeSingle();
  return (data as InvitationRow) ?? null;
}

export async function getByToken(token: string): Promise<InvitationRow | null> {
  if (!/^[0-9A-Za-z]{32}$/.test(token)) return null;
  const { data } = await db().from("invitations").select("*").eq("edit_token", token).maybeSingle();
  return (data as InvitationRow) ?? null;
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
