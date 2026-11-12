# Prépare les images du modèle « La dot » (public/img/dot-*) depuis images-source/la-dot/.
# py -3.12 images-source/la-dot.py
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = "images-source/la-dot/"
OUT = "public/img/"


def webp(im, name, q=80, **kw):
    im.save(OUT + name, "WEBP", quality=q, method=6, **kw)
    print(name, im.size)


# 1. Décors (photos de Glad) : 1024 × 1536, telles quelles
for src, dst in [("coin-des-maries", "dot-coin"), ("cour-reception", "dot-cour"), ("presents-dot", "dot-presents"), ("table", "dot-table")]:
    webp(Image.open(SRC + src + ".webp").convert("RGB"), dst + ".webp", 78)

# Photo de démo du couple (démos seulement)
c = Image.open(SRC + "couple-demo.webp").convert("RGB")
webp(c.resize((800, round(800 * c.height / c.width)), Image.LANCZOS), "demo-couple-dot.webp", 80)

# 2. Raphia sur fond vert : détourage (alpha = 1 - « vert »), puis suppression du reflet vert
a = np.array(Image.open(SRC + "raphia-franges.webp").convert("RGB")).astype(float)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
k = np.clip((g - np.maximum(r, b) - 8) / 40, 0, 1)
alpha = 1 - k
g2 = np.minimum(g, np.maximum(r, b) * 0.98 + 4)  # le vert ne dépasse plus le rouge / bleu
rgba = np.dstack([r, g2, b, alpha * 255]).clip(0, 255).astype(np.uint8)
fr = Image.fromarray(rgba, "RGBA")
# Frange (sans la tresse) : une bande de brins, posée côte à côte en code pour faire le rideau
fringe = fr.crop((0, 168, 1024, 1500))
webp(fringe.resize((640, round(640 * fringe.height / fringe.width)), Image.LANCZOS), "dot-raphia.webp", 82)
# Tresse (bande entre les sections), raccord horizontal par fondu des deux bords
br = np.array(fr.crop((0, 52, 1024, 186))).astype(float)
w = br.shape[1]; ov = 120
left = br[:, :ov].copy()
for i in range(ov):
    t = i / ov
    br[:, w - ov + i] = br[:, w - ov + i] * (1 - t) + left[:, i] * t
band = Image.fromarray(br[:, ov:].clip(0, 255).astype(np.uint8), "RGBA")
webp(band.resize((round(band.width * 0.5), round(band.height * 0.5)), Image.LANCZOS), "dot-tresse.webp", 82)

# 3-4. Dress code : dessiné en code dans le moteur (carnet du tailleur, atelier() dans dot.js), sans image.

# 5. Pagne de démonstration : motif original façon wax (jamais un motif de marque), carreau raccordable
N = 512
IND, ORA, YEL, IVO, BRN = (31, 52, 102), (214, 98, 40), (232, 178, 58), (243, 231, 211), (96, 52, 30)
im = Image.new("RGB", (N, N), IND)
d = ImageDraw.Draw(im)


def wrap(x, y, fn):
    for dx in (-N, 0, N):
        for dy in (-N, 0, N):
            fn(x + dx, y + dy)


def medallion(x, y, R):
    def f(cx, cy):
        for i, (rr, col) in enumerate([(R, ORA), (R * .86, YEL), (R * .74, IVO), (R * .6, ORA), (R * .46, IND), (R * .3, YEL), (R * .14, IND)]):
            d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=col)
        # couronne de points ivoire, comme les crépis du wax
        for j in range(28):
            an = j / 28 * math.tau
            px, py = cx + math.cos(an) * R * .67, cy + math.sin(an) * R * .67
            d.ellipse((px - 3.2, py - 3.2, px + 3.2, py + 3.2), fill=BRN)
        for j in range(16):
            an = j / 16 * math.tau
            d.line((cx + math.cos(an) * R * .88, cy + math.sin(an) * R * .88, cx + math.cos(an) * R * .99, cy + math.sin(an) * R * .99), fill=BRN, width=3)
    wrap(x, y, f)


def leaf(x, y, s, rot, col):
    def f(cx, cy):
        pts = []
        for i in range(21):
            t_ = i / 20 * math.pi
            px, py = math.cos(t_) * s, math.sin(t_) * s * .38
            pts.append((px, py))
        pts += [(p[0], -p[1]) for p in reversed(pts)]
        c_, s_ = math.cos(rot), math.sin(rot)
        d.polygon([(cx + p[0] * c_ - p[1] * s_, cy + p[0] * s_ + p[1] * c_) for p in pts], fill=col)
        d.line((cx - s * c_, cy - s * s_, cx + s * c_, cy + s * s_), fill=BRN, width=2)
    wrap(x, y, f)


medallion(128, 128, 104)
medallion(384, 384, 104)
leaf(384, 120, 62, -.7, YEL); leaf(410, 160, 44, -.2, ORA)
leaf(120, 390, 62, 2.4, YEL); leaf(90, 350, 44, 2.9, ORA)
for i in range(70):  # petites hachures et points (le « craquelé » du tissu)
    rnd = (i * 7919) % 997 / 997
    x, y = (i * 173) % N, (i * 311 + 40) % N
    if min(math.dist((x, y), (128, 128)), math.dist((x, y), (384, 384))) < 118:
        continue
    if i % 2:
        wrap(x, y, lambda cx, cy: d.ellipse((cx - 2.5, cy - 2.5, cx + 2.5, cy + 2.5), fill=IVO))
    else:
        wrap(x, y, lambda cx, cy: d.line((cx, cy, cx + 9, cy - 5), fill=IVO, width=2))
# grain léger du coton
arr = np.array(im).astype(float)
rng = np.random.default_rng(3)
arr += rng.normal(0, 4, arr.shape[:2])[..., None]
webp(Image.fromarray(arr.clip(0, 255).astype(np.uint8)), "dot-pagne-demo.webp", 86)

# 6. Tresse verticale (chemin du programme)
v_ = Image.open(OUT + "dot-tresse.webp").convert("RGBA").rotate(90, expand=True)
webp(v_, "dot-tresse-v.webp", 82)

# 7. Fond de tout le modèle : lin ivoire à bandes de raphia tressé (photo de Glad, 12 nov. 2026)
webp(Image.open(SRC + "fond-lin-raphia.webp").convert("RGB"), "dot-fond.webp", 80)
