import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

// Optional browser regression: set BLOG_TEST_URL and PLAYWRIGHT_MODULE to run.
test('posts graph fills the viewport without changing the list layout', {
  skip: !process.env.BLOG_TEST_URL || !process.env.PLAYWRIGHT_MODULE,
}, async (t) => {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE)
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
  })
  t.after(() => browser.close())

  for (const path of ['/posts', '/en/posts']) {
    await t.test(path, async () => {
      const page = await browser.newPage({
        viewport: { width: 1715, height: 1163 },
        colorScheme: 'dark',
        recordVideo: process.env.GRAPH_SCREENSHOT_DIR ? { dir: process.env.GRAPH_SCREENSHOT_DIR } : undefined,
      })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      try {
        await page.route('**/*', route => {
          if (new URL(route.request().url()).origin === new URL(process.env.BLOG_TEST_URL).origin) return route.continue()
          return route.abort()
        })
        await page.goto(`${process.env.BLOG_TEST_URL}${path}?show=graph`)
        const canvas = page.locator('.force-graph-container canvas').first()
        await canvas.waitFor({ state: 'visible' })

        for (const [name, width, height] of [['desktop', 1715, 1163], ['resized', 1024, 768], ['mobile', 390, 844]]) {
          await page.setViewportSize({ width, height })
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          const bounds = await canvas.boundingBox()
          const nav = await page.locator('.VPNav').boundingBox()
          if (process.env.GRAPH_SCREENSHOT_DIR) {
            mkdirSync(process.env.GRAPH_SCREENSHOT_DIR, { recursive: true })
            await page.waitForTimeout(350) // Let the existing 300ms zoom-to-fit animation finish.
            await page.screenshot({ path: join(process.env.GRAPH_SCREENSHOT_DIR, `${path === '/posts' ? 'zh' : 'en'}-${name}.png`) })
          }
          assert.ok(bounds && nav)
          assert.ok(Math.abs(bounds.x) <= 1, `${path} ${name}: left gap ${bounds.x}px`)
          assert.ok(Math.abs(bounds.x + bounds.width - width) <= 1, `${path} ${name}: right edge must reach the viewport`)
          assert.ok(Math.abs(bounds.y - (nav.y + nav.height)) <= 1, `${path} ${name}: graph must start below navigation`)
          assert.ok(Math.abs(bounds.y + bounds.height - height) <= 1, `${path} ${name}: bottom edge must reach the viewport`)
          assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), 'Graph view must not scroll')
        }

        const graphButton = await page.getByRole('button', { name: /切换列表|Toggle List/ }).boundingBox()
        await page.getByRole('button', { name: /切换列表|Toggle List/ }).click()
        await page.waitForFunction(() => !document.querySelector('.force-graph-container'))
        assert.notEqual(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), 'hidden')
        await page.getByText(/^(所有文章|All Posts)$/).waitFor({ state: 'visible' })
        const listButton = await page.getByRole('button', { name: /切换图表|Toggle Graph/ }).boundingBox()
        assert.ok(graphButton && listButton)
        assert.ok(Math.abs(graphButton.x + graphButton.width - listButton.x - listButton.width) <= 1 && Math.abs(graphButton.y - listButton.y) <= 1, 'The toggle button must keep its original top-right anchor')
        await page.getByRole('button', { name: /切换图表|Toggle Graph/ }).click()
        await canvas.waitFor({ state: 'visible' })
        const remounted = await canvas.boundingBox()
        assert.ok(remounted && Math.abs(remounted.width - 390) <= 1, 'Remounted graph must still fill the viewport')
        assert.deepEqual(errors, [], 'Resizing and toggling must not cause browser errors')
      } finally {
        await page.close()
      }
    })
  }
})
