# Écran de galerie phone-livre.webp (720 × 1560) : la couverture du livre, centrée, sans texte
# (prénoms et consigne posés en vrai texte par PhoneTemplate). Les bords sont prolongés par la même photo floutée.
from PIL import Image, ImageFilter
W, H = 720, 1560
src = Image.open("images-source/livre/couverture.webp").convert("RGB")
bg = src.resize((round(H * src.width / src.height), H), Image.LANCZOS)
bg = bg.crop(((bg.width - W) // 2, 0, (bg.width - W) // 2 + W, H)).filter(ImageFilter.GaussianBlur(22))
s = 620 / 746                      # le livre (746 px de large dans l'original) occupe 620 px
im = src.resize((round(src.width * s), round(src.height * s)), Image.LANCZOS)
ox = round(W / 2 - (124 + 746 / 2) * s)
oy = round(0.43 * H - 712 * s)     # centre de l'ovale à 43 % de la hauteur (names.top)
mask = Image.new("L", im.size, 255)
fade = 40                          # fondu sur les bords haut et bas de la photo nette
for y in range(fade):
    a = round(255 * y / fade)
    mask.paste(a, (0, y, im.width, y + 1)); mask.paste(a, (0, im.height - 1 - y, im.width, im.height - y))
bg.paste(im, (ox, oy), mask)
bg.save("public/img/phone-livre.webp", "WEBP", quality=82, method=6)
print("phone-livre.webp", bg.size)
