import { NextResponse } from "next/server";
import { getMusicLibrary } from "@/lib/admin/music";

export const dynamic = "force-dynamic";

/** Bibliothèque de musiques publique (éditeur et invitations) : titres, fichiers, point de départ, défauts par catégorie. */
export async function GET() {
  const lib = await getMusicLibrary();
  return NextResponse.json(lib, { headers: { "cache-control": "public, max-age=60, s-maxage=60" } });
}
