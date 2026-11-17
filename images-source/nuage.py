# Modèle « Sur un petit nuage » (nuage) : prépare public/img/nuage-*.webp depuis images-source/nuage/.
#  - ciels : simple conversion WebP ;
#  - montgolfière et ballon de soie (fond vert) : détourage par chroma key + retrait du reflet vert ;
#  - nappes de nuages (fond noir) : l'alpha vient de la luminosité, puis la couleur est « dé-prémultipliée »
#    (les bords restent vaporeux, sans halo noir) ;
#  - photo de démo du couple (exception validée : visages acceptés dans les démos).
# Lancer depuis la racine du projet : python images-source/nuage.py
import os
import numpy as np
from PIL import Image

SRC = "images-source/nuage"
OUT = "public/img"

def save(im, name, q=84):
    im.save(os.path.join(OUT, name), "WEBP", quality=q, alpha_quality=90, method=6)
    print(name, im.size, os.path.getsize(os.path.join(OUT, name)) // 1024, "Ko")

def plain(src, name, w):
    im = Image.open(os.path.join(SRC, src)).convert("RGB")
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    save(im, name, 80)

def crop_alpha(rgba, pad=8):
    a = np.asarray(rgba)[..., 3]
    ys, xs = np.where(a > 4)
    return rgba.crop((max(0, xs.min() - pad), max(0, ys.min() - pad), min(rgba.width, xs.max() + pad), min(rgba.height, ys.max() + pad)))

def green(src, name, max_side):
    im = np.asarray(Image.open(os.path.join(SRC, src)).convert("RGB")).astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    gr = g - np.maximum(r, b)                      # fond ≈ 150-190 ; soie, or et osier ≤ 0
    a = 1 - np.clip((gr - 14) / (70 - 14), 0, 1)
    g2 = np.where(a < 0.999, np.minimum(g, np.maximum(r, b) * 0.96 + 2), g)   # retrait du vert sur les bords
    rgba = np.dstack([r, g2, b, a * 255]).clip(0, 255).astype(np.uint8)
    out = crop_alpha(Image.fromarray(rgba, "RGBA"))
    s = min(1, max_side / max(out.size))
    out = out.resize((round(out.width * s), round(out.height * s)), Image.LANCZOS)
    save(out, name)

def black(src, name, w):
    im = np.asarray(Image.open(os.path.join(SRC, src)).convert("RGB")).astype(np.float32)
    m = im.max(-1)
    a = np.clip((m - 10) / (235 - 10), 0, 1) ** 0.9
    rgb = np.where(a[..., None] > 0.02, im / np.maximum(a[..., None], 1e-3), 255)
    rgb = rgb.clip(0, 255)
    rgb = rgb * 0.82 + 255 * 0.18                   # éclaircit un peu : les nuages restent blancs sur le ciel pastel
    rgba = np.dstack([rgb, a * 255]).clip(0, 255).astype(np.uint8)
    out = crop_alpha(Image.fromarray(rgba, "RGBA"), 2)
    out = out.resize((w, round(out.height * w / out.width)), Image.LANCZOS)
    save(out, name, 82)

plain("ciel-aube.webp", "nuage-ciel-aube.webp", 900)
plain("ciel-haut.webp", "nuage-ciel-haut.webp", 900)
green("montgolfiere.webp", "nuage-montgolfiere.webp", 1100)
green("ballon.webp", "nuage-ballon.webp", 900)
black("nuage-dense.webp", "nuage-nappe-1.webp", 1400)
black("nuage-leger.webp", "nuage-nappe-2.webp", 1400)
black("nuage-voile.webp", "nuage-nappe-3.webp", 1400)
im = Image.open(os.path.join(SRC, "demo-couple.webp")).convert("RGB")
im = im.resize((900, 1350), Image.LANCZOS).crop((0, 75, 900, 1275))
save(im, "demo-couple-nuage.webp", 80)
