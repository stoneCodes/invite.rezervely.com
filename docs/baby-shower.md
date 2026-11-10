# Modèle baby shower « Il était une fois » : cahier des charges

Choisi par Glad le 10 nov. 2026, avec le style de papier **B, papier découpé en couches**. C'est le premier modèle de la catégorie `baby-shower` de la galerie.

## Choix de Glad

| Modèle | Statut |
|---|---|
| **« Il était une fois » / « Once Upon a Time »** (livre en papier découpé) | à développer |
| « Le mobile de berceau » | **plus tard** |
| « Sur un petit nuage » (montgolfière) | **plus tard** |

## Fiche technique

- Id `livre`.
- Moteur `components/invitation/livre/` (`mountLivre(root, data, opts)`), styles préfixés `lv-`.
- Images `public/img/livre-*.webp`, originaux dans `images-source/livre/`.
- À mettre à jour, comme pour tout nouveau modèle :
  - `lib/types.ts` (TEMPLATES, catégorie `baby-shower`) ;
  - `app/i/[slug]/opengraph-image.tsx` ;
  - migration `013_template_livre.sql` (contrainte `invitations_template_check`) ;
  - thème PDF `lib/pdf/themes.ts` ;
  - photo de démo `lib/demoPhotos.ts` ;
  - écran de galerie `phone-livre.webp`.
- Musique : morceau par défaut de la catégorie baby shower (bibliothèque).

## Ce qui le distingue d'Origami (condition de Glad)

- Pas de washi, pas de kraft, pas de pliage.
- Ici, la profondeur vient de **plans de carton blanc superposés**, comme un diorama ou une boîte à lumière :
  - 4 à 5 plans par scène ;
  - une vraie ombre portée entre chaque plan ;
  - une lumière chaude derrière la scène.
- Le papier est épais, mat, avec un grain fin, et ses bords découpés sont nets.

## Déroulé

### Ouverture : la couverture
- Un livre relié en toile de lin crème, posé sur un drap.
- Sur la couverture, le titre est en vrai texte, en lettres dorées dans le cadre en creux de l'image : « Il était une fois… » puis les prénoms des parents.
- L'invité touche le livre ou glisse le doigt de droite à gauche :
  - la couverture se soulève en 3D ;
  - la lumière s'allume derrière la première scène ;
  - les plans se lèvent un à un, du fond vers l'avant ;
  - la musique démarre (`unlock()` dans ce geste).

### Défilement : on tourne les pages
- C'est la mécanique nouvelle du modèle. Le défilement vertical **pilote la page qui tourne** :
  - sur téléphone, on voit une page à la fois ;
  - en défilant, la page se soulève par le coin, se courbe (ombre et reflet sur la courbe) et part vers la gauche ;
  - la scène suivante se déplie en profondeur pendant qu'elle se découvre.
- Le geste de glisser vers la gauche ou la droite tourne aussi une page entière.
- Les plans bougent un peu avec l'inclinaison du téléphone, si l'appareil le permet (sinon, avec le défilement) : la profondeur se voit.
- Un petit signet en ruban indique la page en cours, par exemple « 3 / 9 ».

### Les pages (une scène par page)
1. **Le titre** : « Il était une fois… », les prénoms des parents et la photo (échographie ou photo du couple) dans un médaillon découpé. Scène : collines, nuages, lune.
2. **La date, obligatoire** : cachée derrière une **tirette en papier** (« Tirez doucement »). En la faisant glisser, une lune pleine se lève dans la scène et la date apparaît. La suite reste bloquée tant que la tirette n'a pas été tirée.
3. **Le compte à rebours** : des étoiles en papier, avec les jours restants.
4. **Le programme** : un chemin en papier qui serpente entre les collines, avec une étape sur chaque petit drapeau.
5. **Le thème ou le dress code** : les couleurs choisies sont posées sur des nuages en papier.
6. **Le lieu** : une petite maison en papier, l'adresse, l'itinéraire et l'agenda.
7. **La liste de souhaits et la cagnotte** (bloc commun `wishlist.js`).
8. **Les pronostics** (facultatif, activé par les parents) : les invités devinent, s'ils le veulent, le prénom, la date de naissance et le poids. Ces réponses sont ajoutées en tête du message, comme les allergies des anniversaires, sans nouvelle colonne en base.
9. **Un mot pour bébé et la réponse** : formulaire RSVP, puis le livre se referme doucement sur « … à suivre ».

## Données propres au modèle (`data.baby`, à passer dans `lib/validate.ts`)

- Un ou deux prénoms de parents. On réutilise `partner1` et `partner2`, et le second reste facultatif.
- Mois de naissance prévu (facultatif), affiché « Bébé arrive en mars ».
- Sexe : « surprise » (par défaut), « fille » ou « garçon ». Il sert seulement au texte (« Bébé », « notre fille », « notre fils »).
- Case « pronostics des invités », oui ou non.
- Palette au choix (champ `palette`), sans étiquette fille ou garçon :
  - **Ivoire et sable** (neutre, par défaut) ;
  - **Rose poudré et lin** ;
  - **Bleu brume et sauge**.
- Pas de verset pour ce modèle.

## Comment les couleurs changent sans refaire les images

