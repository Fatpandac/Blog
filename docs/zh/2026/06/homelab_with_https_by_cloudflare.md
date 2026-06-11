---
title: Homelab 通过 Cloudflare 配置 https
date: 2026-06-11
tags:
  - Homelab
  - https
  - Cloudflare
categories:
  - 技文
---

<script setup>
import HomelabCloudflareTopology from '../../../.vitepress/theme/components/Atoms/HomelabCloudflareTopology.vue'
</script>

前段时间遇到一个问题我的 GitHub 帐号突然被封禁了，不过在后面和 GitHub Support 沟通之后拿回来了，
但是还是让我有些后怕，最后决定要自己搭建一个 Gitea 来备份一下，避免后面再出现这个问题的时候我的代码没有办法获取到了。

<!-- more -->

最后我在我的树莓派上面搭建了 Gitea 这时候我当时使用的之前的方法通过系统自带的签证实现 https 以及修改需要访问的机子的 host
来实现 DNS 查找树莓派 IP 然后通过自带签证来实现 https 具体实现可以看看之前的[文章](../../2025/11/local_domain.md)。

不过后面发现有一个问题 Gitea 如果使用的是自签证的话 auth 登录的时候就没有办法使用 Passkey 了，为了简化登录的麻烦我在登录注册
网站的时候我基本都会优先选择 Passkey 登录，所以这个问题就比较麻烦了，后来我就想到了一个办法就是通过 Cloudflare 来实现 https 
以及 DNS 解析，这样就可以直接使用 Cloudflare 的证书来实现 https 了。

<HomelabCloudflareTopology />

首先就是要修改我的树莓派上 caddy 的我配置文件，修改成下面的样子：

```txt
gitea.fatpandac.com {
    tls {
        # 这里需要替换成你自己的 Cloudflare API Token
        dns cloudflare XXXXXXXXXXXXXXXXXXXXXXXXXX 
    }
    reverse_proxy localhost:3000
}
```

通过上面的配置就可以让 caddy 通过 Cloudflare 的 API 来获取证书了，接下来就是要在 Cloudflare 上面添加一个 DNS 记录了
在 Cloudflare 上面添加一个 A 记录，主机名是 gitea，指向你的树莓派的局域网 IP 地址，这样就可以通过 gitea.fatpandac.com 来访问你的 Gitea 了。
当然这种方式是需要你和树莓派在同一个局域网里面的，为了更加方便使得不在同一个局域网的情况下也可以访问的话可以通过 Cloudflare 的 Tunnel 来实现，
但是这种会有一个问题就是在公网上所有人都可以访问虽然可以通过配置 auth 来限制访问，但是还是比较麻烦的，所以我就没有使用这种方式了。

最后选择了使用 Tailscale 的方式来实现，现在需要访问的设备上登录 Tailscale 之后，把这些原本不在一个局域网里面的设备都加入到同一个 Tailscale 网络
里面，这样就可以通过 gitea.fatpandac.com 来访问你的 Gitea 了。

这时候 Cloudflare 的 DNS 解析还是会指向你自己的树莓派的局域网 IP 地址，但是在加入 Tailscale 之后就不能通过这个局域网 IP 地址来访问了，这时候
需要给树莓派的 Tailscale 添加一个局域网路由，使其可以访问到树莓派的局域网 IP 地址，这样就可以通过 gitea.fatpandac.com 来访问你的 Gitea 了。

Tailscale 开启的命令如下：

```bash
sudo tailscale up --advertise-routes=192.168.31.0/24
```

执行这个命令之后再到 admin console 上面开启这个路由就可以了，之后就可以连接 Tailscale 后通过 gitea.fatpandac.com 来访问你的 Gitea 了。
