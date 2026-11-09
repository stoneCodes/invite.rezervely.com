// Point d'entrée Cloudflare : le site Next.js (généré par OpenNext) + la tâche planifiée quotidienne.
// @ts-ignore : fichier généré par `opennextjs-cloudflare build`
import { default as handler } from "./.open-next/worker.js";

type Env = { CRON_SECRET?: string; NEXT_PUBLIC_SITE_URL?: string };

export default {
  fetch: handler.fetch,

  /** Cron (wrangler.jsonc) : appelle la route du récapitulatif, protégée par CRON_SECRET comme sur Vercel. */
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) {
    const base = env.NEXT_PUBLIC_SITE_URL || "https://ecartestudio.com";
    const req = new Request(`${base}/api/cron/recap`, { headers: { authorization: `Bearer ${env.CRON_SECRET ?? ""}` } });
    ctx.waitUntil(
      Promise.resolve(handler.fetch(req, env, ctx)).then(async (res: Response) => console.log("cron recap", res.status, await res.text())),
    );
  },
};