- Glad fournit les découpes **en papier blanc**.
- Le code les teinte dans la couleur de la palette (fusion « multiply » : le grain et les ombres du papier restent visibles).
- Un seul jeu d'images suffit donc pour les 3 palettes, et pour celles qu'on ajoutera plus tard.

## Règles communes

- Toutes les chaînes existent en FR et en EN.
- Respect de `prefers-reduced-motion` : les pages s'enchaînent en fondu, sans courbure ni profondeur animée.
- Sur un téléphone peu puissant, on garde les ombres mais on coupe l'effet d'inclinaison.
- Les éléments en bas de l'écran utilisent `bottom:max(0px,calc(100% - 100svh))`.
- Pas de personnages sous licence ni d'animaux dessinés façon dessin animé.

---

## Images à générer (ChatGPT)

**Consignes pour toutes les images :**
- photographique, réaliste ;
- **aucun texte, aucune lettre, aucun chiffre, aucun visage** ;
- format portrait 1024 × 1536, sauf indication contraire.

**Pour les découpes (images 4 à 12) :**
- papier cartonné **blanc** mat, épais, au grain fin visible et aux bords découpés nets ;
- posé **à plat**, photographié du dessus ;
- sur un **fond vert uni (#00B140)**, sans ombre portée sur le fond ;
- éléments bien séparés les uns des autres, sans se toucher.

Je les détoure ensuite en Python, comme pour les anniversaires.

### 1. Couverture du livre
> Photographie réaliste vue de dessus d'un livre relié fermé, couverture en toile de lin couleur crème, coins légèrement arrondis, au centre un cadre ovale en creux vide (sans aucune inscription), posé sur un drap de lit en lin blanc froissé, lumière douce du matin venant de la gauche, tons ivoire et beige, aucune lettre, aucun texte, aucun visage. Format portrait.

### 2. Fond de la chambre
> Photographie floue (bokeh) d'une chambre de bébé claire et élégante, lumière dorée de fin d'après-midi, tons ivoire, lin et bois clair, sans aucun objet net, sans texte ni visage. Format portrait.

### 3. Texture du papier
> Gros plan photographique d'une feuille de papier aquarelle en coton blanc, grain fin et régulier, éclairage rasant très léger et uniforme, sans pli, sans ombre, sans tache, cadrage plein. Format carré 1024 × 1024.

### 4. Collines
> Trois bandes horizontales de collines douces découpées dans du papier cartonné blanc épais, chacune avec un profil d'ondulation différent, posées à plat sur un fond vert uni #00B140, photographiées du dessus, lumière douce, bords nets, sans ombre sur le fond, sans texte. Format paysage 1536 × 1024.

### 5. Nuages
> Cinq nuages de tailles différentes découpés dans du papier cartonné blanc épais, formes arrondies et élégantes, posés à plat et séparés sur un fond vert uni #00B140, vus du dessus, bords nets, sans ombre sur le fond, sans texte. Format paysage.

### 6. Lune et étoiles
> Une lune pleine ronde, un croissant de lune et sept petites étoiles à cinq branches, découpés dans du papier cartonné blanc épais, posés à plat et séparés sur un fond vert uni #00B140, vus du dessus, bords nets, sans ombre sur le fond, sans texte.

### 7. Arbres
> Trois arbres stylisés élégants (un rond, un haut et fin, un saule) découpés dans du papier cartonné blanc épais, silhouettes pleines, posés à plat et séparés sur un fond vert uni #00B140, vus du dessus, bords nets, sans texte.

### 8. Maison
> Une petite maison de campagne avec un toit en pente, une cheminée et des fenêtres ajourées, découpée dans du papier cartonné blanc épais, posée à plat sur un fond vert uni #00B140, vue de face, bords nets, sans texte.

### 9. Berceau et mobile
> Un berceau ancien à barreaux en silhouette et, séparément, un mobile de berceau avec de petites étoiles et des nuages suspendus, découpés dans du papier cartonné blanc épais, posés à plat et séparés sur un fond vert uni #00B140, vus du dessus, bords nets, sans texte.

### 10. Oiseaux et montgolfière
> Quatre petits oiseaux en vol et une petite montgolfière, découpés dans du papier cartonné blanc épais, silhouettes élégantes, posés à plat et séparés sur un fond vert uni #00B140, vus du dessus, bords nets, sans texte.

### 11. Fleurs et herbes
> Des brins d'herbes folles, trois petites fleurs des champs et deux branches feuillues, découpés dans du papier cartonné blanc épais, posés à plat et séparés sur un fond vert uni #00B140, vus du dessus, bords nets, sans texte.

### 12. Fanions du programme
> Six petits fanions triangulaires sur une ficelle et un petit drapeau sur un bâtonnet, découpés dans du papier cartonné blanc épais, posés à plat et séparés sur un fond vert uni #00B140, vus du dessus, bords nets, sans texte.

### 13. Photo de démo (exception validée : visages acceptés)
> Photographie élégante et naturelle d'un couple attendant un bébé, la femme enceinte, tenues lin crème et beige, en extérieur dans une prairie à la lumière dorée, cadrage à mi-corps, ambiance douce et joyeuse, aucun texte. Format portrait.

À déposer dans `images-source/livre/` (le nom de fichier n'a pas d'importance, je les renomme).
