---
title: "A Flash Drive That Locks When It Is Read Out of Order"
kicker: "Interactive paper · Annual Simulation Symposium 2008"
subtitle: "An interactive companion to R. Brian Anderson, Mike Borowczak, and Philip A. Wilsey's self-protecting USB storage device, which watches the order of the blocks it is asked for and shuts itself down when that order stops looking like a file system at work."
description: "Play a thief and an owner against a USB drive that counts trust, decode the 31-byte command a computer sends to read a block, step through the paper's three-constant trust rule, and run it over recreated FAT file-system traces to see why the paper's constants accept normal use and lock out a raw copy within four accesses."
share_description: "A lost flash drive gives up its files to anyone who plugs it in. This one watches the order of the blocks it is asked for, and a stranger's copy tool locks it within four requests. Try the paper's trust counter in your browser, written for five reading levels."
share_text: "A flash drive that watches the order of the blocks it is asked for, and locks when a stranger tries to copy it. Try it in your browser:"
share_image: /papers/usb-self-protecting/share.png
share_image_alt: "A trust counter for a USB drive: on a recreated FAT file-system trace the trust line stays between three and eight, while a raw copy without the driver drains it to zero in four accesses, under the title A Flash Drive That Locks When It Is Read Out of Order."
date: 2026-10-20
topics: ["Hardware security"]
default_level: public
level_hints:
  public: No background needed
  hs: Bits, bytes, and counting
  ug: Storage, USB, and programming
  grad: Detector design and false alarms
  res: Full method, reproduction, and open questions
authors:
  - name: R. Brian Anderson
    affiliation: Clifton Labs, Inc.
  - name: Mike Borowczak
    affiliation: Clifton Labs, Inc.
    member: mike-borowczak
  - name: Philip A. Wilsey
    affiliation: Clifton Labs, Inc., and University of Cincinnati
sources:
  - venue: "41st Annual Simulation Symposium (ANSS) · 2008 · pp. 220–226"
    title: "The Use of Device Simulation in Development of USB Storage Devices"
    url: https://doi.org/10.1109/ANSS-41.2008.34
    access: Paywalled (IEEE)
code:
  label: "This page's detector, recorded traces, and checks (no authors' code is public)"
  url: https://github.com/ucf-draco-lab/draco-website/tree/main/papers/usb-self-protecting
citations:
  - anderson2008use
widget:
  css:
    - /papers/usb-self-protecting/widget.css
  js:
    - /papers/usb-self-protecting/trust-engine.js
    - /papers/usb-self-protecting/widget.js
credit: "Interactive page by the [DRACO Lab](/). The detector in `trust-engine.js` ports the trust rule the paper prints in Section 5 (`calcNewTrust`, with START_TRUST 3, INC_TRUST 1, and MAX_TRUST 8). The paper's own Java, compiled with the one missing semicolon restored, gives the same trust value as the page at every step of 3,028 test sequences (469,050 accesses). The paper's 2008 SCSI traces are not public, so the file-system traces here were recorded from the open-source pyfatfs driver on a 16 MB FAT16 image and are labeled recreated; with the paper's constants all four are accepted when each block is checked, which reproduces the paper's claim that these constants accept valid use. The 31-byte Command Block Wrapper matches the paper's struct field for field. The address cipher is this page's stand-in, since the paper does not name one. Everything runs on your device."
bibtex: |
  @inproceedings{anderson2008usb,
    author    = {Anderson, R. Brian and Borowczak, Mike and Wilsey, Philip A.},
    title     = {The Use of Device Simulation in Development of {USB} Storage Devices},
    booktitle = {41st Annual Simulation Symposium (ANSS-41 2008)},
    pages     = {220--226},
    year      = {2008},
    publisher = {IEEE},
    doi       = {10.1109/ANSS-41.2008.34}
  }
---

<div class="lede" data-levels="public" markdown="1">
Anyone who finds a lost USB flash drive can plug it in and read every file on it. R. Brian Anderson, Mike Borowczak, and Philip A. Wilsey, then at Clifton Labs, designed a drive that protects itself. Its owner's computer scrambles every request, and the drive watches the order of the requests it receives. A computer saving or opening files mostly asks for neighboring pieces of the disk, one after another. A stranger without the scrambling key looks, to the drive, like someone jumping all over the disk. After a few such jumps the drive locks. The paper describes how the team built and tested this idea in software before building any hardware.
</div>

