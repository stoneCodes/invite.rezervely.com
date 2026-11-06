import { TEMPLATE_IDS, type InvitationData, type TemplateId } from "./types";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const hex = (v: unknown) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : undefined);
const arr = <T>(v: unknown, max: number, map: (x: any) => T): T[] => (Array.isArray(v) ? v.slice(0, max).map(map) : []);

export function isTemplate(v: unknown): v is TemplateId {
  return typeof v === "string" && (TEMPLATE_IDS as string[]).includes(v);
}

/** Nettoie et borne les données envoyées par l'éditeur (jamais de confiance côté client). */
export function sanitizeData(input: any): InvitationData {
  const d = input ?? {};
  const date = new Date(d.dateISO);
  const dc = d.dressCode ?? {};
  const v = d.verse;
  const photo = typeof d.photoUrl === "string" && d.photoUrl.startsWith(process.env.SUPABASE_URL ?? "https://") ? d.photoUrl.slice(0, 500) : null;
  return {
    lang: d.lang === "en" ? "en" : "fr",
    partner1: str(d.partner1, 40) || "Prénom",
    partner2: str(d.partner2, 40) || "Prénom",
    intro: str(d.intro, 200),
    dateISO: isNaN(date.getTime()) ? new Date().toISOString() : str(d.dateISO, 40),
    venue: { name: str(d.venue?.name, 120), address: str(d.venue?.address, 200) },
    programme: arr(d.programme, 10, (x) => ({ t: str(x?.t, 12), title: str(x?.title, 60), note: str(x?.note, 120) })),
    dressCode: {
      enabled: dc.enabled !== false,
      title: str(dc.title, 60),
      note: str(dc.note, 240),
      men: { label: str(dc.men?.label, 30) || "Messieurs", text: str(dc.men?.text, 160) },
      women: { label: str(dc.women?.label, 30) || "Mesdames", text: str(dc.women?.text, 160) },
      colors: arr(dc.colors, 4, (c) => {
        const base = hex(c?.hex) ?? "#C9A46A";
        return { name: str(c?.name, 30) || "Couleur", hex: base, men: hex(c?.men), women: hex(c?.women) };
      }),
    },
    verse:
      v && str(v.text, 600)
        ? { kind: ["bible", "coran", "autre"].includes(v.kind) ? v.kind : "autre", orig: str(v.orig, 600) || undefined, text: str(v.text, 600), ref: str(v.ref, 80) }
        : null,
    story: arr(d.story, 6, (x) => ({ y: str(x?.y, 12), text: str(x?.text, 300) })),
    rsvpBy: str(d.rsvpBy, 120),
    photoUrl: photo,
  };
}
