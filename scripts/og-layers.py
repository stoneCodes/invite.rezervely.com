"""Fabrique les calques fixes de l'enveloppe de marque E-carte Studio (lib/og/layers.ts).

Les formes nettes viennent du site (/api/dev/og?layer=back|card|front|seal, dessinées par lib/og/envelope.tsx) ;
ce script ajoute ce que Satori ne sait pas faire : table en lin, ombres floues, grain du papier.

Prérequis : `npm run dev` lancé (port 3020) et Pillow (pip install pillow).
Usage : python scripts/og-layers.py [http://localhost:3020]
Résultat : calque arrière en JPEG (table + enveloppe + carte vierge), calque avant en PNG transparent (poche + sceau).
"""
import base64, io, sys, urllib.request
from PIL import Image, ImageChops, ImageFilter

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3020"
W, H = 1200, 630

def fetch(layer):
    with urllib.request.urlopen(f"{BASE}/api/dev/og?layer={layer}", timeout=120) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGBA")

def shadow(layer, dx, dy, blur, alpha, color=(58, 42, 22)):
    """Ombre floue de la forme d'un calque (d'après sa transparence)."""
    a = layer.getchannel("A").point(lambda v: int(v * alpha))
    a = a.filter(ImageFilter.GaussianBlur(blur))
    sh = Image.new("RGBA", (W, H), color + (0,))
    moved = Image.new("L", (W, H), 0)
    moved.paste(a, (dx, dy))  # décalage sans retour de l'autre côté (ImageChops.offset boucle)
    sh.putalpha(moved)
    return sh

def grain(layer, strength, sigma=48, scale=1):
    """Grain du papier, seulement là où la forme existe (multiplication douce)."""
    n = Image.effect_noise((W // scale, H // scale), sigma).resize((W, H), Image.BICUBIC)
    n = n.point(lambda v: 128 + int((v - 128) * strength))
    rgb = layer.convert("RGB")
    mixed = ImageChops.overlay(rgb, Image.merge("RGB", (n, n, n)))
    out = Image.composite(mixed, rgb, layer.getchannel("A"))
    out = out.convert("RGBA"); out.putalpha(layer.getchannel("A"))
    return out

def table():
    """Table en lin clair : dégradé éclairé en haut à gauche, fibres horizontales et verticales, vignettage."""
    bg = Image.new("RGB", (W, H))
    px = bg.load()
    for y in range(H):
        for x in range(W):
            d = ((x - W * 0.38) / W) ** 2 + ((y - H * 0.25) / H) ** 2
            k = min(1.0, d * 1.9)
            px[x, y] = (int(247 - 40 * k), int(240 - 46 * k), int(228 - 58 * k))
    fib_h = Image.effect_noise((W // 6, H), 70).resize((W, H), Image.BICUBIC)
    fib_v = Image.effect_noise((W, H // 6), 70).resize((W, H), Image.BICUBIC)
    fib = ImageChops.add(fib_h, fib_v, scale=2.0).point(lambda v: 128 + int((v - 128) * 0.11))
    bg = ImageChops.overlay(bg, Image.merge("RGB", (fib, fib, fib)))
    return bg.convert("RGBA")

back, card, front, seal = (fetch(l) for l in ("back", "card", "front", "seal"))
envelope = Image.alpha_composite(back, front)

scene = table()
scene = Image.alpha_composite(scene, shadow(envelope, 22, 36, 26, 0.42))   # grande ombre douce
scene = Image.alpha_composite(scene, shadow(envelope, 4, 7, 5, 0.32))     # ombre de contact
scene = Image.alpha_composite(scene, grain(back, 0.14))
scene = Image.alpha_composite(scene, shadow(card, 9, 18, 9, 0.34))        # la carte sur le fond de l'enveloppe
scene = Image.alpha_composite(scene, grain(card, 0.08))

over = Image.new("RGBA", (W, H), (0, 0, 0, 0))
over = Image.alpha_composite(over, shadow(front, 0, -6, 10, 0.22))        # bord de la poche sur la carte
over = Image.alpha_composite(over, grain(front, 0.13))
over = Image.alpha_composite(over, shadow(seal, 6, 10, 6, 0.5, (40, 28, 10)))
over = Image.alpha_composite(over, seal)

# Calque arrière : tout ce qui est sous les textes (opaque, JPEG)
buf = io.BytesIO(); scene.convert("RGB").save(buf, "JPEG", quality=86, optimize=True, progressive=True)
# Calque avant : poche, rabats, sceau (transparent, PNG 256 couleurs)
q = over.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
buf2 = io.BytesIO(); q.save(buf2, "PNG", optimize=True)

with open("lib/og/layers.ts", "w", encoding="utf-8", newline="\n") as f:
    f.write("// Calques de l'enveloppe de marque (généré par scripts/og-layers.py, ne pas modifier à la main).\n")
    f.write(f'export const OG_BACK = "data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}";\n')
    f.write(f'export const OG_FRONT = "data:image/png;base64,{base64.b64encode(buf2.getvalue()).decode()}";\n')
print(f"arrière {len(buf.getvalue()) // 1024} Ko, avant {len(buf2.getvalue()) // 1024} Ko")
