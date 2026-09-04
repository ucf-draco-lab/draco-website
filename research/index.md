---
title: Research
nav:
  order: 1
  tooltip: Published works
---

# {% include icon.html icon="fa-solid fa-microscope" %}Research

DRACO investigates the security and resilience of computing systems at every level of abstraction — from transistor-level side channels to system-level threat models. Our applied research spans hardware security, side channel analysis, embedded systems, and AI-assisted vulnerability assessment, delivering open-source tools, reproducible methodologies, and field-tested solutions to our partners.

With over a dozen active researchers and nationally recognized cybersecurity education programs from K-12 through graduate level, every project we undertake doubles as a talent pipeline — producing publications and production-ready engineers in parallel.

{% include section.html size="full" %}

{% youtube hXAL-cSkj1w /img/placeholder.jpg %}

{% include section.html %}

## Research Areas

{% capture text %}
Power and electromagnetic analysis, and machine learning over the traces it produces. [Shadow AI]({{ site.baseurl }}/projects/shadow-ai.html) fingerprints workloads on machines we do not control; [Trace-AI]({{ site.baseurl }}/projects/trace-ai.html) carries that from detection to attribution; [Aegis]({{ site.baseurl }}/projects/aegis.html) measures what an edge ML accelerator gives up about its own model, and builds what closes the leak.
{% endcapture %}
{%
  include feature.html
  image="images/research/research-highlight.png"
  title="Side Channel Analysis"
  text=text
%}

{% capture text %}
Malicious logic, and the verification that is supposed to catch it. [Dark Matter]({{ site.baseurl }}/projects/dark-matter.html) works the analog and mixed-signal blocks that digital verification never examines, following earlier lab work on FPGA bitstream Trojans. On the defense side, [Dark Logic]({{ site.baseurl }}/projects/dark-logic.html) attacks the state explosion that keeps formal methods off production-scale designs, and [RTL Insight]({{ site.baseurl }}/projects/rtl-insight.html) builds the static analysis that makes large RTL legible in the first place.
{% endcapture %}
{%
  include feature.html
  image="images/projects/dark-matter.jpg"
  title="Hardware Trojans & Trust"
  flip=true
  text=text
%}

{% capture text %}
Architectures that keep their secrets. [Encrypted processor frameworks]({{ site.baseurl }}/projects/encrypted-processor.html) and [partially homomorphic execution in real hardware]({{ site.baseurl }}/projects/side-channel-resistant-architecture.html) aim at computation that never exposes a plaintext operand; [polymorphic components]({{ site.baseurl }}/projects/polymorphic-components.html) break the trace accumulation every side-channel attack depends on; [Signal Insight]({{ site.baseurl }}/projects/signal-insight.html) asks what information theory can tell us about power before the simulator can.
{% endcapture %}
{%
  include feature.html
  image="images/projects/epfa.webp"
  title="Secure & Resilient Architectures"
  text=text
%}

{% capture text %}
Coordination that survives contact with the field. [SHARKS]({{ site.baseurl }}/projects/sharks.html) draws its coordination mechanisms from biology — collective behaviors that already evolved under predation and deception — and asks which missions each one can carry and what an adversary inside the group does to it. [PUPS]({{ site.baseurl }}/projects/pups.html) is the untethered platform that keeps those claims honest. [CHIRP]({{ site.baseurl }}/projects/chirp.html) targets the other end of the scale — peer-to-peer networking on devices too small for a conventional stack.
{% endcapture %}
{%
  include feature.html
  image="images/projects/sharks.jpg"
  title="Autonomous Systems & IoT"
  flip=true
  text=text
%}

{% include section.html %}

Please note that the citations on this page were generated automatically from identifiers using the [Manubot cite utility](https://github.com/manubot/manubot#cite). Please reference the published version of the publications for accurate citation information.

{%
  include button.html
  icon="fa-brands fa-google fa-beat"
  text="More on Google Scholar"
  link="https://scholar.google.com/citations?hl=en&user=h0M0TmsAAAAJ"
%}
{%
  include button.html
  icon="fa-brands fa-researchgate fa-beat"
  text="More on ResearchGate"
  link="https://www.researchgate.net/profile/Mike-Borowczak"
%}
{%
  include button.html
  icon="fa-regular fa-folder-open fa-beat"
  text="More on ASEE Peer Repository"
  link="https://peer.asee.org/?q=borowczak"
%}

{% include section.html %}

## All Publications
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
