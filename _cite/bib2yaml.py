"""
bib2yaml.py — Convert BibTeX files into citations.yaml for the DRACO Lab website.

Replaces the Manubot/ORCID citation pipeline. BibTeX files in _bibliography/
are the single source of truth for all publications.

Usage:
    python _cite/bib2yaml.py
"""

import re
import sys
import yaml
from pathlib import Path
from pybtex.database import parse_string

# ─── Configuration ───────────────────────────────────────────────────────────

# Map each bib file to a publication type (used for icons and filtering).
# Order here controls processing order (not output order — output is by date).
BIB_FILE_MAP = {
    "pubs.bib":                     "journal",
    "proceedings.bib":              "conference",
    "books.bib":                    "book",
    "invited.bib":                  "invited",
    "conf_pres_no_proceeding.bib":  "presentation",
    "otherwork.bib":                "other",
}

INPUT_DIR = Path("_bibliography")
OUTPUT_FILE = Path("_data/citations.yaml")

# Month name/number → zero-padded number
MONTH_MAP = {
    "jan": "01", "feb": "02", "mar": "03", "apr": "04",
    "may": "05", "jun": "06", "jul": "07", "aug": "08",
    "sep": "09", "oct": "10", "nov": "11", "dec": "12",
    "january": "01", "february": "02", "march": "03", "april": "04",
    "june": "06", "july": "07", "august": "08",
    "september": "09", "october": "10", "november": "11", "december": "12",
}

# ─── Helpers ─────────────────────────────────────────────────────────────────

def log(msg, level=0, tag=""):
    prefix = "  " * level
    if tag:
        prefix = f"{prefix}[{tag}] "
    print(f"{prefix}{msg}")


