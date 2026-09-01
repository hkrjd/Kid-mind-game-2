#!/usr/bin/env python3
"""Generate the PWA icons with no image libraries — just zlib + struct.

Draws a rounded purple tile with a yellow star, which is what shows up
on the tablet home screen after "Add to Home Screen". Re-run with:
    python3 tools/make_icons.py
"""
import math
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(__file__), "..", "icons")

BG_TOP = (87, 67, 153)      # --bg-mid
BG_BOT = (61, 47, 107)      # --bg-deep
STAR = (245, 197, 24)       # --joy-yellow
STAR_EDGE = (242, 140, 40)  # --joy-orange


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def in_star(px, py, cx, cy, r_out, r_in, points=5, rot=-math.pi / 2):
    """Point-in-star test via the polar radius of a 5-pointed star."""
    dx, dy = px - cx, py - cy
    dist = math.hypot(dx, dy)
    if dist > r_out:
        return False
    if dist <= r_in * 0.999:
        return True
    ang = math.atan2(dy, dx) - rot
    step = math.pi / points
    # Fold the angle into one half-sector, then compare against the
    # straight edge running from an outer tip to the next inner vertex.
    local = (ang % (2 * step))
    if local > step:
        local = 2 * step - local
    # Edge line in polar form: r(theta) for the segment tip->valley.
    denom = math.sin(step - local) * r_out + math.sin(local) * r_in
    if denom <= 0:
        return False
    edge_r = (r_out * r_in * math.sin(step)) / denom
    return dist <= edge_r


def rounded(px, py, size, radius):
    """Inside a rounded square?"""
    x = min(px, size - 1 - px)
    y = min(py, size - 1 - py)
    if x >= radius or y >= radius:
        return True
    return math.hypot(radius - x, radius - y) <= radius


def render(size, maskable=False):
    # Maskable icons get cropped to a safe circle by the OS, so shrink
    # the art and let the background bleed to the edges.
    pad = size * 0.18 if maskable else 0.0
    radius = 0 if maskable else size * 0.22
    art = size - 2 * pad
    cx = cy = size / 2
    r_out = art * 0.40
    r_in = r_out * 0.42

    rows = []
    for y in range(size):
        row = bytearray()
        row.append(0)  # PNG filter type 0 (None)
        for x in range(size):
            if not maskable and not rounded(x, y, size, radius):
                row += bytes((0, 0, 0, 0))  # transparent corner
                continue
            base = lerp(BG_TOP, BG_BOT, y / max(1, size - 1))
            # Two-tone star: a slightly larger orange star behind the
            # yellow one reads as an outline at small sizes.
            if in_star(x, y, cx, cy, r_out, r_in):
                col = STAR
            elif in_star(x, y, cx, cy, r_out * 1.10, r_in * 1.10):
                col = STAR_EDGE
            else:
                col = base
            row += bytes((col[0], col[1], col[2], 255))
        rows.append(bytes(row))
    return b"".join(rows)


def chunk(tag, data):
    return (struct.pack(">I", len(data)) + tag + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))


def write_png(path, size, maskable=False):
    raw = render(size, maskable)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", ihdr)
           + chunk(b"IDAT", zlib.compress(raw, 9))
           + chunk(b"IEND", b""))
    with open(path, "wb") as f:
        f.write(png)
    print(f"  {os.path.basename(path):26} {size}x{size}  {len(png):>7,} bytes")


SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#574399"/><stop offset="1" stop-color="#3d2f6b"/>
  </linearGradient></defs>
  <rect width="512" height="512" rx="113" fill="url(#g)"/>
  <path fill="#f28c28" d="M256 76l52 107 118 17-85 83 20 118-105-56-105 56 20-118-85-83 118-17z"/>
  <path fill="#f5c518" d="M256 96l47 97 107 15-77 75 18 107-95-50-95 50 18-107-77-75 107-15z"/>
</svg>
"""

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    print("Generating icons:")
    write_png(os.path.join(OUT, "icon-192.png"), 192)
    write_png(os.path.join(OUT, "icon-512.png"), 512)
    write_png(os.path.join(OUT, "icon-maskable-512.png"), 512, maskable=True)
    with open(os.path.join(OUT, "icon.svg"), "w") as f:
        f.write(SVG)
    print("  icon.svg")
