# BibTeX Citation Pipeline Migration

## What changed

The old citation pipeline (ORCID → Manubot → `_data/citations.yaml`) has been
replaced with a direct BibTeX-to-YAML converter. Your `.bib` files in
`_bibliography/` are now the single source of truth for all publications.

## Files in this archive

Extract at the repo root. These files are **new or replaced**:

| Path | Status | Description |
|------|--------|-------------|
| `_cite/bib2yaml.py` | **new** | BibTeX → YAML converter (replaces `cite.py`) |
| `_cite/requirements.txt` | **replaced** | Now depends on `pybtex` instead of Manubot |
| `_bibliography/*.bib` | **new dir** | Your 6 bib files (source of truth) |
| `_data/citations.yaml` | **replaced** | Auto-generated from bib files (152 entries) |
| `_data/types.yaml` | **replaced** | Added `conference`, `invited`, `presentation`, `other` types |
| `_styles/pub-filters.scss` | **new** | Styling for type filter buttons |
| `research/index.md` | **replaced** | Filter buttons + updated intro (removed Manubot disclaimer) |
| `_config.yaml` | **replaced** | Added `_bibliography` to Jekyll exclude list |
| `.github/workflows/update-citations.yaml` | **replaced** | Calls `bib2yaml.py`, removed GOOGLE_SCHOLAR_API_KEY |

## Files you can remove after migration

These are no longer needed by the new pipeline:

- `_data/orcid.yaml` — ORCID ID list (was input for old pipeline)
- `_data/_outdated_sources.yaml` — old source data
- `_cite/cite.py` — old Manubot-based converter
- `_cite/util.py` — old utility module
- `_cite/plugins/` — old plugin directory (google-scholar, orcid, pubmed, sources)

## How it works

1. **Source of truth**: `_bibliography/*.bib` — 6 files mapped to publication types:
   - `pubs.bib` → `journal`
   - `proceedings.bib` → `conference`
   - `books.bib` → `book`
   - `invited.bib` → `invited`
   - `conf_pres_no_proceeding.bib` → `presentation`
   - `otherwork.bib` → `other`

2. **CI pipeline**: On push/PR/schedule, GitHub Actions runs `python _cite/bib2yaml.py`,
   which parses all `.bib` files and regenerates `_data/citations.yaml`.

3. **Research page**: The existing `list.html` + `citation.html` templates render
   entries from `_data/citations.yaml` unchanged. Filter buttons at the top let
   visitors narrow by type using the site's existing tag-based search system.

## Running locally

```bash
pip install -r _cite/requirements.txt
python _cite/bib2yaml.py
```

## Adding new publications

Edit the appropriate `.bib` file in `_bibliography/`, push, and CI regenerates
the YAML. The converter handles:

- `%`-prefixed comment lines (stripped before parsing)
- Oxford commas in author fields (`Shah, Sajjad H., and Borowczak, Mike`)
- LaTeX escapes (`\&`, `{braces}`, etc.)
- Month names and numbers → standardized dates
- DOI → `https://doi.org/...` links

## Note on `books.bib`

One entry (`borowczak-stem-handbook`) is skipped because it has no `title` field.
Add a title when it's available and it will appear automatically on the next build.
