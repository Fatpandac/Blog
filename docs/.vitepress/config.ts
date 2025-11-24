import { defineConfig } from 'vitepress'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  title: "Fatpandac's blog",
  lastUpdated: true,
  lang: 'zh-CN',
  outDir: '../public',
  themeConfig: {
    logo: '',
    search: {
      provider: 'local'
    },
    siteTitle: false,
    aside: false,
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
    'blog/:year/:month/:slug.md': 'docs/:year/:month/:slug.md'
  },
})
