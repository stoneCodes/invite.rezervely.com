import { welcomeEmail, publishedEmail, recapEmail, linksEmail } from "@/lib/email";

/* Aperçu des e-mails en local uniquement : /api/dev/email?type=welcome|published|recap|links&lang=fr|en
   Renvoie 404 en production. */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const u = new URL(req.url);
  const lang = u.searchParams.get("lang") === "en" ? "en" : "fr";
  const who = { partner1: "Samuel", partner2: "Léa" };
  const tok = "DEMO0000000000000000000000000000";
  const mail = {
    welcome: () => welcomeEmail(lang, who, tok),
    published: () => publishedEmail(lang, who, tok, "abc23xyz"),
    recap: () => recapEmail(lang, who, tok, [
      { name: "Marie Dupont", attending: true, guests: 2, message: "Trop hâte de fêter ça avec vous !" },
      { name: "Paul <script>", attending: false, guests: 0, message: null },
      { name: "Awa Diallo", attending: true, guests: 1, message: null },
    ], { yes: 14, no: 3 }),
    links: () => linksEmail(lang, [{ ...who, token: tok }, { partner1: "Awa", partner2: "Moussa", token: tok }]),
  }[u.searchParams.get("type") ?? "welcome"] ?? (() => welcomeEmail(lang, who, tok));
  const m = mail();
  if (u.searchParams.get("text")) return new Response(`${m.subject}\n\n${m.text}`, { headers: { "content-type": "text/plain; charset=utf-8" } });
  return new Response(m.html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
