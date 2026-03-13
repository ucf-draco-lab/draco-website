---
title: Research
nav:
  order: 1
  tooltip: Published works
---

# {% include icon.html icon="fa-solid fa-microscope" %}Research

DRACO explores the resilience and security of computing systems. With a team of over a dozen student researchers, our focus is on automating the design, development, and assessment of attacks, resilience, robustness, and ultimately security in electronic devices and systems.

{% include section.html size="full" %}

<div class="video-hero">
  <div class="video-hero-inner">
    {% youtube hXAL-cSkj1w %}
    <p class="video-hero-caption">Exploring side-channel vulnerabilities in modern hardware</p>
  </div>
</div>

{% include section.html %}

{%
  include button.html
  icon="fa-brands fa-google fa-beat"
  text="More on Google Scholar"
  link="https://scholar.google.com/citations?hl=en&user=h0M0TmsAAAAJ"
%}
{%
  include button.html
  icon="fa-brands fa-researchgate fa-beat"
  text="More on Research Gate"
  link="https://www.researchgate.net/lab/DRACO-UCF-and-CEDAR-UWyo-Labs-Mike-Borowczak"
%}
{%
  include button.html
  icon="fa-regular fa-folder-open fa-beat"
  text="More on ASEE Peer Repository"
  link="https://peer.asee.org/?q=borowczak"
%}

{% include section.html %}

## Publications

<div class="pub-filters">
  <a class="pub-filter" data-filter="" onclick="filterPubs(this)" data-active>All ({{ site.data.citations | size }})</a>
  {% assign journals = site.data.citations | where: "type", "journal" %}
  <a class="pub-filter" data-filter="journal" onclick="filterPubs(this)">{% include icon.html icon="fa-regular fa-newspaper" %} Journals ({{ journals | size }})</a>
  {% assign confs = site.data.citations | where: "type", "conference" %}
  <a class="pub-filter" data-filter="conference" onclick="filterPubs(this)">{% include icon.html icon="fa-solid fa-users-rectangle" %} Proceedings ({{ confs | size }})</a>
  {% assign books = site.data.citations | where: "type", "book" %}
  <a class="pub-filter" data-filter="book" onclick="filterPubs(this)">{% include icon.html icon="fa-solid fa-book" %} Books ({{ books | size }})</a>
  {% assign invites = site.data.citations | where: "type", "invited" %}
  <a class="pub-filter" data-filter="invited" onclick="filterPubs(this)">{% include icon.html icon="fa-solid fa-microphone" %} Invited ({{ invites | size }})</a>
  {% assign pres = site.data.citations | where: "type", "presentation" %}
  <a class="pub-filter" data-filter="presentation" onclick="filterPubs(this)">{% include icon.html icon="fa-solid fa-chalkboard-user" %} Presentations ({{ pres | size }})</a>
  {% assign others = site.data.citations | where: "type", "other" %}
  <a class="pub-filter" data-filter="other" onclick="filterPubs(this)">{% include icon.html icon="fa-solid fa-file-lines" %} Other ({{ others | size }})</a>
</div>

{% include search-box.html %}

{% include search-info.html %}

{% include list.html data="citations" component="citation" style="rich" %}

<script>
function filterPubs(el) {
  document.querySelectorAll('.pub-filter').forEach(function(btn) {
    btn.removeAttribute('data-active');
  });
  el.setAttribute('data-active', '');

  var filter = el.getAttribute('data-filter');
  var input = document.querySelector('.search-input');
  if (filter) {
    var query = '"tag: ' + filter + '"';
    if (input) input.value = query;
    // call the global search handler directly (avoids 1s debounce)
    if (typeof onSearchInput === 'function') onSearchInput(input);
  } else {
    if (input) input.value = '';
    if (typeof onSearchClear === 'function') onSearchClear();
  }
}
</script>
