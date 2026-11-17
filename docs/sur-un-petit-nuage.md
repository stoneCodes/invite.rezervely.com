# Modèle baby shower « Sur un petit nuage » : cahier des charges

**Codé le 17 nov. 2026** avec les images de Glad ; à valider visuellement. Choisi par Glad le 17 nov. 2026 : proposition **B** de la maquette `docs/maquettes/baby-shower-2.*`. L'autre proposition, « Le mobile », est gardée pour plus tard.

Exigence de Glad pour tout le modèle : **haut de gamme, classe, luxueux**. Cela vaut pour chaque élément qu'on touche (anneau à maintenir, compte à rebours, boutons, formulaire). Rien qui fasse « gadget » ou dessin animé.

## Fiche technique

- **Identifiants**
  - Id `nuage`, catégorie `baby-shower`.
  - Nom : FR « Sur un petit nuage », EN « On Cloud Nine ».
- **Moteur et fichiers**
  - Moteur `components/invitation/nuage/nuage.js` (`mountNuage(root, data, opts)`), styles préfixés `nu-`.
  - Images `public/img/nuage-*.webp`, originaux dans `images-source/nuage/`.
- **Données :** les mêmes que « Il était une fois » (`data.baby` : sexe, terme, pronostics, palette, `partner2` facultatif), plus `baby.reveal` (booléen) pour la révélation.
- **Base :** migration `019_template_nuage.sql`, qui élargit `invitations_template_check`.
- **Fichiers à mettre à jour, comme pour tout modèle :** `lib/types.ts`, l'image Open Graph, `lib/pdf/themes.ts`, `lib/demoPhotos.ts`, l'écran de galerie `phone-nuage.webp`, et les textes `inviteDict().nuage` (FR et EN).

## Palette

Ciel nacré de l'aube et or :
- ivoire `#FBF4EC` ;
- pêche poudrée `#F5E6DA` ;
- bleu poudré `#DCE3EA` ;
- rose nacré `#EADFDC` ;
- feuille d'or (dégradé du site).

**Polices**
- Pinyon Script pour les prénoms et la date.
- Italiana pour les titres.
- Cormorant Garamond (fine) pour les chiffres.
- Jost 300 en petites capitales espacées pour les sur-titres.

## Déroulé

