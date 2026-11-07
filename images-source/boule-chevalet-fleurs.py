"""Couche « fleurs » du chevalet (monde miniature) : les fleurs qui débordent sur l'ouverture du cadre,
posées par-dessus la photo des mariés. Usage : python boule-chevalet-fleurs.py <chevalet.webp> <sortie.webp>"""
import sys
from PIL import Image, ImageFilter
import numpy as np
im = Image.open(sys.argv[1]).convert('RGB'); a = np.asarray(im).astype(float) / 255
H, W, _ = a.shape
L = a @ [0.299, 0.587, 0.114]; sat = a.max(2) - a.min(2)
# Fond crème de l'ouverture : clair et peu saturé.
# Papier crème, ombré ou non : rapports rouge/vert et bleu/vert du papier (les roses roses ont r/g plus fort,
# les feuilles sont vertes, les petites fleurs blanches ont b/g plus proche de 1).
r, g, b = a[..., 0], a[..., 1], a[..., 2]
rg = r / np.maximum(g, 1e-3); bg = b / np.maximum(g, 1e-3)
cream = (rg > 1.0) & (rg < 1.30) & (bg > 0.70) & (bg < 0.925) & (L > 0.68)
X = np.arange(W)[None, :]; Y = np.arange(H)[:, None]
# Grosses roses (blanches comprises, de la même teinte que le papier) : disques posés à la main.
ROSES = [(340, 360, 50), (268, 410, 50), (745, 920, 48), (682, 944, 30), (700, 960, 22)]
rose = np.zeros((H, W), bool)
for cx, cy, rr in ROSES: rose |= (X - cx) ** 2 + (Y - cy) ** 2 < rr ** 2
inside = (X >= 250) & (X <= 760) & (Y >= 330) & (Y <= 982)
keep = inside & (~cream | rose)
# Ne garder que les grandes taches (fleurs), pas le bruit du papier.
m = Image.fromarray((keep * 255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.ModeFilter(5))
m = np.asarray(m) > 127
# Fleurs uniquement dans les deux coins (haut-gauche, bas-droit) ; la moulure reste à part.
corner = ((X < 470) & (Y < 640)) | ((X > 560) & (Y > 820))
m = m & corner & inside
alpha = Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2))
out = im.copy(); out.putalpha(alpha)
out = out.crop((240, 320, 770, 990))   # zone utile, repositionnée en CSS
out.save(sys.argv[2], quality=88, method=6)
vis = Image.new('RGB', out.size, (40, 160, 40))
Image.open(sys.argv[1]).convert('RGB').crop((240, 320, 770, 990)).save(sys.argv[2] + '.orig.png'); vis.paste(out, (0, 0), out); vis.save(sys.argv[2] + '.vis.png')
print(out.size)
