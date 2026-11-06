# Instructions pour les agents (Codex)

**Lis d'abord `CLAUDE.md`** : c'est la référence du projet (stack, structure, décisions validées avec Glad, règles de langues FR/EN, e-mails, paiement, hébergement Cloudflare, commandes). Tout ce qui y est écrit s'applique aussi à toi.

## Tâche en cours
- **Espace administrateur** : cahier des charges complet dans `docs/admin.md`. Le développer **étape par étape** (section « Découpage »), un commit par étape, et faire valider chaque étape par Glad avant de passer à la suivante.

- **Liste des invités en PDF personnalisé** (style du modèle, réservé aux payants, offrable depuis l'admin) : cahier des charges dans `docs/pdf-invites.md`.

## Règles essentielles (rappel de CLAUDE.md)
- **Ne jamais pousser sur `main` sans l'accord explicite de Glad** (chaque push part en production). Faire valider d'abord, puis demander : « Je pousse ? ».
- Glad est francophone : réponses en français, avis honnêtes et directs, listes à puces plutôt que des paragraphes.
- **Demander avant toute action irréversible** : suppression de données, paiement, DNS, changement en production.
- **Secrets** (clés Supabase, Brevo, Stripe, Cloudflare, `ADMIN_SESSION_SECRET`…) : Glad les saisit lui-même dans Cloudflare (Worker `joyeuxevent` → Settings → Variables and secrets, type **Secret**) ou dans `.env.local`. Ne jamais lui demander de les coller dans le chat, ne jamais les écrire dans le code ni les afficher.
- **Migrations SQL** (`supabase/migrations/00X_*.sql`) : Glad les applique dans Supabase > SQL Editor **avant** le déploiement du code qui en dépend. Le lui rappeler clairement.
- **Déploiement** : chaque push sur `main` part en production (Cloudflare Workers Builds). Ne pousser que du code vérifié (`npm run typecheck`, test en local).
- Aucun texte visible écrit en dur : dictionnaires `lib/i18n/*` (exception : l'admin, en français seulement, dans `lib/i18n/admin-fr.ts`).
- Toute donnée venant du navigateur passe par `lib/validate.ts` (ou une validation équivalente côté serveur).
- Ne jamais lancer `npm run build` pendant que `npm run dev` tourne (sinon supprimer `.next`).
- Messages de commit en français.
- À la fin de chaque tâche : mettre à jour `CLAUDE.md` et dire à Glad quoi tester.
