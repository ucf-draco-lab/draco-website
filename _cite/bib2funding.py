"""
bib2funding.py — Convert funding.bib into _data/funding.yaml for the DRACO Lab website.

Reads the structured grant entries from _bibliography/funding.bib and produces
a YAML data file grouped by status (active, pending, completed) with computed
PI-share amounts and aggregate totals.

Usage:
    python _cite/bib2funding.py
"""

import re
import sys
import yaml
from pathlib import Path
from pybtex.database import parse_string

# ─── Configuration ───────────────────────────────────────────────────────────

INPUT_FILE = Path("_bibliography/funding.bib")
OUTPUT_FILE = Path("_data/funding.yaml")

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
    prev = None
    while prev != text:
        prev = text
        text = re.sub(r'\{([^{}]*)\}', r'\1', text)
    text = text.replace("\\&", "&").replace("\\#", "#").replace("\\$", "$")
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) >= 2 and text[0] == '"' and text[-1] == '"':
        text = text[1:-1].strip()
    # Convert remaining straight double-quotes to curly pairs (HTML-safe)
    result, n = [], 0
    for ch in text:
        if ch == '"':
            result.append("\u201c" if n % 2 == 0 else "\u201d")
            n += 1
        else:
            result.append(ch)
    return "".join(result)


def get_field(entry, name, default=""):
    val = entry.fields.get(name, default)
    return clean_latex(str(val)) if val else default


def preprocess_bib(text):
    """Strip %-prefixed comment lines."""
    lines = text.split("\n")
    return "\n".join(l for l in lines if not l.lstrip().startswith("%"))


def fmt_amount(k_dollars):
    """Format amount in K to human-readable string: $150K, $1.2M, etc."""
    if k_dollars >= 1000:
        m = k_dollars / 1000
        if m == int(m):
            return f"${int(m)}M"
        return f"${m:.1f}M"
    return f"${k_dollars}K"


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    log("")
    log("=" * 60)
    log("bib2funding: Converting funding.bib to funding.yaml")
    log("=" * 60)

    if not INPUT_FILE.exists():
        log(f"{INPUT_FILE} not found!", tag="ERROR")
        sys.exit(1)

    raw = INPUT_FILE.read_text(encoding="utf-8")
    cleaned = preprocess_bib(raw)

    try:
        bib_data = parse_string(cleaned, bib_format="bibtex")
    except Exception as e:
        log(f"Parse error: {e}", tag="ERROR")
        sys.exit(1)

    grants = []
    for key, entry in bib_data.entries.items():
        title = get_field(entry, "title")
        institution = get_field(entry, "institution")
        note = get_field(entry, "note")
        year = get_field(entry, "year")

        # Custom structured fields
        total_k = int(get_field(entry, "usera", "0") or 0)
        share_pct = int(get_field(entry, "userb", "0") or 0)
        role = get_field(entry, "userc", "PI")
        share_k = round(total_k * share_pct / 100)

        # Status from keywords
        keywords = get_field(entry, "keywords")
        status = "completed"
        for s in ["active", "pending", "completed"]:
            if s in keywords.lower():
                status = s
                break

        grant = {
            "id": key,
            "title": title,
            "institution": institution,
            "period": note,
            "year": int(year) if year.isdigit() else 0,
            "total": total_k,
            "total_fmt": fmt_amount(total_k),
            "share_pct": share_pct,
            "share": share_k,
            "share_fmt": fmt_amount(share_k),
            "role": role,
            "status": status,
        }
        grants.append(grant)

    # Sort each group: active/pending by year desc, completed by year desc
    grants.sort(key=lambda g: g["year"], reverse=True)

    # Compute aggregate stats
    active = [g for g in grants if g["status"] == "active"]
    pending = [g for g in grants if g["status"] == "pending"]
    completed = [g for g in grants if g["status"] == "completed"]

    total_awarded_k = sum(g["total"] for g in active + completed)
    total_share_k = sum(g["share"] for g in active + completed)
    total_pending_k = sum(g["total"] for g in pending)
    total_all_k = total_awarded_k + total_pending_k

    stats = {
        "total_awarded": total_awarded_k,
        "total_awarded_fmt": fmt_amount(total_awarded_k),
        "total_share": total_share_k,
        "total_share_fmt": fmt_amount(total_share_k),
        "total_pending": total_pending_k,
        "total_pending_fmt": fmt_amount(total_pending_k),
        "total_all": total_all_k,
        "total_all_fmt": fmt_amount(total_all_k),
        "count_active": len(active),
        "count_pending": len(pending),
        "count_completed": len(completed),
        "count_all": len(grants),
    }

    output = {
        "stats": stats,
        "grants": grants,
    }

    log(f"  Active:    {len(active)} grants")
    log(f"  Pending:   {len(pending)} grants")
    log(f"  Completed: {len(completed)} grants")
    log(f"  Awarded total:  {fmt_amount(total_awarded_k)}")
    log(f"  PI share total: {fmt_amount(total_share_k)}")

    # Write YAML
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    class CleanDumper(yaml.SafeDumper):
        pass
    def str_representer(dumper, data):
        return dumper.represent_scalar("tag:yaml.org,2002:str", data)
    CleanDumper.add_representer(str, str_representer)

    header = "# DO NOT EDIT — generated automatically by bib2funding.py\n"
    header += f"# Source: _bibliography/funding.bib ({len(grants)} entries)\n\n"

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(header)
        yaml.dump(
            output, f,
            Dumper=CleanDumper,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
            width=120,
        )

    log(f"Wrote {OUTPUT_FILE}")
    log("All done!", tag="SUCCESS")


if __name__ == "__main__":
    main()
