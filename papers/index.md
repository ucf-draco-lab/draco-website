---
title: Interactive Papers
description: DRACO papers you can run in your browser, written for five reading levels from the general public to researchers.
---

<link rel="stylesheet" href="{{ "/papers/kit/paper-kit.css" | relative_url }}?v={{ site.time | date: "%s" }}">

# {% include icon.html icon="fa-solid fa-flask-vial" %}Interactive Papers

Each page below rebuilds one DRACO result in your browser and explains it at five reading levels (public, high school, undergraduate, graduate, and researcher). Pick a level at the top of any page; shared links keep the level you chose.

{% assign papers = site.papers | sort: "date" | reverse %}
{% assign topics = papers | map: "topics" | compact | join: "|" | split: "|" | uniq | sort %}

{% comment %}
  Sort and filter controls stay hidden until paper-gallery.js runs, so without
  JavaScript the page is the plain list below, newest first. The controls read
  and write ?topic=, ?sort= and ?q= so a filtered list can be linked.
{% endcomment %}
<div class="paper-browse" data-paper-browse hidden>
  <div class="paper-browse-row">
    <label class="paper-browse-search">
      <span class="sr-only">Search interactive papers</span>
      {% include icon.html icon="fa-solid fa-magnifying-glass" %}
      <input type="search" data-browse-q placeholder="Search titles and descriptions" autocomplete="off">
    </label>
    <label class="paper-browse-sort">
      <span>Sort by</span>
      <select data-browse-sort>
        <option value="added">Newest added</option>
        <option value="popular" data-needs-views>Most viewed</option>
        <option value="year">Publication year</option>
        <option value="title">Title (A–Z)</option>
        <option value="random">Random</option>
      </select>
    </label>
  </div>
  <div class="pub-filters paper-browse-topics" role="group" aria-label="Filter by topic">
    <button type="button" class="pub-filter" data-browse-topic="" data-active aria-pressed="true">All ({{ papers.size }})</button>
    {% for topic in topics %}
      {% assign count = papers | where_exp: "p", "p.topics contains topic" | size %}
      <button type="button" class="pub-filter" data-browse-topic="{{ topic | slugify }}" aria-pressed="false">{{ topic }} ({{ count }})</button>
    {% endfor %}
  </div>
  <p class="paper-browse-status" data-browse-status aria-live="polite"></p>
</div>

<ul class="paper-index" data-browse-list>
{% for paper in papers %}
  {% assign icon = "images/papers/interactive/" | append: paper.slug | append: ".svg" %}
  {% if paper.icon %}{% assign icon = paper.icon %}{% endif %}
  {% assign views = site.data.views.pages[paper.url] | default: 0 %}
  {% capture topic_slugs %}{% for topic in paper.topics %}{{ topic | slugify }} {% endfor %}{% endcapture %}
  <li data-views="{{ views }}" data-added="{{ paper.date | date: "%Y-%m-%d" }}" data-title="{{ paper.title | escape }}" data-topics=" {{ topic_slugs }}">
    <a class="paper-index-icon" href="{{ paper.url | relative_url }}" tabindex="-1" aria-hidden="true">
      <img src="{{ icon | relative_url }}" alt="" width="96" height="96" loading="lazy" {% include fallback.html %}>
    </a>
    <a class="paper-index-title" href="{{ paper.url | relative_url }}">{{ paper.title }}</a>
    <span class="paper-index-meta">{{ paper.kicker }}{% if views > 0 %} · {{ views | delimit_number }} {% if views == 1 %}view{% else %}views{% endif %}{% endif %}</span>
    <span>{{ paper.description }}</span>
    {% if paper.topics %}
      <span class="paper-index-topics">{% for topic in paper.topics %}<span>{{ topic }}</span>{% endfor %}</span>
    {% endif %}
  </li>
{% endfor %}
</ul>
<p class="paper-browse-empty" data-browse-empty hidden>No papers match. <button type="button" class="button" data-style="bare" data-browse-reset>Clear filters</button></p>

<script src="{{ "/papers/kit/paper-gallery.js" | relative_url }}" defer></script>
