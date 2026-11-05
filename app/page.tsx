import Link from "next/link";
import { TEMPLATES } from "@/lib/types";

export default function Home() {
  return (
    <main className="site">
      <section className="wrap-site" style={{ paddingBlock: "56px 24px", textAlign: "center" }}>
        <p className="muted" style={{ letterSpacing: ".3em", textTransform: "uppercase", fontSize: ".72rem" }}>Invitations de mariage animées</p>
        <h1 style={{ fontSize: "clamp(2.4rem,6vw,4rem)", margin: ".3em 0" }}>
          Une invitation que vos invités <span style={{ fontFamily: "var(--f-script)", color: "var(--accent)", fontWeight: 400 }}>ouvrent</span>
        </h1>
        <p className="muted" style={{ maxWidth: "52ch", margin: "0 auto", fontSize: "1.05rem" }}>
          Choisissez un style, ajoutez vos prénoms, votre date et votre photo. Vous recevez un lien privé à envoyer par WhatsApp ou SMS, et vous suivez les réponses en direct.
        </p>
      </section>
      <section className="wrap-site" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20, paddingBottom: 64 }}>
        {TEMPLATES.map((t) => (
          <article key={t.id} className="card-s" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ aspectRatio: "3/4", background: `url(${t.cover}) center/cover` }} />
            <div style={{ padding: "18px 18px 20px", display: "grid", gap: 10 }}>
              <h2 style={{ fontSize: "1.7rem", margin: 0 }}>{t.name}</h2>
              <p className="muted" style={{ margin: 0 }}>{t.tagline}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                <Link className="btn-s" href={`/creer?t=${t.id}`}>Créer la mienne</Link>
                <Link className="btn-s ghost" href={`/demo/${t.id}`} target="_blank">Voir la démo</Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
