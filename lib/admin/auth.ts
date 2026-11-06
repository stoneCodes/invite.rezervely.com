import "server-only";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/supabase";
import { cleanEmail, sendEmail } from "@/lib/email";
import adminFr from "@/lib/i18n/admin-fr";

const COOKIE = "admin";
const TTL = 12 * 60 * 60 * 1000;
const secret = () => process.env.ADMIN_SESSION_SECRET?.trim() || "";
const allowed = () => (process.env.ADMIN_EMAILS || "").split(",").map((x) => cleanEmail(x)).filter(Boolean) as string[];
async function hmac(value: string) {
  const s = secret();
  if (s.length < 32) throw new Error("ADMIN_SESSION_SECRET doit contenir au moins 32 caractères");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(s), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}
const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
function equal(a: string, b: string) { let diff = a.length ^ b.length; for (let i=0;i<Math.max(a.length,b.length);i++) diff |= (a.charCodeAt(i)||0) ^ (b.charCodeAt(i)||0); return diff === 0; }
export function originAllowed(req: Request) {
  const origin = req.headers.get("origin");
  const expected = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin || !expected) return false;
  try { return new URL(origin).origin === new URL(expected).origin; } catch { return false; }
}
export async function issueAdminCode(rawEmail: unknown, req: Request) {
  const email = cleanEmail(rawEmail);
  if (!email || !allowed().includes(email)) return;
  const ip = req.headers.get("cf-connecting-ip")?.slice(0, 80) || "unknown";
  const since = new Date(Date.now() - 15 * 60_000).toISOString();
  const { count: emailCount } = await db().from("admin_codes").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since);
  const { count: ipCount } = await db().from("admin_codes").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", since);
  if ((emailCount || 0) >= 3 || (ipCount || 0) >= 10) return;
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const code = String((((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0) % 1_000_000).padStart(6, "0");
  const codeHash = hex(await hmac(`${email}:${code}`));
  const { error } = await db().from("admin_codes").insert({ email, code_hash: codeHash, expires_at: new Date(Date.now()+10*60_000).toISOString(), ip });
  if (error) throw error;
  const body = `${adminFr.emailCodeIntro} ${code}\n\n${adminFr.emailExpiry}`;
  await sendEmail({ to: email, subject: adminFr.emailSubject, text: body, html: `<div style="font-family:Arial,sans-serif;background:#0D0911;color:#F4EADB;padding:28px;border-radius:16px"><p>${adminFr.brand}</p><h1 style="font-weight:400">${adminFr.emailCodeIntro}</h1><p style="font-size:32px;letter-spacing:.2em;color:#D9B76E">${code}</p><p>${adminFr.emailExpiry}</p></div>` });
}
export async function verifyAdminCode(rawEmail: unknown, rawCode: unknown) {
  const email = cleanEmail(rawEmail);
  const code = typeof rawCode === "string" ? rawCode.trim() : "";
  if (!email || !/^\d{6}$/.test(code) || !allowed().includes(email)) return false;
  const ip = (await headers()).get("cf-connecting-ip")?.slice(0, 80) || "unknown";
  const since = new Date(Date.now() - 15 * 60_000).toISOString();
  const { data: recent } = await db().from("admin_codes").select("attempts").eq("ip", ip).gte("created_at", since);
  if ((recent || []).reduce((n, row) => n + Number(row.attempts || 0), 0) >= 10) return false;
  const { data } = await db().from("admin_codes").select("id,code_hash,expires_at,attempts").eq("email", email).is("used_at", null).gt("expires_at", new Date().toISOString()).lt("attempts", 5).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) return false;
  const expected = hex(await hmac(`${email}:${code}`));
  const ok = equal(expected, data.code_hash);
  const update = ok ? { used_at: new Date().toISOString(), attempts: data.attempts + 1 } : { attempts: data.attempts + 1, ...(data.attempts + 1 >= 5 ? { used_at: new Date().toISOString() } : {}) };
  await db().from("admin_codes").update(update).eq("id", data.id);
  if (!ok) return false;
  const payload = `${email}|${Date.now()+TTL}`;
  const encoded = btoa(payload).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  const signature = hex(await hmac(encoded));
  (await cookies()).set(COOKIE, `${encoded}.${signature}`, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: TTL / 1000 });
  return true;
}
export async function requireAdmin(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value || "";
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return null;
  try {
    const expected = hex(await hmac(payload));
    if (!equal(expected, signature)) return null;
    const raw = atob(payload.replaceAll("-", "+").replaceAll("_", "/"));
    const [email, expiry] = raw.split("|");
    if (!email || !allowed().includes(email) || Number(expiry) <= Date.now()) return null;
    return email;
  } catch { return null; }
}
export async function logoutAdmin() { (await cookies()).delete(COOKIE); }