1. **Ouverture**
   - **Décor :** ciel de l'aube en plein écran, mer de nuages en bas, la montgolfière posée dessus avec une lueur chaude derrière.
   - **Textes :** en haut, « Une naissance s'annonce », puis les prénoms en lettres d'or.
   - **Commande :** en bas, un anneau doré à **maintenir**, avec la consigne « Maintenez pour gonfler ».
     - Pendant l'appui (environ 1,6 s), l'anneau se remplit et la flamme du brûleur s'allume (lueur dessinée en code). La soie se tend légèrement et un souffle de brûleur feutré se fait entendre.
     - Si on relâche trop tôt, l'anneau se vide doucement.
   - **Décollage :** à la fin, la montgolfière s'élève, la caméra la suit et l'on traverse la couche de nuages.
   - La musique de la bibliothèque démarre dans ce geste (contrainte de l'iPhone).
2. **L'ascension** : on fait défiler la page vers le bas, et l'on a l'impression de monter.
   - Trois nappes de nuages glissent à des vitesses différentes.
   - Le ciel passe peu à peu de l'aube au ciel d'altitude (fondu entre les deux photos).
   - La petite montgolfière reste visible sur un côté, et se balance légèrement.
3. **Photo et mot des parents** : médaillon bordé de nacre et d'or (photo d'échographie ou du couple ; sans photo, initiales gravées).
4. **La date, obligatoire avant la suite**
   - Une étoile filante dorée trace une courbe dans le ciel. On la suit du doigt (ou on touche trois fois l'étoile) : la date s'écrit en lettres d'or le long de la traînée, puis l'heure apparaît en dessous.
   - La suite reste masquée tant que la date n'est pas écrite.
5. **Compte à rebours** : jours, heures et minutes sur des plaques de nacre en arche.
6. **La révélation, facultative** : seulement si les parents l'activent et ont choisi « fille » ou « garçon ». Avec « surprise », cette étape n'existe pas.
   - Un ballon de soie ivoire flotte. On le touche : il s'ouvre et libère une pluie de feuilles d'or teintées rose ou bleu.
   - Le texte « C'est une fille » ou « C'est un garçon » s'écrit alors en lettres d'or.
7. **Le programme** : les étapes sur des plaques de nacre, reliées par un cordage doré vertical (celui de la montgolfière).
8. **Le thème** : les couleurs choisies en pastilles de soie, avec les consignes.
9. **Le lieu** : adresse, bouton itinéraire et ajout à l'agenda.
10. **Liste de souhaits et cagnotte** (bloc commun).
11. **Pronostics** (facultatif, comme « Il était une fois »), ajoutés en tête du message.
12. **Réponse**
    - Le formulaire commun, avec le choix du repas.
    - À l'envoi, une petite montgolfière emporte la réponse vers le haut.

## Règles

- **Mouvement réduit :** plus de déplacement des nuages ni de vol ; les étapes s'enchaînent en fondu, et la date apparaît d'un coup après un toucher.
- **Téléphones peu puissants :** on garde une seule nappe de nuages animée et on coupe les flous.
- **Bas de l'écran :** l'anneau et les consignes se calent avec `bottom:max(0px,calc(100% - 100svh))`, pour la barre de Safari.
- **Aperçu de l'éditeur :** tout s'affiche d'un coup, sans geste à faire.
- **Langues :** tous les textes en FR et en EN.

---

## Images à générer (ChatGPT)

**Consignes pour toutes les images :**
- photographique, réaliste, haut de gamme (ambiance de magazine de mariage) ;
- **aucun texte, aucune lettre, aucun chiffre, aucun logo, aucun visage, aucune personne** ;
- lumière douce de l'aube, tons ivoire, pêche, rose nacré et bleu poudré.

À déposer dans `images-source/nuage/` (le nom des fichiers n'a pas d'importance).

### 1. Ciel de l'aube (fond de l'ouverture)
> Photographie réaliste d'un ciel à l'aube vu depuis une montgolfière, au-dessus d'une mer de nuages blancs et moelleux qui occupe le tiers inférieur de l'image, ciel dégradé du bleu poudré en haut au pêche et rose nacré près de l'horizon, soleil très doux et diffus caché derrière une fine brume, ambiance calme, luxueuse et éthérée, aucune montgolfière, aucun oiseau, aucun texte, aucune personne. Format portrait 1024 × 1536.

### 2. Ciel en altitude (fond de l'ascension)
> Photographie réaliste d'un ciel haut au-dessus des nuages au petit matin, ciel bleu poudré très pâle et nacré, quelques voiles de nuages fins et lumineux, lumière dorée douce venant du côté droit, aucun sol visible, aucune montgolfière, aucun oiseau, aucun texte. Format portrait 1024 × 1536.

### 3. La montgolfière (à détourer)
> Photographie réaliste d'une élégante montgolfière en soie ivoire nacrée, avec un fin filet de cordages dorés sur l'enveloppe et de fines coutures dorées, nacelle en osier naturel clair avec un bord en cuir caramel, brûleur éteint, vue de face légèrement en contre-plongée, montgolfière entière visible avec de la marge tout autour, sur un fond vert uni #00B140, sans ombre sur le fond, aucun logo, aucun texte, aucune personne dans la nacelle. Format portrait 1024 × 1536.

### 4, 5 et 6. Trois nappes de nuages (à détourer)
Une image par nappe, **sur fond noir pur** (le noir est retiré en code, ce qui garde les bords vaporeux). Changer seulement le passage entre crochets :

> Photographie réaliste d'une longue nappe horizontale de nuages blancs, doux et moelleux, [VARIANTE], éclairée par une lumière douce et chaude venant du haut, isolée sur un fond noir pur uni, aucun ciel, aucun sol, aucun texte. Format paysage 1536 × 1024.

- Image 4 : « épaisse et dense, aux sommets arrondis en dômes ».
- Image 5 : « plus légère, étirée et effilochée sur les bords ».
- Image 6 : « fine et vaporeuse, presque transparente, comme un voile de brume ».

### 7. Le ballon de soie de la révélation (à détourer)
> Photographie réaliste d'un grand ballon rond en soie satinée ivoire, reflets nacrés délicats, un fin ruban de satin ivoire noué au bas et qui pend en ondulant, sur un fond vert uni #00B140, sans ombre sur le fond, aucun texte, aucun motif. Format portrait 1024 × 1536.

Il est teinté en rose ou en bleu en code.

### 8. Photo de démo (facultative ; visages acceptés, exception validée)
> Photographie élégante et naturelle d'un couple attendant un bébé, la femme enceinte, tenues fluides ivoire et rose poudré, en extérieur sur une colline au lever du soleil, ciel pastel, cadrage à mi-corps, ambiance douce et lumineuse, aucun texte. Format portrait.

Sans cette photo, la démo reprend celle d'« Il était une fois ».
