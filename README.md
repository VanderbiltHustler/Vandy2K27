# Vanderbilt 2K27

**If the ’Dores were in a video game?** An interactive preseason article that rates every player on the Vanderbilt men’s basketball roster the way a basketball video game would.

Hover a face in the roster for a quick ratings card, then flip through a full breakdown of each player: overall rating, 18 attributes in five categories, bio details and a written scouting report.

> The ratings are subjective and were fabricated for editorial purposes. This is an unofficial project, not affiliated with 2K Sports or Vanderbilt Athletics.

## Features

- **Clickable roster** with 2K-style hover cards (tap on touch screens)
- **Player carousel** with arrows, dots, keyboard arrows and swipe
- **Attribute charts** for all 18 ratings, color-coded by category
- **Fully static**: plain HTML, CSS and JavaScript, no build step and no backend
- **Content kept separate from data**, so the writing and the ratings can each be updated on their own

## How it works

| Path | What it holds |
|---|---|
| `data/ratings.xlsx` | Source for every rating |
| `data/players.json` | Generated from the workbook |
| `data/bios.json` | Jersey number, class, height, weight, hometown, high school |
| `data/hotspots.json` | Roster photo layout and the order players appear in |
| `content/article.json` | Title, byline, intro and conclusion text, banner image |
| `content/analysis.json` | The scouting-report text for each player |
| `content/tags.json` | Returner / Transfer / Freshman labels |
| `config/site.json` | Theme, tier cutoffs and short labels |
| `css/tokens.css` | Colors, fonts and spacing for the whole site |
| `js/` | Roster, hover card, carousel and chart code |

## Updating the content

- **Ratings:** edit `data/ratings.xlsx`, then run `python3 tools/build_data.py` (needs `pip install openpyxl`).
- **Writing:** edit `content/article.json` and `content/analysis.json`. Each paragraph is a string, and HTML such as links is allowed.
- **Colors and fonts:** change the values in `css/tokens.css`.

## Deploying

There is nothing to build. Publish the folder as-is on any static host, such as Netlify, GitHub Pages or Cloudflare Pages. A `netlify.toml` is included.

## Credits

Written and rated by Tristan Rutman. Project was created with the assistance of Alexander Cheng and the Vanderbilt Hustler Data section..
