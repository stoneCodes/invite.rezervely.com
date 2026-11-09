# Modèles « Anniversaire » : cahier des charges

Validé avec Glad le 9 nov. 2026. Catégorie `anniversaire` de la galerie.

## Choix de Glad

| Pour | Modèle | Statut |
|---|---|---|
| Adulte | **A1 « Face A »** (vinyle) | à développer |
| Adulte | **A2 « Le toast »** (champagne) | à développer |
| Enfant | **E1 « Le gâteau magique »** | à développer, 2 palettes au choix |
| Enfant | **E3 « La piñata »** | à développer, 2 palettes au choix |
| Adulte | A3 « Rétrospective » (polaroïds) | **plus tard** (bonne idée, gardée) |
| Enfant | E2 « La carte au trésor » | **plus tard** (bonne idée, gardée) |

## Règle commune

- Rien de commun avec les mariages : pas d'enveloppe, de sceau, de portail, de porte, de clé ni d'écran d'appel.
- On garde le contrat de l'invitation, dans cet ordre :
  - prénom de la personne fêtée et âge ;
  - photo ;
  - **date à révéler, obligatoire** ;
  - compte à rebours, programme, dress code ou thème, lieu ;
  - réponse.
- Données propres aux anniversaires, à ajouter dans l'éditeur et dans `lib/validate.ts` :
  - **un seul prénom** et un **âge** ;
  - case « fête surprise, chut ! » (texte d'avertissement aux invités) ;
  - champ facultatif « cadeaux ou cagnotte » ;
  - enfant seulement : heure de fin (pour récupérer les enfants), téléphone d'un parent, question « allergies » dans la réponse ;
  - pas de verset pour ces modèles.
- Pas de personnages sous licence (Disney, Pat'Patrouille…) : uniquement des couleurs et des thèmes génériques.
- Toutes les chaînes doivent exister en FR et en EN.
- Respect de `prefers-reduced-motion`.
- Un écran de galerie `phone-<id>.webp` par modèle.

## Enfant : choix de la couleur (demande de Glad)

- Un même modèle, avec **2 palettes au choix** des parents dans l'éditeur (champ `data.palette`, validé dans `lib/validate.ts`) :
  - **Rose poudré et menthe** ;
  - **Bleu ciel et jaune soleil**.
- Les palettes restent ouvertes à tous : on ne les étiquette pas « fille » ou « garçon » dans l'interface.
- Mise en œuvre :
  - tokens CSS par `[data-palette]` ;
  - images principales fournies en 2 versions (même cadrage, couleurs changées). On peut demander à ChatGPT « même image, glaçage bleu ciel ».
- On pourra ajouter d'autres palettes plus tard sans toucher au moteur.

## A1 « Face A » (vinyle)

### Ouverture
- Platine vue de dessus.
- On glisse le bras jusqu'au disque. Le diamant se pose, le disque tourne et la musique (synthétisée) démarre.

### Défilement
- L'invitation est un album : chaque section est une piste (« 1 Le rendez-vous », « 2 Le programme »…).
- Le disque reste en haut et tourne avec le défilement ; le bras avance vers le centre.

### Sections
- **Date** : floue sur l'étiquette centrale, révélée par un scratch (va-et-vient du doigt). Obligatoire.
- **Âge** : en gros, façon « Édition 40 ».
- **Dress code** : une pochette d'album aux couleurs choisies.
- **Réponse** : « Ajouter ma voix à l'album », avec un disque qui rentre dans sa pochette.

## A2 « Le toast » (champagne)

### Ouverture
- On glisse le doigt le long du sabre : le bouchon saute et la mousse envahit l'écran.

### Défilement
- On remonte avec les bulles.
- Chaque section naît dans une bulle qui grossit puis s'ouvre ; des bulles décoratives montent en continu.

### Sections
- **Date** : dans la grande bulle, à faire éclater (toucher), obligatoire.
- **Réponse** : deux flûtes qui trinquent.
- Le modèle évoque l'alcool : c'est assumé par Glad. Ne rien écrire d'autre sur l'alcool dans les textes.

## E1 « Le gâteau magique »

### Ouverture
- Un gâteau avec **autant de bougies que l'âge** (bougies dessinées en code, de 1 à 12, au-delà afficher le chiffre).
- On souffle dans le micro, avec autorisation demandée au geste. Si le micro est refusé ou absent, on touche chaque bougie.
- Les flammes s'éteignent, fumée puis confettis.

### Défilement
- On descend le gâteau étage par étage. Chaque étage est une section, avec sa couleur de glaçage et ses vermicelles.

### Sections
- **Date** : sous la crème, à étaler du doigt. Obligatoire.
- **Programme** : des bonbons posés sur l'étage.
- **Thème ou déguisement** : à la place du dress code.
- **Réponse** : « Je viens ! », avec une part de gâteau qui s'envole.

## E3 « La piñata »

### Ouverture
- Une piñata étoile qui se balance. On la tape 3 fois (elle se fissure), puis elle s'ouvre.

### Défilement
- Les bonbons tombent du haut de l'écran.
- Chaque grand bonbon emballé porte une section ; il se déballe quand il arrive à l'écran.

### Sections
- **Date** : dans le premier bonbon, à déballer (le tirer ou le toucher), obligatoire.
- **Réponse** : « Je viens ! », avec une pluie de confettis.

## Images à générer par Glad (ChatGPT)

Règles pour toutes les images :
- photo réaliste, format vertical 9:16 ;
- **sans texte, sans logo, sans personne ni visage** ;
- WebP ensuite dans `public/img`, originaux dans `images-source/anniversaire/`.

### A1 vinyle
1. `vinyle-platine` : « Photo réaliste vue exactement de dessus d'une platine vinyle vintage en bois de noyer, plateau noir vide sans disque, posée sur un meuble sombre, lumière chaude et tamisée de salon, ambiance lounge élégante, format vertical 9:16, sans texte, sans logo, sans personne. »
2. `vinyle-bras` : « Bras de lecture de platine vinyle chromé seul, vu exactement de dessus, avec sa base ronde et sa tête de lecture, isolé sur fond blanc uni, éclairage doux, sans texte ni logo. »
3. `vinyle-disque` : « Disque vinyle noir vu exactement de dessus, parfaitement centré et rond, sillons visibles avec un léger reflet, étiquette centrale vierge couleur or mat, sur fond blanc uni, sans texte. »
4. `vinyle-pochette` : « Pochette de disque vinyle carrée vierge en carton texturé ivoire, posée à plat, vue de dessus, lumière douce, sans texte ni motif. »
5. `vinyle-salon` : « Intérieur de salon lounge chic le soir, banquettes en velours, lampes dorées, étagère de vinyles, très flou en arrière-plan (bokeh), tons ambre et brun, format vertical 9:16, sans personne, sans texte. »

### A2 toast
1. `toast-bouteille` : « Bouteille de champagne vue de face, col emballé de feuille dorée, étiquette crème vierge sans aucune inscription, debout sur fond bleu nuit profond, éclairage de studio élégant avec reflets dorés, format vertical 9:16, sans texte. »
2. `toast-sabre` : « Sabre à champagne élégant, lame argentée et poignée dorée, isolé sur fond blanc uni, vu de côté, sans texte. »
3. `toast-bulles` : « Macro de bulles de champagne qui remontent dans un liquide doré, lumière chaude, arrière-plan doré flou, format vertical 9:16, sans texte. »
4. `toast-flutes` : « Deux flûtes de champagne qui trinquent, éclaboussure dorée, fond bleu nuit avec bokeh doré, format vertical 9:16, sans mains visibles, sans texte. »

### E1 gâteau (2 versions : rose/menthe puis bleu ciel/jaune)
1. `gateau-<palette>` : « Gâteau d'anniversaire rond à deux étages, glaçage lisse rose poudré avec coulures blanches, vermicelles multicolores, sans bougies, posé sur un présentoir blanc, fond rose très pâle, vue de face, lumière douce, format vertical 9:16, sans texte, sans personne. » Puis : « Même image, glaçage bleu ciel et fond jaune très pâle. »
2. `gateau-etage-<palette>` : « Gros plan plein cadre sur le flanc d'un gâteau au glaçage menthe, coulures blanches en haut, quelques vermicelles, vue de face, format vertical 9:16, sans texte. » Puis la même en jaune soleil.

### E3 piñata (2 versions)
1. `pinata-<palette>` : « Piñata en forme d'étoile en papier crépon frangé, corps rose et pointes turquoise, lilas et menthe, suspendue à une corde, isolée sur fond blanc uni, vue de face, sans texte. » Puis : « Même piñata, corps bleu ciel et pointes jaune, orange et vert. »
2. `pinata-bonbons` : « Six gros bonbons emballés dans du papier brillant torsadé aux deux bouts, couleurs vives variées, posés séparément sur fond blanc uni, vue de dessus, sans texte. »
3. `pinata-fond` : « Jardin de fête d'enfant en plein jour, guirlandes de fanions et ballons, très flou en arrière-plan (bokeh), couleurs gaies, format vertical 9:16, sans personne, sans texte. »

## Pour plus tard

- **A3 « Rétrospective »**
  - Ouverture : appareil photo instantané, on déclenche le flash.
  - Défilement : une frise horizontale des années, une photo par époque.
  - Date : sur un polaroïd qui se développe quand on secoue le téléphone.
  - Point faible : demande 4 ou 5 photos aux clients.
- **E2 « La carte au trésor »**
  - Ouverture : on déroule un parchemin.
  - Défilement : un pion suit un chemin en pointillés d'île en île.
  - Date : dans un coffre qui s'ouvre après 3 pièces ramassées.
  - Réponse : « Rejoindre l'équipage ».
  - Environ deux fois plus de travail que le gâteau.
