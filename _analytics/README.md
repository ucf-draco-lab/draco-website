# Profile view counts

Member profile pages can show how many times they've been viewed:

> 👁 1,284 views

The number comes from Umami, the privacy-friendly analytics the site already
loads (see `_includes/analytics.html`). Rather than asking the visitor's
browser to call a counter service, the count is read out of Umami **at build
time** and rendered as plain static HTML. Nothing extra is collected about
visitors, and no third-party request is added to the page.

## Setup

One repository secret is all that's needed.

1. In [Umami Cloud](https://cloud.umami.is), go to **Settings → API** and
   create an API key.
2. In this repository, go to **Settings → Secrets and variables → Actions**
   and add a secret named `UMAMI_API_KEY` with that value.

That's it. The website id is read from `analytics.umami_website_id` in
`_config.yaml`, which is the same id the tracking script already uses.

Until the secret exists the counter simply doesn't render — no errors, no
zeroes, no broken layout. That's also what happens on pull request previews
and forks, which have no access to secrets by design.

## How it runs

`fetch_views.py` runs as a step in both deploy workflows
(`.github/workflows/jekyll.yml` and `.github/workflows/build-site.yaml`),
just before Jekyll builds. It rewrites `_data/views.yaml` in the working tree
— nothing is committed, so there's no daily churn in git history. Both
workflows also rebuild once a day so the numbers stay current between pushes.

The step is `continue-on-error`, so a hiccup at Umami can never block a
deploy; the site just builds with whatever counts were last committed.

## Running it locally

```sh
UMAMI_API_KEY=your-key python3 _analytics/fetch_views.py
```

Other environment variables, all optional:

| Variable | Default | Purpose |
| --- | --- | --- |
| `UMAMI_WEBSITE_ID` | `analytics.umami_website_id` from `_config.yaml` | Which site to read |
| `UMAMI_API_URL` | `https://api.umami.is/v1` | Point at a self-hosted Umami with `https://your-host/api` |
| `UMAMI_START_DATE` | `2020-01-01` | Counts are cumulative from this date |

Remember to `git checkout _data/views.yaml` afterwards if you don't want your
local pull showing up in a commit.

## Counting other page types

`fetch_views.py` only writes counts for member profiles, which keeps
`_data/views.yaml` small and its diffs readable. To count posts or projects
too, widen `wanted_paths()` in the script and add
`{% include view-counter.html %}` to the relevant layout.
