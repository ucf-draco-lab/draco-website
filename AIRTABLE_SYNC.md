# Airtable ↔ website disconnects

Snapshot taken **2026-08-21** against the `Researchers` table of the **DRACO**
Airtable base (`appnKGo7NspWFrwcx`). Everything listed here is a place where the
base and `_members/` disagree, or where the base itself has a hole that the site
then renders as a blank. Nothing below is fixed silently — the fixes that *were*
applied are in the commit that adds this file; what remains is the next pass.

## 0. Headshots — who still needs one

Airtable serves attachments from `v5.airtableusercontent.com`, which the session's
egress policy refuses (`403` on `CONNECT`). So neither `Headshot` nor
`BiographyMarkdown` could be downloaded from here. The `BiographyMarkdown` set was
since delivered out of band (70 files) and applied — see "Where a bio comes from"
below. Every headshot in section 0.1 still needs pulling by hand or from a session
that can reach that host.

The signal used below is Airtable's `headshot-bio-update` field, which is a
last-modified stamp over exactly two fields — `Headshot` and `BiographyMarkdown`
(confirmed against the field schema). Compared against the date each member's
image last changed in git, that gives a reliable "Airtable has something newer"
flag — though it cannot distinguish a new headshot from a new bio attachment.

### 0.1 Airtable has a newer headshot or bio than the repo

All five had `headshot-bio-update` bumped on 2026-08-21, after their repo image
was last committed:

| Member | Airtable updated | Repo image last committed | Corroborating signal |
| --- | --- | --- | --- |
| `sebastian-candelaria` | 2026-08-21 | 2026-05-19 | Airtable holds `.png`, repo references `.jpeg` |
| `ilona-van-der-linden` | 2026-08-21 | 2026-05-19 | Airtable holds `.png`, repo references `.jpg` |
| `alexei-solonari` | 2026-08-21 | 2026-05-19 | — |
| `lakshmi-ramanathan` | 2026-08-21 | 2026-05-20 | — |
| `evan-eichholz` | 2026-08-21 | 2026-01-30 | repo copy is only 196×212; Airtable holds 1170×1487 |

`cade-chretien` and `katelin-shaffer` were also touched recently (2026-07-08/11)
but their repo images were committed 2026-07-31, so those are already current.

### 0.2 Missing from the repo entirely

`eren-durham` — record created 2026-08-20 with a headshot and bio attachment.
Her bio attachment has landed and now backs the page, along with the sponsor and
links her submission carried. The portrait still falls back to
`images/fallback.svg` until `images/people/eren-durham.jpg` lands.

### 0.3 Published, but Airtable has no headshot on file at all

Airtable cannot be the source for these — the photo would have to be collected
directly. Eight of the twelve are the legacy alumni batch added 2026-05-20.

`aaron-lingerfelt`, `andrea-borowczak`, `donald-doyle`, `jarett-artman`,
`jarred-long`, `jenna-goodrich`, `lana-perkins`, `luckner-ablard`, `malia-rojas`,
`nina-tran`, `sheridan-sloan`, `yvan-pierre`

### 0.4 Still below the 400px the site renders at

The portrait slot generates 400px and 800px WebP variants, and the generator only
downscales — anything smaller than 400px is served upscaled and soft. Eight
members were pointing at ~175px LinkedIn thumbnails while a full-size copy sat
unused beside it in the repo; those now reference the `-hd` file. What is left:

| Member | Size | Note |
| --- | --- | --- |
| `evan-eichholz` | 196×212 | fixed by pulling the Airtable headshot (0.1) |
| `andrea-borowczak` | 250×300 | no Airtable headshot (0.3) |
| `davi-dantas` | 306×506 | both repo copies are this size |
| `malia-rojas` | 343×372 | best copy in the repo; no Airtable headshot (0.3) |
| `aidan-bowman` | 389×389 | marginal |

## 1. Conflicting values

