# Rend l'écran de galerie de « La dot » : py -3.12 images-source/la-dot-galerie.py
# Chrome sans fenêtre, 360 × 780 à l'échelle 2 → public/img/phone-dot.webp (720 × 1560).
import os, subprocess, tempfile
from PIL import Image

root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
html = os.path.join(root, "images-source", "la-dot-galerie.html")
chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
out = os.path.join(tempfile.mkdtemp(), "shot.png")
subprocess.run([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                "--force-device-scale-factor=2", "--virtual-time-budget=4000", "--window-size=500,780",
                f"--screenshot={out}", "file:///" + html.replace("\\", "/")], check=True, capture_output=True)
im = Image.open(out).convert("RGB").crop((0, 0, 720, 1560))  # Chrome sans fenêtre impose 500 px de large : on garde les 360 premiers
im.save(os.path.join(root, "public", "img", "phone-dot.webp"), "WEBP", quality=82, method=6)
print("phone-dot.webp", im.size)
