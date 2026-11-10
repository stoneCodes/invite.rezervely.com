# Modèle « Il était une fois » (livre) : prépare les images de public/img/livre-*.webp
# depuis les originaux de Glad (images-source/livre/).
#  - découpes en papier blanc sur fond vert : détourage (chroma key), retrait du reflet vert sur les bords,
#    une image par élément (composantes connexes). Pas d'ombre dans l'image : le code la dessine (drop-shadow),
#    sinon la teinte de la palette (masque = forme de l'image) colorerait aussi l'ombre ;
#  - couverture, chambre, papier, photo de démo : simple conversion WebP redimensionnée.
# Lancer depuis la racine du projet : python images-source/livre-decoupes.py
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = "images-source/livre"
OUT = "public/img"

def key(path):
    im = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    green = g - np.maximum(r, b)              # fond ≈ 120-170, papier ≈ 0
    a = 1 - np.clip((green - 18) / (75 - 18), 0, 1)
    # Retrait du vert : sur les bords semi-transparents, le vert redescend au niveau du rouge/bleu
    g2 = np.minimum(g, np.maximum(r, b) + 4)
    rgb = np.stack([r, g2, b], -1)
    # Papier blanc : les pixels de bord (mélangés au vert) sont ramenés à un blanc cassé neutre
    lum = rgb.mean(-1, keepdims=True)
    edge = (a < 0.98)[..., None]
    rgb = np.where(edge, np.clip(lum * 0 + np.maximum(lum, 215), 0, 255) * np.ones(3), rgb)
    return rgb, a

def pieces(name, min_area=1500, merge=0):
    rgb, a = key(os.path.join(SRC, name + ".webp"))
    mask = a > 0.5
    if merge:  # relie les morceaux proches (ficelle des fanions, herbes)
        mask = ndimage.binary_dilation(mask, iterations=merge)
    lab, n = ndimage.label(mask)
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        area = (lab[sl] == i + 1).sum()
        if area < min_area:
            continue
        out.append((sl, ndimage.binary_dilation(lab == i + 1, iterations=3)))
    out.sort(key=lambda s: (s[0][0].start // 120, s[0][1].start))  # lecture : rangées puis gauche → droite
    return rgb, a, out

def save_piece(rgb, a, piece_def, dest, pad=28, shadow=False, max_side=900):
    sl, own = piece_def
    a = a * own  # seulement cet élément (pas les bouts des voisins pris dans le cadre)
    y0, y1 = max(0, sl[0].start - pad), min(a.shape[0], sl[0].stop + pad)
    x0, x1 = max(0, sl[1].start - pad), min(a.shape[1], sl[1].stop + pad)
    c = rgb[y0:y1, x0:x1]
    al = a[y0:y1, x0:x1]
    h, w = al.shape
    rgba = np.dstack([c, al * 255]).astype(np.uint8)
    piece = Image.fromarray(rgba, "RGBA")
    if shadow:
        # Ombre portée douce vers le bas : le papier est posé un peu en avant du plan suivant
        sh = Image.fromarray((al * 255 * 0.42).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(7))
        base = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        dark = Image.new("RGBA", (w, h), (52, 40, 28, 255))
        sh_off = Image.new("L", (w, h), 0)
        sh_off.paste(sh, (3, 9))
        base.paste(dark, (0, 0), sh_off)
        piece = Image.alpha_composite(base, piece)
    s = min(1, max_side / max(w, h))
    if s < 1:
        piece = piece.resize((round(w * s), round(h * s)), Image.LANCZOS)
    piece.save(os.path.join(OUT, dest), "WEBP", quality=86, alpha_quality=90, method=6)
    print(dest, piece.size)

def cut(name, names, **kw):
    merge = kw.pop("merge", 0)
    rgb, a, sls = pieces(name, merge=merge)
    if len(sls) != len(names):
        print("!!", name, "attendu", len(names), "trouvé", len(sls), [(s[0].start, s[1].start) for s in sls])
    for sl, dest in zip(sls, names):
        if dest:
            save_piece(rgb, a, sl, f"livre-{dest}.webp", **kw)

cut("collines", ["colline-1", "colline-2", "colline-3"], max_side=1400)
cut("nuages", ["nuage-1", "nuage-2", "nuage-3", "nuage-4", "nuage-5"], max_side=700)
cut("lune", ["lune", "etoile-1", "croissant", "etoile-2", "etoile-3", "etoile-4", "etoile-5", "etoile-6", "etoile-7"], max_side=600)
cut("arbres", ["cypres", "arbre-rond", "saule"], max_side=700, merge=2)
cut("maison", ["maison"], max_side=900)
cut("berceau", ["mobile", "berceau"], max_side=700, merge=3)
cut("oiseaux", ["montgolfiere", "oiseau-1", "oiseau-2", "oiseau-3", "oiseau-4"], max_side=700, merge=6)
cut("fleurs", ["fleurs"], max_side=1200, merge=4)
cut("fanions", ["fanions-1", "fanions-2"], max_side=1200, merge=2)

def photo(name, dest, size, q=82):
    im = Image.open(os.path.join(SRC, name + ".webp")).convert("RGB")
    im.thumbnail(size, Image.LANCZOS)
    im.save(os.path.join(OUT, dest), "WEBP", quality=q, method=6)
    print(dest, im.size)

photo("couverture", "livre-couverture.webp", (1024, 1536), 84)
photo("chambre", "livre-chambre.webp", (900, 1350), 78)
photo("papier", "livre-papier.webp", (640, 640), 80)
photo("couple", "demo-couple-livre.webp", (900, 1200), 82)
