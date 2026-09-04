#!/usr/bin/env python3
"""Generate abstract card art for projects that have no photograph.

The five images this produces are meant to read as one set: a shared ground,
a shared blue-to-cyan ink ramp, and a shared post-process (bloom, vignette,
grain). Only the motif changes, and each motif is a loose picture of what the
project actually does, so the cards stay distinguishable at thumbnail size.

The palette is lifted from the site's default "Deep Space" theme in
_styles/-theme.scss, so the cards sit against the page rather than on top of it.

Everything is seeded, so re-running reproduces the committed images byte for
byte. Bump a project's seed to reroll just that one.

    python3 _art/generate_project_art.py            # write all five
    python3 _art/generate_project_art.py aegis      # write just one
"""

import math
import os
import random
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# ---------------------------------------------------------------- constants

W, H = 1500, 1000  # cards render at aspect-ratio 3/2, object-fit: cover
SS = 2  # supersample factor; drawn at SS*, downsampled at the end
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "images", "projects")

# _styles/-theme.scss, [data-theme="deep-space"]
BG_TOP = (6, 13, 31)  # --background
BG_BOTTOM = (12, 26, 54)  # --background-alt
GRID = (30, 58, 95)  # --light-gray

# blue -> cyan ink ramp, coolest to hottest
INK = [
    (30, 58, 95),  # --secondary
    (37, 99, 235),
    (59, 130, 246),
    (96, 165, 250),  # --primary
    (34, 211, 238),  # --accent
    (103, 232, 249),
]


def ink(t, alpha=255):
    """Sample the ramp at t in [0, 1] with linear interpolation."""
    t = min(max(t, 0.0), 1.0) * (len(INK) - 1)
    lo = int(math.floor(t))
    hi = min(lo + 1, len(INK) - 1)
    f = t - lo
    return tuple(
        int(round(INK[lo][c] + (INK[hi][c] - INK[lo][c]) * f)) for c in range(3)
    ) + (alpha,)


# ------------------------------------------------------------------ ground


def ground():
    """Vertical gradient plus an off-centre radial glow."""
    y = np.linspace(0.0, 1.0, H * SS, dtype=np.float32)[:, None]
    top = np.array(BG_TOP, dtype=np.float32)
    bottom = np.array(BG_BOTTOM, dtype=np.float32)
    img = top[None, None, :] + (bottom - top)[None, None, :] * (y**1.35)[:, :, None]
    img = np.repeat(img, W * SS, axis=1)

    # radial glow, up and left of centre so the composition has a light source
    yy, xx = np.mgrid[0 : H * SS, 0 : W * SS].astype(np.float32)
    cx, cy = W * SS * 0.38, H * SS * 0.34
    r = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / (W * SS * 0.72)
    glow = np.clip(1.0 - r, 0.0, 1.0) ** 2.6
    img += glow[:, :, None] * np.array([14.0, 34.0, 62.0], dtype=np.float32)

    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")


def grid(base, spacing=64, alpha=16):
    """Faint engineering grid, so the field reads as a workspace not a void."""
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for x in range(0, base.size[0], spacing * SS):
        d.line([(x, 0), (x, base.size[1])], fill=GRID + (alpha,), width=SS)
    for y in range(0, base.size[1], spacing * SS):
        d.line([(0, y), (base.size[0], y)], fill=GRID + (alpha,), width=SS)
    return Image.alpha_composite(base.convert("RGBA"), layer)


# ------------------------------------------------------------- post-process


def bloom(base, marks, radius=26, strength=0.85):
    """Additive glow so the ink looks emissive against the dark ground."""
    blur = marks.filter(ImageFilter.GaussianBlur(radius * SS))
    b = np.asarray(blur).astype(np.float32)
    rgb, a = b[:, :, :3], (b[:, :, 3:4] / 255.0) * strength
    out = np.asarray(base.convert("RGB")).astype(np.float32) + rgb * a
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB")


def vignette(img, amount=0.42):
    yy, xx = np.mgrid[0 : img.size[1], 0 : img.size[0]].astype(np.float32)
    nx = (xx / img.size[0] - 0.5) * 2.0
    ny = (yy / img.size[1] - 0.5) * 2.0
    r = np.sqrt(nx**2 + ny**2) / math.sqrt(2.0)
    mask = 1.0 - amount * np.clip(r - 0.28, 0.0, 1.0) ** 1.7
    out = np.asarray(img).astype(np.float32) * mask[:, :, None]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB")


def grain(img, sigma=2.6, seed=0):
    rng = np.random.default_rng(seed)
    noise = rng.normal(0.0, sigma, (img.size[1], img.size[0], 1)).astype(np.float32)
    out = np.asarray(img).astype(np.float32) + noise
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB")


