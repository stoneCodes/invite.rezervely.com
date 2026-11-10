"""Enveloppe 3D E-carte Studio pour l'accueil (section « Du papier à l'écran », components/HomeReveal.tsx).

Même dessin que l'aperçu des liens (lib/og/envelope.tsx, scripts/og-layers.py), mais en trois calques
transparents séparés pour l'animation : dos de l'enveloppe, carte (qui sort), poche avant + sceau.
Pas de table en lin : l'enveloppe est posée sur le satin de l'accueil.

Prérequis : `npm run dev` lancé (port 3020) et Pillow.
Usage : python scripts/accueil-enveloppe.py [http://localhost:3020]
Résultat : public/img/accueil-env-{back,card,front}.webp (même cadrage, à empiler) ; repères affichés à la fin.
"""
import io, sys, urllib.request
from PIL import Image, ImageChops, ImageFilter

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3020"
W, H = 1200, 630

def fetch(layer):
    with urllib.request.urlopen(f"{BASE}/api/dev/og?layer={layer}", timeout=120) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGBA")

def shadow(layer, dx, dy, blur, alpha, color=(58, 42, 22)):
    a = layer.getchannel("A").point(lambda v: int(v * alpha)).filter(ImageFilter.GaussianBlur(blur))
    moved = Image.new("L", (W, H), 0); moved.paste(a, (dx, dy))
    sh = Image.new("RGBA", (W, H), color + (0,)); sh.putalpha(moved)
    return sh

def grain(layer, strength, sigma=48):
    n = Image.effect_noise((W, H), sigma).point(lambda v: 128 + int((v - 128) * strength))
    rgb = layer.convert("RGB")
    out = Image.composite(ImageChops.overlay(rgb, Image.merge("RGB", (n, n, n))), rgb, layer.getchannel("A")).convert("RGBA")
    out.putalpha(layer.getchannel("A"))
    return out

def stack(*layers):
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for l in layers: out = Image.alpha_composite(out, l)
    return out

back, card, front, seal = (fetch(l) for l in ("back", "card", "front", "seal"))
envelope = Image.alpha_composite(back, front)

L_back = stack(shadow(envelope, 18, 30, 24, 0.34), shadow(envelope, 3, 6, 5, 0.28), grain(back, 0.14))
L_card = stack(shadow(card, 8, 16, 9, 0.3), grain(card, 0.08))
L_front = stack(shadow(front, 0, -6, 10, 0.22), grain(front, 0.13), shadow(seal, 6, 10, 6, 0.5, (40, 28, 10)), seal)

# Même cadrage pour les trois : boîte englobante commune + petite marge pour les ombres
box = None
for l in (L_back, L_card, L_front):
    b = l.getchannel("A").point(lambda v: 255 if v > 3 else 0).getbbox()
    box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
box = (max(0, box[0] - 4), max(0, box[1] - 4), min(W, box[2] + 4), min(H, box[3] + 4))
for name, l in (("back", L_back), ("card", L_card), ("front", L_front)):
    l.crop(box).save(f"public/img/accueil-env-{name}.webp", "WEBP", quality=88, method=6)
bw, bh = box[2] - box[0], box[3] - box[1]
print("cadre", box, "taille", bw, "x", bh)
print("carte (rect, avant inclinaison) en % :", round((318 - box[0]) / bw * 100, 2), round((46 - box[1]) / bh * 100, 2), round(564 / bw * 100, 2), round(420 / bh * 100, 2))
print("haut de l'enveloppe :", round((236 - box[1]) / bh * 100, 2), "% ; bas :", round((608 - box[1]) / bh * 100, 2), "%")
