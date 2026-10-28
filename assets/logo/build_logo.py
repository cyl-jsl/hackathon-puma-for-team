# /// script
# dependencies = ["fonttools"]
# ///
"""產生 assets/logo/ 的 7 個 SVG。

用法：uv run assets/logo/build_logo.py <Huninn-Regular.ttf> assets/logo
字型從 https://github.com/google/fonts/raw/main/ofl/huninn/Huninn-Regular.ttf 下載（OFL）。
brand-showcase.html 是手寫的，不由本檔產生。
"""
import sys, pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FONT, OUT = sys.argv[1], pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
INK, YELLOW, WHITE, BLACK = "#1D2226", "#FFD21F", "#FFFFFF", "#1A1A1A"

# Canonical mark (64x64), one colour: a solid magnifier with the bin knocked out of the lens.
# Every variant reuses these strings verbatim.
LENS   = ("M26 4a22 22 0 1 1 0 44a22 22 0 1 1 0-44Z"
          "M18 15a2 2 0 0 0 0 4H34a2 2 0 0 0 0-4Z"
          "M18 21L19.7 35.2Q20 37 21.8 37H30.2Q32 37 32.3 35.2L34 21Z")
HANDLE = "M43.83 38.17L57.83 52.17A4 4 0 0 1 52.17 57.83L38.17 43.83A4 4 0 0 1 43.83 38.17Z"

def mark(fill):
    return (f'    <path d="{LENS}" fill="{fill}" fill-rule="evenodd"/>\n'
            f'    <path d="{HANDLE}" fill="{fill}"/>')

def wordmark(size, track):
    f = TTFont(FONT); gs = f.getGlyphSet(); cmap = f.getBestCmap(); s = size / f['head'].unitsPerEm
    x, ds, bb = 0, [], [1e9, 1e9, -1e9, -1e9]
    for ch in "桶緝犯":
        g = cmap[ord(ch)]; t = (s, 0, 0, -s, x, 0)
        pen = SVGPathPen(gs, ntos=lambda v: f"{round(v, 2):g}"); gs[g].draw(TransformPen(pen, t))
        bp = BoundsPen(gs); gs[g].draw(TransformPen(bp, t)); b = bp.bounds
        bb = [min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3])]
        ds.append(pen.getCommands()); x += f['hmtx'][g][0] * s + track
    return " ".join(ds), bb

def svg(vb, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="桶緝犯">\n  <title>桶緝犯</title>\n{body}\n</svg>\n'

# logo-full: mark at translate(4,4); wordmark starts at x=84, vertically centred; whole group centred horizontally
W_FULL, bb_full = wordmark(58, 6)
tx, ty = 84 - bb_full[0], 36 - (bb_full[1] + bb_full[3]) / 2
DX = round((320 - (tx + bb_full[2]) - 8) / 2, 2)
def full(fill):
    return (f'  <g transform="translate({4 + DX:.2f},4)">\n{mark(fill)}\n  </g>\n'
            f'  <!-- wordmark: 桶緝犯 (jf open 粉圓 Huninn, outlined) -->\n'
            f'  <path transform="translate({tx + DX:.2f},{ty:.2f})" d="{W_FULL}" fill="{fill}"/>')

W_WM, bb_wm = wordmark(40, 4)
wx, wy = (180 - (bb_wm[2] - bb_wm[0])) / 2 - bb_wm[0], 20 - (bb_wm[1] + bb_wm[3]) / 2

# favicon: redrawn on the 16px pixel grid with the mark's proportions
FAV_LENS   = "M7 1a6 6 0 1 1 0 12a6 6 0 1 1 0-12ZM4.5 4a.5 .5 0 0 0 0 1H9.5a.5 .5 0 0 0 0-1ZM4.5 6L5.2 10H8.8L9.5 6Z"
FAV_HANDLE = "M12.12 10.28L14.92 13.08A1.3 1.3 0 0 1 13.08 14.92L10.28 12.12A1.3 1.3 0 0 1 12.12 10.28Z"

files = {
    "logo-mark.svg": svg("0 0 64 64", f'  <g>\n{mark(INK)}\n  </g>'),
    "logo-full.svg": svg("0 0 320 72", full(INK)),
    "logo-white.svg": svg("0 0 320 72", full(WHITE)),
    "logo-black.svg": svg("0 0 320 72", full(BLACK)),
    "logo-wordmark.svg": svg("0 0 180 40", f'  <path transform="translate({wx:.2f},{wy:.2f})" d="{W_WM}" fill="{INK}"/>'),
    "logo-icon.svg": svg("0 0 512 512", f'  <rect width="512" height="512" rx="112" fill="{YELLOW}"/>\n'
                         f'  <g transform="translate(53.8,53.8) scale(6.4)">\n{mark(INK)}\n  </g>'),
    "favicon.svg": svg("0 0 16 16", f'  <rect width="16" height="16" rx="3.5" fill="{WHITE}"/>\n'
                       f'  <path d="{FAV_LENS}" fill="{INK}" fill-rule="evenodd"/>\n  <path d="{FAV_HANDLE}" fill="{INK}"/>'),
}
for n, c in files.items(): (OUT / n).write_text(c, encoding="utf-8")
