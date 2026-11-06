import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Toutes les pages sont dynamiques (pas de cache ISR) : pas besoin de R2 pour le cache.
export default defineCloudflareConfig({});
