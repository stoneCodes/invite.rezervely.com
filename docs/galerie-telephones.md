# Galerie « téléphones » et catégories — cahier des charges (pour Codex)

Validé avec Glad le 7 nov. 2026. Lire `CLAUDE.md` et `AGENTS.md` avant de commencer : toutes les règles du projet s'appliquent (textes FR/EN, palette claire du site, `prefers-reduced-motion`, rien ne déborde à 375 px, aucun push sans l'accord de Glad).

## 1. Objectif

- Présenter **chaque modèle dans un téléphone** (cadre dessiné en code + écran d'ouverture du modèle), sur l'accueil et dans l'éditeur.
- Ranger les modèles par **catégories**, affichées en **rangées** (« tables ») qui défilent à l'horizontale.
- Tout nouveau modèle devra fournir son écran « téléphone » (voir § 6).

## 2. Décisions validées

- **Cadre du téléphone en code** (CSS/SVG), identique pour tous les modèles : bords arrondis, îlot en haut, liseré métal discret. Jamais dessiné dans l'image.
- **Écran = image sans aucun texte** fournie par Glad (décor, enveloppe, sceau vide ou à motif). Les prénoms, le monogramme du sceau et la consigne (« Touchez le sceau pour ouvrir »…) sont du **vrai texte posé par-dessus** :
  - langue suit le bouton FR/EN du site (accueil) ;
  - prénoms : démo « Léa & Samuel » sur l'accueil ; dans l'éditeur, les prénoms saisis par les mariés (monogramme = initiales).
- **Catégories** :
  - `mariage` — libellé « Mariage et fiançailles » / « Weddings and engagements » (les 7 modèles actuels) ;
  - `anniversaire` — « Anniversaire » / « Birthday » ;
  - `baby-shower` — « Baby shower » / « Baby shower ».
  - Un modèle peut appartenir à plusieurs catégories.
- Sur grand écran, les cartes s'affichent en grille de quatre colonnes (trois sur tablette) avec suffisamment d'espace autour des téléphones. Sur mobile, chaque catégorie devient un carrousel horizontal : un téléphone visible à la fois, geste du doigt gauche/droite et arrêt aimanté sur chaque modèle.
- Dans « Tout », les coups de cœur sont présentés en premier et exclus de la rangée mariage qui suit, afin de ne pas les répéter. « Tout voir » affiche ensuite le catalogue complet.
- **Rangée « Tout »** en premier, titrée « Nos coups de cœur » / « Our favourites » : sélection de 4 à 6 modèles (champ `featured`), lien « Tout voir » qui affiche le catalogue complet.
- **Rangées vides** : affichées avec 2 emplacements « Bientôt » / « Coming soon » (cadre en pointillés), pas masquées.
- **Pastilles de catégorie** en haut de la section (Tout · Mariage et fiançailles · Anniversaire · Baby shower) : toucher = filtrer (n'affiche que la rangée choisie). Accessibles au clavier (`role="tablist"` ou boutons `aria-pressed`).
- **Accueil ET éditeur** utilisent le même composant ; dans l'éditeur, version plus compacte, le modèle choisi reste mis en avant (badge « Votre modèle » existant), toucher = ouvrir la démo comme aujourd'hui.

## 3. Maquette (validée)

```
[Tout] [Mariage et fiançailles] [Anniversaire] [Baby shower]

Nos coups de cœur
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  grille 4 colonnes sur ordinateur
│ ▬▬   │ │ ▬▬   │ │ ▬▬   │ │ ▬▬   │
│ (L&S)│ │ (L&S)│ │      │ │  ✿   │   écran = image du modèle
│Léa & │ │Léa & │ │Léa & │ │Léa & │   + texte vivant par-dessus
│Samuel│ │Samuel│ │Samuel│ │Samuel│
└──────┘ └──────┘ └──────┘ └──────┘
Pétales   Roses d'or ...                 nom du modèle
[Démo] [Créer]                           actions

Mariage et fiançailles                              7 modèles →
(même rangée)

Anniversaire                                           Bientôt
┌┄┄┄┄┄┄┐ ┌┄┄┄┄┄┄┐
┆Bientôt┆ ┆Bientôt┆
└┄┄┄┄┄┄┘ └┄┄┄┄┄┄┘
```

- « Démo » ouvre la pop-up plein écran existante (`/demo/<id>?integre=1`, styles `.ed-full*`) ; « Créer » mène à `/creer?t=<id>` (feu d'artifice doré conservé).
- Garder l'esprit de l'accueil actuel (poussière d'or, légère inclinaison des cartes au défilement), sans casser `prefers-reduced-motion`.
- Ordinateur : grille de 4 téléphones par ligne ; tablette : 3 par ligne ; mobile : carrousel horizontal par catégorie, un téléphone visible à la fois, balayage gauche/droite avec le doigt et arrêt aimanté. Les dimensions et marges laissent de l'espace autour des visuels ; jamais de débordement horizontal de la page (`overflow-x:clip`), seul le carrousel défile horizontalement.

## 4. Données (`lib/types.ts`)

Ajouter à chaque entrée de `TEMPLATES` :

```ts
categories: ["mariage"],          // CategoryId[]
featured: true,                   // apparaît dans « Nos coups de cœur »
phone: {
  screen: "/img/phone-<id>.webp", // écran sans texte (ratio 9:19,5)
  // Zones du texte vivant, en % de l'écran (à mesurer sur chaque image) :
  names: { top: 78, size: 9 },    // prénoms (taille en % de la largeur)
  hint:  { top: 87 },             // consigne
  seal:  { top: 50, left: 50, d: 22 } | null, // monogramme sur le sceau, ou null si pas de sceau
  ink: "#7a1f35",                 // couleur du texte sur cet écran
  font: "script" | "serif",       // police des prénoms
},
```

- Déclarer `CATEGORIES = [{ id: "mariage" }, { id: "anniversaire" }, { id: "baby-shower" }] as const` et le type `CategoryId`.
- Libellés des catégories, des rangées, de « Bientôt », « Tout voir », « Nos coups de cœur » et des consignes d'écran (« Touchez le sceau pour ouvrir », « Glissez pour répondre », « Secouez la boule », « Faites défiler »…) dans `lib/i18n/site-fr.ts` + `site-en.ts` (le typecheck garantit la parité). **Aucun texte en dur.**
- Pas de migration SQL : les catégories ne concernent que l'affichage.

## 5. Fichiers à toucher

- `components/PhoneTemplate.tsx` (nouveau) + styles dans `app/globals.css` (classes préfixées `ph-`, tokens du site sur `.site`) : le téléphone (cadre, écran, texte vivant, monogramme). Props : `template`, `names: [string, string]`, `lang`, `compact?`.
- `components/TemplateRows.tsx` (nouveau) : pastilles + rangées + emplacements « Bientôt ». Utilisé par l'accueil et l'éditeur.
- `app/HomeClient.tsx` / `app/home.css` : remplacer la galerie horizontale `.gl-tpl` actuelle par `TemplateRows` (garder le titre de section existant, la pop-up démo et les boutons « Créer »).
- `app/creer/Editor.tsx` / `editor.css` : remplacer la grille `.ed-tpls` par `TemplateRows` en mode compact, avec les prénoms saisis.
- `lib/types.ts`, `lib/i18n/site-fr.ts`, `lib/i18n/site-en.ts`.
- `public/img/phone-<id>.webp` (conversion des images de Glad, qualité 85, largeur 720 px max).

## 6. Images (fournies par Glad)

Glad dépose les originaux dans `images-source/galerie/<id>.png` (ids : `cygnes`, `nuit-doree`, `jardin-nuit`, `appel`, `boule-neige`, `origami`, `velours`). Correspondance proposée avec les 7 maquettes envoyées le 7 nov. 2026, **à confirmer avec Glad** : enveloppe rose papier → `cygnes` ; roses d'or sur fond chocolat → `nuit-doree` ; enveloppe rose sur nuit bleue → `jardin-nuit` ; appel → `appel` ; boule à neige → `boule-neige` ; enveloppe crème et gypsophile → `origami` ; velours bordeaux → `velours`.

Les maquettes envoyées contiennent du texte (« Lea & Samuel », « TAP THE SEAL TO OPEN », « L&S ») et le cadre de l'iPhone : **elles ne sont pas utilisables telles quelles**. Prompt à donner à ChatGPT pour chaque image (en joignant la maquette) :

> Recrée exactement cette image d'écran de téléphone, avec le même décor, les mêmes couleurs, la même lumière et la même composition, mais : sans le cadre du téléphone (uniquement le contenu de l'écran, bord à bord), sans aucun texte, aucune lettre, aucun prénom et aucun monogramme (le sceau de cire reste lisse ou avec un simple motif floral, sans initiales), et en laissant vide la zone où se trouvaient les prénoms et la consigne. Format vertical 9:19,5 (par ex. 1179 × 2556 px), rendu photographique haute qualité.

Pour « Appel entrant » : pas de photo de couple dans l'écran (la photo des mariés est posée par le code, ronde, au centre) et pas d'imitation exacte de l'écran d'appel iOS : seulement le fond flou chaleureux et les anneaux dorés.

Tant qu'une image manque, afficher la couverture actuelle (`cover`) dans le cadre du téléphone.

## 7. Critères d'acceptation

- [ ] Accueil : pastilles + « Nos coups de cœur » + « Mariage et fiançailles » + « Anniversaire » et « Baby shower » en « Bientôt ».
- [ ] Chaque téléphone affiche son écran et le texte vivant ; FR ⇄ EN change tous les textes sans recharger.
- [ ] Éditeur : même composant compact, prénoms des mariés dans les écrans, modèle choisi mis en avant, démo au toucher.
- [ ] 375 × 667 et 375 × 500 : aucun débordement horizontal de page ; glissement tactile horizontal et arrêt modèle par modèle dans chaque catégorie.
- [ ] `prefers-reduced-motion` : aucune animation d'inclinaison/parallaxe.
- [ ] `npm run typecheck` passe ; aucun texte visible en dur.
- [ ] Mettre à jour `CLAUDE.md` (décision + structure) ; montrer à Glad en local avant tout commit/push.
