import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, getByToken, siteUrl } from "@/lib/supabase";
import CopyLink from "./CopyLink";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Votre espace", robots: { index: false } };

type Rsvp = { id: string; name: string; attending: boolean; guests: number; message: string | null; created_at: string };

export default async function Espace({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getByToken(token);
  if (!inv) notFound();
  const { data } = await db().from("rsvps").select("*").eq("invitation_id", inv.id).order("created_at", { ascending: false });
  const rsvps = (data ?? []) as Rsvp[];
  const yes = rsvps.filter((r) => r.attending);
  const guests = yes.reduce((n, r) => n + r.guests, 0);
  const link = `${siteUrl()}/i/${inv.slug}`;
  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });
  return (
    <main className="site">
      <div className="wrap-site" style={{ paddingBlock: "40px 64px", maxWidth: 860, display: "grid", gap: 22 }}>
        <header>
          <p className="muted" style={{ letterSpacing: ".3em", textTransform: "uppercase", fontSize: ".72rem", margin: 0 }}>Votre espace</p>
          <h1 style={{ fontSize: "2.6rem", margin: ".2em 0" }}>{inv.data.partner1} & {inv.data.partner2}</h1>
          <p className="muted" style={{ margin: 0 }}>Gardez ce lien pour vous : il donne accès à vos réponses et à la modification de l'invitation.</p>
        </header>

        <section className="card-s" style={{ padding: 20, display: "grid", gap: 12 }}>
          <strong>Lien à envoyer à vos invités</strong>
          {inv.status === "published" ? (
            <CopyLink url={link} />
          ) : (
            <p className="muted" style={{ margin: 0 }}>L'invitation n'est pas encore publiée. Publiez-la depuis l'éditeur pour obtenir le lien.</p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn-s" href={`/creer?edit=${token}`}>Modifier l'invitation</Link>
            {inv.status === "published" && <a className="btn-s ghost" href={link} target="_blank" rel="noopener">Voir l'invitation</a>}
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[["Réponses", rsvps.length], ["Présents", guests], ["Absents", rsvps.length - yes.length]].map(([l, n]) => (
            <div key={l} className="card-s" style={{ padding: 16, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--f-serif)", fontSize: "2.2rem", fontVariantNumeric: "tabular-nums" }}>{n}</div>
              <div className="muted" style={{ fontSize: ".75rem", letterSpacing: ".15em", textTransform: "uppercase" }}>{l}</div>
            </div>
          ))}
        </section>

        <section className="card-s" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <strong>Réponses des invités</strong>
            {rsvps.length > 0 && <a className="btn-s ghost" href={`/espace/${token}/csv`}>Exporter (CSV)</a>}
          </div>
          {rsvps.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>Aucune réponse pour l'instant. Elles apparaîtront ici dès qu'un invité répondra.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".92rem" }}>
                <thead><tr style={{ textAlign: "left" }}>{["Nom", "Réponse", "Personnes", "Message", "Reçue le"].map((h) => <th key={h} style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontWeight: 500 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {rsvps.map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>{r.name}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", color: r.attending ? "var(--ok)" : "var(--err)" }}>{r.attending ? "Présent" : "Absent"}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", fontVariantNumeric: "tabular-nums" }}>{r.guests}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", minWidth: 180 }}>{r.message}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>{fmt.format(new Date(r.created_at))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
