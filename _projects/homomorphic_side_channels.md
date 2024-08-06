---
title: Homomorphic Acceleration Side-Channel Attacks
subtitle: Finding information leakage in homomorphic acceleration platforms.
image: images/project/default.jpg
projectmembers:
-
  id: aaron-lingerfelt
  name: "Aaron Lingerfelt"
  role: "Project Lead"
  start-date: "2023-10-10"
tags: 
  - active
  - encryption
  - side-channel
prq: Do proposed homomorphic acceleration platforms leak information about their cryptographic keys?

---

With the rise of cloud computing, we need ways to preserve our data against cloud server attacks. Typically data sent to the cloud must be decrypted before operations can be performed on it, creating a weakness for attackers. Homomorphic encryption provides a solution against this by allowing cloud computing operations to be performed on encrypted data, securing against a potential cloud-side attack. However, homomorphic encryption/decryption is a computationally expensive process, and typical edge-side embedded devices need additional hardware and software implementations to accelerate the en/decryption step. However, these edge-sided operations are still be susceptible to side-channel attacks, potentially leaking information about the cryptographic keys. This project seeks to explore potential side-channels in proposed homomorphic acceleration platforms.
