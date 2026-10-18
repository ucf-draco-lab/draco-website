"""
paper_icons.py — Generate a topic mini-icon (SVG) for each publication.

There are no abstracts in _bibliography/, so each paper's title (plus its
keywords) is matched against TOPIC_RULES below. The first rule that matches
picks the main glyph and colour family; the next match with a different glyph
becomes a small badge in the corner (e.g. a side-channel waveform with a
neural-net badge for "Stealing ML Parameters via Side Channel Power Attacks").
A faint circuit-trace pattern seeded from the citation id makes each icon
unique, even for repeat titles.

Output is deterministic, so re-running produces no diffs. bib2yaml.py calls
icon_for() for every entry; an `image` field in a .bib entry overrides it.

The same generator also draws (run `python _cite/paper_icons.py`, which
bib2yaml.py does too):
  - a 3:2 card image for every project in _data/projects.yaml whose `image`
    points into images/projects/icons/ (projects without artwork of their own)
  - a square icon for each interactive paper in _papers/, shown on /papers/
"""

import hashlib
import math
import re
from pathlib import Path

ICON_DIR = Path("images/papers")
PROJECT_ICON_DIR = Path("images/projects/icons")
INTERACTIVE_ICON_DIR = Path("images/papers/interactive")
PROJECTS_FILE = Path("_data/projects.yaml")
INTERACTIVE_DIR = Path("_papers")

# ─── Colour families (gradient start, gradient end) ──────────────────────────

FAMILIES = {
    "hwsec":   ("#1d7fe0", "#0839c2"),  # hardware security / side channels
    "crypto":  ("#6d4fe0", "#2e1f8f"),  # cryptography
    "ml":      ("#a24fd6", "#4b1a7a"),  # machine learning / AI
    "network": ("#14a39d", "#0a5560"),  # IoT, swarms, networks
    "cyber":   ("#e0582a", "#8a2a10"),  # attacks / defenses
    "edu":     ("#d99a06", "#8a5600"),  # education / outreach
    "science": ("#38a169", "#1c4532"),  # science / data
    "systems": ("#5b6b82", "#1e293b"),  # embedded systems / software
}

# ─── Glyphs: drawn in a 100×100 box, centred on (50, 50) ─────────────────────
# Strokes use the surrounding group's colour; "F" marks a filled shape.

def _star(cx, cy, r_out, r_in, points=5):
    pts = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        a = -math.pi / 2 + i * math.pi / points
        pts.append(f"{cx + r * math.cos(a):.1f},{cy + r * math.sin(a):.1f}")
    return f'<polygon class="F" points="{" ".join(pts)}"/>'


def _gear(cx, cy, r_out, r_in, teeth=8):
    pts = []
    for i in range(teeth * 4):
        a = 2 * math.pi * i / (teeth * 4)
        r = r_out if i % 4 in (1, 2) else r_in
        pts.append(f"{cx + r * math.cos(a):.1f},{cy + r * math.sin(a):.1f}")
    return f'<polygon points="{" ".join(pts)}"/><circle cx="{cx}" cy="{cy}" r="7"/>'


def _neural():
    layers = [(30, [36, 50, 64]), (50, [30, 43, 57, 70]), (70, [42, 58])]
    lines, nodes = [], []
    for (x1, ys1), (x2, ys2) in zip(layers, layers[1:]):
        for y1 in ys1:
            for y2 in ys2:
                lines.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>')
    for x, ys in layers:
        for y in ys:
            nodes.append(f'<circle class="F" cx="{x}" cy="{y}" r="4.5"/>')
    return f'<g stroke-width="1.8">{"".join(lines)}</g>{"".join(nodes)}'