# ----------------------------------------------------------------- motifs
#
# Each motif draws onto a transparent RGBA layer at SS scale. Coordinates are
# written in final-image space and scaled by S(), so the numbers below read as
# positions on a 1500x1000 card.


def S(v):
    return v * SS


def _swarm(d, rng):
    """PUPS: agents, their neighbour links, and the orbits they hold."""
    cx, cy = 750, 500

    for i, rad in enumerate((235, 375, 515, 655)):
        t = 0.15 + i * 0.1
        d.ellipse(
            [S(cx - rad), S(cy - rad * 0.74), S(cx + rad), S(cy + rad * 0.74)],
            outline=ink(t + 0.3, 78 - i * 12),
            width=int(S(1.8)),
        )

    agents = []
    for _ in range(52):
        ang = rng.uniform(0, math.tau)
        rad = rng.uniform(60, 700) ** 0.94
        agents.append((cx + math.cos(ang) * rad, cy + math.sin(ang) * rad * 0.74))

    # link near neighbours: the coordination graph, not a mesh
    for i, (ax, ay) in enumerate(agents):
        for bx, by in agents[i + 1 :]:
            dist = math.hypot(ax - bx, ay - by)
            if dist < 210:
                fade = int(120 * (1.0 - dist / 210.0))
                d.line(
                    [S(ax), S(ay), S(bx), S(by)],
                    fill=ink(0.45 + rng.uniform(0, 0.25), fade),
                    width=int(S(1.5)),
                )

    for ax, ay in agents:
        t = 0.45 + rng.uniform(0, 0.5)
        size = rng.uniform(9.5, 17.0)
        head = rng.uniform(0, math.tau)
        pts = [
            (ax + math.cos(head) * size * 1.9, ay + math.sin(head) * size * 1.9),
            (
                ax + math.cos(head + 2.5) * size,
                ay + math.sin(head + 2.5) * size,
            ),
            (
                ax + math.cos(head - 2.5) * size,
                ay + math.sin(head - 2.5) * size,
            ),
        ]
        d.polygon([(S(x), S(y)) for x, y in pts], fill=ink(t, 232))


def _shield(d, rng):
    """Aegis: nested shield arcs, and the leak escaping through the gap."""
    cx, cy = 560, 500

    for i in range(7):
        rad = 150 + i * 62
        span = 128 - i * 4
        start = -span / 2 - 8
        d.arc(
            [S(cx - rad), S(cy - rad), S(cx + rad), S(cy + rad)],
            start=start,
            end=start + span,
            fill=ink(0.25 + i * 0.09, 210 - i * 16),
            width=int(S(5.5 - i * 0.4)),
        )
        d.arc(
            [S(cx - rad), S(cy - rad), S(cx + rad), S(cy + rad)],
            start=start + 180,
            end=start + 180 + span,
            fill=ink(0.25 + i * 0.09, 150 - i * 14),
            width=int(S(4.0 - i * 0.3)),
        )

    # power traces leaking out to the right: what the side channel gives up
    for row in range(9):
        y0 = 190 + row * 78
        x = 700.0
        y = float(y0)
        pts = [(x, y)]
        while x < 1470:
            x += rng.uniform(14, 38)
            y += rng.gauss(0, 7.5)
            if rng.random() < 0.16:  # the spike that carries information
                y += rng.choice((-1, 1)) * rng.uniform(22, 46)
            pts.append((x, y))
        d.line(
            [(S(px), S(py)) for px, py in pts],
            fill=ink(0.55 + row * 0.045, 118 + row * 9),
            width=int(S(1.9)),
            joint="curve",
        )

    d.ellipse([S(cx + 132), S(cy - 16), S(cx + 164), S(cy + 16)], fill=ink(1.0, 255))


def _netlist(d, rng):
    """RTL Insight: gates in ranks, wired with Manhattan routing."""
    cols = [180, 445, 710, 975, 1240]
    nodes = []
    for ci, cx in enumerate(cols):
        count = (3, 5, 6, 5, 3)[ci]
        span = count * 128
        top = 500 - span / 2 + 64
        col = [(cx, top + r * 128 + rng.uniform(-16, 16)) for r in range(count)]
        nodes.append(col)

    for ci in range(len(cols) - 1):
        for ax, ay in nodes[ci]:
            for bx, by in rng.sample(nodes[ci + 1], k=min(2, len(nodes[ci + 1]))):
                mid = ax + (bx - ax) * rng.uniform(0.38, 0.62)
                hot = rng.random() < 0.22  # the path the analysis highlights
                d.line(
                    [
                        (S(ax + 26), S(ay)),
                        (S(mid), S(ay)),
                        (S(mid), S(by)),
                        (S(bx - 26), S(by)),
                    ],
                    fill=ink(0.85 if hot else 0.3, 200 if hot else 92),
                    width=int(S(2.6 if hot else 1.5)),
                )

    for ci, col in enumerate(nodes):
        for nx, ny in col:
            t = 0.35 + ci * 0.14
            d.rectangle(
                [S(nx - 26), S(ny - 19), S(nx + 26), S(ny + 19)],
                outline=ink(t, 236),
                fill=BG_TOP + (215,),
                width=int(S(2.4)),
            )
            d.line(
                [S(nx - 13), S(ny), S(nx + 13), S(ny)],
                fill=ink(t + 0.2, 190),
                width=int(S(2.0)),
            )


