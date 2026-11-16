# Rend les écrans de galerie des save the date : py -3.12 images-source/save-the-date-galerie.py
# Même dessin que l'ouverture (components/invitation/std/std.css), sans aucun texte : initiales, prénoms et consigne
# sont posés en vrai texte par la galerie (phone.seal / names / hint dans lib/types.ts).
# Chrome sans fenêtre, 360 × 780 à l'échelle 2 → public/img/phone-std-<variante>.webp (720 × 1560).
import os, subprocess, tempfile
from PIL import Image

root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
img = lambda n: "file:///" + os.path.join(root, "public", "img", n).replace("\\", "/")
chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

BASE = """<!doctype html><meta charset=utf-8><style>
html,body{margin:0;width:360px;height:780px;overflow:hidden;background:#000}
.bg{position:absolute;left:0;top:0;width:360px;height:780px;background-position:center;background-size:cover}
</style>"""

NUIT = BASE + f"""<style>
.bg{{background-image:url({img('std-nuit-table.webp')});filter:blur(1.5px) brightness(.62) saturate(1.05);transform:scale(1.04)}}
.glow{{position:absolute;left:0;top:0;width:360px;height:780px;background:radial-gradient(ellipse 58% 46% at 50% 42%,rgba(255,196,110,.12),transparent 70%),linear-gradient(rgba(10,6,3,.2),rgba(10,6,3,.5))}}
.card{{position:absolute;left:50px;top:150px;width:260px;height:348px;border-radius:4px;background:url({img('std-nuit-carte-dos.webp')}) center/100% 100%;box-shadow:0 34px 60px -20px rgba(0,0,0,.9)}}
</style><div class=bg></div><div class=glow></div><div class=card></div>"""

# Mur au clou en « cover » sur 360 × 780 : échelle 0,4665, clou en (180, 70), tête en (180, 63)
DOMAINE = BASE + f"""<style>
.bg{{background-image:url({img('std-domaine-mur.webp')})}}
.tag{{position:absolute;left:39.5px;top:70px;width:281px;height:500px;background:url({img('std-domaine-etiquette-dos.webp')}) center/100% 100%;filter:drop-shadow(0 18px 16px rgba(80,60,30,.22))}}
.head{{position:absolute;left:162.3px;top:45.3px;width:35.4px;height:35.4px;background:url({img('std-domaine-clou.png')}) center/100% 100%}}
.line{{position:absolute;left:157px;top:418px;width:46px;border-top:1px solid #A8884F}}
</style><div class=bg></div><div class=tag></div><div class=head></div><div class=line></div>"""

for name, html in [("nuit-doree", NUIT), ("domaine", DOMAINE)]:
    d = tempfile.mkdtemp()
    src, out = os.path.join(d, "p.html"), os.path.join(d, "shot.png")
    open(src, "w", encoding="utf-8").write(html)
    subprocess.run([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                    "--force-device-scale-factor=2", "--virtual-time-budget=4000", "--window-size=500,780",
                    f"--screenshot={out}", "file:///" + src.replace("\\", "/")], check=True, capture_output=True)
    im = Image.open(out).convert("RGB").crop((0, 0, 720, 1560))
    dst = os.path.join(root, "public", "img", f"phone-std-{name}.webp")
    im.save(dst, "WEBP", quality=82, method=6)
    print(os.path.basename(dst), im.size)
