---
title: Homelab HTTPS via Cloudflare
date: 2026-06-11
tags:
  - Homelab
  - https
  - Cloudflare
categories:
  - Tech
---

<script setup>
import HomelabCloudflareTopology from '../../../.vitepress/theme/components/Atoms/HomelabCloudflareTopology.vue'
</script>

> [!info]
> This article was auto-translated using Claude.

A while back my GitHub account got suspended out of the blue. I eventually got it back after going back and forth with GitHub Support, but the experience shook me enough that I decided to self-host a Gitea instance as a backup — so that if something like that ever happens again, I won't be locked out of my own code.

<!-- more -->

I set up Gitea on my Raspberry Pi. At the time I was using my earlier approach: a self-signed certificate for HTTPS and a local `/etc/hosts` override to point the domain at the Pi's LAN IP. The details of that setup are in a [previous post](../../2025/11/local_domain.md).

The problem I ran into was that Gitea doesn't support Passkey authentication when a self-signed certificate is in use. Since I almost always reach for Passkey when signing in to a site, losing that was a real pain. The solution I landed on was to route HTTPS through Cloudflare — letting Caddy use a proper certificate obtained via Cloudflare's DNS API.

<HomelabCloudflareTopology />

First, update the Caddy configuration on the Raspberry Pi:

```txt
gitea.fatpandac.com {
    tls {
        # Replace with your own Cloudflare API Token
        dns cloudflare XXXXXXXXXXXXXXXXXXXXXXXXXX
    }
    reverse_proxy localhost:3000
}
```

This tells Caddy to obtain a certificate through Cloudflare's DNS-01 challenge. Next, add a DNS record in Cloudflare: an `A` record with the hostname `gitea` pointing to your Raspberry Pi's LAN IP. After that you can reach Gitea at `gitea.fatpandac.com` — as long as you're on the same local network.

If you also want access from outside the LAN, one option is Cloudflare Tunnel, but that exposes the service to the public internet. You can restrict it with an auth layer, but it's extra complexity I didn't want. Instead, I went with Tailscale.

Once the devices that need access are joined to the same Tailscale network, they can reach the Pi regardless of where they are physically. The Cloudflare DNS record still points to the Pi's LAN IP, but with Tailscale's subnet routing enabled you can reach that IP from any device on the tailnet.

Enable subnet routing on the Pi with:

```bash
sudo tailscale up --advertise-routes=192.168.31.0/24
```

After running that command, go to the Tailscale admin console and approve the subnet route. From then on, any device connected to Tailscale can open `gitea.fatpandac.com` and land on the Gitea instance.
