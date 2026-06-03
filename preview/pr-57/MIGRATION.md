# BibTeX Citation & Funding Pipeline Migration

## What changed

The old citation pipeline (ORCID → Manubot → `_data/citations.yaml`) has been
replaced with direct BibTeX-to-YAML converters. Your `.bib` files in
`_bibliography/` are now the single source of truth for publications and funding.

A new **Funding** page has been added, driven by `_bibliography/funding.bib`.

## Extract instructions

From the repo root:

```bash
unzip -o draco-bib-migration.zip
```

This overwrites the listed files only — no other files are affected.

## Files in this archive

| Path | Status | Description |
|------|--------|-------------|
| **Converters** | | |
| `_cite/bib2yaml.py` | new | BibTeX → citations.yaml (replaces `cite.py`) |
| `_cite/bib2funding.py` | new | funding.bib → funding.yaml |
| `_cite/requirements.txt` | replaced | `pybtex` + `PyYAML` |
| **BibTeX sources** | | |
| `_bibliography/*.bib` | new dir | 7 bib files (6 publication + 1 funding) |
| **Generated data** | | |
| `_data/citations.yaml` | replaced | 152 publications from bib files |
| `_data/funding.yaml` | new | 43 grants with computed stats |
| `_data/types.yaml` | replaced | Added conference, invited, presentation, other, active, pending, completed types |
| **Pages & templates** | | |
| `research/index.md` | replaced | Filter buttons, full-bleed video hero, removed Manubot disclaimer |
| `funding/index.md` | new | Funding page with stats + grant cards |
| `_includes/funding-card.html` | new | Grant card template |
| `_plugins/youtube.rb` | replaced | Clean class-based markup, click-to-play, no inline styles |
| **Styles** | | |
| `_styles/pub-filters.scss` | new | Publication filter pill buttons |
| `_styles/funding.scss` | new | Funding stats + grant card styling |
| `_styles/video-hero.scss` | new | Full-bleed dark hero with glow + YouTube embed base |
| **Config & CI** | | |
| `_config.yaml` | replaced | Added `_bibliography` to exclude list |
| `.github/workflows/update-citations.yaml` | replaced | Runs both bib2yaml.py and bib2funding.py |

## Files you can remove after migration

- `_data/orcid.yaml`
- `_data/_outdated_sources.yaml`
- `_cite/cite.py`
- `_cite/util.py`
- `_cite/plugins/` (entire directory)

## How it works

### Publications (`bib2yaml.py`)

Parses 6 bib files, each mapped to a type:

| File | Type |
|------|------|
| `pubs.bib` | journal |
| `proceedings.bib` | conference |
| `books.bib` | book |
| `invited.bib` | invited |
| `conf_pres_no_proceeding.bib` | presentation |
| `otherwork.bib` | other |

Outputs `_data/citations.yaml` matching the existing site schema. The research
page renders a combined list with filter buttons that hook into the existing
tag-based search system.

### Funding (`bib2funding.py`)

Parses `funding.bib` which uses custom BibTeX fields:

| Field | Meaning |
|-------|---------|
| `usera` | Total award in thousands ($K) |
| `userb` | PI share percentage (0–100) |
| `userc` | Role (PI, Co-PI, PI-LI) |
| `keywords` | Status: active, pending, completed |
| `note` | Date range or submission status |

Outputs `_data/funding.yaml` with per-grant data and aggregate stats
(total awarded, PI share, counts). The funding page displays summary
stats at the top and grants grouped by status.

### CI pipeline

On push/PR/schedule, GitHub Actions runs both converters:

```
python _cite/bib2yaml.py     # → _data/citations.yaml
python _cite/bib2funding.py  # → _data/funding.yaml
```

### Running locally

```bash
pip install -r _cite/requirements.txt
python _cite/bib2yaml.py
python _cite/bib2funding.py
```

## Notes

- `books.bib` entry `borowczak-stem-handbook` is skipped (no title field yet).
- The converter preprocesses Oxford commas in author fields (`Shah, Sajjad H., and` → `Shah, Sajjad H. and`).
- `%`-prefixed comment lines are stripped before parsing (pybtex doesn't support them natively).
- Nav order for Funding is 1.5 (between Research at 1 and Projects at 2).
