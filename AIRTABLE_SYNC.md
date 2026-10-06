# Airtable ↔ website disconnects

Snapshot taken **2026-10-06** against the `Researchers` table of the **DRACO**
Airtable base (`appnKGo7NspWFrwcx`), superseding the 2026-08-21 pass. Everything
listed here is a place where the base and `_members/` disagree, or where the
base itself has a hole that the site then renders as a blank. Nothing below is
fixed silently — the fixes that *were* applied are in the commit that updates
this file; what remains is the next pass.

## What this pass changed

- **Degrees now name the institution that awarded them.** See "The institution
  model" below. This is the headline change: before it, every row of the alumni
  table read as a UCF degree.
- **Six researchers Airtable flags `BS Alum` were listed only as graduate
  students** — `daniel-de-armas`, `daniel-odi`, `francisco-soriano`,
  `gabriel-martin`, `jarred-long`, `nina-tran`. They now carry
  `role: [ms, alumni]` and a B.S. degree row, which is the treatment
  `jordan-merkel`, `leo-melson`, `robert-lee`, `michael-castiglia` and
  `franco-mezzarapa` already had. This was deferred by the last pass because it
  changes who counts as an alum; the alumni table went from 34 degree rows to 40.
- **Six alumni had no `date:`**, so Jekyll gave them the *build* date and they
  would have silently moved to 2027 in January. Dated from the most recent
  degree each has actually completed.
- **Five Lab Status `Active` researchers had no page at all** — `lawson-heard`,
  `matthew-edun`, `matthew-saintilus`, `osmand-arburua`, `aaditya-patel`. Added
  with generated stubs; they need real bios and headshots (§0).
- `sriram-nimmala`'s display name was lower-cased (`sri ram nimmala`) and his
  bio was missing a verb. Both fixed.

## The institution model

The lab is at UCF, but not every degree its people hold was awarded by UCF —
several earned a B.S. elsewhere before joining, and the PI's move from the
University of Wyoming means Wyoming degrees recur. The alumni table lists
level, major and year, so before this pass a non-UCF degree read as a UCF one.

