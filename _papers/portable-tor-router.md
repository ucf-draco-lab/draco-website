---
title: "A Privacy Box for Every Device: The Portable Tor Router"
kicker: "Interactive paper · IEEE ICCE 2018"
subtitle: "An interactive companion to Barberis, Radosevich, Emery, and Borowczak's Raspberry Pi router that sends every connected device's traffic through Tor, and to what that privacy costs in speed."
description: "Wrap a web request in three layers of real encryption and watch each Tor relay peel one away, see who can still link you to a website with the router on or off, and compare the paper's 30 speed tests through Tor with its tests without it."
share_description: "A $100 Raspberry Pi can hide where every device in a room goes online, at about one fifth of the speed. Peel a three-layer onion in your browser and see the paper's speed tests, written for five reading levels."
share_text: "A $100 Raspberry Pi can hide where every device in a room goes online, at about one fifth of the speed. Try it in your browser:"
share_image: /papers/portable-tor-router/share.png
share_image_alt: "A request drawn as three nested rings travelling from a home router through entry, middle, and exit relays to a website, beside the paper's download-speed histograms with and without Tor, under the title Portable Tor Router."
date: 2026-10-20
topics: ["Privacy", "Networks"]
default_level: public
level_hints:
  public: No background needed
  hs: Addresses, packets, and a little arithmetic
  ug: Networking, encryption, and programming
  grad: Threat models, measurement, and statistics
  res: Full method, figure reconstruction, and open questions
authors:
  - name: Adrian Barberis
    affiliation: University of Wyoming
  - name: Danny Radosevich
    affiliation: University of Wyoming
  - name: Wyatt Emery
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "arXiv:1710.02025 · 2017"
    title: "Portable Tor Router: Easily Enabling Web Privacy for Consumers"
    url: https://arxiv.org/abs/1710.02025
    access: Open access (author version)
  - venue: "IEEE ICCE · 2018"
    title: "Portable Tor Router: Easily Enabling Web Privacy for Consumers"
    url: https://doi.org/10.1109/ICCE.2018.8326333
    access: Paywalled (IEEE)
citations:
  - Borowczak2018ToR
widget:
  css:
    - /papers/portable-tor-router/widget.css
  js:
    - /papers/portable-tor-router/tor-engine.js
    - /papers/portable-tor-router/widget.js
credit: "Interactive page by the [DRACO Lab](/). The onion demo encrypts each layer with AES-128 in counter mode, written out in `tor-engine.js` and checked against the FIPS-197 and NIST SP 800-38A test vectors and against Node's crypto module on 2,000 random keys and messages; every wrap is peeled back and compared byte for byte. The authors did not release code or raw measurements, so the speed demo uses counts and bin edges read from the paper's Figures 2 to 5 (axis ticks used for calibration, about ±0.006 Mb/s). The bars reproduce the paper's text: 30 Tor downloads between 0.53 and 2.69 Mb/s, most often 1 to 1.4 Mb/s, and capped near 2 Mb/s. The two averages printed in the text do not fit the plotted bars; the researcher notes explain. Rank tests and mean bounds at the graduate and researcher levels are this page's own, checked against SciPy. Everything runs on your device."
bibtex: |
  @inproceedings{barberis2018portable,
    author    = {Barberis, Adrian and Radosevich, Danny and Emery, Wyatt and Borowczak, Mike},
    title     = {Portable {Tor} Router: Easily Enabling Web Privacy for Consumers},
    booktitle = {2018 IEEE International Conference on Consumer Electronics (ICCE)},
    year      = {2018},
    doi       = {10.1109/ICCE.2018.8326333}
  }
---

<div class="lede" data-levels="public" markdown="1">
Every time a phone or laptop loads a web page, the network carrying the request can read where it is going, where it came from, and when. Four University of Wyoming researchers built a small box that hides those details for every device that connects to it. The box is a Raspberry Pi 3 (a credit-card-sized computer) set up as a Wi-Fi router that sends all traffic through Tor, a volunteer network that passes each request through three relays so no single one knows both who you are and where you are going. It cost about $100. The price is speed: downloads through the box ran at roughly one fifth of the direct speed, capped near 2 megabits per second, still enough for web browsing and 720p video.
</div>