def _provenance(d, rng):
    """Trace-AI: many observations resolving back to one origin."""
    root = (185, 500)

    def branch(x, y, ang, length, depth, t):
        if depth == 0:
            d.ellipse(
                [S(x - 7), S(y - 7), S(x + 7), S(y + 7)], fill=ink(min(t, 1.0), 240)
            )
            return
        nx = x + math.cos(ang) * length
        ny = y + math.sin(ang) * length
        d.line(
            [S(x), S(y), S(nx), S(ny)],
            fill=ink(t, 118 + depth * 22),
            width=int(S(max(1.4, depth * 1.5))),
        )
        d.ellipse(
            [S(nx - depth * 1.4), S(ny - depth * 1.4),
             S(nx + depth * 1.4), S(ny + depth * 1.4)],
            fill=ink(t + 0.1, 170),
        )
        for _ in range(rng.choice((2, 2, 3))):
            branch(
                nx,
                ny,
                ang + rng.uniform(-0.62, 0.62),
                length * rng.uniform(0.6, 0.78),
                depth - 1,
                t + 0.13,
            )

    for start in (-0.52, -0.17, 0.17, 0.52):
        branch(root[0], root[1], start, 235, 4, 0.28)

    d.ellipse(
        [S(root[0] - 21), S(root[1] - 21), S(root[0] + 21), S(root[1] + 21)],
        fill=ink(0.15, 255),
        outline=ink(0.95, 255),
        width=int(S(3.4)),
    )


def _analog(d, rng):
    """Dark Matter: clean analog waves, and the one carrying something."""
    for row in range(7):
        y0 = 140 + row * 122
        freq = rng.uniform(0.006, 0.017)
        amp = rng.uniform(24, 46)
        phase = rng.uniform(0, math.tau)
        tainted = row == 4  # the trojan sits in a single mixed-signal rail

        pts = []
        for x in range(40, 1461, 3):
            y = y0 + math.sin(x * freq + phase) * amp
            y += math.sin(x * freq * 2.7 + phase * 1.6) * amp * 0.22
            if tainted and 690 < x < 880:
                burst = math.exp(-((x - 785) ** 2) / 5200.0)
                y += math.sin(x * 0.34) * 58 * burst
            pts.append((S(x), S(y)))

        d.line(
            pts,
            fill=ink(0.95 if tainted else 0.28 + row * 0.075, 236 if tainted else 148),
            width=int(S(3.4 if tainted else 2.1)),
            joint="curve",
        )

    # marker bracketing the anomaly
    d.rectangle(
        [S(672), S(140 + 4 * 122 - 96), S(898), S(140 + 4 * 122 + 96)],
        outline=ink(1.0, 120),
        width=int(S(1.8)),
    )


# ---------------------------------------------------------------- projects

PROJECTS = {
    "pups": (_swarm, 20260904, 30),
    "aegis": (_shield, 71134, 24),
    "rtl-insight": (_netlist, 55021, 20),
    "trace-ai": (_provenance, 90118, 26),
    "dark-matter": (_analog, 40777, 28),
}


def render(name):
    motif, seed, glow = PROJECTS[name]
    rng = random.Random(seed)

    base = grid(ground())
    marks = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    motif(ImageDraw.Draw(marks), rng)

    composed = Image.alpha_composite(base, marks)
    out = bloom(composed, marks, radius=glow)
    out = out.resize((W, H), Image.LANCZOS)
    out = vignette(out)
    out = grain(out, seed=seed)

    path = os.path.abspath(os.path.join(OUT_DIR, f"{name}.jpg"))
    out.save(path, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"{path}  {os.path.getsize(path) // 1024} KB")


if __name__ == "__main__":
    names = sys.argv[1:] or list(PROJECTS)
    for n in names:
        if n not in PROJECTS:
            raise SystemExit(f"unknown project {n!r}; known: {', '.join(PROJECTS)}")
        render(n)