def _lattice():
    pts = {(i, j): (28 + i * 17 + j * 6, 36 + j * 14) for i in range(3) for j in range(3)}
    lines = []
    for (i, j), (x, y) in pts.items():
        for di, dj in ((1, 0), (0, 1)):
            if (i + di, j + dj) in pts:
                x2, y2 = pts[(i + di, j + dj)]
                lines.append(f'<line x1="{x}" y1="{y}" x2="{x2}" y2="{y2}"/>')
    dots = "".join(f'<circle class="F" cx="{x}" cy="{y}" r="4"/>' for x, y in pts.values())
    return f'<g stroke-width="2">{"".join(lines)}</g>{dots}'


def _keyboard():
    keys = []
    for y in (42, 50):
        for x in (29, 37, 45, 53, 61, 69):
            keys.append(f'<rect class="F" x="{x - 2.5}" y="{y - 2.5}" width="5" height="5" rx="1"/>')
    return ('<rect x="22" y="34" width="56" height="32" rx="5"/>' + "".join(keys) +
            '<rect class="F" x="36" y="56" width="28" height="4" rx="2"/>')


def _hub():
    out = ['<circle class="F" cx="50" cy="50" r="7"/>']
    for k in range(5):
        a = -math.pi / 2 + k * 2 * math.pi / 5
        x, y = 50 + 23 * math.cos(a), 50 + 23 * math.sin(a)
        lx, ly = 50 + 11 * math.cos(a), 50 + 11 * math.sin(a)
        ex, ey = 50 + 18 * math.cos(a), 50 + 18 * math.sin(a)
        out.append(f'<line x1="{lx:.1f}" y1="{ly:.1f}" x2="{ex:.1f}" y2="{ey:.1f}"/>')
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5"/>')
    return "".join(out)


def _burst():
    rays = []
    for k in range(8):
        a = k * math.pi / 4
        rays.append(f'<line x1="{50 + 12 * math.cos(a):.1f}" y1="{50 + 12 * math.sin(a):.1f}" '
                    f'x2="{50 + 25 * math.cos(a):.1f}" y2="{50 + 25 * math.sin(a):.1f}"/>')
    return '<circle class="F" cx="50" cy="50" r="7"/>' + "".join(rays)


def _atom():
    return ("".join(f'<ellipse cx="50" cy="50" rx="25" ry="9" transform="rotate({a} 50 50)"/>'
                    for a in (0, 60, 120)) +
            '<circle class="F" cx="50" cy="50" r="4.5"/>')


def _chip(inner):
    pins = []
    for p in (40, 50, 60):
        pins += [f'<line x1="27" y1="{p}" x2="33" y2="{p}"/>', f'<line x1="67" y1="{p}" x2="73" y2="{p}"/>',
                 f'<line x1="{p}" y1="27" x2="{p}" y2="33"/>', f'<line x1="{p}" y1="67" x2="{p}" y2="73"/>']
    return '<rect x="33" y="33" width="34" height="34" rx="4"/>' + "".join(pins) + inner


