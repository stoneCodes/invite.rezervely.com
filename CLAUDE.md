# invite.rezervely.com — Invitations de mariage animées

Service en libre-service : les mariés choisissent un template, remplissent un formulaire avec aperçu en direct, publient, et envoient un lien privé (`/i/<slug>`). Les invités ouvrent une invitation animée et répondent (RSVP). Les mariés suivent les réponses dans leur espace (`/espace/<token>`).

Propriétaire : Glad (francophone, veut des retours honnêtes et des listes à puces). Toute l'interface est en français.

## Stack
- Next.js 15 (App Router, TypeScript), déployé sur Vercel. Domaine prévu : `invite.rezervely.com` (sous-domaine de Rezervely).
- Supabase (projet `usolfegmepnazrporeec`) : Postgres + Storage (bucket `photos`). Schéma : `supabase/migrations/001_init.sql`.
- Pas de client Supabase côté navigateur : RLS activé **sans policy**, tout passe par les routes serveur avec la clé `service_role` (`lib/supabase.ts`, marqué `server-only`).
- Variables : voir `.env.example`.

## Structure
- `components/invitation/` : le cœur visuel.
  - `engine.js` : moteur porté du prototype validé (ouvertures, particules, défilement scénarisé, grattage, dress code, verset, musique synthétisée). `mountInvitation(data, template, opts)` → `{ replay, destroy }`. Fichier JS volontairement non typé (typage dans `engine.d.ts`).
  - `markup.ts` : balisage commun aux 3 templates (les ids sont utilisés par le moteur).
  - `invitation.css` : styles des 3 templates (tokens par `body[data-tpl]`).
  - `Invitation.tsx` : composant client qui monte le moteur. Pour changer les données, remonter le composant (prop `key`).
- `app/creer/Editor.tsx` : éditeur (formulaire + iframe `/apercu` alimentée par `postMessage`).
- `app/i/[slug]` : page publique + image Open Graph (aperçu WhatsApp).
- `app/espace/[token]` : réponses, stats, export CSV.
- `app/api/*` : création/mise à jour (`invitations`), publication, envoi photo, RSVP.
- `lib/validate.ts` : nettoyage/bornage de toutes les données venant du client. Toute nouvelle donnée doit y passer.
- `prototype/index.html` : prototype d'origine validé par Glad (référence visuelle ; ses images sont dans `public/img`).

## Décisions validées avec Glad
- 3 templates pour démarrer : `cygnes` (Lac aux cygnes), `nuit-doree` (Nuit dorée), `jardin-nuit` (Jardin de nuit). Chacun a sa propre ouverture ET sa propre mise en page.
- Ordre de l'invitation : « Nous nous marions » + prénoms (sans date) → photo + verset → **date à gratter obligatoire** (la suite est masquée tant que la date n'est pas grattée) → compte à rebours → programme → dress code → lieu → histoire → RSVP.
- Verset facultatif (Bible, Coran, autre), saisi librement par les mariés, texte original (ex. arabe, RTL) + traduction + référence. Ne pas fournir de versets pré-remplis sans relecture.
- Dress code : 1 à 4 couleurs de n'importe quelle teinte, possibilité d'une couleur différente hommes/femmes, consignes libres. Veste et robe en SVG recolorées.
- Effets « waouh » au défilement sur les 3 templates (héros épinglé qui avance dans la scène, médaillon photo en 3D avec orbite de particules, titres lettre par lettre, fil lumineux du programme…).
- Textes, images : pas de texte ni de visage dans les images générées par IA ; images en WebP dans `public/img`.
- Identité du site (accueil, éditeur, espace) : thème « Nuit de gala », choisi par Glad le 5 nov. 2026 parmi 3 maquettes. Fond nuit aubergine `#0D0911`, or champagne en dégradé animé, touches de rose `#E7A6B6`. Titres en Italiana, écriture en Pinyon Script, texte en Jost 300. Tokens dans `app/globals.css`, posés sur `.site` (jamais sur `:root`, pour ne pas toucher aux invitations).
- Accueil (`app/HomeClient.tsx` + `app/home.css`, classes préfixées `gl-`) : poussière d'or, titre lettre par lettre, enveloppe qui s'ouvre au défilement, modèles en défilement horizontal, feu d'artifice doré sur les boutons « Créer ». Toujours respecter `prefers-reduced-motion`.

## À faire (par ordre)
1. Stripe Checkout : quand `PAYMENTS_ENABLED=true`, `POST /api/invitations/[token]/publish` doit créer une session et publier sur webhook `checkout.session.completed`. Prix à définir avec Glad.
2. E-mail aux mariés avec le lien de leur espace (Resend ou Supabase), sinon un jeton perdu = espace perdu.
3. Anti-abus : limite de débit sur `/api/rsvp` et `/api/invitations` (ex. Upstash), honeypot sur le formulaire RSVP.
4. Version allégée des effets pour les téléphones peu puissants (désactiver flou/3D si `navigator.hardwareConcurrency <= 4` ou FPS bas).
5. Pages légales : mentions légales, CGV, politique de confidentialité (photos + noms des invités → RGPD, durée de conservation).
6. Templates suivants : voir le document « Catalogue des 10 templates d'invitation » (prompts d'images inclus).
7. Vercel : passer en Pro avant d'activer le paiement (Hobby interdit l'usage commercial).

## Commandes
- `npm run dev` → http://localhost:3000 (démo sans base : `/demo/jardin-nuit`)
- `npm run build` / `npm run typecheck`
