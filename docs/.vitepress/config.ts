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
  rewrites: {
    'zh/:rest*': ':rest*'
  },
})
