#!/usr/bin/env python3
"""One-time helper for the 5x3 headshot-grid photo: crops each headshot to
assets/players/<id>.jpg and writes the initial data/hotspots.json.
Edit GRID_ORDER / geometry if you use a different photo; afterwards tune
hotspots.json by hand or with the in-page editor (index.html?edit=1)."""
import json
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
GRID_ORDER = [  # row-major, as they appear in the photo
 "tyler-tanner","ace-glass","bangot-dak","chandler-bing","sebastian-williams-adams",
 "berke-buyuktuncel","t-o-barrett","jayden-leverett","ant-brown-jr","gabe-nesmith",
 "ethan-mgbako","jackson-sheffield","mavrick-hawkins","baylor-allen","chase-byington"]
XS, YS, CW, CH = [24,271,517,764,1010], [24,378,731], 240, 320   # cell geometry in px
im = Image.open(ROOT/"assets/roster.webp").convert("RGB"); W, H = im.size
spots = []
for i, pid in enumerate(GRID_ORDER):
    r, c = divmod(i, 5)
    im.crop((XS[c], YS[r], XS[c]+CW, YS[r]+CH)).save(ROOT/f"assets/players/{pid}.jpg", quality=90)
    cx, cy = XS[c]+CW/2, YS[r]+CH*0.47
    spots.append({"playerId": pid, "x": round(cx/W*100,2), "y": round(cy/H*100,2),
                  "w": 15.0, "h": 27.0, "shape": "ellipse", "tooltip": "auto"})
(ROOT/"data/hotspots.json").write_text(json.dumps({
  "_help": "x,y = hotspot CENTER as % of image width/height; w,h = size in the same units. tooltip: auto|left|right|top|bottom. playerId must match an id in players.json.",
  "image": {"src": "assets/roster.webp", "alt": "Vanderbilt men's basketball roster headshots", "aspect": round(W/H,4)},
  "hotspots": spots}, indent=2)+"\n")
print("ok", W, H)