GLYPHS = {
    "waveform": ('<rect x="22" y="30" width="56" height="40" rx="5"/>'
                 '<polyline stroke-width="3.5" points="27,54 34,54 37,40 41,62 45,45 49,58 53,36 57,61 61,50 73,50"/>'),
    "hash": ('<line x1="44" y1="27" x2="38" y2="73"/><line x1="62" y1="27" x2="56" y2="73"/>'
             '<line x1="28" y1="42" x2="72" y2="42"/><line x1="27" y1="58" x2="71" y2="58"/>'),
    "lattice": _lattice(),
    "key": ('<circle cx="36" cy="50" r="11"/><circle class="F" cx="36" cy="50" r="3"/>'
            '<line x1="47" y1="50" x2="74" y2="50"/><line x1="65" y1="50" x2="65" y2="59"/>'
            '<line x1="73" y1="50" x2="73" y2="57"/>'),
    "fsm": ('<circle cx="31" cy="36" r="8"/><circle cx="69" cy="36" r="8"/><circle cx="50" cy="68" r="8"/>'
            '<line x1="40" y1="36" x2="59" y2="36"/><polyline points="54,32 59,36 54,40"/>'
            '<line x1="65" y1="44" x2="55" y2="60"/><polyline points="55,54 55,60 61,58"/>'
            '<line x1="45" y1="60" x2="35" y2="44"/><polyline points="35,50 35,44 41,46"/>'),
    "chip": _chip('<rect class="F" x="42" y="42" width="16" height="16" rx="2"/>'),
    "chip_bolt": _chip('<polygon class="F" points="53,38 42,52 49,52 46,62 58,47 51,47"/>'),
    "chip_warn": _chip('<polygon stroke-width="3" points="50,40 59,57 41,57"/>'
                       '<circle class="F" cx="50" cy="53" r="1.6"/><line stroke-width="3" x1="50" y1="46" x2="50" y2="49"/>'),
    "neural": _neural(),
    "check": '<circle cx="50" cy="50" r="24"/><polyline points="38,51 46,59 63,42"/>',
    "car": ('<path d="M22,62 V52 L30,50 L37,38 H63 L70,50 L78,52 V62 Z"/><line x1="38" y1="50" x2="69" y2="50"/>'
            '<line x1="50" y1="38" x2="50" y2="50"/><circle cx="34" cy="64" r="6"/><circle cx="66" cy="64" r="6"/>'),
    "lock": ('<path d="M39,48 V40 a11,11 0 0 1 22,0 V48"/><rect x="31" y="48" width="38" height="26" rx="4"/>'
             '<circle class="F" cx="50" cy="59" r="3.5"/><line x1="50" y1="60" x2="50" y2="67"/>'),
    "eye_slash": ('<path d="M24,50 Q50,26 76,50 Q50,74 24,50 Z"/><circle cx="50" cy="50" r="7"/>'
                  '<line x1="30" y1="74" x2="70" y2="26"/>'),
    "keyboard": _keyboard(),
    "hub": _hub(),
    "drone": ('<rect x="43" y="43" width="14" height="14" rx="3"/>'
              '<line x1="44" y1="44" x2="33" y2="33"/><line x1="56" y1="44" x2="67" y2="33"/>'
              '<line x1="44" y1="56" x2="33" y2="67"/><line x1="56" y1="56" x2="67" y2="67"/>'
              '<ellipse cx="31" cy="31" rx="10" ry="3.5"/><ellipse cx="69" cy="31" rx="10" ry="3.5"/>'
              '<ellipse cx="31" cy="69" rx="10" ry="3.5"/><ellipse cx="69" cy="69" rx="10" ry="3.5"/>'),
    "radio": ('<circle class="F" cx="50" cy="44" r="4.5"/><line x1="50" y1="48" x2="50" y2="76"/>'
              '<line x1="42" y1="76" x2="58" y2="76"/>'
              '<path d="M40,34 Q33,44 40,54"/><path d="M60,34 Q67,44 60,54"/>'
              '<path d="M32,27 Q21,44 32,61"/><path d="M68,27 Q79,44 68,61"/>'),
    "wifi": ('<circle class="F" cx="50" cy="68" r="5"/><path d="M38,57 Q50,46 62,57"/>'
             '<path d="M30,48 Q50,30 70,48"/><path d="M22,39 Q50,14 78,39"/>'),
    "router": ('<rect x="24" y="52" width="52" height="18" rx="4"/><line x1="36" y1="52" x2="31" y2="32"/>'
               '<line x1="64" y1="52" x2="69" y2="32"/><circle class="F" cx="33" cy="61" r="2.5"/>'
               '<circle class="F" cx="41" cy="61" r="2.5"/><circle class="F" cx="49" cy="61" r="2.5"/>'
               '<line x1="58" y1="61" x2="68" y2="61"/>'),
    "blocks": ('<rect x="22" y="24" width="18" height="18" rx="3"/><rect x="41" y="41" width="18" height="18" rx="3"/>'
               '<rect x="60" y="58" width="18" height="18" rx="3"/>'
               '<line x1="36" y1="42" x2="41" y2="47"/><line x1="55" y1="59" x2="60" y2="64"/>'),
    "ballot": ('<rect x="39" y="24" width="22" height="26" rx="2"/><polyline points="44,37 48,42 56,31"/>'
               '<rect x="26" y="50" width="48" height="24" rx="3"/><line x1="36" y1="50" x2="64" y2="50"/>'),
    "leaf": ('<path d="M28,72 C28,42 48,28 74,28 C74,54 58,72 28,72 Z"/><line x1="28" y1="72" x2="60" y2="42"/>'),
    "file_lock": ('<path d="M33,24 H56 L67,35 V76 H33 Z"/><polyline points="56,24 56,35 67,35"/>'
                  '<path stroke-width="3.5" d="M45,57 V53 a5,5 0 0 1 10,0 V57"/>'
                  '<rect class="F" x="42" y="57" width="16" height="12" rx="2"/>'),
    "globe": ('<circle cx="50" cy="50" r="24"/><ellipse cx="50" cy="50" rx="10" ry="24"/>'
              '<line x1="26" y1="50" x2="74" y2="50"/><path d="M30,38 H70 M30,62 H70" stroke-width="3"/>'),
    "onion": ('<path d="M50,28 C66,42 71,53 69,61 A19,19 0 0 1 31,61 C29,53 34,42 50,28 Z"/>'
              '<path d="M50,40 C58,48 60,55 59,61 A9,9 0 0 1 41,61 C40,55 42,48 50,40 Z"/>'
              '<path d="M50,28 Q52,20 60,18"/>'),
    "shield": ('<path d="M50,23 L73,31 V50 C73,64 63,72 50,78 C37,72 27,64 27,50 V31 Z"/>'
               '<polyline points="39,50 47,58 61,42"/>'),
    "shield_bolt": ('<path d="M50,23 L73,31 V50 C73,64 63,72 50,78 C37,72 27,64 27,50 V31 Z"/>'
                    '<polygon class="F" points="54,32 41,53 50,53 46,68 59,46 50,46"/>'),
    "board": ('<rect x="20" y="32" width="60" height="34" rx="6"/><circle cx="30" cy="49" r="4"/>'
              '<circle cx="70" cy="49" r="4"/>' +
              "".join(f'<circle class="F" cx="{x}" cy="{y}" r="2.2"/>' for x in (42, 50, 58) for y in (41, 49, 57)) +
              "".join(f'<line stroke-width="3" x1="{x}" y1="66" x2="{x}" y2="73"/>' for x in (28, 37, 46, 54, 63, 72))),
    "ant": ('<g class="F"><circle cx="50" cy="29" r="5"/><circle cx="50" cy="42" r="5"/>'
            '<ellipse cx="50" cy="62" rx="8" ry="12"/></g>'
            '<g stroke-width="3"><polyline points="34,32 40,40 50,43 60,40 66,32"/>'
            '<line x1="31" y1="45" x2="69" y2="45"/><polyline points="33,58 40,49 50,45 60,49 67,58"/>'
            '<line x1="47" y1="25" x2="41" y2="17"/><line x1="53" y1="25" x2="59" y2="17"/></g>'),
    "robot": ('<rect x="32" y="32" width="36" height="28" rx="6"/><circle class="F" cx="42" cy="45" r="3.5"/>'
              '<circle class="F" cx="58" cy="45" r="3.5"/><line x1="44" y1="53" x2="56" y2="53"/>'
              '<line x1="50" y1="32" x2="50" y2="25"/><circle class="F" cx="50" cy="23" r="3.5"/>'
              '<line x1="32" y1="46" x2="26" y2="46"/><line x1="68" y1="46" x2="74" y2="46"/>'
              '<rect x="38" y="62" width="24" height="13" rx="3"/>'),
    "badge": ('<circle cx="50" cy="42" r="17"/>' + _star(50, 42, 9, 4) +
              '<polyline points="41,56 36,76 44,72 48,78 50,60"/><polyline points="59,56 64,76 56,72 52,78 50,60"/>'),
    "board_teach": ('<rect x="22" y="26" width="56" height="36" rx="3"/><line x1="36" y1="62" x2="30" y2="76"/>'
                    '<line x1="64" y1="62" x2="70" y2="76"/><polyline stroke-width="3.5" points="30,52 38,42 46,48 56,36 68,44"/>'),
    "apple": ('<path d="M50,38 C42,30 26,33 27,49 C28,64 38,76 50,71 C62,76 72,64 73,49 C74,33 58,30 50,38 Z"/>'
              '<path d="M50,38 Q49,30 52,24"/><path class="F" d="M53,31 Q58,21 68,23 Q63,32 53,31 Z"/>'),
    "tent": ('<polygon points="50,26 76,72 24,72"/><polyline points="42,72 50,54 58,72"/>'
             '<line x1="16" y1="72" x2="84" y2="72"/><polyline points="50,26 50,18 58,21 50,24"/>'),
    "play": ('<rect x="22" y="30" width="56" height="40" rx="7"/><polygon class="F" points="44,40 44,60 61,50"/>'),
    "pin": ('<path d="M50,77 C50,77 29,57 29,43 A21,21 0 0 1 71,43 C71,57 50,77 50,77 Z"/>'
            '<circle cx="50" cy="43" r="7"/>'),
    "dna": ('<path d="M38,24 C38,37 62,37 62,50 C62,63 38,63 38,76"/><path d="M62,24 C62,37 38,37 38,50 C38,63 62,63 62,76"/>'
            '<g stroke-width="3"><line x1="41" y1="27" x2="59" y2="27"/><line x1="41" y1="50" x2="59" y2="50"/>'
            '<line x1="41" y1="73" x2="59" y2="73"/></g>'),
    "drop": ('<path d="M50,22 C50,22 31,45 31,58 A19,19 0 0 0 69,58 C69,45 50,22 50,22 Z"/>'
             '<path stroke-width="3.5" d="M40,60 Q45,53 50,60 T60,60"/>'),
    "thermo": ('<path d="M44,58 V30 a6,6 0 0 1 12,0 V58"/><circle cx="50" cy="66" r="10"/>'
               '<circle class="F" cx="50" cy="66" r="5"/><line x1="50" y1="38" x2="50" y2="62"/>'
               '<g stroke-width="3"><line x1="62" y1="32" x2="68" y2="32"/><line x1="62" y1="40" x2="68" y2="40"/>'
               '<line x1="62" y1="48" x2="68" y2="48"/></g>'),
    "burst": _burst(),
    "bars": ('<polyline points="26,24 26,74 76,74"/><rect class="F" x="33" y="54" width="9" height="16" rx="1.5"/>'
             '<rect class="F" x="46" y="42" width="9" height="28" rx="1.5"/><rect class="F" x="59" y="30" width="9" height="40" rx="1.5"/>'),
    "magnifier": '<circle cx="45" cy="45" r="15"/><line x1="56" y1="56" x2="72" y2="72"/>',
    "cloud": ('<path d="M33,66 H67 A12,12 0 0 0 65,42 A16,16 0 0 0 35,40 A13,13 0 0 0 33,66 Z"/>'
              '<g stroke-width="3.5"><polyline points="45,48 40,54 45,60"/><polyline points="55,48 60,54 55,60"/></g>'),
    "usb": ('<line x1="50" y1="30" x2="50" y2="70"/><polygon class="F" points="50,20 44,30 56,30"/>'
            '<circle class="F" cx="50" cy="72" r="6"/><polyline points="50,58 37,49 37,42"/>'
            '<circle class="F" cx="37" cy="39" r="4"/><polyline points="50,52 63,43 63,38"/>'
            '<rect class="F" x="59" y="31" width="8" height="8"/>'),
    "plane": ('<path class="F" d="M50,20 C53,20 54,25 54,29 V43 L76,56 V62 L54,55 V68 L61,73 V77 L50,74 '
              'L39,77 V73 L46,68 V55 L24,62 V56 L46,43 V29 C46,25 47,20 50,20 Z"/>'),
    "code": ('<polyline points="37,34 24,50 37,66"/><polyline points="63,34 76,50 63,66"/>'
             '<line x1="55" y1="30" x2="45" y2="70"/>'),
    "laptop": ('<rect x="28" y="28" width="44" height="30" rx="3"/><path d="M20,66 H80 L76,72 H24 Z"/>'
               '<g stroke-width="3.5"><polyline points="44,37 38,43 44,49"/><polyline points="56,37 62,43 56,49"/></g>'),
    "cycle": ('<path d="M69,44 A20,20 0 0 0 32,40"/><polyline points="69,32 69,44 58,42"/>'
              '<path d="M31,56 A20,20 0 0 0 68,60"/><polyline points="31,68 31,56 42,58"/>'),
    "sparkle": ('<path class="F" d="M46,22 C48,42 54,48 74,50 C54,52 48,58 46,78 C44,58 38,52 18,50 C38,48 44,42 46,22 Z"/>'
                '<path class="F" d="M72,20 C73,27 75,29 82,30 C75,31 73,33 72,40 C71,33 69,31 62,30 C69,29 71,27 72,20 Z"/>'),
    "cap": ('<polygon points="50,28 80,41 50,54 20,41"/><path d="M33,47 V60 C33,68 67,68 67,60 V47"/>'
            '<polyline points="76,43 76,60"/><circle class="F" cx="76" cy="62" r="3"/>'),
    "rings": '<circle cx="40" cy="50" r="15"/><circle cx="60" cy="50" r="15"/>',
    "megaphone": ('<path d="M26,44 V58 H36 L62,72 V30 L36,44 Z"/><line x1="38" y1="58" x2="43" y2="71"/>'
                  '<path d="M69,42 Q75,51 69,60"/><path d="M75,36 Q84,51 75,66"/>'),
    "gear": _gear(50, 50, 24, 18),
    "atom": _atom(),
}

