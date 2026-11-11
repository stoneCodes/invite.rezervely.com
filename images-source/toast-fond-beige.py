# Le toast : remplace le fond bleu nuit des photos de bouteille par le fond beige de la référence de Glad
# (images-source/anniversaire/toast-fond-reference.webp, 11 nov. 2026). Même cadrage : étiquette, bouchon et sabre restent calés.
# Lancer depuis la racine : py -3.12 images-source/toast-fond-beige.py
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
REF = "images-source/anniversaire/toast-fond-reference.webp"
W, H = 941, 1672
HORIZON = 1455          # ligne du sol derrière la bouteille (base de la bouteille vers 1555)

def backdrop():
    ref = np.asarray(Image.open(REF).convert("RGB")).astype(np.float32)
    h, w, _ = ref.shape
    # vide le centre (bouteille, ruban, « CHAMPAGNE BRUT », reflet) : interpolation ligne par ligne entre les bords
    x0, x1 = int(w * .27), int(w * .73)
    for y in range(h):
        a = ref[y, x0 - 12:x0].mean(0); b = ref[y, x1:x1 + 12].mean(0)
        t = np.linspace(0, 1, x1 - x0)[:, None]; ref[y, x0:x1] = a * (1 - t) + b * t
    # raccord sans couture : flou mélangé progressivement sur 90 px de part et d'autre du vide
    blur = cv2.GaussianBlur(ref, (0, 0), 22)
    xs = np.arange(w); wgt = np.clip(1 - np.maximum(x0 - xs, xs - x1) / 90, 0, 1)[None, :, None]
    ref = ref * (1 - wgt) + blur * wgt
    s = W / w; ref = cv2.resize(ref, (W, int(h * s)), interpolation=cv2.INTER_CUBIC)
    hz = int(1290 * s)                                       # horizon de la référence
    wall = cv2.resize(ref[:hz], (W, HORIZON), interpolation=cv2.INTER_CUBIC)
    floor = ref[hz:hz + (H - HORIZON)]
    if len(floor) < H - HORIZON: floor = cv2.resize(ref[hz:], (W, H - HORIZON))
    return np.concatenate([wall, floor], 0)

def bottle_mask(img):
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    m = np.maximum(r, g)
    blue = (b - m > 8) & (b > 1.5 * m + 2) & (b > 14)          # fond bleu nuit, même très sombre
    lab, _ = ndi.label(blue)
    border = set(np.unique(np.concatenate([lab[0], lab[:, 0], lab[:, -1], lab[-1]]))) - {0}
    bg = np.isin(lab, list(border))
    bg = ndi.binary_opening(bg, iterations=2)
    fg = ~bg
    fg = ndi.binary_closing(fg, structure=np.ones((1, 25), bool), iterations=1)  # referme la fente du reflet bleu sur le bord
    fg = ndi.binary_fill_holes(fg)
    fg = ndi.binary_opening(fg, iterations=3)
    lab, n = ndi.label(fg); sizes = ndi.sum(fg, lab, range(1, n + 1)); fg = lab == (np.argmax(sizes) + 1)
    fg[1556:] = False                                         # pas de reflet bleu d'origine sous la bouteille
    fg = ndi.binary_erosion(fg, iterations=1)                 # retire le liseré sombre du bord
    a = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 1.2)
    return a

def warm_rims(img, a):
    """Reflets bleus sur le verre → reflets chauds, comme dans une pièce beige."""
    out = img.copy(); r, g, b = img[..., 0], img[..., 1], img[..., 2]
    k = np.clip((b - np.maximum(r, g) - 4) / 40, 0, 1) * a
    lum = .3 * r + .59 * g + .11 * b
    warm = np.stack([lum * 1.35 + 18, lum * 1.1 + 10, lum * .7], -1)
    return out * (1 - k[..., None]) + warm * k[..., None]

def build(src, dst, bgimg):
    img = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    a = bottle_mask(img); img = warm_rims(img, a)
    out = bgimg.copy()
    # ombre de contact + reflet de la bouteille sur le sol brillant
    base = 1556; cols = np.where(a[base - 4] > .5)[0]
    if len(cols):
        cx, half = cols.mean(), (cols.max() - cols.min()) / 2
        yy, xx = np.mgrid[0:H, 0:W]
        sh = np.exp(-(((xx - cx) / (half * 1.25)) ** 2 + ((yy - base - 6) / 16) ** 2)) * .45
        out *= (1 - sh[..., None] * .55)
    n = H - base; refl = img[base - n:base][::-1]; ra = a[base - n:base][::-1]
    fade = np.linspace(.32, 0, n)[:, None] * ra
    out[base:] = out[base:] * (1 - fade[..., None]) + refl * fade[..., None]
    out = out * (1 - a[..., None]) + img * a[..., None]
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst, quality=90, method=6)

bg = backdrop()
for name in ("toast-bouteille", "toast-bouteille-ouverte"):
    src = f"images-source/anniversaire/{name}.webp" if name == "toast-bouteille" else f"images-source/anniversaire/{name}-bleu.webp"
    build(src, f"public/img/{name}.webp", bg)
print("ok")
