"""Turn an image into a soft-focus SVG: a grid of its colors under a Gaussian blur.

Usage: field.py <in.png> <out.svg> [cols]
Stdlib only: ffmpeg downsamples to raw RGB, Python writes the rects.
"""
import subprocess
import sys

src, dst = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 64
rows = round(cols * 9 / 16)
W, H = 1600, 900
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={cols}:{rows}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                     check=True, capture_output=True).stdout
cw, ch = W / cols, H / rows
pad = 3  # edge cells repeat outward this far, so the blur has no white halo at the frame
rects = []
for gy in range(-pad, rows + pad):
    y = min(max(gy, 0), rows - 1)
    x = -pad
    while x < cols + pad:
        sx = min(max(x, 0), cols - 1)
        i = (y * cols + sx) * 3
        color = raw[i:i + 3]
        run = 1  # merge runs of near-identical neighbours into one wider rect
        while x + run < cols + pad:
            j = (y * cols + min(max(x + run, 0), cols - 1)) * 3
            if max(abs(a - b) for a, b in zip(raw[j:j + 3], color)) > 3:
                break
            run += 1
        rects.append(f'<rect x="{round(x * cw)}" y="{round(gy * ch)}" width="{round(run * cw) + 1}" height="{round(ch) + 1}" fill="#{color.hex()}"/>')
        x += run
blur = round(cw * 0.65)
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">'
       f'<defs><filter id="s" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="{blur}"/></filter>'
       f'<filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>'
       f'<feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .05 0"/></filter></defs>'
       f'<g filter="url(#s)">{"".join(rects)}</g><rect width="{W}" height="{H}" filter="url(#g)"/></svg>')
open(dst, "w").write(svg)
print(f"{dst}: {cols}x{rows}, {len(rects)} rects, {len(svg)} chars")
