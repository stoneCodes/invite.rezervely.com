# Cahier des charges : liste des invités en PDF personnalisé

Décidé avec Glad le 6 nov. 2026. À développer par Codex. Lire d'abord `CLAUDE.md` et `AGENTS.md`.
**Ne rien pousser en production sans l'accord explicite de Glad.**

## 1. Ce que veut Glad

- Dans l'espace des mariés (`app/espace/[token]/page.tsx`), à côté de l'export CSV existant : un bouton **« Télécharger la liste en PDF »**.
- Le PDF est **beau et personnalisé** : au nom du couple (ou de la personne pour un anniversaire, un baptême… : un seul prénom possible), avec la date et le lieu, **dans le style du modèle choisi** (couleurs, polices, ornement du modèle).
- Les mariés le génèrent **quand ils veulent** (avant, 2 jours avant, le jour J…), autant de fois qu'ils veulent : il contient toujours les réponses **du moment**.
- **Réservé aux invitations payées.** Glad peut aussi **l'offrir** depuis l'admin.
- **Glad va ajouter d'autres modèles** : le système doit être fait pour qu'un nouveau modèle ait son style de PDF **sans oubli possible** (voir § 4).

## 2. Accès

- Accès autorisé si : `paid_at` non nul **ou** `comped_at` non nul (publication offerte par l'admin) **ou** `pdf_granted_at` non nul (PDF offert par l'admin).
- Nouvelle migration `supabase/migrations/009_pdf.sql` : `alter table invitations add column if not exists pdf_granted_at timestamptz;` (`008_admin_clients.sql` est déjà réservée à la gestion clients ; Glad applique les migrations `008` puis `009` dans Supabase **avant** leur déploiement ; le lui rappeler).
- **Contrôle côté serveur obligatoire** : les données du PDF viennent d'une route `GET /api/espace/[token]/pdf` (jeton validé comme ailleurs avec `getByToken`), qui renvoie **403** si l'accès n'est pas autorisé. Ne jamais se fier seulement au bouton masqué.
- Sans accès : le bouton est visible mais présenté comme réservé (« Disponible avec la publication payante »), sans erreur technique. Le CSV reste disponible pour tous, comme aujourd'hui.
- **Admin** (`app/admin/(protege)/invitations/[id]` + `app/api/admin/invitations/[id]/route.ts`) : action **« Offrir le PDF » / « Retirer le PDF »** (met ou enlève `pdf_granted_at`), avec confirmation et entrée dans le journal `admin_events`, comme les autres actions. Afficher dans la fiche si l'accès vient du paiement, de la publication offerte ou du PDF offert.

## 3. Contenu du PDF (format A4 portrait)

1. **En-tête / couverture** : prénoms (`partner1 & partner2`, ou un seul prénom), date et lieu de l'événement (formatés avec `dateParts` / `LOCALE` selon la langue), ornement du modèle.
2. **Résumé** : nombre de réponses, présents, absents, nombre total de personnes attendues.
3. **Liste des présents** (ordre alphabétique) : une **case à cocher** vide (pour pointer les arrivées le jour J), nom, nombre de personnes, message (court, tronqué proprement si très long).
4. **Liste des absents** (ordre alphabétique) : nom, message.
5. **Page « Vos messages »** : tous les messages des invités, en entier, mis en valeur comme un petit livre d'or.
6. **Pied de chaque page** : « Liste arrêtée le <date et heure> » (puisqu'il est généré à tout moment), numéro de page « 2 / 5 », « Créé avec joyeuxevent ».

- Nom du fichier : `invites-<prenoms-sans-accents>-<AAAA-MM-JJ>.pdf` (réutiliser `slugPart` de `lib/slug.ts`).
- Doit rester propre avec **0 réponse** (message « Aucune réponse pour le moment ») et avec **plusieurs centaines** de réponses (pagination automatique, en-têtes de colonnes répétés).
- Noms et messages longs : retour à la ligne, jamais de texte qui sort de la page. Messages dans d'autres alphabets (arabe, etc.) : prévoir une police de secours à large couverture (ex. Noto Sans) pour qu'aucun caractère ne disparaisse.

## 4. Un style par modèle, sans oubli possible

- Créer `lib/pdf/themes.ts` : `export const PDF_THEMES: Record<TemplateId, PdfTheme> = { … }` (`TemplateId` vient de `lib/types.ts`).
  - Comme c'est un `Record` sur **tous** les `TemplateId`, ajouter un modèle dans `TEMPLATES` sans ajouter son thème PDF **fait échouer `npm run typecheck`** (même garantie que les dictionnaires FR/EN). C'est voulu.
- `PdfTheme` contient : couleurs (fond, texte, accent, filets), polices (titre, texte, éventuellement écriture manuscrite), ornement (petit SVG ou image WebP/PNG légère tirée de `public/img/<modele>-*`), et éventuellement une image d'en-tête.
- Reprendre les couleurs et polices réelles de chaque modèle (tokens dans `components/invitation/invitation.css` et les CSS `appel/`, `boule/`, `origami/`). Les 6 modèles actuels : `cygnes`, `nuit-doree`, `jardin-nuit`, `appel`, `boule-neige`, `origami`.
- Fond clair conseillé pour l'impression (économie d'encre, lisibilité) même pour les modèles sombres : garder l'ambiance par les couleurs d'accent, les titres et l'ornement.
- **Ajouter à `CLAUDE.md`**, dans la ligne « Nouveau template = … » : « + son thème PDF dans `lib/pdf/themes.ts` ».

## 5. Technique

- **Génération dans le navigateur du client** (pas sur le serveur Cloudflare, limité en calcul en formule gratuite) : bibliothèque `pdf-lib` (+ `@pdf-lib/fontkit` pour les polices), **chargée seulement au clic** (`import()` dynamique) pour ne pas alourdir l'espace.
- Polices : fichiers TTF/OTF libres (licence OFL, Google Fonts) dans `public/fonts/pdf/`, chargés à la demande. Ne charger que celles du thème utilisé.
- Les données viennent de la route du § 2 (JSON : infos de l'invitation + réponses), jamais d'une variable globale de la page.
- **Langue du PDF = langue de l'invitation** (`data.lang`), comme l'invitation elle-même : textes fixes dans `lib/i18n/invite.ts` (nouvelle section, FR + EN typés). Le bouton et les messages de l'espace suivent la langue du site (`lib/i18n/site-fr.ts` / `site-en.ts`). Aucun texte en dur.
- Téléchargement : `Blob` + lien de téléchargement ; vérifier sur iPhone (Safari ouvre le PDF, l'utilisateur peut l'enregistrer ou l'imprimer) et Android.
- Pendant la génération : bouton désactivé + « Préparation du PDF… » ; en cas d'erreur, message clair.

## 6. Vérifications avant de proposer le push

- `npm run typecheck` sans erreur ; ne jamais lancer `npm run build` pendant `npm run dev`.
- Tester en local avec des invitations de test : payée, non payée (403 + bouton « réservé »), publication offerte, PDF offert puis retiré depuis l'admin.
- Générer le PDF pour **chacun des 6 modèles**, en français et en anglais, avec 0, 5 et 300 réponses, des messages longs et un message en arabe.
- Vérifier l'affichage de l'espace à 375 px de large.
- **Supprimer ensuite les invitations de test créées** (la base de production est partagée avec le local) et le dire à Glad.
- Mettre à jour `CLAUDE.md`, dire à Glad quoi tester, puis **demander son accord avant de pousser**.
