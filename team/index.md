---
title: Team & Supporters
nav:
  order: 3
  tooltip: DRACO KNIGHTS
---

# {% include icon.html icon="fa-solid fa-users" %}Team

The DRACO Laboratory in the Electrical and Computer Engineering Department within UCF's College of Engineering and Computer Science advances resilient computing architectures through research activities in side-channel security, swarm intelligence, and emerging computational paradigms. Our team welcomes researchers at all levels to engage in work spanning theoretical foundations to system-level implementations, with current opportunities in AI workload detection, autonomous swarm architectures, and hardware security innovations. 

 Our team works hard and welcomes those who want to engage in research and outreach. Does this sound like something you're interested in? 
 Reach out with you resume and a brief statement about how your interests might intersect. 

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

{% include list.html data="members" component="portrait" filters="role: alumni" %}

{% include section.html %}

## Funding and Support

The work, projects, publications, materials, and members represented have been funded by a variety of federal, state, local, and corporate entities. We appreciate their support and look forward to continuing to develop mutually beneficial relationships. Have a project you're interesting in supporting? Contact [Dr. Mike]({{ site.baseurl }}/contact).


### Sponsors
A special thank you to our current sponors -  click on the profiles below to see the projects/researchers these entitles have sponsored.
{% include list.html data="members" component="portrait" filters="role: sponsor " %}


The work shown throughout our website has been sponsored by many agencies and organizations - learn more about them by visiting their web presence.

{% capture content %}

{% include figure.html image="images/sponsors/nsf.png"   link="http://nsf.gov" %}
{% include figure.html image="images/sponsors/nsa.png" link="http://nsa.gov" %}
{% include figure.html image="images/sponsors/gencyber.jpg" link="http://gen-cyber.com" %} 
{% include figure.html image="images/sponsors/doe.png" link="http://energy.gov"%} 
{% include figure.html image="images/sponsors/inl.png" link="http://inl.gov"%} 

{% include figure.html image="images/sponsors/amd.png"   link="http://amd.com" %}
{% include figure.html image="images/sponsors/ng-square.png"   link="https://www.northropgrumman.com" %}
{% include figure.html image="images/sponsors/awn-sq.png"   link="http://arcticwolf.com" %}

{% include figure.html image="images/sponsors/iog.png" link="http://iog.io" %} 
{% include figure.html image="images/sponsors/kraken.png" link="http://kraken.com"%} 
{% include figure.html image="images/sponsors/ripple.png" link="http://ripple.com" %} 


{% endcapture %}

{% include grid.html style="square" content=content %}
