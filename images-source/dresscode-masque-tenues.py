"""Masque du dress code « tenues » (costume + robe sans personne).
Usage : python dresscode-masque-tenues.py <source.webp> <sortie_dossier>
Rouge = costume, vert = robe, bleu = cravate et pochette (sauge dans la source)."""
import sys
from PIL import Image, ImageFilter
import numpy as np
src = Image.open(sys.argv[1]).convert('RGBA'); out = sys.argv[2]
a = np.asarray(src).astype(float) / 255
rgb = a[..., :3]; al = a[..., 3]
H, W = al.shape
mx = rgb.max(2); mn = rgb.min(2); sat = mx - mn; L = rgb @ [0.299, 0.587, 0.114]
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
op = al > 0.5
sage = ((np.minimum(r, g) - b) > 0.035) & (g > b) & op
grey = (sat < 0.09) & op & ~sage
# Frontière costume / robe (x selon y), passée dans les vides entre les deux.
pts = [(0,600),(400,605),(520,585),(580,577),(660,572),(700,520),(760,510),(880,490),(1000,476),(1120,465),(1240,450),(1300,439),(1360,418),(1454,418)]
bx = np.interp(np.arange(H), [p[0] for p in pts], [p[1] for p in pts])
X = np.arange(W)[None, :]
right = X > bx[:, None]
suit = grey & ~right & (L < 0.80) & (L > 0.18)   # sans la chemise blanche
dress = grey & right & (L > 0.18)
def clean(m):
    im = Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.ModeFilter(5)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    return np.asarray(im) > 127
suit = clean(suit) & op; dress = clean(dress) & op & ~suit
tie = clean(sage) & op
def soft(m): return np.asarray(Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.7))).astype(float) / 255
mask = np.stack([soft(suit), soft(dress), soft(tie)], -1) * al[..., None]
Image.fromarray((mask * 255).round().astype('uint8')).save(out + '/dresscode-tenues-mask.png', optimize=True)
src.save(out + '/dresscode-tenues.webp', quality=86, method=6)
vis = (rgb * 255).astype('uint8').copy()
vis[suit] = [200, 30, 30]; vis[dress] = [40, 40, 220]; vis[tie] = [0, 200, 0]
Image.fromarray(np.where(op[..., None], vis, 40).astype('uint8')).save(out + '/tenues-vis.png')
print(W, H, 'refs', [round(float(np.median(L[m])), 3) for m in (suit, dress, tie)])
