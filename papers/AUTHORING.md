# Interactive papers: authoring guide

Each interactive paper is one markdown file in `_papers/` plus one asset folder in
`papers/<slug>/`. The page is published at `/papers/<slug>/`, listed on `/papers/`
and on the Research page, and every matching citation on the Research page gets a
"Try it in your browser" link.

## Files

| Path | Purpose |
|---|---|
| `_papers/<slug>.md` | Front matter (below) and the page text, written per reading level |
| `papers/<slug>/widget.js`, `widget.css` | The paper's interactive pieces; mount into empty `<div id="...">` elements in the page text |
| `papers/<slug>/share.png` | 1200 × 630 social card |
| `images/papers/interactive/<slug>.svg` | Listing icon on `/papers/` and in the "More interactive papers" section at the foot of every paper page, drawn from the title and subtitle by `python _cite/paper_icons.py` (set `icon:` in front matter to use your own) |
| `papers/kit/paper-kit.js`, `paper-kit.css` | Shared: level switch, share bar, copy buttons (do not fork per paper) |
| `_layouts/paper.html`, `_includes/share-bar.html` | Shared page frame |
| `_data/paper_levels.yaml` | The five reading levels: `public`, `hs`, `ug`, `grad`, `res` |

## Front matter

```yaml
title: "Plain-language title"
kicker: "Interactive paper · Venue Year"
subtitle: "One sentence on what the page lets a reader do"
description: "Listing blurb on /papers/ (also the tooltip on the Research-page gallery tile)"
share_description: "Social card text (used as-is, no site prefix)"
share_text: "Text that leads a shared post, ending with a colon"
share_image: /papers/<slug>/share.png
share_image_alt: "What the card shows"
date: YYYY-MM-DD
topics: ["Hardware security"]  # filter chips on /papers/; reuse an existing topic name when one fits
default_level: public
level_hints:                   # optional: per-paper tooltips for the level buttons
  hs: "Classroom science and a little coding"
authors:
  - name: Full Name
    affiliation: Institution
    member: member-file-slug     # links to their _members page, if one exists
    link: https://...            # otherwise an outside link
sources:
  - venue: "Journal V(N):A · Year"
    title: "Paper title"
    url: https://...
    access: Open access
code: { label: "Repository name", url: https://github.com/... }
citations: [citation-id-from-_data/citations.yaml]
widget:
  css: [/papers/<slug>/widget.css]
  js: [/papers/<slug>/engine.js, /papers/<slug>/widget.js]
credit: "Markdown line on how the page was built and checked"
ai_model: "Claude Opus 5.5 Extra"  # optional: the layout's AI-development note names this model (default shown)
bibtex: |
  @article{...}
```

## Writing per level

Wrap text for specific levels in a block with `data-levels` and `markdown="1"`:

```html
<div data-levels="public hs" markdown="1">
Text for the public and high-school levels.
</div>
```

Anything without `data-levels` shows at every level. Widgets can mark their own
elements (including SVG groups) with `data-levels`, and can listen for
`document.addEventListener("paperlevel", e => e.detail.level)`.

Every level gets an opening paragraph (class `lede`), the same demos, and its own
explanation after each demo. Levels: public (no background), high school (bits and
bytes), undergraduate (digital logic and programming), graduate (probability and
domain basics), researcher (full method, statistics, open questions).

## Checks before merging

- Every number on the page traces to the paper or to a computation the page runs.
- Figures computed in the browser say so, with their sample size next to the paper's.
- The page works at 390 px wide and in all six site themes.
- Share links carry `?level=` when a non-default level is selected.
