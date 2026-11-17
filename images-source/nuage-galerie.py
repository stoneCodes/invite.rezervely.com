# Écran de galerie « Sur un petit nuage » : public/img/phone-nuage.webp (720 × 1560, sans texte).
# Ciel de l'aube, lueur chaude, montgolfière posée sur la mer de nuages, voile de brume, anneau doré « maintenez ».
# Prénoms (haut, 15,5 %) et consigne (88 %) sont posés en vrai texte par la galerie (lib/types.ts, phone).
# Lancer depuis la racine du projet après images-source/nuage.py : python images-source/nuage-galerie.py
from PIL import Image, ImageDraw, ImageFilter

W, H, S = 720, 1560, 2           # rendu en double taille puis réduit (bords nets)
w, h = W * S, H * S
img = lambda n: Image.open(f"public/img/nuage-{n}.webp").convert("RGBA")

sky = img("ciel-aube")
sc = max(w / sky.width, h * 1.08 / sky.height)
sky = sky.resize((round(sky.width * sc), round(sky.height * sc)), Image.LANCZOS)
x0 = (sky.width - w) // 2
base = sky.crop((x0, round(sky.height * 0.04), x0 + w, round(sky.height * 0.04) + h))

def place(im, width, cx, bottom, alpha=1.0):
    im = im.resize((round(width), round(im.height * width / im.width)), Image.LANCZOS)
    if alpha < 1:
        a = im.getchannel("A").point(lambda v: round(v * alpha)); im.putalpha(a)
    base.alpha_composite(im, (round(cx - im.width / 2), round(bottom - im.height)))

# voile clair en haut (lisibilité des prénoms) et lueur derrière la montgolfière
veil = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(veil)
d.ellipse((-w * 0.2, -h * 0.12, w * 1.2, h * 0.34), fill=(255, 250, 244, 120))
d.ellipse((w * 0.05, h * 0.3, w * 0.95, h * 0.78), fill=(255, 232, 196, 70))
base.alpha_composite(veil.filter(ImageFilter.GaussianBlur(70 * S)))

place(img("nappe-2"), w * 1.6, w * 0.56, h * 0.80, 0.75)
place(img("montgolfiere"), w * 0.56, w * 0.5, h * 0.775)
place(img("nappe-1"), w * 1.9, w * 0.45, h * 1.05)
place(img("nappe-3"), w * 1.5, w * 0.5, h * 0.5, 0.32)

# anneau doré à maintenir (88 % = consigne au-dessus)
r = 40 * S; cx, cy = w // 2, round(h * 0.935)
ring = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(ring)
d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 253, 248, 150))
d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(168, 136, 79, 230), width=2 * S)
glow = Image.new("RGBA", (w, h), (0, 0, 0, 0)); ImageDraw.Draw(glow).ellipse((cx - 16 * S, cy - 16 * S, cx + 16 * S, cy + 16 * S), fill=(240, 210, 150, 200))
base.alpha_composite(ring.filter(ImageFilter.GaussianBlur(0.6)))
base.alpha_composite(glow.filter(ImageFilter.GaussianBlur(10 * S)))
ImageDraw.Draw(base).ellipse((cx - 7 * S, cy - 7 * S, cx + 7 * S, cy + 7 * S), fill=(201, 168, 101, 255))

out = base.resize((W, H), Image.LANCZOS).convert("RGB")
out.save("public/img/phone-nuage.webp", "WEBP", quality=84, method=6)
print("phone-nuage.webp", out.size)
