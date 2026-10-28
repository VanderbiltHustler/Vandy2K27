#!/usr/bin/env python3
"""Convert data/ratings.xlsx -> data/players.json.

Reads the workbook structure (merged category headers in row 1, attribute names
in row 2, bold 'Overall' column) instead of hard-coding it, and verifies that
the cached formula results match a re-evaluation of the formulas (Excel-style
half-up rounding). Run:  python3 tools/build_data.py [workbook.xlsx]
"""
import json, re, sys, datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import openpyxl
from openpyxl.utils import range_boundaries, get_column_letter

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "ratings.xlsx"
OUT = ROOT / "data" / "players.json"
SHEET = "Ratings"
HEADER_CAT_ROW, HEADER_ATTR_ROW, FIRST_PLAYER_ROW = 1, 2, 3

def slug(s):
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s

def half_up(x):
    return int(Decimal(str(x)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

wb_f = openpyxl.load_workbook(SRC)                  # formulas + formatting
wb_v = openpyxl.load_workbook(SRC, data_only=True)  # cached values
ws, wv = wb_f[SHEET], wb_v[SHEET]

# --- structure ---------------------------------------------------------------
groups, abbrev = [], None
for mr in ws.merged_cells.ranges:
    c1, r1, c2, _ = range_boundaries(str(mr))
    if r1 != HEADER_CAT_ROW:
        continue
    label = str(ws.cell(1, c1).value)
    if label.startswith("("):
        abbrev = (c1, c2)
    else:
        groups.append((c1, c2, label))
groups.sort()
overall_col = next(c for c in range(1, ws.max_column + 1)
                   if ws.cell(HEADER_ATTR_ROW, c).value == "Overall")
assert ws.cell(HEADER_ATTR_ROW, overall_col).font.b, "Overall column is not bold"

categories = []
for c1, c2, label in groups:
    categories.append({
        "key": slug(label), "label": label,
        "attributes": [{"key": slug(ws.cell(2, c).value), "label": ws.cell(2, c).value,
                        "_col": c} for c in range(c1, c2 + 1)]})
cat_rating_col = {}
for c in range(abbrev[0], abbrev[1] + 1):
    label = ws.cell(2, c).value
    cat_rating_col[slug(label)] = c
assert set(cat_rating_col) == {c["key"] for c in categories}, "category rating columns don't match groups"

# --- formula check -------------------------------------------------------------
def eval_formula(f, row):
    m = re.fullmatch(r"=ROUND\(\(?(SUM|AVERAGE)\(([A-Z]+)\d+:([A-Z]+)\d+\)(?:/(\d+))?\)?,0\)", f)
    if not m:
        return None
    fn, a, b, div = m.groups()
    cols = range(openpyxl.utils.column_index_from_string(a), openpyxl.utils.column_index_from_string(b) + 1)
    vals = [ws.cell(row, c).value for c in cols]
    if any(not isinstance(v, (int, float)) for v in vals):
        return None
    tot = sum(vals)
    return half_up(Decimal(tot) / Decimal(div or 1)) if fn == "SUM" else half_up(Decimal(tot) / Decimal(len(vals)))

warnings, players = [], []
def cell(row, col, what):
    cached = wv.cell(row, col).value
    f = ws.cell(row, col).value
    if isinstance(f, str) and f.startswith("="):
        calc = eval_formula(f, row)
        if calc is not None and cached is not None and calc != cached:
            warnings.append(f"row {row} {what}: cached {cached} != recomputed {calc}")
        return cached if cached is not None else calc
    return f if isinstance(f, (int, float)) else None

for r in range(FIRST_PLAYER_ROW, ws.max_row + 1):
    name = ws.cell(r, 1).value
    if not name:
        continue
    name = str(name).strip()
    p = {"id": slug(name), "name": name,
         "overall": cell(r, overall_col, "Overall"),
         "categoryRatings": {k: cell(r, c, k) for k, c in cat_rating_col.items()},
         "attributes": {}, "metadata": {}, "image": f"assets/players/{slug(name)}.jpg",
         "_row": r}
    for cat in categories:
        for a in cat["attributes"]:
            p["attributes"][a["key"]] = cell(r, a["_col"], a["label"])
    players.append(p)

for cat in categories:
    for a in cat["attributes"]:
        a.pop("_col")
for p in players:
    p.pop("_row")
    for k, v in list(p["attributes"].items()) + list(p["categoryRatings"].items()) + [("overall", p["overall"])]:
        if v is None:
            warnings.append(f"{p['name']}: {k} is missing (kept as null)")

data = {
    "meta": {
        "source": SRC.name, "sheet": SHEET,
        "generatedAt": datetime.date.today().isoformat(),
        "scale": {"min": 0, "max": 99},
        "overallField": {"column": get_column_letter(overall_col), "bold": True,
                         "formula": str(ws.cell(FIRST_PLAYER_ROW, overall_col).value)},
        "categoryRatingFormula": "ROUND(AVERAGE(<category attribute columns>),0), read from workbook columns U-Y",
        "note": "Values imported as stored in the workbook; nothing recalculated or altered."},
    "categories": categories,
    "players": players}
OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
print(f"{len(players)} players, {sum(len(c['attributes']) for c in categories)} attributes, {len(categories)} categories -> {OUT}")
for w in warnings:
    print("WARNING:", w)
if not warnings:
    print("Formula check: all cached values match re-evaluated formulas.")
