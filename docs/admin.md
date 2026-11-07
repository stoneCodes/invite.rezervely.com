# Cahier des charges : espace administrateur joyeuxevent

Rédigé le 6 nov. 2026 à partir des demandes de Glad (propriétaire). À développer par Codex, **par étapes** (voir « Découpage » en bas) : une étape = un commit, testée, puis montrée à Glad avant la suivante.

Lire d'abord `CLAUDE.md` (stack, conventions, règles i18n, déploiement Cloudflare, décisions validées). Tout ce qui y est écrit s'applique ici.

---

## 0. Principes

- **Adresse** : `joyeuxevent.com/admin` (page de connexion) et `/admin/...` (pages internes). Ajouter `/administrateur` qui redirige vers `/admin`.
- **Un seul utilisateur** pour l'instant : Glad. Prévoir une liste d'adresses (variable `ADMIN_EMAILS`, séparées par des virgules) pour plus tard.
- **Ne rien casser** de l'existant : invitations, éditeur, espace des mariés, paiement Stripe, e-mails, tâche quotidienne.
- **Interface en français uniquement** (exception à la règle FR/EN : l'admin n'est utilisé que par Glad). Les textes restent dans un dictionnaire : `lib/i18n/admin-fr.ts`, aucun texte en dur dans les composants.
- **Habillage** : thème du site « Nuit de gala » (classe `.site`, tokens de `app/globals.css`), sobre et lisible ; tableaux et chiffres avant les effets. Utilisable sur téléphone (tester à 375 px de large, rien ne déborde).
- **Pas de client Supabase dans le navigateur** : tout passe par des routes serveur avec `db()` (`lib/supabase.ts`).
- **Léger pour Cloudflare** (formule gratuite, CPU limité) : listes paginées (50 lignes), agrégats calculés en SQL (vues ou fonctions `rpc`), pas de gros calculs en JavaScript.
- `noindex` sur toutes les pages admin (`robots: { index: false }`), et `Disallow: /admin` si un `robots.txt` est ajouté.
- **Journal** : chaque action qui modifie quelque chose (prix, offrir, dépublier, supprimer…) est enregistrée dans `admin_events` (qui, quoi, quand, détails).

---

## 1. Connexion par code reçu par e-mail (sur le site)

Choix de Glad : se connecter **depuis le site**, sur `/admin`, **avec un code**.

