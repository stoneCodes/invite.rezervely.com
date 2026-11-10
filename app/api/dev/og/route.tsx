import { renderEnvelope, renderLayer } from "@/lib/og/envelope";

/* Local uniquement (404 en production) :
   - /api/dev/og?names=Léa%20%26%20Samuel&photo=<url>&date=…&kicker=… : aperçu de l'enveloppe ;
   - /api/dev/og?layer=back|card|front|seal : calques fixes, lus par scripts/og-layers.py. */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const u = new URL(req.url).searchParams;
  const layer = u.get("layer");
  if (layer === "back" || layer === "card" || layer === "front" || layer === "seal") return renderLayer(layer);
  return renderEnvelope({
    kicker: u.get("kicker") ?? "NOUS NOUS MARIONS",
    names: u.get("names") ?? "Léa & Samuel",
    date: u.get("date") ?? "Samedi 14 juin 2027",
    photo: u.get("photo"),
    brand: "E-CARTE STUDIO",
  });
}