# ─── Topic rules: (regex on lowercased title + keywords, glyph, family) ──────
# Order matters: the first match is the main glyph, so specific topics come
# before general ones.

TOPIC_RULES = [
    (r"ransomware", "file_lock", "cyber"),
    (r"trojan", "chip_warn", "hwsec"),
    (r"fault injection|glitch", "chip_bolt", "hwsec"),
    (r"\btor\b", "onion", "cyber"),
    (r"malicious url|\burl\b", "globe", "cyber"),
    (r"ddos|canar", "router", "network"),
    (r"keystroke|continuous(ly)? authenticat|behavioral", "keyboard", "cyber"),
    (r"sha-?256|avalanche|\bhash|tlsh", "hash", "crypto"),
    (r"lattice|mintt", "lattice", "crypto"),
    (r"s-box|\baes\b|gift|block cipher", "key", "crypto"),
    (r"\bs?\*?fsms?\b|state machine|state encoding|secure controllers", "fsm", "hwsec"),
    (r"side.?channel|power analysis|power attack|tvla|\bdpa\b|leak|uncover the secrets", "waveform", "hwsec"),
    (r"homomorphic|encrypt", "lock", "crypto"),
    (r"formal verification|risc-v|processor", "chip", "hwsec"),
    (r"equivalence|verified", "check", "hwsec"),
    (r"transistor|circuit|microelectronic|hardware security|\bchip", "chip", "hwsec"),
    (r"generative (ai|artificial)", "sparkle", "ml"),
    (r"federated", "hub", "ml"),
    (r"neural|machine learning|\bml\b|deep|graph convolutional|poisoning|classification|explainab",
     "neural", "ml"),
    (r"privacy|anonymi", "eye_slash", "cyber"),
    (r"\belection", "ballot", "crypto"),
    (r"carbon", "leaf", "science"),
    (r"blockchain", "blocks", "crypto"),
    (r"\bswarms?\b(?! scholars)|drone|uav", "drone", "network"),
    (r"s-chirp|schirp|peer-to-peer|command, control", "radio", "network"),
    (r"automobile|automotive|vehicle", "car", "systems"),
    (r"storage device|\busb\b", "usb", "systems"),
    (r"avionics", "plane", "systems"),
    (r"\biot\b|iots|internet of things|\bcps\b|embedded|devices", "wifi", "network"),
    (r"\bstig\b|cyberattack", "shield_bolt", "cyber"),
    (r"micro:?bits?|arduino|physical computing|microcontroller|\blmap\b", "board", "systems"),
    (r"netlogo|\bants\b|naturally inspired", "ant", "science"),
    (r"robot", "robot", "edu"),
    (r"video|youdemo|flipgrid|director's chair", "play", "edu"),
    (r"\bgis\b", "pin", "science"),
    (r"genome|\bgene\b|arabidopsis|genetic algorithm", "dna", "science"),
    (r"storm water|derivative", "drop", "science"),
    (r"colder", "thermo", "science"),
    (r"big bang", "burst", "science"),
    (r"data corral|data analysis|data collection|statistic|quantitative|visualization|predictive|"
     r"corpora|data-driven|\bsearch|feature selection", "bars", "science"),
    (r"web notebooks|cloud", "cloud", "systems"),
    (r"c\+\+|lazy streams", "code", "systems"),
    (r"agile|constructivist|action research|lesson study|design thinking", "cycle", "edu"),
    (r"micro-?credential|micro:?badge|competency", "badge", "edu"),
    (r"\bcamps?\b|gencyber", "tent", "edu"),
    (r"outreach|engagement|interest|expo|showcase", "megaphone", "edu"),
    (r"partner|collaborat|communication", "rings", "edu"),
    (r"cyber|security|attack|secur|resilien|defens|adversar|hardening|protect", "shield", "cyber"),
    (r"lesson plan|teacher|pre-service|educator|professional develop|classroom|pedagog|instruction|"
     r"k-?1[26]|k-?20|\bteach", "apple", "edu"),
    (r"doctoral|faculty|graduate|freshman|university|students?\b|soft skills|attrition|capstone|"
     r"education", "cap", "edu"),
    (r"computer science|computing|computational|\bcs\b|unplugged|coding", "laptop", "edu"),
    (r"design|engineer|systems", "gear", "systems"),
    (r"stem|science", "atom", "edu"),
]