Each entry in a member's `degrees:` block now takes an `institution:` key,
whose value is a key in `_data/institutions.yaml` (itself a mirror of
Airtable's `Academic Institutions` table, `tbllTiwXQmSFew1wY`):

```yaml
degrees:
  - level: B.S.
    major: Computer Science
    year: 2024
    institution: uwyo
```

The alumni table renders it as a sortable, filterable, groupable **Institution**
column. The cell shows the abbreviation (`UCF`, `UWyo`) with the full name as
its hover text; the `data-institution` attribute that sorting, filtering and the
search box read carries the *full* name, so "Wyoming" matches. An
`institution:` value with no entry in the data file still renders, as its own
literal text, so a one-off needs no entry.

**The institution is never inferred.** A degree row that names none renders as
an em dash rather than defaulting to UCF — defaulting is exactly the bug this
replaces. All 40 current rows name one: 39 UCF and one Wyoming.

### Non-UCF degrees known to the lab

| Member | Degree | Institution | In the alumni table? | Source |
| --- | --- | --- | --- | --- |
| `alicia-thoney` | B.S. Computer Science 2024 | University of Wyoming | **yes** — was reading as UCF, now fixed | her bio, confirmed by the PI |
| `calvin-vanwormer` | B.S. Computer Science | University of Wyoming | no — he has no B.S. row | his bio, confirmed by the PI |
| `jenna-goodrich` | B.S. (no major or year on file) | University of Wyoming | no — she has no B.S. row | Airtable `Undergraduate Institution` |
| `ilona-van-der-linden` | B.S. Computer Science | University of Wyoming | no — no `degrees:` block | her bio |
| `ilona-van-der-linden` | M.S. Computer Science | Santa Clara University | no — no `degrees:` block | her bio |
| `sriram-nimmala` | M.S. Electrical Engineering 2024 | UT Dallas | no — no `degrees:` block | his bio |
| `_andey-robins` | B.S. Computer Science | University of Wyoming | no — member is hidden | his bio |

Only Alicia's row was actually being published as a UCF degree. The others are
recorded here because the moment any of them gains a `degrees:` block — which a
naive sync of Airtable's `Undergraduate Graduation Year` would do — it would
inherit the same error. **Calvin's is the live trap:** Airtable has him at
`Computer Science 2022` with the institution blank, so syncing that field
without reading this table would publish a Wyoming B.S. as a UCF one.

Santa Clara University and UT Dallas are *not* in Airtable's `Academic
Institutions` table and so are not in `_data/institutions.yaml` either. They
need adding to Airtable before either member's degrees can be synced.

## 0. Headshots — who still needs one

Airtable serves attachments from `v5.airtableusercontent.com`, which this
environment's network policy still refuses (`403` on `CONNECT`, re-tested
2026-10-06). So no headshot can be pulled from a session configured like this
one; they have to come from a session whose environment allows that host, or by
hand.

### 0.1 Rendering the fallback portrait right now

Ten published members have an `image:` path with no file behind it, so they
render `images/fallback.svg`. Nine of the ten have a headshot sitting in
Airtable, unreachable from here:

| Member | Airtable headshot | Note |
| --- | --- | --- |
| `kathlyn-buckley` | yes | not flagged by the last pass |
| `rebecca-smith` | yes | not flagged by the last pass |
| `ryan-eng` | yes | not flagged by the last pass |
| `yuliia-plysiuk` | yes | not flagged by the last pass |
| `eren-durham` | yes, 2472×2160 | outstanding since the last pass |
| `lawson-heard` | yes, 1206×1310 | added this pass |
| `matthew-edun` | yes, 1084×1295 | added this pass |
| `osmand-arburua` | yes, 1179×2556 | added this pass |
| `aaditya-patel` | yes, 1897×2386 | added this pass |
| `matthew-saintilus` | **no** | must be collected directly |

### 0.2 Airtable has a newer headshot or bio than the repo

Unchanged from the last pass — all five still pending, for the same reason:

`sebastian-candelaria` (Airtable holds `.png` at 2189×3292, repo references
`.jpeg`), `ilona-van-der-linden` (Airtable `.png` 2160×2880, repo `.jpg`; the
attachment filename is the literal `-.png`), `alexei-solonari` (444×451),
`lakshmi-ramanathan` (456×540), `evan-eichholz` (Airtable 1170×1487 against a
196×212 repo copy).

The signal is Airtable's `headshot-bio-update` field, a last-modified stamp over
exactly two fields — `Headshot` and `BiographyMarkdown`. Compared against the
date each member's image last changed in git it gives a reliable "Airtable has
something newer" flag, though it cannot distinguish a new headshot from a new
bio attachment.

### 0.3 Published, but Airtable has no headshot on file at all

Airtable cannot be the source for these — the photo has to be collected
directly. All but `matthew-saintilus` already have a usable repo image, so only
he is actually broken.

`aaron-lingerfelt`, `andrea-borowczak`, `donald-doyle`, `jarett-artman`,
`jarred-long`, `jenna-goodrich`, `lana-perkins`, `luckner-ablard`,
`malia-rojas`, `matthew-saintilus`, `nina-tran`, `sheridan-sloan`, `yvan-pierre`

### 0.4 Still below the 400px the site renders at

The portrait slot generates 400px and 800px WebP variants and the generator only
downscales, so anything smaller is served upscaled and soft.

| Member | Size | Note |
| --- | --- | --- |
| `evan-eichholz` | 196×212 | fixed by pulling the Airtable headshot (§0.2) |
| `andrea-borowczak` | 250×300 | no Airtable headshot (§0.3) |
| `davi-dantas` | 306×506 | both repo copies are this size |
| `malia-rojas` | 343×372 | best copy in the repo; no Airtable headshot |
| `aidan-bowman` | 389×389 | marginal |
| `_arturo-lara` | 175×174 | member is hidden |

## 1. Conflicting values

- **`calvin-vanwormer` — B.S. graduation year.** Airtable's *Undergraduate
  Graduation Year* says `2022`; his bio says "graduated with his Bachelor of
  Science in Computer Science from the University of Wyoming in **Spring
  2024**". Two years apart, and nothing on the site depends on it yet because he
  has no B.S. degree row — but one of the two is wrong and it needs settling
  before his undergraduate record is published.
- **`jarred-long` — B.S. graduation year.** Airtable says `2025`; his bio opens
  "Jarred Long (CpE BS '24)". His new degree row carries **2024**, following the
  rule that a member's own words win, and his `date:` was set to match. If
  Airtable is right, both need moving to 2025.
- **`joshua-joseph` — first company after graduation.** The site says `Snowcap`
  (his bio: "His first job after graduation was with Snowcap"); Airtable's
  *Company Post Graduation* says `Northrop Grumman`. The site value was kept
  because the bio corroborates it. One of the two is stale. Unchanged.
- **`ash-hanzelka` — name.** Site: `Ashley Hanzelka`. Airtable first name:
  `Ash`, no preferred name set. Two headshots exist (`ash-hanzelka.jpg`,
  `ashley-hanzelka.jpg`), only one referenced. Unchanged.
- **`ilona-van-der-linden` — name casing.** Site: `Lona Van Der Linden`.
  Airtable: first `Ilona`, last `van der Linden`, preferred `Lona`. Her own bio
  prose uses `Lona van der Linden`, so the site's title-casing of the particle
  is wrong either way. Unchanged.

## 2. Holes in Airtable that the site renders as blanks

- **No *Undergraduate Institution*** — 18 records, now the field that matters
  most: `aaditya--patel`, `alicia-thoney`, `calvin-vanwormer`, `christina-till`,
  `cory-brynds`, `eren-durham`, `ilona-van-der-linden`, `katelin-shaffer`,
  `lakshmi-katravulapalli`, `lakshmi-ramanathan`, `lawson-heard`,
  `marcus-simmonds`, `matthew-edun`, `matthew-saintilus`, `osmand-arburua`,
  `sagar-srujan-somepalli`, `sarayu-panditi`, `sriram-nimmala`. Filling these in
  is the single highest-value edit on the Airtable side: it is what lets the
  undergraduate record of anyone in this list be synced without guessing.
- **No *Masters Institution*** where an MS year is set — `alicia-thoney`,
  `calvin-vanwormer`, `christina-till`, `cory-brynds`,
  `ilona-van-der-linden`, `sriram-nimmala`, `victoria-moreno`. The seven
  published M.S. rows were resolved from each member's own bio instead.
- **A malformed duplicate in *Academic Institutions*.** `recAti6EsR2KYzPYX`
  has `Short-Form` set to the literal `University of Central Florida` and no
  `Institution Name` at all, alongside the real UCF record
  (`recR9lyz47DBEp0ww`). Nothing links to it; it should be deleted before
  something does.
- **A trailing space in `aaditya--patel`'s *First Name*** (`"Aaditya "`), which
  is why the `filename_base` formula yields a double hyphen. His page is at
  `_members/aaditya-patel.md`; fixing the field would make the two agree.
- **No undergraduate major** — `aaron-lingerfelt`, `lana-perkins`,
  `luckner-ablard`, `malia-rojas`, `sheridan-sloan`, `yvan-pierre`. Their
  alumni-table Major cell is an em dash. Unchanged.
- **No master's major** — `jarett-artman`, `jenna-goodrich`. Unchanged.
- **`aaditya--patel`'s undergraduate major is the choice `Other`**, so his stub
  claims no major.
- **No *Alumni Type*** — `cory-brynds` (bio says B.S. CpE UCF 2025 *and* M.S.)
  and `calvin-vanwormer` (site tags him `ms-alumni`). Both are alumni; the field
  is simply unset. Unchanged.
- **`ash-hanzelka` — *Company Post Graduation* is the literal string `TBD`.**
  Left out of the site rather than published as-is. Unchanged.
- **`nicole-baez-espinosa`** has no graduation year of any kind. Unchanged.
- **`lakshmi-ramanathan`** still has no bio anywhere: her *Biography* field
  holds pasted YAML front matter and the bio attachment is 248 bytes of the
  same. Her page carries the generated one-line stub. Unchanged.
- **`matthew-wilbanks`** listed his LinkedIn as a display name rather than a
  handle, so it could not be turned into a URL and was dropped. Unchanged.
- **Website Status is blank** for 21 published members, now including the five
  added this pass. If that field is meant to gate publication, the site is well
  ahead of it; the convention actually in force is Lab Status (§"Reproducing
  this"). Unchanged in substance.

## 3. Role tagging the site and Airtable disagree on

**Resolved this pass.** The six records Airtable marked `BS Alum` whose pages
carried only a graduate role — `daniel-de-armas`, `daniel-odi`,
`francisco-soriano`, `gabriel-martin`, `jarred-long`, `nina-tran` — are now
`role: [ms, alumni]` with a B.S. degree row each.

What is left is the mirror-image question, and it is a question for the PI
rather than a defect:

- ***MS Graduation Year* is being used for expected graduation, not award.**
  Eleven records have an MS year of 2026 or earlier while *Alumni Type* does not
  say `MS Alum`: `cade-chretien`, `calvin-vanwormer`, `christina-till`,
  `cory-brynds`, `gabriel-martin`, `ilona-van-der-linden`, `jarred-long`,
  `kyle-cahalan`, `lakshmi-katravulapalli`, `nina-tran`, `sriram-nimmala`. For
  `gabriel-martin`, `jarred-long` and `nina-tran` the year is now in the past,
  so they may be M.S. alumni too — but *Alumni Type* does not claim it and no
  bio corroborates it, so this pass did not assert it. The field cannot be used
  as an alumni signal until the two agree.

## 4. Site-only problems, unrelated to Airtable

- **`andrea-borowczak` has `role: Collaborator`**, which is not a key in
  `_data/types.yaml`. She gets no icon and no description, and no section on
  `team/index.md` filters for that role — so she is on the site but unreachable
  from the team page. Airtable has her as active faculty. Unchanged.
- **`team/index.md` filters on `role: capstone-senior`**, a role no member has
  and that `_data/types.yaml` does not define. That include renders nothing.
  Unchanged.
- **Unreferenced portraits** in `images/people/` — mostly the small copy left
  behind after a member was repointed at their `-hd` file, plus a few plain
  duplicates: `aaron-lingerfelt.jpg`, `andey-robins-hd.jpg`, `ash-hanzelka.jpg`,
  `davi-dantas.png`, `jarred-long.jpg`, `jenna-goodrich.jpg`,
  `joshua-joseph-hd.jpg`, `katherine-doyle.jpg`, `lana-perkins.jpg`,
  `luckner-ablard.jpeg`, `malia_rojas.jpg`, `michael-castiglia.jpg`,
  `mike-borowczak-hd.png`, `sagar-srujan-somepalli.jpg`, `samuel-lane.jpg`,
  `sebastian-candelaria.jpg`, `sheridan-sloan.png`. Safe to delete once the
  Airtable headshots in §0.2 have landed. Unchanged.
- **`sri-ram-nimmala.md` does not match Airtable's `filename_base`**
  (`sriram-nimmala`). The filename was left alone so the published URL does not
  break; his display name is now `Sriram Nimmala`. Either the file needs
  renaming with a redirect, or Airtable's First Name needs the space removed.
- **Graduation months are assumed.** Airtable records only a year, so every
  `date:` added this pass uses May except `francisco-soriano`, whose bio says
  "graduated in Fall 2024" and who is dated December. Where a member graduated
  in summer or fall, their card groups under the wrong term.

## Where a bio comes from

Bios are not written for a member while any source of their own words exists. In
precedence order:

1. **`BiographyMarkdown`** — the markdown file the member submitted. Used even
   when it is malformed, which it often is: bare front matter with no `---`
   fences, a BOM, CRLF, escaped `\---`, an `## Name` heading the member layout
   already renders, or a second stale attachment on the same record. Take the
   prose, drop the front matter (the repo's own front matter is the curated
   one), repair the source's formatting slips, and leave the wording alone.
2. **`Biography`** — the rich-text field, when it holds prose rather than pasted
   front matter or the `Third person bio goes here!` template line. Note that
   `BioSummary` and `Summary (Biography)` are `aiText` fields computed *from*
   this one, so they are generated, not input, and are never a source.
3. **Generated** — only when 1 and 2 are both empty, and then built from the
   record's structured fields rather than invented. The five pages added this
   pass are all at this level and say so in a frontmatter comment.

Two wrinkles the 2026-08-21 pass hit, both still live:

- **`Biography` can be newer than `BiographyMarkdown`.** `evan-eichholz` has an
  attachment describing a 2nd-year IEEE member and a `Biography` field
  describing side-channel work on embedded ML; the field is the later submission
  and is what the site carries. Prefer the markdown attachment, but check the
  field before overwriting a bio that is already more current.
- **Alumni tense.** An authored bio written while the member was enrolled reads
  wrong once they graduate. Follow `03b29e1`: past-tense only enrollment status
  and lab involvement, and leave interests, motivations and hobbies as written.

## Reproducing this

Airtable side:

- base `appnKGo7NspWFrwcx` → table `Researchers` (`tblh7i1sfs9nzOUOi`)
- institutions → table `Academic Institutions` (`tbllTiwXQmSFew1wY`), mirrored
  into `_data/institutions.yaml`
- "recently updated" = the `headshot-bio-update` last-modified field within the
  past 62 days
- `filename_base` is the formula field that matches a `_members/<slug>.md`
  filename

Site side: `_members/*.md`, where a leading `_` on the filename hides the member
from Jekyll — that convention lines up exactly with Airtable's `Lab Status:
Inactive`. There are 16 hidden files; 15 have an Airtable record and every one
of those is `Inactive`. The sixteenth, `_andey-robins`, has no record in the
base at all — he predates it.

Building: the repo pins `jekyll ~> 4.3`, which crashes on Ruby 3.3 (`undefined
method '[]' for nil` out of `logger`). CI uses Ruby 3.1 and so should any local
build — `PATH="/opt/rbenv/versions/3.1.6/bin:$PATH" bundle exec jekyll build`.
