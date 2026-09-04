---
title: CHIRP
subtitle: Ultra-Lightweight IoT Communication
image: images/projects/chirp.webp
poster: images/projects/2025/chirp.jpg
poster_caption: CHIRP research poster.
sponsor: [ucf]
projectmembers:
-
  id: cade-chretien
  name: "Cade Chretien"
  role: "Project Lead"
  start-date: "2026-08-17"
-
  id: calvin-vanwormer
  name: "Calvin VanWormer"
  role: "Alumni Mentor — prior project lead"
  start-date: "2026-01-06"
tags:
  - active
  - iot
  - networking
  - embedded systems
  - low power
  - peer-to-peer
prq: What does a peer-to-peer network cost on devices too small for a conventional stack?
---

Most IoT networking assumes resources the smallest devices do not have. A conventional stack expects memory, a scheduler, and a power budget that a sensor node running for years on a coin cell cannot supply. The usual answer is to centralize — push the intelligence to a gateway and leave the endpoint dumb — which trades away autonomy and creates the single point of failure the deployment was often trying to avoid.

CHIRP implements a peer-to-peer network using the CHIRP communication algorithm, targeting exactly that constrained regime. The research question is not whether the algorithm works in principle; it is what the algorithm costs once it stops being a specification and becomes firmware on a real radio.

Concretely, we are measuring:

- **Power**, per message and at idle, since idle dominates the lifetime of anything battery-powered.
- **Memory**, both code and state, against the footprint of parts that are actually cheap in volume.
- **Latency and delivery**, under contention and interference rather than on a clean bench.

The lab's earlier S-CHIRP work addressed the security layer over this protocol family. Establishing the unsecured baseline honestly is a prerequisite to saying what security costs on top of it.

## Open questions

- What is the true idle power of a peer-to-peer node, and does it undercut a gateway-based deployment over a realistic device lifetime?
- How does delivery degrade as node density rises, and where does the protocol stop being peer-to-peer in practice?
- What headroom is left for security once the base protocol has taken its share of a constrained part?