DEFAULT = ("atom", "edu")

# ─── Rendering ───────────────────────────────────────────────────────────────

def classify(text):
    """Return (main glyph, family, badge glyph or None) for a title string."""
    text = text.lower()
    matches = [(g, f) for pattern, g, f in TOPIC_RULES if re.search(pattern, text)]
    if not matches:
        return DEFAULT[0], DEFAULT[1], None
    glyph, family = matches[0]
    badge = next((g for g, _ in matches[1:] if g != glyph), None)
    return glyph, family, badge


def _traces(seed, width=100):
    """Faint circuit traces: grid-aligned runs with one 45° bend and a via."""
    out = []
    sx = width / 100
    for k in range(6):
        b = seed[k * 4:(k + 1) * 4]
        side = b[0] % 4
        t = 14 + (b[1] % 8) * 10           # position along the starting edge
        tx = round(t * sx)
        run = 8 + b[2] % 20                 # straight run before the bend
        bend = 6 + b[3] % 12                # diagonal run
        d = 1 if b[3] & 1 else -1
        if side == 0:   x0, y0, dx, dy = tx, 6, 0, 1
        elif side == 1: x0, y0, dx, dy = width - 6, t, -1, 0
        elif side == 2: x0, y0, dx, dy = tx, 94, 0, -1
        else:           x0, y0, dx, dy = 6, t, 1, 0
        x1, y1 = x0 + dx * run, y0 + dy * run
        x2, y2 = x1 + (dx or d) * bend, y1 + (dy or d) * bend
        out.append(f'<polyline points="{x0},{y0} {x1},{y1} {x2},{y2}"/>'
                   f'<circle cx="{x2}" cy="{y2}" r="2.2"/>')
    return "".join(out)


