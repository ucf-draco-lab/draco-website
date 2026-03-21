---
title: Funding
nav:
  order: 1.5
  tooltip: Research funding and support
---

# {% include icon.html icon="fa-solid fa-hand-holding-dollar" %}Funding

Every dollar invested in DRACO funds student researchers, builds open-source security tools, and produces graduates ready to lead in industry and government. Our work is made possible through the support of federal agencies, industry partners, and the broader UCF community.

{% include section.html %}

{% assign stats = site.data.funding.stats %}

<div class="funding-stats">
  <div class="funding-stat">
    <span class="funding-stat-value">{{ stats.total_awarded_fmt }}</span>
    <span class="funding-stat-label">Total Awarded</span>
  </div>
  <div class="funding-stat">
    <span class="funding-stat-value">{{ stats.total_share_fmt }}</span>
    <span class="funding-stat-label">PI Share</span>
  </div>
  <div class="funding-stat">
    <span class="funding-stat-value">{{ stats.count_active }}</span>
    <span class="funding-stat-label">Active Projects</span>
  </div>
  <div class="funding-stat">
    <span class="funding-stat-value">{{ stats.count_all }}</span>
    <span class="funding-stat-label">Total Projects</span>
  </div>
</div>

{% include section.html %}

{% assign grants = site.data.funding.grants %}

## {% include icon.html icon="fa-solid fa-circle-check" %} Active

{% assign active = grants | where: "status", "active" %}
{% for g in active %}
  {% include funding-card.html
    title=g.title
    institution=g.institution
    period=g.period
    total_fmt=g.total_fmt
    share_pct=g.share_pct
    share_fmt=g.share_fmt
    role=g.role
    status=g.status
  %}
{% endfor %}

{% assign pending = grants | where: "status", "pending" %}
{% if pending.size > 0 %}

## {% include icon.html icon="fa-solid fa-clock" %} Pending

{% for g in pending %}
  {% include funding-card.html
    title=g.title
    institution=g.institution
    period=g.period
    total_fmt=g.total_fmt
    share_pct=g.share_pct
    share_fmt=g.share_fmt
    role=g.role
    status=g.status
  %}
{% endfor %}

{% endif %}

## {% include icon.html icon="fa-solid fa-flag-checkered" %} Completed

{% assign completed = grants | where: "status", "completed" %}
{% for g in completed %}
  {% include funding-card.html
    title=g.title
    institution=g.institution
    period=g.period
    total_fmt=g.total_fmt
    share_pct=g.share_pct
    share_fmt=g.share_fmt
    role=g.role
    status=g.status
  %}
{% endfor %}
