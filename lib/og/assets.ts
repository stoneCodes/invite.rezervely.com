import "server-only";

/**
 * Ressources de l'image d'aperçu (next/og) : polices Google réduites aux seuls caractères affichés,
 * et photo des mariés convertie en data URL (une photo illisible ne doit jamais casser l'aperçu).
 */
type Font = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600; style: "normal" };

async function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`, { signal: AbortSignal.timeout(4000) }).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    return res.ok ? await res.arrayBuffer() : null;
  } catch { return null; }
}

/** Polices : écriture (prénoms), titres en capitales, date. Celles qui ne se chargent pas sont ignorées. */
export async function ogFonts(texts: { script: string; caps: string; serif: string }): Promise<Font[]> {
  const font = (name: string, weight: Font["weight"]) => (data: ArrayBuffer | null): Font | null => (data ? { name, data, weight, style: "normal" } : null);
  const list = await Promise.all([
    googleFont("Pinyon Script", 400, texts.script).then(font("Script", 400)),
    googleFont("Cinzel", 500, texts.caps).then(font("Caps", 500)),
    googleFont("Cormorant Garamond", 500, texts.serif).then(font("Serif", 500)),
  ]);
  return list.filter((f): f is Font => !!f);
}

/** Photo JPEG/PNG en data URL (satori ne lit pas le WebP), sinon null. */
export async function photoDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const type = (res.headers.get("content-type") || "").split(";")[0].trim();
    if (!res.ok || !["image/jpeg", "image/png"].includes(type)) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 4 * 1024 * 1024) return null;
    return `data:${type};base64,${Buffer.from(buf).toString("base64")}`;
  } catch { return null; }
}