def render_svg(citation_id, title, text, wide=False):
    """Square rounded tile, or a full-bleed 3:2 banner when wide (project cards)."""
    glyph, family, badge = classify(text)
    c1, c2 = FAMILIES[family]
    seed = hashlib.sha256(citation_id.encode("utf-8")).digest()
    angle = seed[30] % 90
    gid = "g" + seed.hex()[:8]
    main = GLYPHS[glyph]
    if badge:
        main = f'<g transform="translate(44 44) scale(0.88) translate(-50 -50)">{main}</g>'
        badge_svg = (f'<circle cx="75" cy="75" r="14" fill="#fff"/>'
                     f'<g stroke="{c2}" stroke-width="7" transform="translate(75 75) scale(0.22) translate(-50 -50)">'
                     f'{GLYPHS[badge]}</g>')
    else:
        badge_svg = ""
    width = 150 if wide else 100
    if wide:
        main = f'<g transform="translate(25 0)">{main}</g>'
        badge_svg = f'<g transform="translate(25 0)">{badge_svg}</g>'
        frame = f'<rect width="{width}" height="100" fill="url(#{gid})"/>'
    else:
        frame = f'<rect x="4" y="4" width="92" height="92" rx="16" fill="url(#{gid})"/>'
    safe_title = (title.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} 100" role="img">'
        f'<title>{safe_title}</title>'
        f'<defs><linearGradient id="{gid}" gradientTransform="rotate({angle} .5 .5)">'
        f'<stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>'
        f'<style>.F{{fill:currentColor;stroke:none}}</style></defs>'
        f'{frame}'
        f'<g fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.6" stroke-linecap="round">'
        f'{_traces(seed, width)}</g>'
        f'<g fill="none" stroke="#fff" color="#fff" stroke-width="4.5" stroke-linecap="round" '
        f'stroke-linejoin="round">{main}</g>'
        f'<g fill="none" color="{c2}" stroke-linecap="round" stroke-linejoin="round">{badge_svg}</g>'
        f'</svg>\n'
    )


