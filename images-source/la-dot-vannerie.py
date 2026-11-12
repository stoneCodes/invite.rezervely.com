# Vannerie de « La dot » : py -3.12 images-source/la-dot-vannerie.py
#  - dot-plateau.png : plateau en raphia spiralé vu du dessus, fait en enroulant la vraie tresse (dot-tresse.webp) en anneaux.
import numpy as np, cv2
from PIL import Image, ImageFilter
from scipy import ndimage as nd

OUT = "public/img/"

# ---------- Plateau spiralé ----------
br = np.array(Image.open(OUT + "dot-tresse.webp").convert("RGBA")).astype(float)
bh, bw = br.shape[:2]
S = 640; c = S / 2
yy, xx = np.mgrid[0:S, 0:S].astype(float)
r = np.hypot(xx - c, yy - c); th = np.arctan2(yy - c, xx - c)
R = c - 6
ring = R / 5.6                       # épaisseur d'un tour de spirale
# anneaux concentriques (comme une vannerie cousue tour à tour) : un nombre entier de motifs par tour, donc aucun raccord
r0 = ring * 0.55
s = np.maximum(r - r0, 0)
k = np.floor(s / ring)
v = s / ring - k
rk = r0 + (k + 0.5) * ring
reps = np.maximum(1, np.round(2 * np.pi * rk / (bw * ring / bh * 0.95)))
tn = (th / (2 * np.pi)) % 1
u = (tn * reps) % 1
off = (k * 0.37) % 1                 # chaque tour décalé
px = (((u + off) % 1) * (bw - 1)).astype(int)
py = np.clip((0.12 + v * 0.76) * (bh - 1), 0, bh - 1).astype(int)
# cœur : petite rosace tressée (la tresse vue en travers)
core = r < r0
px = np.where(core, ((tn * 3 % 1) * (bw - 1)).astype(int), px)
py = np.where(core, np.clip((r / r0) * (bh - 1), 0, bh - 1).astype(int), py)
v = np.where(core, 0.5 + 0 * v, v)
img = br[py, px, :3]
# relief : chaque tour est bombé, sillon sombre entre deux tours
bump = np.sin(np.clip(v, 0, 1) * np.pi) ** 0.6
img *= (0.62 + 0.42 * bump)[..., None]
# lumière douce venant du haut à gauche, centre légèrement creusé
light = 1 + 0.10 * (-(xx - c) - (yy - c)) / S
img *= light[..., None]
img *= (0.86 + 0.14 * np.clip(r / (R * 0.35), 0, 1))[..., None]
alpha = np.clip((R - r) / 2.5, 0, 1) * 255
# bord : la dernière couronne est un peu plus foncée (lisière cousue)
edge = np.clip((r - (R - ring * 0.55)) / (ring * 0.55), 0, 1)
img *= (1 - 0.18 * edge)[..., None]
pl = Image.fromarray(np.dstack([img.clip(0, 255), alpha]).astype(np.uint8), "RGBA")
pl.convert("RGBA").save(OUT + "dot-plateau.webp", "WEBP", quality=84, method=6)
print("dot-plateau", pl.size)
