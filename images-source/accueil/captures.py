# Captures TEMPORAIRES de la section « Tableau de bord » de l'accueil : py -3.12 images-source/accueil/captures.py
# Rend tableau-maquette.html et pdf-maquette.html (échelle 2) → public/img/accueil-tableau.webp et accueil-pdf.webp.
# À remplacer par les vraies captures de Glad (même nom de fichier, même format paysage / A4).
import os, subprocess, tempfile
from PIL import Image

root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
for name, w, h, out in [("tableau-maquette", 760, 560, "accueil-tableau"), ("pdf-maquette", 500, 707, "accueil-pdf")]:
    html = os.path.join(root, "images-source", "accueil", name + ".html")
    shot = os.path.join(tempfile.mkdtemp(), "shot.png")
    subprocess.run([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=2",
                    "--virtual-time-budget=5000", f"--window-size={max(w, 500)},{h}", f"--screenshot={shot}",
                    "file:///" + html.replace("\\", "/")], check=True, capture_output=True)
    pw = w
    im = Image.open(shot).convert("RGB").crop((0, 0, pw * 2, h * 2))
    im.save(os.path.join(root, "public", "img", out + ".webp"), "WEBP", quality=84, method=6)
    print(out, im.size)
