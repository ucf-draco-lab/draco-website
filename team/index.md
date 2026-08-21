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

{% capture lab_pi %}
## Lab PI

{% include list.html data="members" component="portrait" filters="role: PI" group_years=false %}
{% endcapture %}

{% capture alumni_mentors %}
## Alumni Mentors

{% include list.html data="members" component="portrait" filters="role: alumni-mentor" group_years=false %}
{% endcapture %}

{% include cols.html col1=lab_pi col2=alumni_mentors %}


{% include section.html %}
## PhD Student Researchers

{% include list.html data="members" component="portrait" filters="role: ^phd$" display_mode="student" group_years=false %}

{% include section.html %}
## Masters Student Researchers

{% include list.html data="members" component="portrait" filters="role: ^ms$" display_mode="student" group_years=false %}

{% include section.html %}
## Undergraduate Students

{% include list.html data="members" component="portrait" filters="role: undergrad" display_mode="student" group_years=false %}


{% include list.html data="members" component="portrait" filters="role: capstone-senior " display_mode="student" group_years=false %}

{% include section.html %}
## Alumni

{% include list.html data="members" component="portrait" filters="role: (ms-alumni|^alumni$|phd-alumni)" style="small" display_mode="alumni" %}

{% include section.html %}

## Funding and Support

Our research, tools, and student training are made possible through partnerships with federal, state, and corporate entities. These collaborations advance critical security research while giving partners early access to emerging talent, novel IP, and applied results. Interested in what a partnership looks like? Contact [Dr. Mike]({{ site.baseurl }}/contact).


### Sponsors
A special thank you to our current sponsors — click on the profiles below to see the projects and researchers these entities have sponsored.
{% include list.html data="members" component="portrait" filters="role: sponsor " group_years=false %}


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
