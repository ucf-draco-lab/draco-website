---
title: Research
nav:
  order: 1
  tooltip: Published works
---

# {% include icon.html icon="fa-solid fa-microscope" %}Research

DRACO investigates the security and resilience of computing systems at every level of abstraction — from transistor-level side channels to system-level threat models. Our applied research spans hardware security, side channel analysis, embedded systems, and AI-assisted vulnerability assessment. We also lead nationally recognized cybersecurity education programs from K-12 through graduate level.

With a team of over a dozen active researchers, our work produces open-source tools, reproducible methodologies, and real-world impact through industry and government partnerships.

Learn more about some of our side channel analysis work in the following video.

{% youtube hXAL-cSkj1w /img/placeholder.jpg %}

{% include section.html %}

## Research Areas

{% capture text %}
Power analysis, electromagnetic analysis, and ML-based classification of hardware vulnerabilities. Our ethos — assessing and hardening devices from design time through deployment.
{% endcapture %}
{%
  include feature.html
  image="images/research/research-highlight.png"
  title="Side Channel Analysis"
  text=text
%}

{% capture text %}
AI-driven generation and detection of malicious logic in RTL designs and FPGA bitstreams. Projects include Dark Logic (RTL Trojans), Dark Fabric (FPGA Trojans), and TRIDENT (ML-based detection).
{% endcapture %}
{%
  include feature.html
  image="images/projects/dark_logic.webp"
  title="Hardware Trojans"
  flip=true
  text=text
%}

{% capture text %}
Encrypted processor frameworks, polymorphic logic primitives, side-channel-resistant architectures, and lattice-based compression functions for post-quantum readiness.
{% endcapture %}
{%
  include feature.html
  image="images/projects/epfa.webp"
  title="Secure & Resilient Architectures"
  text=text
%}

{% capture text %}
Secure coordination protocols for heterogeneous autonomous swarms (SHARKS), adversarial resilience of multi-agent systems, and lightweight IoT communication (CHIRP/S-CHIRP).
{% endcapture %}
{%
  include feature.html
  image="images/projects/sharks.png"
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

{% include search-box.html %}

{% include search-info.html %}

{% include list.html data="citations" component="citation" style="rich" %}
