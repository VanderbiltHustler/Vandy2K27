# Vandy MBB — Interactive Roster Ratings

A static, no-backend article template: a clickable roster photo with 2K-style hover cards, plus a profile for every
player with a full attribute chart (iframe-ready). Vanilla HTML/CSS/JS (ES modules) — no build step, no dependencies
at runtime.

## Run locally
Browsers block `fetch`/modules on `file://`, so serve the folder:
```bash
cd Vandy2K && python3 -m http.server 8123   # then open http://localhost:8123
```

## Folder map
| Path | Purpose |
|---|---|
| `index.html` | Article page shell |
| `charts/player.html` | Standalone chart page, e.g. `charts/player.html?p=tyler-tanner` |
| `data/ratings.xlsx` → `data/players.json` | Source workbook → generated data (never hand-edit the JSON) |
| `data/hotspots.json` | Roster-photo hotspot coordinates + hotspot→player mapping |
| `content/article.json` | Title, dek, author, date, logo, intro paragraphs |
| `content/analysis.json` | Your per-player writing (blank = placeholder) |
| `config/site.json` | Theme choice, profile order, chart mode, tiers, short labels |
| `css/tokens.css` | **All design tokens** + the 3 themes |
| `css/site.css`, `css/chart.css` | Layout/components (use tokens only) |
| `js/chart.js` | The one reusable chart component |
| `js/roster.js`, `js/tooltip.js`, `js/hotspot-editor.js` | Roster, hover card, hotspot editor |
| `js/profiles.js`, `js/main.js`, `js/core.js` | Profiles, page assembly, helpers |
| `tools/build_data.py` | Excel → JSON converter (needs `pip install openpyxl`) |
| `tools/init_roster.py` | One-time: crop headshots + seed hotspots for a 5×3 grid photo (needs Pillow) |

## Data import notes (how the workbook is read)
* Sheet `Ratings`; names in col A; **Overall = bold col B** (formula `ROUND(SUM(C:T)/16,0)` — imported as-is, per your decision; it sums 18 attributes and divides by 16).
* Row 1 merged headers define the 5 categories; row 2 names the 18 attributes (C–T); cols U–Y hold the 5 category ratings (used verbatim, not recomputed).
* The converter re-evaluates the formulas (Excel half-up rounding) and prints a warning if a stored value disagrees. Currently: all match.
* Blank cells become `null` and display as **N/A** (never 0). No position/height/number columns exist, so none are shown; add values under a player's `metadata` (or new columns + a small tweak to the script) if you want them.
* The workbook spells "Buyuktuncel"; the site uses the workbook's spelling. Fix it in Excel and re-run.

## Common tasks
* **Update ratings / add or remove players:** edit `data/ratings.xlsx`, run `python3 tools/build_data.py`. For a new player also add a hotspot (below) and a headshot at `assets/players/<id>.jpg` (id = lowercase hyphenated name, see `players.json`). Players without a hotspot still get a profile and appear in the roster list.
* **Replace the roster photo:** overwrite `assets/roster.webp` (or change `image.src`/`aspect` in `data/hotspots.json`). If the file is missing the site shows a labeled placeholder.
* **Adjust hotspots:** open `http://localhost:8123/index.html?edit=1`. Drag a hotspot to move it; arrow keys nudge (Shift = 1%); `+`/`-` resize; the panel remaps player, tooltip side (`auto/left/right/top/bottom`) and shape. Click **Copy hotspots.json** and paste over `data/hotspots.json`. Coordinates are % of the image (x,y = center), so they scale with the photo.
* **Write the article:** fill in `content/article.json` (leave `""` to keep the bracketed placeholder). Add player copy in `content/analysis.json`: `"tyler-tanner": ["Paragraph one…", "Paragraph two…"]` (HTML allowed).
* **Change theme:** set `"theme"` in `config/site.json` to `vandy`, `dark` or `editorial` (or try `?theme=editorial`). Add a theme by copying a block in `css/tokens.css`; override single tokens without editing CSS via `"tokenOverrides": {"--c-primary": "#cfae70"}`.
* **Chart style/scale:** colors/fonts in `css/tokens.css`, tier cutoffs in `config/site.json`, scale (0–99) in `data/players.json › meta.scale`.
* **Inline vs iframe charts:** `"chartMode": "iframe"` (default) or `"inline"` in `config/site.json`; same component either way.

## Embedding a chart elsewhere
```html
<iframe src="https://YOUR-SITE/charts/player.html?p=tyler-tanner&header=1&theme=vandy"
        title="Player attribute ratings" style="width:100%;border:0;height:700px" scrolling="no"></iframe>
```
The chart posts `{type:"player-chart:resize", id, height}` to its parent on every size change; `js/profiles.js` shows a listener you can copy to auto-fit height. It adapts to any iframe width.

## Deploy (any static host)
No build step; publish the folder root.
* **Netlify:** drag the folder into app.netlify.com/drop (or connect the repo; `netlify.toml` is included).
* **GitHub Pages:** push to a repo → Settings → Pages → deploy from branch `/ (root)` (`.nojekyll` included).
* **Vercel / Cloudflare Pages:** framework "Other", no build command, output directory `.`.
Use relative URLs only (already the case), so subfolder hosting works.

## Validation status
Verified in a browser (served over HTTP): 15 players ↔ 15 hotspots ↔ 15 profiles; card values match the data; click and
deep links land under the sticky bar; touch behaviour (first tap = card, second = navigate) and the roster list; 18 attributes
× 15 players render in iframes that auto-resize; all three themes switch without changing data; the hotspot editor loads.
Not covered: real-device touch testing, screen-reader pass, other browsers, and the missing-photo placeholder with your final photo.
