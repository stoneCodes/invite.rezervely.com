import sys; sys.path.insert(0, sys.argv[1])
from PIL import Image, ImageFilter; import numpy as np
S = sys.argv[1].rsplit('/pylib', 1)[0]
src = Image.open(S + '/afro.webp').convert('RGBA'); a = np.asarray(src).astype(float) / 255
rgb = a[..., :3]; al = a[..., 3]
mx = rgb.max(2); mn = rgb.min(2); sat = mx - mn; L = rgb @ [0.299, 0.587, 0.114]
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
sage = ((np.minimum(r, g) - b) > 0.04) & (sat < 0.2) & (L > 0.45) & (al > 0.5)
grey = (sat < 0.085) & (L > 0.22) & (L < 0.90) & (al > 0.5) & ~sage
vis = (rgb * 255).astype('uint8').copy()
vis[grey] = [255, 0, 0]; vis[sage] = [0, 200, 0]
out = np.where(al[..., None] > 0.5, vis, 40).astype('uint8')
Image.fromarray(out).save(S + '/maskvis.png')
print(grey.mean(), sage.sum())
ys = np.arange(H if 'H' in dir() else a.shape[0])
H, W = L.shape
pts = [(0,548),(300,548),(440,545),(500,548),(570,554),(630,554),(700,545),(760,538),(790,525),(820,515),(880,505),(950,470),(1050,455),(1200,440),(1400,425),(1536,420)]
bx = np.interp(np.arange(H), [p[0] for p in pts], [p[1] for p in pts])
X = np.arange(W)[None, :]; Y = np.arange(H)[:, None]
side_w = X > bx[:, None]
band = (np.abs(X - bx[:, None]) < 0)
# dans la bande : la robe est plus claire que le costume
side_w = np.where(band, L > 0.6, side_w)
head = ((Y < 200)) | ((X > 540) & (Y < 300))
clutch = (X > 752) & (X < 892) & (Y > 742) & (Y < 862) & (L > 0.74)
feet_m = (Y > 1410) & (X < 470)
suit = grey & ~side_w & ~head & ~feet_m
dress = grey & side_w & ~head & ~clutch & (Y < 1530)
def clean(m):
    im = Image.fromarray((m*255).astype('uint8')).filter(ImageFilter.ModeFilter(5)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    return np.asarray(im) > 127
suit = clean(suit) & (al > 0.5); dress = clean(dress) & (al > 0.5) & ~suit
tie = sage & (X > 320) & (X < 500) & (Y > 230) & (Y < 400)
vis = (rgb * 255).astype('uint8').copy()
vis[suit] = [200, 30, 30]; vis[dress] = [40, 40, 220]; vis[tie] = [0, 200, 0]
Image.fromarray(np.where(al[..., None] > 0.5, vis, 40).astype('uint8')).save(S + '/maskvis2.png')

def soft(m): return np.asarray(Image.fromarray((m*255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.7))).astype(float)/255
ms, md, mt = soft(suit), soft(dress), soft(tie)
mask = np.stack([ms, md, mt], -1) * al[..., None]
Image.fromarray((mask*255).round().astype('uint8')).save(S + '/mask_out.png', optimize=True)
src.save(S + '/base_out.webp', quality=84, method=6)
np.save(S+'/maskarr.npy', mask)
print('refs', [float(np.median(L[m])) for m in (suit, dress, tie)])
