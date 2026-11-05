# invite.rezervely.com

Invitations de mariage animées : création en ligne, aperçu en direct, lien privé, réponses des invités.

## Mise en route

1. **Supabase** : ouvrir *SQL Editor*, coller `supabase/migrations/001_init.sql`, exécuter.
2. **Variables** : copier `.env.example` en `.env.local` et remplir `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API Keys → `service_role`).
3. `npm install` puis `npm run dev` → http://localhost:3000

## Déploiement Vercel

1. Vercel → *Add New Project* → importer `stoneCodes/invite.rezervely.com`.
2. *Settings → Environment Variables* : `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYMENTS_ENABLED=false`.
3. *Settings → Domains* : ajouter `invite.rezervely.com`, puis créer chez le registrar le CNAME indiqué par Vercel.

## Pages

| Adresse | Rôle |
| --- | --- |
| `/` | Accueil, choix du template |
| `/demo/<template>` | Démo avec des données d'exemple |
| `/creer` | Éditeur avec aperçu en direct |
| `/i/<slug>` | Invitation publique envoyée aux invités |
| `/espace/<jeton>` | Espace privé des mariés (réponses, export CSV) |

Voir `CLAUDE.md` pour l'architecture, les décisions et la suite.