- **`joshua-joseph` — first company after graduation.** The site says `Snowcap`
  (his bio: "His first job after graduation was with Snowcap"); Airtable's
  *Company Post Graduation* says `Northrop Grumman`. The site value was kept
  because the bio corroborates it. One of the two is stale.
- **`ash-hanzelka` — name.** Site: `Ashley Hanzelka`. Airtable first name: `Ash`,
  no preferred name set. Two headshots exist (`ash-hanzelka.jpg`,
  `ashley-hanzelka.jpg`), only one referenced.
- **`ilona-van-der-linden` — name casing.** Site: `Lona Van Der Linden`. Airtable:
  first `Ilona`, last `van der Linden`, preferred `Lona`. Her own bio prose uses
  `Lona van der Linden`, so the site's title-casing of the particle is wrong
  either way.

## 2. Holes in Airtable that the site renders as blanks

- **No undergraduate major** — `aaron-lingerfelt`, `lana-perkins`,
  `luckner-ablard`, `malia-rojas`, `sheridan-sloan`, `yvan-pierre`.
- **No master's major** — `jarett-artman`, `jenna-goodrich`.
- **No *Alumni Type*** — `cory-brynds` (bio says B.S. CpE UCF 2025 *and* M.S.) and
  `calvin-vanwormer` (site tags him `ms-alumni`). Both are alumni; the field is
  simply unset, so the alumni table shows only the degree the site's `role` asserts.
- **No *Undergraduate Institution*** — `alicia-thoney` and `marcus-simmonds`, both
  flagged `BS Alum`. Alicia's bio says her B.S. is from the University of Wyoming,
  which matters: the alumni table lists level/major/year but not institution, so
  a non-UCF degree reads as a UCF one. Worth deciding whether the table should
  carry an institution column.
- **`ash-hanzelka` — *Company Post Graduation* is the literal string `TBD`.**
  Left out of the site rather than published as-is.
- **`nicole-baez-espinosa`** has no graduation year of any kind.
- **`lakshmi-ramanathan`** has no bio anywhere: her *Biography* field holds pasted
  YAML front matter instead of prose, and the bio attachment is 248 bytes (front
  matter again). Her page body was empty and now carries a one-line stub built
  from her Airtable record — the last resort in the precedence below. It should be
  replaced the moment she writes something.
- **`matthew-wilbanks`** listed his LinkedIn as a display name (`Matthew Wilbanks`)
  rather than a handle, so it could not be turned into a URL and was dropped. His
  real handle needs adding.
- **Website Status is blank** (neither `Online` nor `Offline`) for 16 members who
  *are* published: `aidan-bowman`, `andrea-borowczak`, `antonio-espinoza`,
  `benjamin-pierre`, `danielle-van`, `donald-doyle`, `eren-durham`, `jaden-yun`,
  `lakshmi-ramanathan`, `lina-rahama`, `matthew-wilbanks`, `mike-borowczak`,
  `nick-nimroozi`, `nickie-sethi`, `sarayu-panditi`,
  `sebastian-garayua-caraballo`. If that field is meant to gate publication, the
  site is ahead of it.

## 3. Role tagging the site and Airtable disagree on

Airtable marks these six as `BS Alum`, but their `_members` pages carry only the
graduate role, so they appear in neither the Alumni section nor the alumni table:

`daniel-de-armas`, `daniel-odi`, `francisco-soriano`, `gabriel-martin`,
`jarred-long`, `nina-tran`

The site already handles the same situation the other way for `jordan-merkel`,
`leo-melson`, `robert-lee`, `michael-castiglia` and `franco-mezzarapa`, which use
`role: [ms, alumni]` / `[phd, alumni]`. Making the six match is a one-line edit
each (`role: ms` → `role: [ms, alumni]`) plus a `degrees:` block — but it changes
*who counts as an alum* on the public page, so it is left for the next pass rather
than folded in here.

