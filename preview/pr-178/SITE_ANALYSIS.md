# DRACO Lab Website - Site Analysis & Enhancement Suggestions

**Date:** 2026-03-12
**Site:** thedracolab.com
**Stack:** Jekyll 4.3, Greene Lab Website Template, GitHub Pages

---

## Current State Summary

The DRACO Lab website is built on the Greene Lab Website Template (Jekyll-based).
It has 6 main sections (Home, Research, Projects, Team, Updates, Contact), plus a
Privacy page. Content is managed through Jekyll collections: 80+ team members,
22 blog posts, 8 projects, and ~945 lines of auto-generated citation data via
Manubot/ORCID integration.

### What's Working Well

- Open Graph, Twitter Card meta tags, JSON-LD schema, and RSS feed
- Full dark/light mode toggle with CSS custom properties
- Manubot-powered citation pipeline from ORCID
- Clean Jekyll collections architecture (members, posts, projects)
- Custom 404 page with site-wide search
- Privacy policy present and current

---

## Enhancement Suggestions

### P0 - Critical

#### 1. Image Optimization (275 MB total)

The `images/` directory contains 159 images totaling 275 MB. Most are unoptimized
PNG/JPG files. Only 5 use WebP format. Several portrait images exceed 10 MB each.

**Largest offenders:**
- `riley-newport.png` - 12 MB
- `ilona-van-der-linden.png` - 12 MB
- `ashley-hanzelka.png` / `ash-hanzelka.png` - 11 MB each (possible duplicate)
- `christina-till.png` - 9.5 MB

**Recommendations:**
- Convert all images to WebP (80-90% size reduction)
- Resize portraits to max 800px wide (displayed as small thumbnails)
- Add build-time image optimization (GitHub Action with sharp/imagemagick)
- Add `loading="lazy"` to figure.html and portrait.html includes
- Remove apparent duplicate (ash-hanzelka.png vs ashley-hanzelka.png)

#### 2. Set `site.url` and `site.description` in `_config.yaml`

- `site.description` is empty (line 4) - affects OG/meta description tags
- `site.url` is not set - affects JSON-LD schema and canonical URLs
- Add: `url: "https://thedracolab.com"`
- Add: `description: "DRACO Lab at UCF explores secure and resilient computing at the intersection of hardware, embedded systems, and AI."`

---

### P1 - Important

#### 3. Add `robots.txt`

No robots.txt exists. Add one pointing to the sitemap.

#### 4. Fix HTTP -> HTTPS Links

Several links use `http://` instead of `https://`:
- `team/index.md`: sponsor links (nsf.gov, nsa.gov, energy.gov, etc.)
- `research/index.md`: Google Scholar and ResearchGate buttons

#### 5. Fix Typos

- `team/index.md` line 61: "sponors" -> "sponsors", "entitles" -> "entities"

#### 6. Add SRI Hashes to CDN Scripts

`_includes/scripts.html` loads Popper.js, Tippy.js, and Mark.js from unpkg.com
without Subresource Integrity hashes. Pin versions and add `integrity` attributes.

#### 7. Fix Blog Post Date Format

`2025-01-23-graduate-welcome.md` has `date: 23-01-2025` (DD-MM-YYYY) instead
of the expected YYYY-MM-DD format.

---

### P2 - Moderate

#### 8. Accessibility: Skip-to-Content Link

`default.html` has no skip navigation link. Add:
```html
<a class="skip-link" href="#main-content">Skip to content</a>
```

#### 9. Lazy Loading for Images

Add `loading="lazy"` attribute to images in figure.html and portrait.html includes.

#### 10. Fix Nav Order Conflict

Both `contact/index.md` and `privacy/index.md` have `nav.order: 5`. Give Privacy
a different order or make it footer-only.

#### 11. Nav/Heading Consistency

Blog nav title says "Updates" but page heading says "News & Events".

#### 12. Complete Contact Page

The contact page ends abruptly after the section divider. Consider adding office
hours, a map embed, or additional contact methods.

---

### P3 - Nice-to-Have

#### 13. Analytics

`analytics.html` is an empty placeholder. Consider Plausible or Umami for
privacy-respecting analytics.

#### 14. Content Freshness

Last blog post is from January 2025 (14+ months ago). Regular updates signal
an active lab.

#### 15. Homepage Enhancements

- Add a prominent "Join Us" / "Open Positions" call-to-action
- Add publication count badge ("100+ publications")

#### 16. Developer Experience

- Set `baseurl: ""` explicitly in config
- Consider a Makefile for common tasks (serve, build, optimize-images)

#### 17. Security Headers

- Add Content Security Policy via meta tag or `_headers` file
- Add `rel="noopener noreferrer"` to external links
