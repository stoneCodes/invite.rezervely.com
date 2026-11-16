# Prépare les images des save the date (livrées par Glad le 16 nov. 2026) : py -3.12 images-source/save-the-date-images.py
# Originaux dans images-source/save-the-date/ ; sorties WebP dans public/img/std-*.webp.
#  - Nuit dorée : dos de carte (roses + anneau), face (double filet), table de fête (fond).
#  - Le domaine : étiquette recto / verso détourées du fond vert (ruban compris), mur au clou (fond),
#    tête du clou découpée en rond pour passer PAR-DESSUS le ruban (le ruban semble accroché au clou).
# Repères utilisés par components/invitation/std/std.js (NAIL, TAG) : à recalculer si les images changent.
import os
import numpy as np
from PIL import Image, ImageFilter

root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
src = lambda n: os.path.join(root, "images-source", "save-the-date", n)
out = lambda n: os.path.join(root, "public", "img", n)

def save(im, name, w=None, q=84):
    if w and im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(out(name), "WEBP", quality=q, method=6)
    print(name, im.size, round(os.path.getsize(out(name)) / 1024), "Ko")

# ---------- Nuit dorée ----------
save(Image.open(src("nuit-carte-dos.webp")).convert("RGB"), "std-nuit-carte-dos.webp", 760)
save(Image.open(src("nuit-carte-face.webp")).convert("RGB"), "std-nuit-carte-face.webp", 760)
save(Image.open(src("nuit-table.webp")).convert("RGB"), "std-nuit-table.webp", None, 80)

# ---------- Le domaine : étiquettes détourées ----------
CROP = (150, 0, 936, 1400)  # étiquette + ruban jusqu'en haut de l'image
def cutout(name):
    im = Image.open(src(name)).convert("RGB").crop(CROP)
    a = np.asarray(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = g - np.maximum(r, b)                      # dominance du vert
    alpha = 1 - np.clip((d - 18) / 55, 0, 1)      # vert franc = transparent, ombre verte = demi-teinte
    # retire la teinte verte des bords et de l'ombre
    g2 = np.where(d > 0, np.maximum(r, b), g)
    rgb = np.stack([r, g2, b], -1)
    # ombre douce sous l'étiquette : les zones demi-transparentes deviennent brun très sombre
    shade = alpha < 0.98
    rgb[shade] = rgb[shade] * 0.35 + np.array([40, 30, 18]) * 0.65 * (1 - alpha[shade, None])
    al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    res = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).convert("RGBA")
    res.putalpha(al)
    return res
save(cutout("domaine-etiquette.webp"), "std-domaine-etiquette.webp", 640, 86)
save(cutout("domaine-etiquette-dos.webp"), "std-domaine-etiquette-dos.webp", 640, 86)

# ---------- Le domaine : mur au clou + tête du clou ----------
wall = Image.open(src("domaine-clou.webp")).convert("RGB")
save(wall, "std-domaine-mur.webp", None, 80)
HX, HY, R = 470, 135, 38            # centre et rayon de la tête du clou dans le mur (941 × 1672)
head = wall.crop((HX - R, HY - R, HX + R, HY + R)).convert("RGBA")
m = Image.new("L", (2 * R * 4, 2 * R * 4), 0)
from PIL import ImageDraw
ImageDraw.Draw(m).ellipse((10, 10, 2 * R * 4 - 10, 2 * R * 4 - 10), fill=255)
m = m.resize((2 * R, 2 * R), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1))
head.putalpha(m)
head.save(out("std-domaine-clou.png"))
print("std-domaine-clou.png", head.size)