<div class="lede" data-levels="hs" markdown="1">
A flash drive stores data in numbered blocks of 512 bytes, and the computer reads or writes it by asking for block numbers. This paper's drive keeps a small score called trust. Each request for the block right after the previous one adds a point (up to eight), and each jump to some other block takes a point away; trust starts at three, and at zero the drive shuts off. The owner's driver encrypts the block numbers, and only the drive can decrypt them. Without the key, a copy tool's requests decrypt to random numbers, and three random jumps empty the score.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper prototypes a self-protecting USB mass-storage device in Microsoft's Device Simulation Framework (DSF) before committing it to silicon. The simulated device stacks four layers (DSF scaffolding, the USB Mass Storage bulk-only protocol, a seven-command SCSI interpreter, and a tamper detector) and runs as a real USB disk under Windows. The host driver sends encrypted read and write addresses; the device decrypts each one and passes it to the tamper detector, which keeps a trust count: plus one for the next sequential block, minus one for any other block, capped at eight and starting at three. The authors captured SCSI traces of Windows formatting, writing, reading, and deleting files on FAT and NTFS, and tuned the constants in a Java test harness.
</div>

<div class="lede" data-levels="grad" markdown="1">
The design rests on an observation from trace compression: programs and file systems access storage in highly regular patterns. Anderson, Borowczak, and Wilsey turn that regularity into an access-control signal. A linear trust accumulator, T*ᵢ* = min(T*ᵢ*₋₁ ± *c*, T_max), rewards sequential block addresses and penalizes jumps, and the device disables itself when T ≤ 0. The constants must accept every legitimate trace while catching anything that does not look sequential; the authors chose T₀ = 3, *c* = 1, and T_max = 8 from SCSI traces of up to 3,000 operations. Address encryption between driver and device makes an unauthorized reader's requests look random, which is what the detector catches.
</div>

<div class="lede" data-levels="res" markdown="1">
Anderson, Borowczak, and Wilsey (ANSS 2008) report an experience paper: a DSF-based simulation of a USB mass-storage device with a pluggable `TamperDetector`, a Java harness that replays captured READ/WRITE traces through detector implementations, and a linear trust detector (Section 5) that "met the requirements of the system" and moved to an Atmel AT90USB1286 prototype. The paper prints the detector's code and constants but no traces, acceptance counts, or detection results. This page ports the printed detector and checks it against the printed Java, rebuilds the 31-byte Command Block Wrapper, records replacement FAT traces with an open-source driver, and asks which reading of the detector's input (each block or each command) is consistent with the paper's claim. The answer, and what it implies for the figures and the cipher, is in the notes at the end.
</div>

## Steal the drive

<div id="us-steal" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Play** with **Owner copies files**. Each tile is one piece of the drive the computer asks for, and its colored edge (see the key) shows whether it came right after the previous one, repeated it, or jumped somewhere else. The eight boxes are the drive's trust. Saving files is mostly neighbors, so the trust stays full. Now try **Thief copies the raw drive**: the copy tool asks for pieces in order, but without the owner's key the drive unscrambles them into nonsense, and it locks after four requests.
</div>

<div data-levels="hs" markdown="1">
The owner's run is the start of a recorded file-saving session. Count the jump tiles: the computer jumps a few times to update the drive's table of contents, loses a point each time, and earns it back with the next run of neighbors. The thief's copy tool sends 0, 1, 2, 3, which would be perfectly sequential, but the drive decrypts each number with its key, and decrypted garbage lands at random. Three jumps take trust from three to zero.
</div>

<div data-levels="ug" markdown="1">
The tiles show the decrypted block address the detector sees, with the address on the cable underneath. The page's stand-in cipher is a keyed four-round Feistel permutation over the drive's 32,768 blocks; the paper encrypts addresses in the driver but does not specify a cipher. The owner run is the first 260 block accesses of the recreated write trace in the fourth demo, and it changes with the address unit and constants chosen there.
</div>

