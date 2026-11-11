# Écran de galerie du toast (phone-toast.webp) refait sur fond beige : même position de bouteille que l'ancien écran
# (calée par corrélation sur l'ancienne image bleue), sabre repris de l'ancien écran.
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
old = np.asarray(Image.open("images-source/galerie/phone-toast-bleu.webp").convert("RGB")).astype(np.float32)
blue_src = np.asarray(Image.open("images-source/anniversaire/toast-bouteille.webp").convert("RGB")).astype(np.float32)
beige = np.asarray(Image.open("public/img/toast-bouteille.webp").convert("RGB")).astype(np.float32)
OH, OW, _ = old.shape
# 1. échelle et position de la bouteille dans l'ancien écran (corrélation sur l'étiquette + col)
best = None
for s in np.arange(.74, .80, .002):
    t = cv2.resize(blue_src, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    patch = t[int(300 * s):int(1450 * s), int(280 * s):int(660 * s)]
    r = cv2.matchTemplate(old, patch, cv2.TM_CCOEFF_NORMED); _, v, _, loc = cv2.minMaxLoc(r)
    if best is None or v > best[0]: best = (v, s, loc[0] - int(280 * s), loc[1] - int(300 * s))
v, s, ox, oy = best; print(f"corrélation {v:.3f}, échelle {s:.3f}, décalage {ox},{oy}")
# 2. scène beige à la même échelle et position ; bords prolongés au-delà de la photo
sc = cv2.resize(beige, None, fx=s, fy=s, interpolation=cv2.INTER_AREA); sh, sw, _ = sc.shape
canvas = np.zeros_like(old)
ys = np.clip(np.arange(OH) - oy, 0, sh - 1); xs = np.clip(np.arange(OW) - ox, 0, sw - 1)
canvas = sc[ys][:, xs]
top = oy; bot = oy + sh
if top > 0: canvas[:top] = cv2.GaussianBlur(canvas[:top + 30], (0, 0), 12)[:top]
if bot < OH: canvas[bot:] = cv2.GaussianBlur(canvas[bot - 30:], (0, 0), 12)[30:]
# 3. sabre : pixels non bleus de l'ancien écran dans sa zone
r_, g_, b_ = old[..., 0], old[..., 1], old[..., 2]; m = np.maximum(r_, g_)
notblue = ~((b_ - m > 8) & (b_ > 1.5 * m + 2) & (b_ > 14))
zone = np.zeros(old.shape[:2], bool); zone[440:900, 425:560] = True
# on ne garde que ce qui n'est pas la bouteille beige (sabre) : écart de couleur avec la nouvelle scène
diff = np.abs(old - canvas).sum(-1) > 60
sab = ndi.binary_opening(zone & notblue & diff, iterations=1)
sab = ndi.binary_closing(sab, iterations=2)
a = cv2.GaussianBlur(sab.astype(np.float32), (0, 0), .8)[..., None]
# ombre portée légère du sabre
shadow = cv2.GaussianBlur(np.roll(np.roll(sab.astype(np.float32), 8, 0), -5, 1), (0, 0), 6)[..., None] * .35
canvas = canvas * (1 - shadow)
out = canvas * (1 - a) + old * a
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save("public/img/phone-toast.webp", quality=88, method=6)
print("ok")