## 4. Site-only problems, unrelated to Airtable

- **Six alumni have no `date:`**, which is what the card view groups on. Jekyll
  gives an undated document the *build* date, so `alicia-thoney`, `cory-brynds`,
  `franco-mezzarapa`, `jordan-merkel`, `leo-melson` and `robert-lee` currently
  file under whatever year the site was last built, and will silently move to 2027
  in January. The table view is immune (it groups on the degree year), but the
  cards still need real dates.
- **`andrea-borowczak` has `role: Collaborator`**, which is not a key in
  `_data/types.yaml`. She gets no icon and no description, and no section on
  `team/index.md` filters for that role — so she is on the site but unreachable
  from the team page. Airtable has her as active faculty.
- **`team/index.md` filters on `role: capstone-senior`**, a role no member has and
  that `_data/types.yaml` does not define. That include renders nothing.
- **Unreferenced portraits** in `images/people/` — mostly the small copy left
  behind after a member was repointed at their `-hd` file, plus a few plain
  duplicates: `aaron-lingerfelt.jpg`, `andey-robins-hd.jpg`, `ash-hanzelka.jpg`,
  `davi-dantas.png`, `jarred-long.jpg`, `jenna-goodrich.jpg`,
  `joshua-joseph-hd.jpg`, `katherine-doyle.jpg`, `lana-perkins.jpg`,
  `luckner-ablard.jpeg`, `malia_rojas.jpg`, `michael-castiglia.jpg`,
  `mike-borowczak-hd.png`, `sagar-srujan-somepalli.jpg`, `samuel-lane.jpg`,
  `sebastian-candelaria.jpg`, `sheridan-sloan.png`. Safe to delete once the
  Airtable headshots in section 0.1 have landed.

## Where a bio comes from

Bios are not written for a member while any source of their own words exists. In
precedence order:

1. **`BiographyMarkdown`** — the markdown file the member submitted. Used even when
   it is malformed, which it often is: bare front matter with no `---` fences, a BOM,
   CRLF, escaped `\---`, an `## Name` heading the member layout already renders, or
   a second stale attachment on the same record. Take the prose, drop the front
   matter (the repo's own front matter is the curated one), repair the source's
   formatting slips, and leave the wording alone.
2. **`Biography`** — the rich-text field, when it holds prose rather than pasted
   front matter or the `Third person bio goes here!` template line. Note that
   `BioSummary` and `Summary (Biography)` are `aiText` fields computed *from* this
   one, so they are generated, not input, and are never a source.
3. **Generated** — only when 1 and 2 are both empty, and then built from the record's
   structured fields rather than invented.

Two wrinkles the 2026-08-21 pass hit:

- **`Biography` can be newer than `BiographyMarkdown`.** `evan-eichholz` has an
  attachment describing a 2nd-year IEEE member and a `Biography` field describing
  side-channel work on embedded ML; the field is the later submission and is what
  the site carries. Prefer the markdown attachment, but check the field before
  overwriting a bio that is already more current.
- **Alumni tense.** An authored bio written while the member was enrolled reads
  wrong once they graduate. Follow `03b29e1`: past-tense only enrollment status and
  lab involvement, and leave interests, motivations and hobbies as written.

## Reproducing this

Airtable side:

- base `appnKGo7NspWFrwcx` → table `Researchers` (`tblh7i1sfs9nzOUOi`)
- "recently updated" = the `headshot-bio-update` last-modified field within the
  past 62 days
- `filename_base` is the formula field that matches a `_members/<slug>.md` filename

Site side: `_members/*.md`, where a leading `_` on the filename hides the member
from Jekyll — that convention lines up exactly with Airtable's `Lab Status:
Inactive`, and did so for all 15 hidden files at the time of this snapshot.
`lakshmi-katravulapalli` was the one `Inactive` record still published, and has
since been hidden the same way; her portrait stays in `images/people/`, as every
other hidden member's does.
