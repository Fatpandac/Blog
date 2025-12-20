---
title: Vite Proxy Implementation for Dynamic Target Changes and Target Addresses
date: 2023-07-27
tags:
  - Vite
  - Proxy
categories:
  - Tech
---

> [!info]
> This article was auto-translated using ChatGPT.

Recently, while writing a third-party client [biilii](https://biilii.fatpandac.com) for [bilibili](https://bilibili.com) using [Vite](https://cn.vitejs.dev/guide/) as the build tool, I encountered a problem: the addresses of the videos obtained were not unique due to distributed storage. This meant I needed to dynamically change the proxy's target. After searching for relevant information and finding no direct solutions, I explored a method myself.

<!-- more -->

To achieve this, the first step is, of course, to examine the source code of the relevant part to understand how it works, which will then inform how to proceed.
So, I opened Vite's GitHub repository and found the [corresponding code](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/server/middlewares/proxy.ts). This file contains the proxy server related code. From this, we can see that the configuration, after being iterated through `Object.keys(options)` (L8), generates corresponding proxy servers and related configurations, which are then saved to `proxies`. During this process, the `configure` method (L18) in the configuration is also executed (this is key later). At the end of the function (L33), `viteProxyMiddleware` is returned, which retrieves the matching proxy server and configuration from `proxies`. Finally (L46), `proxy.web(req, res, options)` is used to run the proxy.

```ts{8,18,33,46}
export function proxyMiddleware(
  httpServer: http.Server | null,
  options: NonNullable<CommonServerOptions['proxy']>,
  config: ResolvedConfig,
): Connect.NextHandleFunction {
  const proxies: Record<string, [HttpProxy.Server, ProxyOptions]> = {}

  Object.keys(options).forEach((context) => {
    let opts = options[context]
    if (!opts) {
      return
    }

    if (typeof opts === 'string') { ... }
    const proxy = httpProxy.createProxyServer(opts) as HttpProxy.Server

    if (opts.configure) {
      opts.configure(proxy, opts)
    }

    proxy.on('error', (err, req, originalRes) => { ... })

    proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => { ... })

    proxy.on('proxyRes', (proxyRes, req, res) => { ... })

    proxies[context] = [proxy, { ...opts }]
  })

  if (httpServer) { ... }

  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteProxyMiddleware(req, res, next) {
    const url = req.url!
    for (const context in proxies) {
      if (doesProxyContextMatchUrl(context, url)) {
        const [proxy, opts] = proxies[context]
        const options: HttpProxy.ServerOptions = {}

        if (opts.bypass) { ... }

        debug?.(`${req.url} -> ${opts.target || opts.forward}`)
        if (opts.rewrite) {
          req.url = opts.rewrite(req.url!)
        }
        proxy.web(req, res, options)
        return
      }
    }
    next()
  }
}
```

From the above analysis, we can conclude that we can modify the `target` in `opts` within the `configure` method. The modified `opts` will then be passed to `proxy.web(req, res, options)`. By using the `proxy` provided by `configure` to obtain the corresponding URL, we can dynamically modify the `target` based on the URL, thereby enabling the proxy for distributed resource links.

The URL should retain the server address to facilitate matching the target address and changing the `target` value later. For example, `https://cn-sxxa-cm-11-04.bilivideo.com/path/to/video` would be replaced with a request using `/bilivideo/cn-sxxa-cm-11-04.bilivideo.com/path/to/video`. The specific code is as follows:

```ts
export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 3000,
    proxy: {
      "/bilivideo": {
        target: "https://cn-sxxa-cm-01-04.bilivideo.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bilivideo\/.*?\//, ""),
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq) => {
            // Obtain the target server address by regex matching here
            const target = proxyReq.path.match(/\/bilivideo\/(.*?)\//)![1];
            if (target) options.target = `https://${target}/`;
          });
        },
      },
    },
  },
});
```

Using the method described above, the Vite proxy can dynamically modify the `target` configuration based on the URL.
