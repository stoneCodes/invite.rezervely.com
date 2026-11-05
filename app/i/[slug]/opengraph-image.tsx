import { ImageResponse } from "next/og";
import { getBySlug } from "@/lib/supabase";
import { dateParts } from "@/components/invitation/engine";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
const THEME: Record<string, { bg: string; ink: string; accent: string }> = {
  cygnes: { bg: "linear-gradient(135deg,#FBF1F0,#E9C6CB)", ink: "#4A2E35", accent: "#B0606F" },
  "nuit-doree": { bg: "linear-gradient(135deg,#2A160E,#0D0604)", ink: "#F4D99A", accent: "#D9B46A" },
  "jardin-nuit": { bg: "linear-gradient(135deg,#1B2B4E,#070D1C)", ink: "#FFF4EE", accent: "#EBA3B3" },
};

/** Image d'aperçu affichée par WhatsApp, iMessage, etc. quand le lien est partagé. */
export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const inv = await getBySlug((await params).slug);
  const t = THEME[inv?.template ?? "cygnes"];
  const names = inv && inv.status === "published" ? `${inv.data.partner1} & ${inv.data.partner2}` : "Invitation";
  const when = inv ? dateParts(inv.data.dateISO) : null;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: t.bg, color: t.ink, fontFamily: "serif" }}>
        <div style={{ fontSize: 26, letterSpacing: 10, color: t.accent }}>NOUS NOUS MARIONS</div>
        <div style={{ fontSize: 110, fontStyle: "italic", margin: "18px 0" }}>{names}</div>
        <div style={{ fontSize: 30, letterSpacing: 6 }}>{when ? when.label : ""}</div>
        <div style={{ marginTop: 40, fontSize: 24, padding: "12px 28px", border: `2px solid ${t.accent}`, borderRadius: 999 }}>Touchez pour ouvrir l'invitation</div>
      </div>
    ),
    size
  );
}
