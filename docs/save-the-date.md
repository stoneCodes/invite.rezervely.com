# Save the date : modèles à part, assortis aux invitations

Décidé avec Glad le 16 nov. 2026.

## Principe

- Deux produits distincts :
  - le **save the date** annonce la date ;
  - l'**invitation** apporte le programme, le dress code, les réponses, le repas, etc.
- Chaque save the date a une **invitation assortie** (`pair` dans `TEMPLATES`, `pairOf()` dans `lib/types.ts`).
  - Même identité : couleurs, matières, typographie.
  - Ouverture différente.
- Trois offres plus tard :
  - le save the date seul ;
  - l'invitation seule ;
  - le **pack** des deux, à −10 ou −15 % (prix et Stripe à faire dans l'admin).
- Galerie en deux blocs : « Invitations » et « Save the date », chacun avec les catégories Mariage, Anniversaire, Baby shower (`FORMATS` et `formatOf()` dans `lib/types.ts`).
- Liens séparés : le save the date et l'invitation ont chacun leur adresse.
- Pas de réponse sur un save the date : `/api/rsvp` refuse (400). Les réponses se font sur l'invitation.

## Ce qui est fait

- Moteur commun `components/invitation/std/` :
  - `std.js` : `mountStd(root, data, opts, "nuit" | "domaine")` ;
  - `std.css`, préfixe `sd-`.
- Déroulé :
  - ouverture ;
  - photo ou monogramme + phrase d'intro ;
  - compte à rebours ;
  - lieu (s'il est renseigné) + itinéraire ;
  - « L'invitation arrive bientôt » (petit mot des mariés, `data.std.note`) + « Ajouter à mon agenda » ;
  - pied de page « Revoir l'ouverture ».
- **Nuit dorée · Save the date** (`std-nuit-doree`, assorti à `nuit-doree`) :
  - une carte brun et or (monogramme dans un anneau doré) flotte sur la table de fête floue ;
  - au toucher, elle se soulève et se retourne dans une pluie de poussière d'or ;
  - les prénoms apparaissent, puis la date se grave en lettres d'or avec un reflet qui passe.
- **Le domaine · Save the date** (`std-domaine`, assorti à `boule-neige`) :
  - une étiquette de lin pend à un ruban doré, accrochée à un clou sur le mur ivoire ;
  - on la tire vers le bas (ou on la touche) : elle se balance et se retourne ;
  - la date apparaît à l'encre dorée, et la façade du domaine apparaît, floue, derrière.
- Éditeur : seules restent les sections Style, Couple, Date et lieu, Petit mot et E-mail.
  - Pas de verset, de programme, de dress code, d'histoire, de liste de souhaits, de repas ni de réponses.
- Aperçu des liens (WhatsApp) : sur-titre « SAVE THE DATE ».
- Écrans de galerie : `public/img/phone-std-*.webp`, faits par `images-source/save-the-date-galerie.py`, sans texte dans l'image.
- Migration `017_save_the_date.sql`, **à appliquer avant de déployer**.

## Reste à faire

- Dans l'espace : bouton « Créer l'invitation assortie », qui ouvre l'éditeur sur `pairOf(template)` avec les infos déjà saisies.
- Prix du pack dans l'admin et Stripe.
- ✅ Images livrées par Glad le 16 nov. 2026 et intégrées (originaux `images-source/save-the-date/`, préparation `images-source/save-the-date-images.py` : détourage du fond vert, tête du clou découpée pour passer devant le ruban). Le clou est retrouvé à l'écran par `NAIL` dans `std.js` (mur en « cover » sur téléphone, pleine hauteur au centre sur écran large).
- Si Glad valide : d'autres collections (cygnes, jardin, origami, velours…).

## Prompts d'images (pour Glad, ChatGPT)

Règles communes :

- photographique et naturel ;
- **aucun texte, aucune lettre, aucun visage** ;
- format portrait 2:3 sauf mention contraire ;
- à déposer dans `images-source/save-the-date/`.

### Nuit dorée

Aujourd'hui, la carte réutilise l'enveloppe brune de l'invitation (`2a-enveloppe.webp`). Il faut une vraie carte noir et or.

1. **Dos de la carte** → `std-nuit-carte.webp`
   > Flat lay photograph, seen exactly from above, of a single blank rectangular luxury card in deep black cotton paper with a subtle linen texture, edged with a thin gold foil double border, and delicate gold foil roses and leaves in two opposite corners only. A large empty circle in the center, framed by a fine gold foil ring, left completely blank. The card fills the whole frame with a 3 % margin, perfectly straight, soft warm studio light, a faint sheen on the gold foil. No text, no letters, no monogram, no people.

2. **Face de la carte (là où la date se grave)** → `std-nuit-face.webp`
   > Flat lay photograph, seen exactly from above, of the back of the same black cotton paper card: completely blank deep black surface with a very fine linen texture and a thin gold foil double border close to the edge. Nothing else, large empty space in the middle. Soft warm studio light. No text, no letters, no people.

3. **Table de fête (fond)**, facultatif, si celle de l'invitation ne convient pas → `std-nuit-table.webp`, 9:16
   > Photograph of an elegant evening wedding reception table seen from a seated guest's point of view, dark tablecloth, gold chargers, crystal glasses, many small candles and warm bokeh lights, black and gold palette, very shallow depth of field, the center of the table left empty and slightly darker to place an object on it. No people, no text.

### Le domaine

Aujourd'hui, l'étiquette est dessinée en code. Une vraie étiquette en photo rendrait l'ouverture plus réelle.

4. **Étiquette de lin, vue de face** → `std-domaine-etiquette.webp`, fond vert uni pour la découpe
   > Product photograph, straight front view, of a single large blank luggage-style tag made of thick ivory linen-covered card, corners cut at the top, a polished brushed-gold metal eyelet at the top center, with a narrow champagne-gold silk ribbon threaded through the eyelet and rising up out of the frame. The tag hangs perfectly straight against a plain flat chroma green background (#00B140), soft even light, gentle natural shadow. The tag is completely blank. No text, no letters, no people.

5. **Dos de l'étiquette** → `std-domaine-etiquette-dos.webp`, même cadrage, même fond vert
   > Same tag, same framing and light, seen from the back: blank ivory linen surface with the gold eyelet. No text, no letters, no people.

6. **Clou doré sur le mur ivoire** → `std-domaine-clou.webp`, 9:16
   > Photograph of a smooth ivory lime-plaster wall in soft daylight, with a single small antique brushed-gold nail with a round head near the top center. Plenty of empty wall below it. Warm neutral tones (ivory, linen, beige). No text, no people.

Après livraison :

- découpe des fonds verts en Python, comme pour `livre-decoupes.py` ;
- conversion en WebP dans `public/img` ;
- remplacement des formes dessinées en CSS (`.sd-face`, `.sd-ring`, `.sd-nail`).
