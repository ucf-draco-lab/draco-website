---
title: Team & Supporters
nav:
  order: 3
  tooltip: DRACO KNIGHTS
---

# {% include icon.html icon="fa-solid fa-users" %}Team

The DRACO Laboratory in UCF's Department of Electrical and Computer Engineering develops resilient computing architectures through research in side-channel security, hardware Trojan detection, AI-driven design automation, post-quantum cryptographic primitives, secure swarm coordination, and emerging paradigms such as encrypted processing and memristive computing.

Our team includes undergraduates through postdoctoral scholars — all gaining hands-on experience with the tools and challenges they'll face in careers at companies like AMD, Lockheed Martin, Northrop Grumman, and beyond. Interested? See our [open opportunities]({{ site.baseurl }}/opportunities) or reach out.

{% include section.html %}
## Lab PI

{% include list.html data="members" component="portrait" filters="role: PI" %}


{% include section.html %}
## Graduate Student Researchers

{% include list.html data="members" component="portrait" filters="role: ^(ms|phd)$" %}

{% include section.html %}
## Undergraduate Students

{% include list.html data="members" component="portrait" filters="role: undergrad" %}


{% include list.html data="members" component="portrait" filters="role: capstone-senior " %}

## Alumni

{% include list.html data="members" component="portrait" filters="role: (ms-alumni|alumni)" %}


### Alumni
- Michael Castiglia, B.S., 2025 [AMD; UCF ECE MS Program]
- Jarett Artman, M.S., 2025
- Jenna Goodrich, M.S., 2025
- Davi Dantas, B.S., 2025 [BAE Systems]
- Raul Graterol, B.S., 2025
- Malia Rojas, B.S., 2024 [Lockheed Martin]
- Yvan Pierre, B.S., 2024 [Honeywell]
- Luckner Ablard, B.S., 2024 [Collins Aerospace]
- Francisco Soriano, B.S., 2024 [AMD; UCF Grad School]
- Lana Perkins, BS, 2024 [L3Harris]
- Sheridan Sloan, BS, 2024 [Lockheed Martin]
- Aaron Lingerfelt, BS, 2024 [Northrop Grumman]

{% include section.html %}

## Funding and Support

Our research, tools, and student training are made possible through partnerships with federal, state, and corporate entities. These collaborations advance critical security research while giving partners early access to emerging talent, novel IP, and applied results. Interested in what a partnership looks like? Contact [Dr. Mike]({{ site.baseurl }}/contact).


### Sponsors
A special thank you to our current sponsors — click on the profiles below to see the projects and researchers these entities have sponsored.
{% include list.html data="members" component="portrait" filters="role: sponsor " %}


The work shown throughout our website has been sponsored by many agencies and organizations — learn more about them by visiting their web presence.

{% capture content %}

{% include figure.html image="images/sponsors/nsf.png"   link="https://nsf.gov" %}
{% include figure.html image="images/sponsors/nsa.png" link="https://nsa.gov" %}
{% include figure.html image="images/sponsors/gencyber.jpg" link="https://gen-cyber.com" %}
{% include figure.html image="images/sponsors/doe.png" link="https://energy.gov" %}
{% include figure.html image="images/sponsors/inl.png" link="https://inl.gov" %}

{% include figure.html image="images/sponsors/amd.png"   link="https://amd.com" %}
{% include figure.html image="images/sponsors/ng-square.png"   link="https://www.northropgrumman.com" %}
{% include figure.html image="images/sponsors/awn-sq.png"   link="https://arcticwolf.com" %}

{% include figure.html image="images/sponsors/iog.png" link="https://iog.io" %}
{% include figure.html image="images/sponsors/kraken.png" link="https://kraken.com" %}
{% include figure.html image="images/sponsors/ripple.png" link="https://ripple.com" %}


{% endcapture %}

{% include grid.html style="square" content=content %}
