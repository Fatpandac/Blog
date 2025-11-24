---
title: 使用 local 域名管理自己的本地服务
date: 2025-11-19
tags:
  - Rasberry Pi
categories:
  - 技文
---

最近把我的 树莓派 4B 咸鱼出掉了，没想到四年前买三百多买的现在还能三百块钱出掉怎么说树莓派也是一个不错的理财产品了，出掉之后我就买了一个树莓派 5 现在又可以折腾更多东西了。

<!-- more -->

现在我在树莓派上面跑的服务还不是很多目前就有下面这些：

- NAS 主要就是托管我的下载的一些视频方便我在 Apple TV 通过 infuse 观看
- 一个简单的 Git 远程服务，放一些我不想放在 GitHub 上面的代码（后续可能会做一些同步 GitHub 仓库代码备份的事
- podsync 一个可以把 YouTube 视频转成博客订阅的服务
- Portainer 方便我在网页管理我的 Docker
- Simon 监控我的树莓派运行情况以及 Docker
- Home Assistant 帮我创建一些虚拟开关用于自动化和 bridge 连接米家的设备到 HomeKit
- ......

有了这么多的服务这时候需要记住每一个服务的端口号是一件麻烦的事情，于是就可以通过设置 local 域名来方便我管理，为什么要用 local 域名呢？
因为 .local 域名的设计初衷就是为了在本地使用的见（[mDNS-RFC6762](https://datatracker.ietf.org/doc/html/rfc6762)）, 通过 mDNS 可以实现局域网里面广播地址，
但因为 Tailscale 的限制所以我选择使用修改 `/etc/hosts` 来实现对域名和 IP 的映射，于是在 `/etc/hosts` 添加下面内容即可实现 local 域名解析到树莓派地址。

```text
192.168.31.207 raspi.local
```

现在在终端上面运行 `ping raspi.local` 就可以看到解析到了 `192.168.31.207` 这个 IP

```bash
$ ping raspi.local
PING bit.raspi.local (192.168.31.207): 56 data bytes
64 bytes from 192.168.31.207: icmp_seq=0 ttl=64 time=2.204 ms
```

现在你已经可以通过 `raspi.local` 加上对应服务的端口号就可以直接在浏览器访问对应的服务了，但是这样还是不行为了更方便的访问可以实现 二级域名 到对应服务的解析这样才能更方便
直接通过 `bit.raspi.local` 就可以访问树莓派的 `8080` 端口号的服务，这样将会大大方便访问。

那么就想要把 二级域名 指向树莓派的 IP 如下：

```text
192.168.31.207 bit.raspi.local
```

实现了二级域名解析到树莓派 IP 之后就要实现 `bit.raspi.local` 指向 `8080` 端口的服务，这时候就要使用 caddy 来帮忙了

```bash
# 使用下面命令安装 caddy
sudo apt install caddy
```

然后将下面这个配置写入 `/etc/caddy/Caddyfile` 即可

```
bit.raspi.local {
  @local {
    # 代理来自局域网 192.168.31.X 的请求
    remote_ip 192.168.31.0/24
  }
  handle @local {
    # 方向代理到 本地的 8080
    reverse_proxy 127.0.0.1:8080
  }
}
```

这时候在浏览器上面访问 `bit.raspi.local` 就可以请求到对应端口的服务了，当然这里还有一个问题就是 tls，因为这是一个内网域名所以 caddy 没有办法自动发证书，那么需要添加一个配置 `tls internal` 如下：

```
bit.raspi.local {
  tls internal
  @local {
    # 代理来自局域网 192.168.31.X 的请求
    remote_ip 192.168.31.0/24
  }
  handle @local {
    # 方向代理到 本地的 8080
    reverse_proxy 127.0.0.1:8080
  }
}
```

这样就会使用 Caddy 的本地证书签名，之后我们只需要把 Caddy 生成的根证书（root.crt）添加到访问设备的钥匙串并信任即可。操作步骤如下：

1. 获取 Caddy 根证书
   Caddy 会在本地生成一个自签根证书，一般路径如下（取决于系统和安装方式）：

```bash
/var/lib/caddy/.local/share/caddy/pki/authorities/local/root.crt
```

将找到的 root.crt 文件复制到你的 macOS 设备。

2. 在 macOS 上添加并信任证书

- 双击 root.crt 文件，macOS 会自动打开“钥匙串访问”应用。
- 在弹出的窗口中，选择 系统 钥匙串（或者登录钥匙串），点击 添加。
- 添加完成后，在钥匙串中找到该证书，双击打开，展开 信任 选项。
- 将 使用此证书时 选项设置为 始终信任。
- 关闭窗口，系统会提示输入密码确认更改。

3. 验证证书是否生效
   打开浏览器访问你的二级域名（如 bit.raspi.local），此时不再显示 不安全 或 `net::ERR_CERT_AUTHORITY_INVALID` 提示。

这个文件是 Caddy 生成证书的根证书只要信任这个证书之后所有二级域名的签名都可以正常访问。

Tailscale 的组网以同样的形式实现即可将对应的 local 域名解析到 Tailscale 对应设备的 IP 即可，Caddy 添加同样的反向代理给 Tailscale IP 的请求即可我这里则是 `100.66.0.0/24`。

<GiscusComments />
