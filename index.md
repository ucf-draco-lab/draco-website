---
---

<div class="hero-tagline">We break things.<br>So you can build them better.</div>

<div class="hero-sub">Applied security research from silicon to swarms. The DRACO Lab at <a href="https://ucf.edu">UCF</a> goes where others hesitate — red teaming systems, exploiting side channels, and hardening everything from transistor gates to autonomous drone swarms.</div>

{%
  include button.html
  link="research"
  text="Explore Research"
  icon="fa-solid fa-arrow-right"
  flip=true
%}
{%
  include button.html
  link="contact"
  text="Join the Lab"
  icon="fa-solid fa-arrow-right"
  flip=true
%}

<div class="stats-banner">
  <div class="stat">
    <span class="stat-number">100+</span>
    <span class="stat-label">Publications</span>
  </div>
  <div class="stat">
    <span class="stat-number">12+</span>
    <span class="stat-label">Researchers</span>
  </div>
  <div class="stat">
    <span class="stat-number">8</span>
    <span class="stat-label">Active Projects</span>
  </div>
  <div class="stat">
    <span class="stat-number">6</span>
    <span class="stat-label">Sponsors</span>
  </div>
</div>

{% include section.html %}

## Highlights

{% capture text %}

We develop algorithms and processes to design, develop, and assess the resilience, robustness, security electronic devices and systems.
All of our research and nearly all of our (~100) publications and presentations involve students.
{%
  include button.html
  link="research"
  text="See our publications"
  icon="fa-solid fa-arrow-right"
  flip=true
  style="bare"
%}

{% endcapture %}

{%
  include feature.html
  image="images/research/research-highlight.png"
  link="research"
  title="Our Research"
  text=text
%}

{% capture text %}

We work on a broad range of projects, funded by various federal and industry partners, while much of our work is open source, some of our work may remain embargoed or partially-redacted when necessary.

We have opportunities for undergraduate (paid or experiential based on interest and time commitment) and graduate research (funded). Our research projects are tightly coupled with the topics listed above, but we also sponsor more applied projects which may be of interest to Senior Design Teams.
{%
  include button.html
  link="projects"
  text="Browse our projects"
  icon="fa-solid fa-arrow-right"
  flip=true
  style="bare"
%}

{% endcapture %}

{%
  include feature.html
  image="images/projects.png"
  link="projects"
  title="Our Projects"
  flip=true
  style="bare"
  text=text
%}

{% capture text %}

We're an open and collaborative group - learn more about who we are!

{%
  include button.html
  link="team"
  text="Meet our team"
  icon="fa-solid fa-arrow-right"
  flip=true
  style="bare"
%}

{% endcapture %}

{%
  include feature.html
  image="images/2025-draco-par-team.jpg"
  link="team"
  title="Meet the Team"
  text=text
%}