def clean_latex(text):
    """Strip common LaTeX artifacts from a string."""
    if not text:
        return ""
    text = str(text)
    # Remove wrapping braces (e.g., {Title} → Title), iteratively
    prev = None
    while prev != text:
        prev = text
        text = re.sub(r'\{([^{}]*)\}', r'\1', text)
    # Unescape common LaTeX commands
    replacements = {
        "\\&": "&", "\\%": "%", "\\$": "$", "\\#": "#", "\\_": "_",
        "\\textendash": "–", "\\textemdash": "—",
        "\\textquoteright": "\u2019", "\\textquoteleft": "\u2018",
        "~": "\u00a0",  # non-breaking space
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def format_person(person):
    """Convert a pybtex Person to 'First Last' string."""
    parts = []
    firsts = " ".join(person.first_names)
    middles = " ".join(person.middle_names)
    lasts = " ".join(person.last_names)
    if firsts:
        parts.append(firsts)
    if middles:
        parts.append(middles)
    if lasts:
        parts.append(lasts)
    name = " ".join(parts)
    name = clean_latex(name).rstrip(".")
    return name


def get_field(entry, name, default=""):
    """Safely get a BibTeX field value, cleaned of LaTeX."""
    val = entry.fields.get(name, default)
    return clean_latex(str(val)) if val else default


def parse_month(raw):
    """Convert month field (name or number) to zero-padded string."""
    raw = str(raw).strip().lower().rstrip(".")
    if raw in MONTH_MAP:
        return MONTH_MAP[raw]
    try:
        m = int(raw)
        if 1 <= m <= 12:
            return f"{m:02d}"
    except ValueError:
        pass
    # Try extracting month from compound strings like "August/2024"
    for name, num in MONTH_MAP.items():
        if name in raw:
            return num
    return ""


def build_date(entry):
    """Construct a YYYY-MM-DD date string from year/month/day fields."""
    year = get_field(entry, "year")
    if not year:
        return ""
    # Some year fields have extra text; extract the 4-digit year
    match = re.search(r'(\d{4})', year)
    if not match:
        return ""
    year = match.group(1)

    month = parse_month(get_field(entry, "month"))
    day = get_field(entry, "day")
    if day:
        try:
            day = f"{int(day):02d}"
        except ValueError:
            day = ""

    if month and day:
        return f"{year}-{month}-{day}"
    elif month:
        return f"{year}-{month}-01"
    else:
        return f"{year}-01-01"


def build_link(entry):
    """Get the best available link: DOI > URL > empty."""
    doi = get_field(entry, "doi")
    if doi:
        doi = doi.strip()
        if doi.startswith("http"):
            return doi
        doi = re.sub(r'^https?://doi\.org/', '', doi)
        return f"https://doi.org/{doi}"
    url = get_field(entry, "url")
    if url:
        return url.strip()
    return ""


def get_publisher(entry, entry_type):
    """Extract the most appropriate venue/publisher string."""
    # For conference papers, prefer booktitle
    for field in ["booktitle", "journal", "series", "howpublished", "publisher"]:
        val = get_field(entry, field)
        if val:
            return val
    return ""


def preprocess_bib(text):
    """
    Clean raw BibTeX text before parsing:
      - Remove %-prefixed comment lines (pybtex doesn't handle them)
      - Fix Oxford commas in author fields (', and' → ' and')
        e.g. {Shah, Sajjad H., and Borowczak, Mike} breaks pybtex
    """
    # Strip comment lines
    lines = text.split("\n")
    cleaned = [line for line in lines if not line.lstrip().startswith("%")]
    text = "\n".join(cleaned)

    # Fix Oxford commas in author fields:
    # Match 'author = {....}' and within it replace ', and ' with ' and '
    def fix_author_field(m):
        return m.group(0).replace(", and ", " and ")
    text = re.sub(
        r'(author\s*=\s*\{[^}]+\})',
        fix_author_field,
        text,
        flags=re.IGNORECASE
    )

    return text


# ─── Main ────────────────────────────────────────────────────────────────────

def process_bib_file(filepath, pub_type):
    """Parse a single .bib file and return a list of citation dicts."""
    log(f"Processing {filepath.name} → type={pub_type}")

    raw_text = filepath.read_text(encoding="utf-8")
    cleaned_text = preprocess_bib(raw_text)

    try:
        bib_data = parse_string(cleaned_text, bib_format="bibtex")
    except Exception as e:
        log(f"Failed to parse {filepath.name}: {e}", level=1, tag="ERROR")
        return []

    citations = []
    for key, entry in bib_data.entries.items():
        authors = [format_person(p) for p in entry.persons.get("author", [])]

        title = get_field(entry, "title")
        if not title:
            log(f"Skipping {key}: no title", level=1, tag="WARN")
            continue

        citation = {
            "id": key,
            "title": title,
            "authors": authors,
            "publisher": get_publisher(entry, entry.type),
            "date": build_date(entry),
            "link": build_link(entry),
            "type": pub_type,
            "source": filepath.name,
        }

        # Add tags: always include the type for filtering/searchability
        tags = [pub_type]
        keywords = get_field(entry, "keywords")
        if keywords:
            # Split on semicolons first, fall back to commas
            kw_list = [k.strip() for k in keywords.split(";")]
            if len(kw_list) == 1:
                kw_list = [k.strip() for k in keywords.split(",")]
            tags.extend(kw_list[:5])
        citation["tags"] = tags

        citations.append(citation)

    log(f"  {len(citations)} entries", level=1)
    return citations


def main():
    log("")
    log("=" * 60)
    log("bib2yaml: Converting BibTeX to citations.yaml")
    log("=" * 60)

    if not INPUT_DIR.exists():
        log(f"Input directory '{INPUT_DIR}' not found!", tag="ERROR")
        sys.exit(1)

    all_citations = []
    errors = False

    for bib_filename, pub_type in BIB_FILE_MAP.items():
        filepath = INPUT_DIR / bib_filename
        if not filepath.exists():
            log(f"{filepath} not found, skipping", tag="WARN")
            continue
        try:
            entries = process_bib_file(filepath, pub_type)
            all_citations.extend(entries)
        except Exception as e:
            log(f"Error processing {filepath}: {e}", tag="ERROR")
            errors = True

    # Sort by date descending
    all_citations.sort(key=lambda c: c.get("date", ""), reverse=True)
    log(f"\nTotal citations: {len(all_citations)}")

    # Write YAML output
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    class CleanDumper(yaml.SafeDumper):
        pass

    def str_representer(dumper, data):
        if "\n" in data:
            return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="|")
        return dumper.represent_scalar("tag:yaml.org,2002:str", data)

    CleanDumper.add_representer(str, str_representer)

    header = "# DO NOT EDIT — generated automatically by bib2yaml.py\n"
    header += f"# Source: _bibliography/*.bib ({len(all_citations)} entries)\n\n"

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(header)
        yaml.dump(
            all_citations,
            f,
            Dumper=CleanDumper,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
            width=120,
        )

    log(f"Wrote {OUTPUT_FILE}")

    if errors:
        log("Completed with errors", tag="ERROR")
        sys.exit(1)
    else:
        log("All done!", tag="SUCCESS")


if __name__ == "__main__":
    main()