def icon_filename(citation_id):
    return re.sub(r"[^A-Za-z0-9_-]+", "-", citation_id).strip("-") + ".svg"


def icon_for(citation_id, title, keywords=""):
    """Write the icon for one citation and return its site-relative path."""
    path = ICON_DIR / icon_filename(citation_id)
    _write(path, render_svg(citation_id, title, f"{title} {keywords}"))
    return path.as_posix()


def _write(path, svg):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists() or path.read_text(encoding="utf-8") != svg:
        path.write_text(svg, encoding="utf-8")


def _front_matter(path):
    import yaml
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}
    return yaml.safe_load(text.split("---", 2)[1]) or {}


def generate_site_icons():
    """Project card images and interactive-paper icons (see module docstring)."""
    import yaml
    projects = yaml.safe_load(PROJECTS_FILE.read_text(encoding="utf-8")) or []
    for project in projects:
        image = Path(project.get("image", ""))
        if image.parent != PROJECT_ICON_DIR:
            continue
        text = " ".join(str(project.get(k, "")) for k in ("title", "subtitle", "description"))
        _write(image, render_svg(f"project:{image.stem}", project["title"], text, wide=True))

    for page in sorted(INTERACTIVE_DIR.glob("*.md")):
        meta = _front_matter(page)
        text = f"{meta.get('title', '')} {meta.get('subtitle', '')}"
        _write(INTERACTIVE_ICON_DIR / f"{page.stem}.svg",
               render_svg(f"paper:{page.stem}", meta.get("title", page.stem), text))


if __name__ == "__main__":
    generate_site_icons()