<div class="lede" data-levels="hs" markdown="1">
Each packet on the internet carries a label with its source address and destination address, and anyone along the way can read the label. Tor hides it by wrapping the request in three layers of encryption, one for each of three relays. Each relay can remove only its own layer, which tells it where to send the rest. The paper builds a Wi-Fi router from a Raspberry Pi 3 that does this wrapping for every device that joins it, then measures what it costs: 30 download and 30 upload speed tests through Tor, compared with tests without it, plus a check that website lookups (DNS) do not leak around Tor.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper turns a Raspberry Pi 3 running Raspbian Stretch Lite into a portable Tor gateway. The internal Wi-Fi joins an upstream network, an external Wi-Fi dongle broadcasts a WPA/WPA2 access point, and the Pi provides DHCP, NAT, and DNS like any home router; Tor starts at boot and every packet leaving the Pi goes into the Tor network. The authors set six goals (cost, immediacy of privacy, simplicity, ease of execution, unimpaired functionality, and speed), test speed with upload and download runs with and without Tor (Figures 2 to 5), and run a DNS leak test. Five goals were met; speed was traded for privacy.
</div>

<div class="lede" data-levels="grad" markdown="1">
Tor Browser protects one application on one device. Barberis, Radosevich, Emery, and Borowczak move the protection into the network path: a single-board computer that routes all traffic from any connected device (phones, game consoles, smart televisions) through Tor, with no client software. The evaluation is a feasibility study: 30 Tor and 10 plotted direct download tests, the same for uploads, shown as histograms, a qualitative usability check (720p video worked; large downloads and full high-definition streaming did not), and a DNS leak test. The threat model is an observer upstream of the box, such as an Internet service provider (ISP); the paper names the local network, the router itself, and the exit relay as the remaining exposures.
</div>

<div class="lede" data-levels="res" markdown="1">
Barberis et al. (IEEE ICCE 2018; arXiv:1710.02025) report a Raspberry Pi 3 transparent Tor gateway, its download and upload throughput with and without Tor (Figures 2 to 5, Section IV-A), and a DNS leak test (Section IV-B). This page implements a three-layer onion with AES-128-CTR to illustrate Section II-B, encodes the paper's observer claims as a table, reconstructs the four histograms from the figures, and computes what the bars allow: sample sizes, ranges, bounds on the means, and exact rank tests. The reconstruction exposes three inconsistencies between the text and the figures (unit labels, sample sizes, and printed averages), recorded in the notes at the end.
</div>

## Wrap and peel

<div id="ptr-onion" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Next hop** to follow a request from the router to the website. The rings around the dot are the layers of encryption: the router adds three, and each relay can remove only one. The first relay learns who sent the request but not where it goes; the last relay learns where it goes but not who sent it. Switch the website to **HTTPS** and the final step stays scrambled too. The scrambling here is real encryption, done in your browser.
</div>

<div data-levels="hs" markdown="1">
Each row is the data on the wire between two stops. Watch the byte count: every layer starts with one short line, "NEXT" and an address, so the bundle shrinks by that line at each relay. A relay that tries the wrong key gets nonsense and no address, which is why only the right relay can open each layer. Change one letter of the message and watch the scrambled rows: only the matching characters change. Counter-mode encryption hides what the letters are but not where an edit happened, which is one reason real Tor adds a tamper check to every cell.
</div>

