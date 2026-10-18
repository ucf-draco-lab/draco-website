---
title: Interactive Papers
description: DRACO papers you can run in your browser, written for five reading levels from the general public to researchers.
---

<link rel="stylesheet" href="{{ "/papers/kit/paper-kit.css" | relative_url }}">

# {% include icon.html icon="fa-solid fa-flask-vial" %}Interactive Papers

Each page below rebuilds one DRACO result in your browser and explains it at five reading levels (public, high school, undergraduate, graduate, and researcher). Pick a level at the top of any page; shared links keep the level you chose.

<ul class="paper-index">
{% assign papers = site.papers | sort: "date" | reverse %}
{% for paper in papers %}
  {% assign icon = "images/papers/interactive/" | append: paper.slug | append: ".svg" %}
  {% if paper.icon %}{% assign icon = paper.icon %}{% endif %}
  <li>
    <a class="paper-index-icon" href="{{ paper.url | relative_url }}" tabindex="-1" aria-hidden="true">
      <img src="{{ icon | relative_url }}" alt="" loading="lazy" {% include fallback.html %}>
    </a>
    <a class="paper-index-title" href="{{ paper.url | relative_url }}">{{ paper.title }}</a>
    <span class="paper-index-meta">{{ paper.kicker }}</span>
    <span>{{ paper.description }}</span>
  </li>
{% endfor %}
</ul>