Parcours :
1. `/admin` : champ e-mail → bouton « Recevoir un code ».
2. Si l'adresse fait partie de `ADMIN_EMAILS`, un code à **6 chiffres** est envoyé par e-mail (Brevo, `sendEmail` de `lib/email.ts`, même habillage que les autres e-mails). **Réponse identique** que l'adresse soit admin ou non (« Si cette adresse est autorisée, un code vient d'être envoyé »).
3. Champ code → « Se connecter » → session ouverte, redirection vers `/admin/tableau-de-bord`.

Sécurité (obligatoire) :
- Code tiré avec `crypto.getRandomValues`, **jamais stocké en clair** : on stocke son empreinte HMAC-SHA256 (clé `ADMIN_SESSION_SECRET`) dans la table `admin_codes`.
- Code valable **10 minutes**, **usage unique**, **5 essais maximum** (ensuite le code est invalidé).
- Limite d'envoi : 3 codes par adresse et par 15 minutes ; limite par IP (`cf-connecting-ip`) sur les tentatives.
- Comparaison en temps constant (voir `timingSafeEqual` dans `lib/payment.ts`).
- Session : cookie `admin` **signé** (HMAC avec `ADMIN_SESSION_SECRET`, contenu : e-mail + expiration), `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, durée **12 h**. Bouton « Se déconnecter ».
- Vérification **côté serveur à chaque requête** : un `requireAdmin()` (dans `lib/admin/auth.ts`, `server-only`) appelé par le layout `app/admin/(protege)/layout.tsx` **et** par chaque route `app/api/admin/*` (une route API non protégée = faille). Réponse 404 (pas 401) pour les routes admin sans session, pour ne pas révéler l'admin.
- Toutes les actions qui modifient passent en `POST` (jamais `GET`), avec vérification de l'en-tête `Origin` (= `NEXT_PUBLIC_SITE_URL`).

Variables (secrets saisis par Glad dans Cloudflare, type **Secret**, jamais dans le chat ni dans le code) :
- `ADMIN_EMAILS` : adresses autorisées (ex. celle de Glad).
- `ADMIN_SESSION_SECRET` : 32+ caractères aléatoires.
Les ajouter à `.env.example` (sans valeur) et expliquer à Glad comment les saisir.

---

## 2. Tableau de bord (`/admin/tableau-de-bord`)

Période choisie : aujourd'hui / 7 jours / 30 jours / depuis le début.

Chiffres d'activité (base Supabase) :
- **Chiffre d'affaires** : somme de `paid_amount_cents` (hors publications offertes), nombre de paiements.
- **Invitations** : créées, publiées, payées, offertes.
- **Taux de transformation** : créées → publiées → payées.
- **Réponses d'invités** : nombre total, présents / absents, personnes attendues.
- **Modèles** : répartition par `template` (barres simples).
- **Langue des invitations** : `data.lang` fr / en.
- **Événements à venir** : 10 prochaines invitations publiées par `data.dateISO`.

## 3. Statistiques de visites (`/admin/statistiques`)

Demande de Glad : « le nombre de visites sur le site, ce genre de choses ».

Solution retenue : **Cloudflare Web Analytics** (gratuit, sans cookie, pas de bandeau de consentement, compte les vrais navigateurs et pas les robots).
1. Glad l'active dans Cloudflare (Analytics & Logs → Web Analytics → ajouter `joyeuxevent.com`). Si l'injection automatique ne marche pas avec le Worker, ajouter le petit script `https://static.cloudflareinsights.com/beacon.min.js` (avec le `token` du site) dans `app/layout.tsx`.
2. L'admin lit les chiffres par l'**API GraphQL Cloudflare** (`https://api.cloudflare.com/client/v4/graphql`, jeu de données `rumPageloadEventsAdaptiveGroups`), côté serveur uniquement :
   - visites et pages vues par jour (courbe sur 7 / 30 jours) ;
   - pages les plus vues (accueil, `/creer`, démos, invitations) ;
   - provenance (sites référents : WhatsApp, Instagram, Google…) ;
   - pays, type d'appareil (mobile / ordinateur), navigateur.
3. Variables : `CF_ACCOUNT_ID` (non secret, dans `wrangler.jsonc`), `CF_WEB_ANALYTICS_SITE_TAG` (non secret), `CF_API_TOKEN` (**secret**, jeton avec la seule permission « Account Analytics : Read »).
4. Mettre en cache les réponses quelques minutes (éviter un appel à chaque affichage).
5. **Mettre à jour la politique de confidentialité** (`lib/i18n/legal.ts`, FR + EN, section « Cookies et stockage local ») : mesure d'audience Cloudflare Web Analytics, sans cookie ni donnée personnelle.

Croiser avec l'activité : « visites de `/creer` → invitations créées → publiées → payées » (entonnoir).

## 3 bis. Gestion clients (`/admin/clients`)

Page ajoutée à la demande de Glad : regrouper les invitations par adresse e-mail du propriétaire, rechercher par e-mail ou prénom, et afficher les volumes d'invitations (publiées, payées, offertes), les réponses et la dernière activité. Les invitations d'un client se déplient depuis la liste et ouvrent leur fiche ; suppression protégée depuis cette page avec confirmation et saisie de `SUPPRIMER`.

Les clients sans adresse e-mail restent accessibles individuellement par invitation. La liste est paginée et limitée à 20 invitations récentes par client dans le panneau déplié. La migration `008_admin_clients.sql` fournit les agrégats côté base.

Évolutions proposées, à valider séparément : fiche client consolidée, export/suppression RGPD de toutes les données par e-mail, notes de support et historique des échanges.

## 4. Invitations (`/admin/invitations`)

Liste paginée, la plus récente en premier :
- colonnes : prénoms, e-mail, modèle, statut (brouillon / publiée), payée (montant, date) ou offerte, date de l'événement, nb de réponses, créée le ;
- recherche : prénoms, e-mail, lien (`slug`) ;
- filtres : brouillon, publiée, payée, offerte, événement passé.

Fiche d'une invitation (`/admin/invitations/[id]`) :
- toutes les infos + liens : ouvrir l'invitation (`invitePath(slug)`), ouvrir l'espace des mariés (`/espace/<edit_token>`), ouvrir le paiement dans Stripe (`https://dashboard.stripe.com/payments/...` à partir de `stripe_session_id`) ;
- liste des réponses des invités ;
- **actions** (chacune avec confirmation, et journalisée) :
  - **Offrir la publication** : publie sans paiement (`updateOnPublish` de `lib/publish.ts`, pour garder le lien lisible), marque `comped_at`. Envoie l'e-mail « invitation en ligne » comme une publication normale.
  - **Renvoyer le lien de l'espace** au propriétaire (e-mail `welcomeEmail`).
  - **Dépublier** (contenu signalé) : `status = 'draft'` ; l'invitation n'est plus visible, le lien garde son adresse.
  - **Prolonger** la mise en ligne : champ date `keep_until` ; la purge (`lib/purge.ts`) doit le respecter.
  - **Supprimer** définitivement (photos du bucket comprises, comme `lib/purge.ts`) : confirmation en tapant le mot `SUPPRIMER`.

## 5. Prix et vente (`/admin/prix`)

Aujourd'hui le prix (`PRICE_CENTS = 990` dans `lib/payment.ts`) et l'activation (`PAYMENTS_ENABLED` dans `wrangler.jsonc`) sont dans le code. Les rendre modifiables :
- Table `settings` (clé / valeur JSON). Clés : `price_cents`, `payments_enabled`, `launch_price` (facultatif).
- `lib/payment.ts` : `getPriceCents()` et `paymentsOn()` lisent `settings` (avec un petit cache), et retombent sur les valeurs actuelles (990, variable d'environnement) si la ligne n'existe pas. Une valeur `settings.payments_enabled` enregistrée par l'admin prévaut sur la variable Worker ; tant qu'aucune valeur n'existe, `PAYMENTS_ENABLED` reste le défaut.
- Partout où le prix est affiché ou facturé (éditeur via `formatPrice`, Stripe `unit_amount`, textes `t.pay.*`), utiliser le prix lu en base. **Le prix facturé est toujours recalculé côté serveur**, jamais envoyé par le navigateur.
- **Interrupteur** paiement activé / désactivé. Avant d'activer : vérifier que `STRIPE_SECRET_KEY` a le format d'une clé secrète de test (`sk_test_`) ou de production (`sk_live_`).
- **Codes promo** : ajouter `allow_promotion_codes: "true"` à la session Checkout (`createCheckout`). Dans l'admin : liste des codes (API Stripe `promotion_codes` + `coupons`) et formulaire de création (code, % ou montant, date de fin, nombre d'utilisations max). Le dernier code créé est aussi affiché sur l'accueil tant que la promotion n'est pas expirée et que les paiements sont activés. Le montant réellement payé reste `amount_total` de la session (déjà enregistré dans `paid_amount_cents`).
- **Prix de lancement barré** (facultatif) : attention, en France un prix barré doit être le prix le plus bas pratiqué dans les 30 jours précédents. Afficher seulement si Glad le confirme, avec ce rappel à l'écran.
- Les CGV disent déjà « le prix affiché au moment de la publication fait foi » : rien à changer.

## 6. Modèles (`/admin/modeles`) — étape 2

- Afficher / masquer un modèle (masqué : absent de l'accueil et de l'éditeur, mais les invitations existantes continuent de marcher).
- Ordre d'affichage, badge « Nouveau » / « Populaire ».
- Stocké dans `settings` (`templates`). Lu par l'accueil (`app/HomeClient.tsx`) et l'éditeur (`app/creer/Editor.tsx`).

## 7. Paramètres (`/admin/parametres`) — étape 2

- Infos légales aujourd'hui dans `lib/legal.ts` : médiateur de la consommation (`LEGAL.mediator`, **à renseigner avant les ventes réelles**), adresse, e-mail. Les rendre modifiables (via `settings`, avec `lib/legal.ts` comme valeurs par défaut).
- Durées de conservation (`RETENTION`).
- Envoi d'un e-mail de test (bienvenue, publication, récapitulatif) à l'adresse de l'admin.

## 8. RGPD et santé du site (`/admin/rgpd`, `/admin/sante`) — étape 2

- **Demande RGPD** : saisir un e-mail → tout ce qui y est lié (invitations, réponses) → export JSON et bouton « tout supprimer » (confirmation). Pour un invité : recherche par nom dans les réponses, suppression d'une réponse.
- **Santé** : dernière exécution de la tâche quotidienne (enregistrer son résultat dans `admin_events` depuis `/api/cron/recap` : e-mails envoyés, échecs, invitations supprimées), échecs d'envoi Brevo, rappel du quota Brevo (300/jour partagé avec rezervely).

---

## 9. Base de données

Nouvelle migration `supabase/migrations/007_admin.sql` (Glad l'applique dans Supabase > SQL Editor **avant** le déploiement du code ; le lui rappeler) :
- `settings (key text primary key, value jsonb not null, updated_at timestamptz default now())`
- `admin_codes (id uuid pk default gen_random_uuid(), email text not null, code_hash text not null, expires_at timestamptz not null, attempts int not null default 0, used_at timestamptz, ip text, created_at timestamptz default now())`
- `admin_events (id uuid pk default gen_random_uuid(), at timestamptz default now(), actor text, action text not null, invitation_id uuid, details jsonb)`
- `invitations` : ajouter `comped_at timestamptz`, `keep_until timestamptz`.
- RLS activé **sans policy** sur les nouvelles tables (comme les autres).
- Vues ou fonctions SQL pour les agrégats du tableau de bord.
- Adapter `lib/purge.ts` : ne pas supprimer une invitation dont `keep_until` est dans le futur.

## 10. Organisation du code (proposée)

- `app/admin/page.tsx` (connexion), `app/admin/(protege)/layout.tsx` (vérifie la session, menu), `app/admin/(protege)/tableau-de-bord/`, `statistiques/`, `invitations/`, `invitations/[id]/`, `prix/`, …
- `app/administrateur/page.tsx` → redirection vers `/admin`.
- `app/api/admin/*` : routes serveur (toutes protégées par `requireAdmin()`).
- `lib/admin/auth.ts` (codes, session), `lib/admin/settings.ts` (lecture/écriture `settings` avec cache), `lib/admin/stats.ts` (agrégats + Cloudflare GraphQL), `lib/admin/audit.ts` (journal).
- `lib/i18n/admin-fr.ts` : textes de l'admin.
- Le Splash et le Loader du site ne doivent pas gêner l'admin (vérifier `components/Splash.tsx`).

## 11. Vérifications avant chaque commit

- `npm run typecheck` sans erreur.
- Tester en local (`npm run dev`, http://localhost:3000). En local sans `BREVO_API_KEY`, le code de connexion s'affiche dans le terminal : c'est normal.
- Vérifier : sans session, `/admin/tableau-de-bord` et `/api/admin/*` renvoient 404 ; code faux 5 fois → bloqué ; code expiré refusé ; déconnexion efficace.
- Vérifier que le site public n'a pas changé (accueil, éditeur, invitation, espace, paiement test avec la carte 4242 4242 4242 4242).
- Affichage à 375 px de large.
- **Ne jamais lancer `npm run build` pendant que `npm run dev` tourne** (sinon vider `.next`).
- Mettre à jour `CLAUDE.md` (section admin + « À faire ») à la fin de chaque étape.

## 12. Découpage

1. **Étape 1** : migration 007, connexion par code, layout protégé, tableau de bord (activité).
2. **Étape 2** : invitations (liste, fiche, actions) + journal.
3. **Étape 3** : prix et vente (prix en base, interrupteur, codes promo).
4. **Étape 4** : statistiques de visites (Cloudflare Web Analytics) + mise à jour de la politique de confidentialité.
5. **Étape 5** : modèles, paramètres, RGPD, santé.

Plus tard (non demandé pour l'instant) : remboursement depuis l'admin (en attendant : tableau de bord Stripe), prix par type d'événement, plusieurs administrateurs avec rôles.