<div data-levels="ug" markdown="1">
The router holds a 128-bit key and counter for each relay and encrypts inside out: exit layer first (the destination and request), then the middle layer (the exit's address and that ciphertext), then the entry layer. Counter mode turns AES into a keystream, so ciphertext length equals plaintext length and decryption is the same operation as encryption. The hex rows show the first 24 bytes of each stage; the key line shows the active relay's key and the header it recovers. Real Tor differs in two ways the note under the demo names: keys come from a key exchange with each relay, and data travel in fixed-size cells so lengths reveal less.
</div>

<div data-levels="grad res" markdown="1">
The demo follows the paper's description of onion routing in Section II-B (layer *k* readable only by node *k*, each node knowing only its predecessor and successor) rather than Tor's circuit protocol, where the path is built once with telescoping handshakes and later cells carry no routing header. The construction makes the paper's claims concrete: the entry relay sees the router's address and ciphertext, the middle relay sees two relay addresses, and the exit relay sees the destination and, without end-to-end encryption, the request. Length is the one property the page's onion leaks at every hop; Tor's fixed 514-byte cells close most of that channel.
</div>

## Who sees what

<div id="ptr-observers" class="w-demo"></div>

<div data-levels="public" markdown="1">
Turn the **Tor router** off and your Internet provider can see every website you visit. Turn it on and the provider sees only that you are using Tor. Notice the two rows that stay "Yes" either way: anyone else on the router's own Wi-Fi, and (without HTTPS) the exit relay, which can read what you send. The paper names both and recommends using the Tor Browser and HTTPS along with the router.
</div>

<div data-levels="hs" markdown="1">
Before a browser can load a page it asks a DNS server for the site's numeric address, and that question names the site. If those questions skip Tor, an observer learns where you are going even though the pages themselves are hidden; this is a DNS leak. Turn **DNS through Tor** off to see the leak. The authors ran a leak test on their router and found none: the lookups went through Tor.
</div>

<div data-levels="ug" markdown="1">
Each row restates a sentence of the paper. Off: the upstream network reads source, destination, and timing from packet headers. On: the ISP sees encrypted traffic to an entry relay, plus its size and timing; the entry relay knows the sender; the middle relay knows neither end; the exit relay knows the destination and reads plain HTTP; the website sees the exit's address. The router does not protect traffic on its own Wi-Fi, and a compromised router defeats it, so the paper suggests the Tor Browser for end-to-end protection.
</div>

<div data-levels="grad res" markdown="1">
The table encodes the paper's qualitative threat model; the paper does not test any of these observers directly beyond the DNS leak test. Two exposures that matter for a transparent gateway are outside its scope: traffic correlation by an adversary who watches both the entry side and the exit side, and application-level identifiers (cookies, logins, device fingerprints) that pass through Tor unchanged. The paper's caution covers the second in general terms (browsing and system behaviors that compromise anonymity). A transparent proxy also routes every application, including ones that leak identity, which is why the authors pair it with the Tor Browser where available.
</div>

## The price in speed

<div id="ptr-speed" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each bar counts speed tests; the key under the chart tells the two kinds apart. Every download through Tor was slower than every download without it, and most landed between 1 and 1.5 megabits per second. Uploads were slow either way, and some Tor uploads beat some direct ones. The authors found the speed workable: websites loaded and 720p video streamed, but large downloads and full high-definition video were close to impossible.
</div>

<div data-levels="hs" markdown="1">
Speed is measured in megabits per second (Mb/s). One byte is eight bits, so a 1 megabyte (MB) photo is 8 megabits and takes about 8 seconds at 1 Mb/s. The dotted lines mark the averages the paper prints, 1.7 and 8.3. Divide one by the other and Tor runs at about one fifth of the direct speed. The bars put it nearer one sixth; the researcher notes explain why the two disagree.
</div>

<div data-levels="ug" markdown="1">
The histograms are reconstructed from Figures 2 to 5: counts from bar heights and bin edges from the axis ticks. The outer bin edges are the smallest and largest measurements, which gives exact ranges (0.53 to 2.69 Mb/s for Tor downloads). The paper attributes the slowdown to three causes: repeated encryption and decryption, roundabout paths through the relays, and the slowest relay throttling the whole chain. The next demo shows the third.
</div>

<div data-levels="grad res" markdown="1">
The table bounds each mean from the bars alone: every value at its bin's lower edge (with one value pinned at the maximum) gives the lowest possible mean, and the reverse gives the highest. The rank test asks how often a direct test beats a Tor test; for downloads the answer is every pair, so the exact two-sided p is 2 / C(40, 10). These analyses are the page's, not the paper's, and treat the bars as exact counts of independent tests.
</div>

## The slowest link sets the pace

<div id="ptr-pace" class="w-demo"></div>

<div data-levels="public" markdown="1">
A request through Tor crosses four links: your home connection and three relays run by volunteers around the world. Drag the sliders. The whole connection moves only as fast as its narrowest pipe, so a fast home connection cannot rescue a slow relay. The table shows what the paper's measured speeds mean for a real file: pick a size and compare the fastest and slowest tests with and without Tor.
</div>

<div data-levels="hs" markdown="1">
Time equals size divided by speed. A 10 MB file is 80 megabits; at the slowest Tor download in the paper (0.53 Mb/s) it takes about 2.5 minutes, and at the slowest direct download (7.93 Mb/s) about 10 seconds. Try 1 GB to see why the authors found large downloads close to impossible through Tor.
</div>

<div data-levels="ug grad res" markdown="1">
The demo applies only the paper's rule: end-to-end throughput is bounded by the minimum link capacity. Real Tor throughput also depends on relay load, congestion control, circuit-level flow-control windows, and latency over each hop, and Tor's path selection weights relays by measured bandwidth, so faster relays carry more circuits. The paper's observation that "the greater the distance, the greater impact on the speed" is reported without data, so the page does not model distance.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- A Raspberry Pi and free Tor software, about $100 in all, can give every device on a Wi-Fi network the privacy protection of Tor.
- The box met five of the authors' six goals: low cost, privacy from the moment a device connects, simplicity, ease of setup, and everyday usefulness.
- The sixth goal, speed, was traded away: downloads topped out near 2 megabits per second.
- Websites loaded and 720p video played; big downloads and full high-definition video did not work well.
- A test of website lookups found no leaks around Tor.
</div>

<div data-levels="hs" markdown="1">
- Through the router, the 30 download tests ran between about 0.5 and 2.7 Mb/s, most often between 1 and 1.4 Mb/s; without Tor, downloads ran between 7.9 and 9.6 Mb/s.
- The paper prints average download speeds of 1.7 with Tor and 8.3 without.
- Uploads through Tor ran from almost nothing to 0.62 Mb/s; without Tor, from 0.31 to 0.83 Mb/s.
- The DNS leak test showed the router answered lookups through Tor instead of a regular DNS server.
- Anyone else on the router's own Wi-Fi can still see traffic before it enters Tor, and the exit relay reads anything not protected by HTTPS.
</div>

<div data-levels="ug grad res" markdown="1">
- **Feasibility.** A Raspberry Pi 3 with Raspbian Stretch Lite, a second Wi-Fi interface, DHCP, NAT, and Tor at boot forms a portable transparent Tor gateway for about $100.
- **Goals.** Five of six met (cost, immediacy, simplicity, ease of execution, functionality); speed was sacrificed.
- **Throughput.** Tor downloads 0.53 to 2.69 Mb/s (30 tests, modal bin 0.96 to 1.38); direct downloads 7.93 to 9.60 Mb/s (10 plotted tests). Printed averages: 1.7 and 8.3. Tor uploads 0.01 to 0.62 Mb/s; direct uploads 0.31 to 0.83 Mb/s.
- **Usability.** 720p streaming and general browsing worked; large files and full HD did not.
- **DNS.** No leak; lookups resolved through Tor.
- **Limitations stated.** Local Wi-Fi traffic is exposed before Tor, the router itself is a single point of compromise, the exit relay reads unencrypted traffic, and user behavior (plug-ins, torrents, no HTTPS) can defeat anonymity.
</div>

<div data-levels="grad res" markdown="1">
<div class="pt-table-wrap">
<table class="results-table">
<caption class="w-note">Figures 2 to 5 as reconstructed by this page (Mb/s). Mean bounds are the page's computation from the bars.</caption>
<thead><tr><th>Test</th><th>Bars sum to</th><th>Figure title</th><th>Range</th><th>Mean must lie in</th><th>Printed average</th></tr></thead>
<tbody>
<tr><td>Download, Tor (Fig. 2)</td><td>30</td><td>n = 30</td><td>0.53 – 2.69</td><td>1.22 – 1.62</td><td>1.7</td></tr>
<tr><td>Download, direct (Fig. 3)</td><td>10</td><td>n = 30</td><td>7.93 – 9.60</td><td>8.43 – 8.76</td><td>8.3</td></tr>
<tr><td>Upload, Tor (Fig. 4)</td><td>30</td><td>n = 30</td><td>0.01 – 0.62</td><td>0.31 – 0.42</td><td>not given</td></tr>
<tr><td>Upload, direct (Fig. 5)</td><td>10</td><td>n = 30</td><td>0.31 – 0.83</td><td>0.57 – 0.64</td><td>not given</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Many devices people own cannot run privacy software at all: game consoles, smart televisions, voice assistants, and older phones. A router that applies Tor to everything behind it protects them without installing anything, and it fits in a pocket for use on hotel or café Wi-Fi. The paper is also honest about the cost, measuring how much speed privacy takes and naming what the box does not hide. Ultimately, it shows that three undergraduates and their advisor can build working network privacy from about $100 of parts.
</div>

<div data-levels="ug" markdown="1">
The design moves privacy from the endpoint to the network path, which covers devices that cannot run Tor themselves and removes the setup burden from users. The cost is a single trusted box and a shared local network that sits outside the protection. The measurements give a concrete bound on what users trade: an order-of-magnitude drop in download speed on the test network, with interactive use intact.
</div>

<div data-levels="grad res" markdown="1">
Transparent Tor gateways trade application-level protections (Tor Browser's fingerprinting defenses and stream isolation) for coverage of every device, and the paper's contribution is a low-cost, reproducible build with a first measurement of its usability. The evaluation is small and descriptive, which suits a consumer-electronics feasibility study; the throughput data would support stronger claims with paired, interleaved runs, a named test server, and timestamps. Its stated limitations (the local network, the router as a target, and the exit relay) remain the right checklist for anyone building one.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Printed averages do not fit the bars.** With every bar's values placed as low or as high as its bin allows, the Tor download mean must lie between 1.22 and 1.62 Mb/s and the direct download mean between 8.43 and 8.76 Mb/s. The text prints 1.7 and 8.3, both outside. The averages may come from a different set of runs than the plotted ones (see the next note), or from a different speed-test summary.
- **Sample sizes.** All four figure titles read n = 30. Figures 2 and 4 hold 30 tests each; Figures 3 and 5 (without Tor) hold 10 each. If 30 direct tests were run, 20 are missing from the plots.
- **Units.** The text gives the averages in "MB/s" (megabytes); the figure captions, axes, and the 2 Mb/s cap use Mb/s (megabits). Read as megabytes, the averages would be 13.6 and 66.4 Mb/s, far above every plotted bar, so the page reads them as Mb/s.
- **Bin choice.** The four histograms use different numbers of bins (five, four, five, and six) spanning each sample's own minimum to maximum, so bar widths differ between panels. The page draws all four on a shared axis.
- **Test conditions.** The paper does not name the speed-test service or server, the times of the runs, whether Tor and direct runs were interleaved, or the upstream link. "The greater the distance, the greater impact on the speed" suggests multiple servers, which would make the samples heterogeneous. Under these unknowns the page's rank tests show only that the plotted distributions are separated (downloads: U = 300 of 300, exact two-sided p = 2.4 × 10⁻⁹) or mostly separated (uploads: U between 231 and 290 of 300, p between 3.3 × 10⁻⁷ and 0.010).
- **The DNS leak test.** The paper reports the outcome but not the tool or the router's DNS configuration under Tor; Section III-A configures Google Public DNS before Tor is added. A short note on how DNS was redirected into Tor (for example, Tor's DNS port) would let readers reproduce the result.
- **The onion in the first demo** follows Section II-B's description (each layer names the next hop). Tor itself builds a circuit once and then sends fixed-size cells without per-cell routing headers; the page says so under the demo.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Build a paper onion. Write a message on a card, put it in an envelope addressed "to the website," put that envelope in one addressed to student C, that one in one addressed to student B, and hand it to student A. Each student opens one envelope and passes the rest on. Afterward, ask each student what they knew about the sender and the final destination.
2. Use the speed demo to estimate how long a 25 MB file takes at the fastest and slowest Tor download speeds, then check your answers with the table in the last demo by trying nearby sizes.
3. Use the second demo to list everyone who can still see something with the Tor router on and HTTPS off. For each one, propose a change that would hide it, and check whether the paper suggests the same fix.
</div>
