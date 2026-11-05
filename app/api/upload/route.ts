import { NextResponse } from "next/server";
import { db, getByToken } from "@/lib/supabase";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Reçoit la photo du couple (déjà redimensionnée par le navigateur) et la range dans le bucket "photos". */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const inv = await getByToken(token);
  if (!inv) return NextResponse.json({ error: "Enregistrez d'abord l'invitation." }, { status: 404 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !TYPES[file.type]) return NextResponse.json({ error: "Format accepté : JPG, PNG ou WebP." }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "Photo trop lourde (4 Mo maximum)." }, { status: 413 });
  const path = `${inv.id}/${Date.now()}.${TYPES[file.type]}`;
  const { error } = await db().storage.from("photos").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: "Envoi impossible" }, { status: 500 });
  const { data } = db().storage.from("photos").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
