---
title: Managing Local Services with Local Domain Names
date: 2025-11-19
tags:
  - Raspberry Pi
categories:
  - Tech Article
---

> [!info]
> This article is auto translated by ChatGPT.

Recently, I sold my Raspberry Pi 4B. Surprisingly, the one I bought for around 300 RMB four years ago could still sell for 300 RMB, making the Raspberry Pi a decent investment! After selling it, I bought a Raspberry Pi 5, which allows me to experiment with even more projects.

<!-- more -->

Currently, the services I run on the Raspberry Pi are not many, mainly:

- **NAS**: Hosting downloaded videos for viewing on Apple TV via Infuse.
- **Simple Git server**: Storing code I don't want on GitHub (later I may add GitHub backup sync).
- **Podsync**: Converts YouTube videos into podcast feeds.
- **Portainer**: Manage Docker via a web interface.
- **Simon**: Monitor Raspberry Pi and Docker status.
- **Home Assistant**: Create virtual switches for automation and bridge Mi Home devices to HomeKit.
- ...

With so many services, remembering each port number can be troublesome. Using a local domain simplifies management. Why use a `.local` domain? `.local` is designed for local use ([mDNS-RFC6762](https://datatracker.ietf.org/doc/html/rfc6762)), allowing address broadcasting in the LAN. Due to Tailscale limitations, I chose to modify `/etc/hosts` for domain-to-IP mapping. Add the following to `/etc/hosts`:

```text
192.168.31.207 raspi.local
```

Now, running `ping raspi.local` in the terminal resolves to `192.168.31.207`:

```bash
$ ping raspi.local
PING bit.raspi.local (192.168.31.207): 56 data bytes
64 bytes from 192.168.31.207: icmp_seq=0 ttl=64 time=2.204 ms
```

You can now access services by using `raspi.local` with the corresponding port in the browser. For even more convenience, you can set up **subdomains** to map directly to specific services, e.g., `bit.raspi.local` to the service on port `8080`.

Add the subdomain mapping in `/etc/hosts`:

```text
192.168.31.207 bit.raspi.local
```

After resolving the subdomain to the Raspberry Pi's IP, use **Caddy** to point `bit.raspi.local` to port `8080`:

```bash
# Install Caddy
sudo apt install caddy
```

Create the following configuration in `/etc/caddy/Caddyfile`:

```
bit.raspi.local {
  @local {
    # Proxy requests from LAN 192.168.31.X
    remote_ip 192.168.31.0/24
  }
  handle @local {
    # Reverse proxy to local port 8080
    reverse_proxy 127.0.0.1:8080
  }
}
```

Visit `bit.raspi.local` in the browser to access the service. However, TLS is an issue. Since this is a local domain, Caddy cannot automatically issue certificates. Add `tls internal` to use Caddy's local certificate:

```
bit.raspi.local {
  tls internal
  @local {
    remote_ip 192.168.31.0/24
  }
  handle @local {
    reverse_proxy 127.0.0.1:8080
  }
}
```

Caddy will generate a self-signed root certificate (`root.crt`). Add it to the keychain of your device and trust it:

1. **Obtain Caddy root certificate** (path may vary):

```bash
/var/lib/caddy/.local/share/caddy/pki/authorities/local/root.crt
```

Copy `root.crt` to your macOS device.

2. **Add and trust certificate on macOS**

- Double-click `root.crt`, macOS will open Keychain Access.
- Choose **System** keychain (or Login), click **Add**.
- Find the certificate, double-click, expand **Trust**, set **When using this certificate** to **Always Trust**.
- Close and enter password to confirm.

3. **Verify certificate**

Open the browser and visit your subdomain (`bit.raspi.local`). The warning `net::ERR_CERT_AUTHORITY_INVALID` should no longer appear.

Once trusted, all subdomains using Caddy’s certificate will work.  
For Tailscale, the same approach works: map the local domain to the Tailscale device IP and set up reverse proxy for Tailscale IP (`100.66.0.0/24` in my case).
