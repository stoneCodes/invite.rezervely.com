# « Le domaine » — refonte du modèle `boule-neige` (cahier des charges)

Validé avec Glad le 9 nov. 2026. **Développé par Claude** (pas par Codex, à la demande de Glad). Remplace entièrement « Le monde miniature » (boule à neige jugée trop « Noël » et images trop « dessin »). Lire `CLAUDE.md` et `AGENTS.md` : toutes les règles du projet s'appliquent (textes FR/EN, ordre de l'invitation, date obligatoire, `prefers-reduced-motion`, 375 px sans débordement, aucun push sans l'accord de Glad).

## 1. Décisions

- **Nom** : « Le domaine » (FR) / « The Estate » (EN, à confirmer par Glad ; alternative « The Manor »).
- **Identifiant inchangé** : `boule-neige` (pas de migration, les invitations existantes basculent sur le nouveau rendu). Nouveau dossier moteur `components/invitation/domaine/` (préfixe CSS `dm-`), l'ancien `boule/` est retiré une fois le nouveau validé.
- **Ambiance** : sobre, élégante, neutre. Palette ivoire / lin / beige / or mat / taupe. **Aucun bleu, aucune couleur vive, pas de nuit** : tout se passe **en journée** (de la fin de matinée à la lumière dorée de fin d'après-midi).
- **Images photographiques réalistes**, un **seul et même domaine** d'une image à l'autre, pour donner l'impression d'un vrai parcours. Sans personne, sans visage, sans texte.
- **Ouverture : la clé et la serrure.** Une entrée de serrure baroque dorée sur un mur ivoire, une clé ancienne en dessous. Toucher la clé (ou la glisser vers la serrure) : la clé entre, tourne d'un quart de tour avec un « clic », puis le mur ivoire s'ouvre en deux battants sur le domaine baigné de lumière. Son d'ambiance (oiseaux, vent léger, fontaine) seulement après ce geste. **Ne pas reprendre l'image du concurrent** (filigrane « istudio ») : la serrure et la clé sont générées par nous, avec notre propre ornement.

## 2. Parcours (ordre obligatoire de l'invitation)

| # | Section | Lieu (image) | Effet |
|---|---|---|---|
| 0 | Ouverture | Mur ivoire + serrure + clé (calques séparés) | Clé qui entre et tourne, battants qui s'ouvrent, éclat de lumière |
| 1 | « Nous nous marions » + prénoms | Portail ouvert sur l'allée | Caméra qui avance dans l'allée au défilement |
| 2 | Photo + verset | Allée de platanes, chevalet en bois avec cadre vide | Photo des mariés posée dans le cadre (repères mesurés comme le chevalet actuel) |
| 3 | **Date à révéler (obligatoire)** | Porte-fenêtre vitrée de l'orangerie, vitre nette | Buée dessinée en code sur la vitre, à essuyer au doigt ; la suite reste masquée tant que ce n'est pas fait |
| 4 | Compte à rebours | Cour avec cadran solaire ou horloge en pierre | Chiffres qui défilent |
| 5 | Programme | Arche de cérémonie en lin dans le jardin | Fil doré qui relie les étapes |
| 6 | Dress code | Vestibule / dressing avec armoire ancienne | Tenues réalistes recolorées (`dresscode/couple.js`, inchangé) |
| 7 | Lieu | Façade principale du domaine | Boutons itinéraire + agenda |
| 8 | Histoire | Terrasse sur les vignes / les champs | Souvenirs qui apparaissent un à un |
| 9 | Réponse (RSVP) | Grande table dressée sous les arbres, lumière dorée | Formulaire commun ; à l'envoi, pétales ou confettis de lin |

Effets transverses : passage progressif de la lumière du matin à l'heure dorée au fil du défilement ; premier plan (feuillage, voilage) qui défile plus vite que le fond (profondeur) ; reflets de soleil discrets ; particules de pollen dorées. Tout désactivé ou figé avec `prefers-reduced-motion`. Aperçu de l'éditeur (`skipIntro` + `noGate`) : tout affiché d'un coup, sans ouverture ni buée.

## 3. Images à générer par Glad (ChatGPT)

Format vertical 9:16 (1080 × 1920 ou plus), photographique, à déposer dans `images-source/domaine/` avec ces noms. Générer **d'abord `01-portail`**, puis joindre cette image à chaque demande suivante en ajoutant « dans le même domaine, même architecture, même pierre, même lumière ».

**Style commun à ajouter à chaque prompt :**
> Photographie réaliste haut de gamme, prise à hauteur d'yeux comme si l'on marchait dans le domaine, objectif 35 mm, lumière naturelle de journée douce et chaude, palette neutre et élégante (pierre calcaire claire, lin, ivoire, beige, vert olive doux, touches d'or mat), aucune personne, aucun visage, aucun texte, aucune lettre, aucun panneau, pas de nuit, pas de bleu saturé, ciel pâle légèrement voilé. Format vertical 9:16.

1. **`00-serrure.png`** (fond transparent) — Entrée de serrure baroque en laiton doré mat, très finement ciselée, forme ovale verticale avec volutes et feuillages, trou de serrure au centre, vue de face, éclairage doux de studio, ombre portée légère, isolée sur fond transparent.
2. **`00-cle.png`** (fond transparent) — Clé ancienne en laiton doré mat, anneau ajouré en volutes, panneton travaillé, posée à plat vue de face, horizontale, isolée sur fond transparent.
3. **`00-mur.webp`** — Mur enduit ivoire à la chaux, texture fine et douce, éclairage rasant très léger, sans aucun objet. (Sert de fond aux battants.)
4. **`01-portail`** — Grand portail en fer forgé ouvert, piliers en pierre calcaire, allée de gravier clair qui mène à une bâtisse de maître en pierre au loin, rosiers blancs et lavande, fin de matinée.
5. **`02-allee`** — Allée bordée de grands platanes, lumière filtrée par les feuilles ; au premier plan à droite, un chevalet en bois naturel portant un grand cadre doré mat **vide** (intérieur du cadre uni ivoire), quelques roses blanches au pied.
6. **`03-orangerie`** — Porte-fenêtre vitrée à petits carreaux d'une orangerie en pierre, vue de face, vitres **nettes et parfaitement lisibles** (on voit un intérieur clair avec des orangers en pots), cadre peint blanc cassé, plantes au pied.
7. **`04-cour`** — Cour pavée avec cadran solaire en pierre au centre, fontaine à l'arrière-plan, buis taillés.
8. **`05-arche`** — Arche de cérémonie en bois clair drapée de lin écru et de fleurs blanches et vert sauge, rangées de chaises en bois naturel vides de part et d'autre d'une allée, pelouse, oliviers.
9. **`06-vestibule`** — Vestibule lumineux du domaine, grande armoire ancienne patinée ouverte et vide, miroir doré, banc en lin, sol en tomettes claires, lumière de fenêtre.
10. **`07-facade`** — Façade principale de la bâtisse en pierre, volets beige grisé, perron avec deux grands pots d'oliviers, vue d'ensemble de face.
11. **`08-terrasse`** — Terrasse en pierre avec balustrade dominant des vignes et des collines, fin d'après-midi, deux fauteuils en rotin vides.
12. **`09-table`** — Longue table de réception dressée sous des platanes, nappe en lin écru, vaisselle blanche, verres, bougies non allumées, bouquets blancs et verts, lumière dorée de fin de journée.
13. *(facultatif, pour la profondeur)* **`fg-feuillage.png`** et **`fg-voilage.png`** — branches de platane / voilage de lin en premier plan, flous, sur fond transparent.

Conversion en WebP (qualité 85, 1080 px de large) dans `public/img/domaine-*.webp` ; serrure et clé en WebP avec transparence. Écran téléphone de la galerie : `public/img/phone-boule-neige.webp` refait à partir de l'ouverture (mur + serrure + clé, sans texte) ; `phone.seal = null`.

## 3 bis. Images reçues (9 nov. 2026) et utilisation réelle

- `domaine-serrure` (fond transparent, trou de serrure transparent), `domaine-cle` (transparent), `domaine-mur` : ouverture.
- Sections : `portail` (couverture), `allee` (chevalet, flouté derrière la carte photo), `orangerie` (date), `cour` (compte à rebours), `arche` (programme), `vestibule` (dress code, voilages `domaine-voilage` de part et d'autre), `facade` (lieu), `terrasse` (histoire), `table` (titre de la réponse), `table-flou` (formulaire et pied de page).
- `09-table-b` (doublon) non utilisée.
- Écran de galerie `phone-boule-neige.webp` composé à partir du mur, de la serrure et de la clé.

## 3 ter. Parcours immersif et lieux du programme (validé avec Glad le 9 nov. 2026)

- **Option A** : chaque section est une **station** du parcours, reliée aux autres par un **fil doré** qui se dessine au défilement, passe derrière les cartes et s'allume à chaque station avec une petite phrase (« Avant tout, les voici », « Suivez le fil de la journée », « Étape 2 »…, `inviteDict(lang).domaine.say` / `step` / `places`).
- **Marche entre les lieux** : dans la dernière partie de chaque station, la caméra avance vers le point de fuite de l'image (`FOCAL` dans `domaine.js`) pendant que le lieu suivant apparaît : impression de passer d'un lieu à l'autre.
- **Programme** : une station par étape, chacune dans son lieu. Les mariés choisissent le **type de lieu** de chaque étape dans l'éditeur (champ `programme[i].place`, liste `PLACES` de `lib/types.ts`, visible seulement pour ce modèle) ; sinon il est deviné d'après le titre (mairie, église, mosquée…).
- **Images des lieux** : `public/img/domaine-lieu-<type>.webp`. Tant qu'une image n'est pas livrée, le lieu emprunte une image du domaine (`LIEU_REPLI`) ; à la livraison, ajouter le type dans `LIEUX_PRETS` et mesurer son point de fuite dans `FOCAL`.
- **Clé** : geste en 3D (perspective) comme une main invisible : approche en arc, présentation de trois quarts (l'anneau vient vers nous), deux poussées dans la serrure, petite hésitation, quart de tour sur son axe avec léger dépassement.

### Prompts des lieux du programme (à déposer dans `images-source/domaine/` sous ces noms)

Ajouter à chaque prompt le **style commun** ci-dessus, joindre `01-portail` et préciser « dans le même domaine ou ses environs, même pierre, même lumière ». **Important pour l'effet de marche** : un point de fuite net au centre de l'image (porte, allée, nef), l'objectif à hauteur d'yeux.

1. **`lieu-mairie`** : façade d'une petite mairie de village en pierre calcaire claire, perron de quelques marches, grande porte en bois ouverte au centre, drapeaux absents, jardinières de fleurs blanches, place pavée au premier plan, aucune inscription lisible.
2. **`lieu-eglise`** : intérieur lumineux d'une chapelle en pierre claire, allée centrale menant à l'autel, bancs en bois clair ornés de bouquets blancs et de lin, lumière douce des vitraux clairs (sans personnage ni scène figurée), pétales blancs sur le sol.
3. **`lieu-mosquee`** : cour intérieure d'une mosquée en pierre claire et plâtre blanc sculpté, arcades, fontaine d'ablutions au centre, porte en bois ouvragée au fond dans l'axe, tapis aux tons beige et ivoire, aucune calligraphie lisible.
4. **`lieu-temple`** : intérieur sobre d'un temple protestant en pierre claire, allée centrale vers une table de communion nappée de lin, chaises en bois clair alignées, grandes fenêtres claires, fleurs blanches et vert sauge.
5. **`lieu-ceremonie`** : allée de cérémonie dans un jardin à la française, pelouse, haies de buis, allée de pétales blancs qui mène à une arche en bois drapée de lin au centre, chaises en bois vides de part et d'autre (différente de `05-arche` : cadrage plus serré sur l'allée).
6. **`lieu-cocktail`** : cocktail dans la cour du domaine, mange-debout nappés de lin, plateaux de verres en cristal, citronniers en pots, guirlandes de lumières éteintes, perspective vers une porte cochère ouverte au fond.
7. **`lieu-reception`** : salle de réception dans une grange en pierre restaurée, charpente apparente, lustres en cristal, longues tables dressées en lin écru avec vaisselle blanche et bougies, allée centrale vers de grandes portes vitrées au fond.
8. **`lieu-soiree`** : piste de danse en plein air sous les platanes, guirlandes de lumières allumées, lanternes, fin de journée à l'heure dorée (pas de nuit noire), petite estrade vide au fond, quelques chaises en rotin.

## 4. Fichiers à toucher

- `components/invitation/domaine/domaine.js` + `domaine.css` (nouveau moteur, même contrat `mountDomaine(root, data, opts)` → `{ replay, destroy }`, options `onRsvp` / `skipIntro` / `noGate`) ; `Invitation.tsx` aiguille `boule-neige` vers ce moteur.
- `lib/i18n/invite.ts` : bloc `domaine` FR/EN (consigne « Touchez la clé », « Essuyez la buée », etc.) ; supprimer le bloc `boule` à la fin.
- `lib/types.ts` (nom, accroche, `cover`, réglages `phone`), `lib/i18n/site-*.ts` (nom/accroche du modèle et consigne de la galerie), `lib/demoPhotos.ts` (photo de démo si besoin), `lib/pdf/themes.ts` (thème ivoire/or mat), `app/i/[slug]/opengraph-image.tsx` (couleurs).
- `CLAUDE.md` : remplacer la description de `boule/` par celle de `domaine/`.

## 5. Critères d'acceptation

- [ ] Ouverture clé → serrure → battants fluide sur iPhone et Android, au toucher et au glisser ; son seulement après le geste.
- [ ] Toutes les sections dans l'ordre, date masquée tant que la buée n'est pas essuyée.
- [ ] Rendu sobre (palette neutre), aucune scène de nuit, images cohérentes (même domaine).
- [ ] FR ⇄ EN : tous les textes fixes changent ; prénoms et textes des mariés jamais traduits.
- [ ] Aperçu éditeur statique, démo `/demo/boule-neige` avec photo de démo.
- [ ] 375 × 667 et 375 × 500 sans débordement ; `prefers-reduced-motion` respecté ; `npm run typecheck` passe.
- [ ] Montrer à Glad en local avant tout commit/push.
