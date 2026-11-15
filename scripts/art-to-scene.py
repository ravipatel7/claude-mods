"""Turn a picture into a soft-focus SVG scene for a theme backdrop.

Usage: python3 scripts/art-to-scene.py <in.png|jpg> <out.svg> [cols] [rows]

The desktop app draws scenes in a sandboxed frame that drops SVG filters (no
feGaussianBlur) and embedded images, so the softness comes from gradients only:
each row of the downsampled picture is one horizontal linear gradient, drawn as a
band twice a row tall, and a shared vertical mask fades each band in at its top so
neighbouring rows blend. Stdlib only; ffmpeg does the downsampling.
Keep the output under 131,072 characters (the scene limit): lower cols/rows if not.
"""
import subprocess
import sys

src, dst = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 40
rows = int(sys.argv[4]) if len(sys.argv) > 4 else 30
W, H = 1600, 900

raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={cols}:{rows}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    check=True, capture_output=True,
).stdout


def px(x: int, y: int) -> str:
    i = (y * cols + x) * 3
    return raw[i:i + 3].hex()


ch = H / rows
grads, bands = [], []
for y in range(rows):
    stops = []
    for x in range(cols):
        c = px(x, y)
        # Drop a stop that matches both neighbours: the gradient looks the same without it.
        if 0 < x < cols - 1 and px(x - 1, y) == c == px(x + 1, y):
            continue
        stops.append(f'<stop offset="{x / (cols - 1):.3f}" stop-color="#{c}"/>')
    grads.append(f'<linearGradient id="r{y}">{"".join(stops)}</linearGradient>')
    # Each band starts half a row above its row and fades in, covering the band above
    # smoothly; it runs on two rows down, under the next band's fade, so no gap shows.
    # The first and last run off the frame.
    top = -ch if y == 0 else (y - 0.5) * ch
    bottom = H + ch if y == rows - 1 else (y + 2) * ch
    mask = '' if y == 0 else ' mask="url(#f)"'
    bands.append(f'<rect y="{top:.0f}" width="{W}" height="{bottom - top:.0f}" fill="url(#r{y})"{mask}/>')

# The fade: transparent at a band's top, opaque from 40% down (one row of a 2.5-row band).
# objectBoundingBox units let one mask serve every band.
fade = ('<linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/>'
        '<stop offset=".4" stop-color="#fff"/></linearGradient>'
        '<mask id="f" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#a)"/></mask>')
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">'
       f'<defs>{fade}{"".join(grads)}</defs>{"".join(bands)}</svg>')
with open(dst, "w") as out:
    out.write(svg)
print(f"{dst}: {cols}x{rows}, {len(svg)} chars")
