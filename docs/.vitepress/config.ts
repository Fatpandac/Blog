import { defineConfig } from 'vitepress'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  title: "Fatpandac's blog",
  lastUpdated: true,
  lang: 'zh-CN',
  outDir: '../public',
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/',
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
    },
  },
  themeConfig: {
    logo: '',
    siteTitle: false,
    aside: false,
    nav: [
    ]
  },
  head: [
    ['link', { rel: 'icon', href: '/favicon.png' }],
    [
      "script",
      {
        async: "",
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9193612170661714",
        crossorigin: "anonymous",
      },
    ],
    [
      "meta",
      { name: "google-adsense-account", content: "ca-pub-9193612170661714" },
    ],
    ["link", { rel: "icon", href: "/favicon.png" }],
    [
      "script",
      {
        async: "",
        src: "https://www.googletagmanager.com/gtag/js?id=G-10D6YDNQ9J",
      },
    ],
    [
      "script",
      {},
      `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-10D6YDNQ9J');
            `,
    ],
  ],
  vite: {
    plugins: [
      UnoCSS()
    ],
    server: {
      proxy: {
        '/api': {
          target: 'https://hidden-mud-7c6e.tingfeizheng.workers.dev',
          changeOrigin: true,
        }
      }
    }
  },
  sitemap: {
    hostname: 'https://fatpandac.com',
  },
  cleanUrls: true,
  rewrites: {
    'zh/:path+': ':path+',
  },
})
