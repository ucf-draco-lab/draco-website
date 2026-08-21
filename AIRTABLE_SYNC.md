# Airtable ↔ website disconnects

Snapshot taken **2026-08-21** against the `Researchers` table of the **DRACO**
Airtable base (`appnKGo7NspWFrwcx`). Everything listed here is a place where the
base and `_members/` disagree, or where the base itself has a hole that the site
then renders as a blank. Nothing below is fixed silently — the fixes that *were*
applied are in the commit that adds this file; what remains is the next pass.

## 0. Blocked in this session: headshots and bio attachments

Airtable serves attachments from `v5.airtableusercontent.com`, which the session's
egress policy refuses (`403` on `CONNECT`). So no `Headshot` or `BiographyMarkdown`
attachment could be downloaded, and every headshot below still needs pulling by
hand or from a session that can reach that host.

Eight researcher records were touched in the last two months. All eight have a
headshot and a bio-markdown attachment in Airtable:

| Record | Airtable headshot | In `images/people/` | Note |
| --- | --- | --- | --- |
| `eren-durham` | `eren-durham.png` | **missing** | new record (2026-08-20); page added with a summary built from Airtable fields only — real bio + headshot still to come |
| `sebastian-candelaria` | `sebastian-candelaria.png` | `.jpeg` and `.jpg` | extension mismatch — repo copy is probably not the current Airtable one |
| `ilona-van-der-linden` | `ilona-van-der-linden.png` | `.jpg` | same |
| `alexei-solonari` | `alexei-solonari.png` | `.png` | may or may not be current |
| `katelin-shaffer` | `katelin-shaffer.png` | `.png` | may or may not be current |
| `lakshmi-ramanathan` | `lakshmi-ramanathan.jpg` | `.jpg` | may or may not be current |
| `cade-chretien` | `cade-chretien.png` | `.png` | may or may not be current |
| `evan-eichholz` | `evan-eichholz.png` | `.png` | may or may not be current |

Of the eight, only `evan-eichholz` had a *text* bio in Airtable that differed from
the site — that one has been copied across. The other seven keep their bios in the
markdown attachment, which could not be read, so any prose changes in them are
still unmerged.

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
- **`lakshmi-ramanathan`** has no bio anywhere: her site page body is empty, her
  Airtable *Biography* field holds pasted YAML front matter instead of prose, and
  the bio attachment is 248 bytes (front matter again).
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
- **Duplicate portraits** in `images/people/` that nothing references:
  `ash-hanzelka.jpg`, `davi-dantas.png`, `katherine-doyle.jpg`,
  `sagar-srujan-somepalli.jpg`, `samuel-lane.jpg`, `sebastian-candelaria.jpg`.

## Reproducing this

Airtable side:

- base `appnKGo7NspWFrwcx` → table `Researchers` (`tblh7i1sfs9nzOUOi`)
- "recently updated" = the `headshot-bio-update` last-modified field within the
  past 62 days
- `filename_base` is the formula field that matches a `_members/<slug>.md` filename

Site side: `_members/*.md`, where a leading `_` on the filename hides the member
from Jekyll — that convention lines up exactly with Airtable's `Lab Status:
Inactive`, and did so for all 15 hidden files at the time of this snapshot.