<div data-levels="grad res" markdown="1">
Detection latency for an unkeyed reader is deterministic here: the first access only sets the reference address, and each later access is a jump with probability 1 − 2/*N* for a uniformly random decryption, so the drive locks at access T₀/*c* + 1 = 4 with the paper's constants. The protection therefore rests on the cipher. A reader with the key and driver (the replay row in the code) reads the whole device sequentially without losing trust; the detector distinguishes keyed from unkeyed access, not benign from malicious use.
</div>

## One READ command, 31 bytes

<div id="us-cbw" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
This is what a computer actually sends over the USB cable to read part of a flash drive. Move the sliders and watch the highlighted bytes change: they carry the block number and how many blocks to read. Everything else stays the same from request to request. The drive's trust check sits right where these bytes are decoded, so it sees every block number the computer asks for.
</div>

<div data-levels="ug grad res" markdown="1">
A USB mass-storage device in bulk-only mode receives each SCSI command inside a 31-byte Command Block Wrapper; the paper prints the struct (signature, tag, transfer length, flags, logical unit number, command length, and a 16-byte command block). A READ(10) command puts the opcode 28h in the first command byte, the logical block address big-endian in bytes two to five, and the transfer length in bytes seven and eight. The paper's `ScsiInterpreter` implements seven commands (INQUIRY, TEST_UNIT_READY, READ_CAPACITY, READ, WRITE, MODE_SENSE, and REQUEST_SENSE), enough for Windows to mount the simulated device, and calls `AnalyzeReadRequest(address, length)` before returning any data.
</div>

<div data-levels="res" markdown="1">
The detector API receives an address and a length, but the printed `calcNewTrust` compares single addresses with `previousAddress + 1`. Whether the harness expands each command into its blocks or passes one address per command decides whether a steady multi-block file read counts as sequential. The fourth demo shows that only the per-block reading is compatible with the paper's statement that the constants accept valid traces.
</div>

## The trust counter, one access at a time

<div id="us-trust" class="w-demo"></div>

<div data-levels="public" markdown="1">
Build your own sequence. **Next block** asks for the piece right after the last one and earns a point. **Same block** changes nothing. **Jump** goes somewhere else and costs a point. The dashed line is zero: touch it and the drive locks for good. Try **Earn, then jump** to see how a run of neighbors buys room for a few jumps, and no more.
</div>

<div data-levels="hs" markdown="1">
The rule has three numbers: start at three, add one for each neighbor, and never go above eight. With eight points banked, a reader can survive seven jumps in a row, and the eighth locks the drive. **A small file save** follows the pattern a file system really makes: it touches the table of contents (blocks 1 and 2), the folder listing (65 and 66), and then the file's own blocks in order, and it finishes with trust to spare.
</div>

<div data-levels="ug grad res" markdown="1">
The code block mirrors the paper's Java. Duplicates leave trust unchanged, so a driver that rereads the same block (as file systems do when they update the directory) neither gains nor loses. The sliders change the three constants for every demo on the page. Two edge cases the paper leaves open are fixed here: the first access sets the reference address without changing trust, and a backward step of one block (address − 1) counts as a jump, as the printed code implies.
</div>

## What a file system really asks for

<div id="us-traces" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each dot is one piece of the drive, in the order a computer asked for it while formatting the drive, saving 12 files, reading six, and deleting six. Most dots climb in straight diagonal lines: the computer reads or writes files in order. The shaded bands near the bottom are the drive's table of contents and folder listing, which the computer revisits often. The line underneath is the drive's trust. With the paper's numbers it never reaches zero, so the owner would never notice the protection.
</div>

<div data-levels="hs" markdown="1">
The highlighted jump dots come in small groups: write some file data, jump to update the table of contents, jump to update the folder, jump back to the data. Each group costs two or three points, and the next run of file data earns them back. The paper captured traces like these from Windows and drew them in its Figure 4; this page recorded its own with an open-source file-system program, because the original traces were never published.
</div>

<div data-levels="ug" markdown="1">
The image is FAT16 with four 512-byte blocks per cluster: boot sector at block 0, two copies of the file allocation table (FAT) at blocks 1 to 32 and 33 to 64, the root directory at 65 to 96, and file data from 97. Switch **Address checked** to **Each command**: the same traces now lock the drive within their first seven commands, because a 32-block FAT write followed by the next 32 blocks starts 32 addresses later, which the rule calls a jump.
</div>

<div data-levels="grad res" markdown="1">
The table runs all four traces under the current settings. With the paper's constants and per-block addresses, every trace is accepted: lowest trust 2 for the format and 3 for the other three, with at most three back-to-back jumps. With one address per command, every trace locks (at accesses 4 to 7 of the full traces). Watching only reads or only writes, as the paper's Section 2 allows, changes the counts but not the outcome under the per-block reading. These are pyfatfs traces, not Windows traces: pyfatfs rewrites a whole 32-block FAT copy at each flush, where a Windows driver would touch fewer blocks more often.
</div>

## Choosing the three numbers

<div id="us-tune" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
The designers had to pick the three numbers so the owner never gets locked out and a stranger gets locked out quickly. Each cell tries one pair: the top figure is how many of the four normal recordings pass, and the bottom figure is how many requests a stranger gets before the lock. A lower starting score catches strangers sooner, but start too low and formatting the drive trips the alarm. The paper's choice, three and eight, passes all four and stops a stranger in four requests.
</div>

<div data-levels="ug" markdown="1">
START_TRUST sets the intruder's budget directly: with INC_TRUST = 1, an unkeyed reader gets START_TRUST + 1 accesses. MAX_TRUST sets how many jumps a legitimate session can absorb after a run of sequential blocks. On these traces, MAX_TRUST of 2 fails everything (a FAT update and a directory update come back to back), MAX_TRUST of 4 or more passes everything with START_TRUST of 2 or more, and START_TRUST of 1 fails only the format, whose first accesses are jumps.
</div>

<div data-levels="grad res" markdown="1">
The paper's T₀ = 3 sits one step above the smallest start that accepts these four traces (2), which leaves a margin of one jump for patterns the traces miss; T_max = 8 is twice the smallest maximum that works here. The grid is the page's computation on recreated traces and a uniform-random intruder, not a result from the paper, which reports the chosen constants without the search behind them. A larger trace corpus (NTFS, Windows caching, interleaved applications) would move the edge of the feasible region, and the margin is what absorbs that.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Simulating a new USB drive in software let a small company test its security idea, and write the computer-side software, before building any hardware.
- Computers read and write flash drives in long runs of neighboring blocks, which makes "out of order" a useful warning sign.
- A simple trust score with three settings accepted the team's recordings of normal use and was chosen for the hardware version.
- The software prototype moved to a real microcontroller with little trouble, because the driver had been written alongside the simulated drive.
</div>

<div data-levels="hs" markdown="1">
- The simulated drive worked as a real USB disk in Windows while only answering seven kinds of commands.
- Recordings of formatting, writing, reading, and deleting files (up to 3,000 commands each) showed long runs of sequential block numbers.
- The trust rule (start at three, plus or minus one, never above eight) accepted every normal recording and became the design for the hardware.
- The simulator could not test error handling: once the simulated drive signaled an error, the team found no way to recover the connection.
</div>

<div data-levels="ug grad res" markdown="1">
- **Simulation first.** Microsoft's DSF ran the four-layer device model as a real USB disk under Windows and let the team develop the kernel-mode driver against it.
- **Seven SCSI commands suffice.** INQUIRY, TEST_UNIT_READY, READ_CAPACITY, READ, WRITE, MODE_SENSE, and REQUEST_SENSE were enough for Windows to use the simulated device as storage.
- **Access patterns are linear.** Traces of Windows formatting, reading, writing, and deleting on FAT (Figure 4) and NTFS, up to 3,000 SCSI operations each, showed predominantly sequential block access.
- **The detector.** A linear trust rule with T₀ = 3, *c* = 1, and T_max = 8 met the system's requirements in the Java harness and was chosen for hardware.
- **Limits of the tool.** DSF lacked documentation and could not clear a stalled endpoint, so the error-reporting path could not be tested in simulation; the design then moved to an Atmel AT90USB1286 programmed in C.
</div>

<div data-levels="grad res" markdown="1">
<div class="us-table-wrap">
<table class="results-table">
<caption class="w-note">What the paper reports and what this page computes from it.</caption>
<thead><tr><th>Quantity</th><th>Paper</th><th>This page</th></tr></thead>
<tbody>
<tr><td>CBW size</td><td>struct of 4 + 4 + 4 + 1 + 1 + 1 + 16 bytes, "31-byte"</td><td>31 bytes, built in the second demo</td></tr>
<tr><td>Trust constants</td><td>START 3, INC 1, MAX 8</td><td>same; identical to the printed Java on 469,050 accesses</td></tr>
<tr><td>Valid traces accepted</td><td>"met the requirements" (no counts)</td><td>4 of 4 recreated FAT traces, per-block addresses; 0 of 4 per command</td></tr>
<tr><td>Trace length</td><td>up to 3,000 SCSI operations</td><td>11 to 401 commands (46 to 5,650 block accesses)</td></tr>
<tr><td>Accesses before an unkeyed reader locks</td><td>not reported</td><td>4 (T₀/<i>c</i> + 1)</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Flash drives get lost every day, and most carry no protection at all. Encryption alone protects the files but needs the owner to manage keys and passwords. This design adds a second layer that the drive enforces itself: even if someone tries to copy the raw contents, the drive notices within a handful of requests and stops answering. The same idea of a memory that knows how it is normally used could apply to phones, cameras, and the memory inside computers. Ultimately, the paper also shows how a small team can test a hardware idea cheaply in software before spending money on chips.
</div>

<div data-levels="ug" markdown="1">
The detector costs almost nothing in hardware: one stored address, one small counter, and a comparator, checked once per block. It needs no training and no model of the user, only the regularity that file systems already have. The paper's larger lesson is methodological: a software model of the device, running against the real operating system's driver stack, let the team iterate on detection rules and write the host driver before fabrication, and the move to a microcontroller was straightforward because the driver already existed.
</div>

<div data-levels="grad res" markdown="1">
Self-protecting memories turn access-pattern regularity, long exploited for trace compression and prefetching, into an enforcement mechanism at the storage boundary. The trust rule is a one-state anomaly detector with a single tunable trade-off between false lockouts and attacker budget, which makes it auditable and cheap enough for a USB controller. Its strength comes from pairing it with address encryption: the detector does not need to recognize attacks, only the absence of the driver's key. The open questions are the ones a deployment would raise: fragmented file systems, operating-system caching and readahead, wear leveling, and what an attacker who learns the rule can do with replayed traffic.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **No published traces or counts.** The paper reports the chosen constants and the statement that the algorithm "met the requirements of the system," with no acceptance rates, false-lockout counts, or detection latencies. The page's reproduction is therefore of the claim, on traces recorded for this page, not of a table.
- **Per block, not per command.** The printed rule compares each address with `previousAddress + 1`, while the harness passes `IoAction` objects carrying an address and a length. Fed one address per command, every recreated trace locks within its first seven commands; fed one address per block, all four are accepted. Only the per-block reading fits the paper's claim, and the page uses it by default. The paper does not say which the harness did.
- **Figure 4's second axis.** The right-hand axis of Figure 4, "Number of Consecutive Non-sequential Addresses," runs to 11 for the FAT delete and write traces and to 6 for the format. A run of 11 consecutive jumps would drain any trust capped at 8, so if those counts were reached the plotted quantity must differ from the detector's input (for example, counted per command, or including repeated addresses). The recreated traces never exceed three consecutive jumps per block.
- **Edge cases fixed by the page.** The first access sets the reference address without changing trust; trust ≤ 0 is the tamper condition (from the text; the printed code returns the value and leaves the comparison to the caller); a step to address − 1 counts as a jump. Restarting trust on reconnection is not described.
- **The printed code.** `trust += INC_TRUST` lacks its semicolon in the print; restored, the Java compiles and matches the page. The text formula T*ᵢ* = min(T*ᵢ*₋₁ ± *c*, T_max) omits the duplicate case, which the code handles.
- **The cipher.** The paper says the driver encrypts addresses and the device decrypts them but names no cipher, key size, or mode. The page uses a four-round keyed Feistel permutation with cycle walking over 32,768 blocks (verified as a bijection with exact inverse on every address). A deterministic per-address cipher maps a sequential plaintext stream to a fixed ciphertext sequence, so an observer on the bus who records one session learns a valid sequence to replay; a tweak or counter in the cipher would address that.
- **Recreated traces.** pyfatfs 1.1.0 on a 16 MiB FAT16 image, writing and reading in 4,096-byte chunks. It flushes whole FAT copies (32 blocks) at a time, and it rewrites the boot sector and both FAT copies when it opens and closes the volume, so even the read trace contains writes. Windows' FAT driver, its caching, and readahead will produce different jump structure; NTFS, which the paper also traced, is not recreated.
- **Bibliography.** The `anderson2008use` entry in `proceedings.bib` now carries the DOI, a DOI link in place of a shortened link, and the title's capitalization as printed.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Write down 20 block numbers that a computer might ask for when it saves a short file: two for the table of contents, two for the folder, and the rest in a row. Score them by hand with the rule (start at three, plus one for the next number, minus one for anything else, never above eight). Check your score in the third demo.
2. Now write 20 random numbers between 0 and 1,000 and score them the same way. How many numbers does it take to reach zero? Explain why the answer does not depend on which random numbers you picked.
3. In the last demo, find the lowest starting score that still lets all four normal recordings pass. Discuss with a partner why the designers might choose one point higher than that.
</div>
