---
title: Raspberry Pi Samba Transfer Speed Troubleshooting
date: 2025-09-20
tags:
  - Raspberry Pi
  - NAS
categories:
  - Tech Article
---

> [!info]
> This article is auto translated by ChatGPT.

Recently, I stopped using my PC and went back to tinkering with the Raspberry Pi. I bought a hard drive enclosure, connected it to the Pi, set up a Samba server to store downloaded videos, and used it with Infuse on Apple TV.  
However, I ran into an issue: the Samba network transfer speed was quite poor—only around **10MB/s**! So I started investigating...

<!-- more -->

Here are the troubleshooting steps:

1. **Check if the disk speed is the bottleneck** using the following commands:

```bash
hdparm -t /dev/sda  # Replace /dev/sda with the correct disk path

# Then run this command to measure disk write speed
dd if=/dev/zero of=/mnt/data/test bs=1M count=1024 oflag=direct
```

2. **Check if the network speed is the bottleneck** using `iperf3`:

```bash
# Install if not already installed
sudo apt install iperf3

# Start the server on the Raspberry Pi
iperf3 -s

# Run the client on another device to measure network speed
iperf3 -c <Raspberry Pi IP address> -t 30 -P 4
```

After following the steps above, I confirmed that the issue was caused by the network. I had been using Wi-Fi on the Raspberry Pi, and switching to a wired Ethernet connection fixed the problem.  

A side note: Infuse doesn't seem to handle KMV very well—other formats appear to have slower reading speeds.