import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

function assertReadableLabels(frame, width, height, titles, checkEdges = true) {
  const visibleNodes = frame.nodes.filter(node => node.x >= 0 && node.x <= width && node.y >= 0 && node.y <= height)
  const visibleArticles = visibleNodes.filter(node => ['#9b9af5', '#6366f1'].includes(node.color))
  assert.ok(frame.labels.filter(label => titles.some(title => matchesTitle(label, title))).length >= visibleArticles.length, 'Visible articles must keep their titles while zooming or panning')
  assert.ok(frame.labels.length <= visibleNodes.length, 'Offscreen nodes must not pile their titles onto the viewport edges')
  for (let i = 0; i < frame.labels.length; i++) {
    const a = frame.labels[i]
    if (checkEdges) assert.ok(a.x - a.width / 2 >= 7 && a.x + a.width / 2 <= width - 7 && a.y >= 7 && a.y + a.height <= height - 7, 'Labels must remain inside the viewport')
    for (const b of frame.labels.slice(i + 1)) {
      const overlap = a.x - a.width / 2 < b.x + b.width / 2 && a.x + a.width / 2 > b.x - b.width / 2 && a.y < b.y + b.height && a.y + a.height > b.y
      assert.equal(overlap, false, `Titles overlap: ${JSON.stringify([a, b])}`)
    }
  }
}

function assertTranslatedLabels(beforeFrame, afterFrame) {
  const dx = afterFrame.nodes[0].x - beforeFrame.nodes[0].x
  const dy = afterFrame.nodes[0].y - beforeFrame.nodes[0].y
  for (const before of beforeFrame.labels) {
    const after = afterFrame.labels.find(label => label.text === before.text)
    if (after) assert.ok(Math.abs(after.x - before.x - dx) < 1 && Math.abs(after.y - before.y - dy) < 1, `Dragging must translate labels without reshuffling: ${before.text}`)
  }
}

async function waitForGraph(page) {
  await page.waitForFunction(() => {
    const canvas = document.querySelector('.force-graph-container canvas')
    if (!canvas?.graphFrame?.nodes.length) return false
    const positions = canvas.graphFrame.nodes.map(node => `${node.x.toFixed(1)},${node.y.toFixed(1)}`).join(';')
    if (canvas.graphStable?.positions !== positions) {
      canvas.graphStable = { positions, since: performance.now() }
      return false
    }
    return performance.now() - canvas.graphStable.since > 200
  })
}

const matchesTitle = (label, title) => label.text === title || (label.text.endsWith('…') && title.startsWith(label.text.slice(0, -1)))

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

  for (const [path, colorScheme] of [['/posts', 'dark'], ['/en/posts', 'dark'], ['/posts', 'light'], ['/en/posts', 'light']]) {
    await t.test(`${path} ${colorScheme}`, async () => {
      const screenshotName = `${path === '/posts' ? 'zh' : 'en'}-${colorScheme}`;
      const page = await browser.newPage({
        viewport: { width: 1715, height: 1163 },
        colorScheme,
        recordVideo: process.env.GRAPH_SCREENSHOT_DIR ? { dir: process.env.GRAPH_SCREENSHOT_DIR } : undefined,
      })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(() => {
        const prototype = CanvasRenderingContext2D.prototype
        for (const method of ['clearRect', 'arc', 'fill', 'stroke', 'fillText']) {
          const original = prototype[method]
          prototype[method] = function (...args) {
            if (this.canvas === document.querySelector('.force-graph-container canvas')) {
              if (method === 'clearRect') this.canvas.graphFrame = { nodes: [], labels: [] }
              const frame = this.canvas.graphFrame
              if (frame && method === 'arc') {
                const transform = this.getTransform()
                const point = new DOMPoint(args[0], args[1]).matrixTransform(transform)
                this.graphArc = { x: point.x, y: point.y, radius: args[2] * transform.a, color: this.fillStyle }
              }
              if (frame && method === 'fill' && this.graphArc) {
                frame.nodes.push(this.graphArc)
                this.graphArc = null
              }
              if (method === 'stroke') this.graphArc = null
              if (frame && method === 'fillText') {
                const transform = this.getTransform()
                const point = new DOMPoint(args[1], args[2]).matrixTransform(transform)
                frame.labels.push({ text: args[0], x: point.x, y: point.y, width: this.measureText(args[0]).width * transform.a, height: Number(/([\d.]+)px/.exec(this.font)[1]) * transform.a })
              }
            }
            return original.apply(this, args)
          }
        }
      })
      try {
        await page.route('**/*', route => {
          if (new URL(route.request().url()).origin === new URL(process.env.BLOG_TEST_URL).origin) return route.continue()
          return route.abort()
        })
        await page.goto(`${process.env.BLOG_TEST_URL}${path}`)
        await page.locator('li span.line-clamp-1').first().waitFor({ state: 'visible' })
        const titles = (await page.locator('li span.line-clamp-1').allTextContents()).map(title => title.trim())
        await page.goto(`${process.env.BLOG_TEST_URL}${path}?show=graph`)
        const canvas = page.locator('.force-graph-container canvas').first()
        await canvas.waitFor({ state: 'visible' })
        await waitForGraph(page)
        const overview = await canvas.evaluate(element => element.graphFrame)
        assert.ok(titles.length > 0)
        assert.ok(titles.every(title => overview.labels.some(label => matchesTitle(label, title))), 'Every article must show its title in the default overview without zooming or hovering')
        const canvasBounds = await canvas.boundingBox()
        assertReadableLabels(overview, canvasBounds.width, canvasBounds.height, titles)
        await page.waitForFunction(() => {
          const canvas = document.querySelector('.force-graph-container canvas')
          const bounds = canvas.getBoundingClientRect()
          return canvas.graphFrame.nodes.every(node => node.x >= 24 && node.y >= 24 && node.x <= bounds.width - 24 && node.y <= bounds.height - 24)
        })
        const articleLabel = overview.labels.find(label => titles.some(title => matchesTitle(label, title)))
        assert.ok(articleLabel, 'Overview must include article titles')
        await page.mouse.move(canvasBounds.x + articleLabel.x, canvasBounds.y + articleLabel.y + articleLabel.height / 2)
        await page.locator('.float-tooltip-kap').waitFor({ state: 'visible' })
        assert.ok(titles.includes((await page.locator('.float-tooltip-kap').textContent()).trim()), 'Hovering a title must reveal the full article name')
        if (process.env.GRAPH_SCREENSHOT_DIR) {
          mkdirSync(process.env.GRAPH_SCREENSHOT_DIR, { recursive: true })
          await page.screenshot({ path: join(process.env.GRAPH_SCREENSHOT_DIR, `${screenshotName}-hover.png`) })
        }
        await page.mouse.move(10, 20)
        const panStart = await canvas.evaluate(element => element.graphFrame)
        await page.mouse.move(1680, 1130)
        await page.mouse.down()
        for (let step = 1; step <= 6; step++) {
          await page.mouse.move(1680 - step * 20, 1130)
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          const frame = await canvas.evaluate(element => element.graphFrame)
          assertTranslatedLabels(panStart, frame)
        }
        await page.mouse.up()
        await page.mouse.move(10, 20)
        await page.waitForTimeout(200)
        assertTranslatedLabels(panStart, await canvas.evaluate(element => element.graphFrame))
        await page.mouse.move(850, 600)
        await page.mouse.wheel(0, -400)
        await page.mouse.move(10, 20)
        await page.waitForTimeout(350) // Wait for the wheel gesture to finish.
        const zoomed = await canvas.evaluate(element => element.graphFrame)
        assertReadableLabels(zoomed, canvasBounds.width, canvasBounds.height, titles, false)
        await page.mouse.move(1600, 1100)
        await page.mouse.down()
        await page.mouse.move(950, 1100, { steps: 8 })
        await page.mouse.up()
        await page.mouse.move(10, 20)
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        assertReadableLabels(await canvas.evaluate(element => element.graphFrame), canvasBounds.width, canvasBounds.height, titles, false)
        if (process.env.GRAPH_SCREENSHOT_DIR) {
          await page.screenshot({ path: join(process.env.GRAPH_SCREENSHOT_DIR, `${screenshotName}-panned.png`) })
        }
        await page.setViewportSize({ width: 1714, height: 1163 })
        await page.setViewportSize({ width: 1715, height: 1163 })

        for (const [name, width, height] of [['desktop', 1715, 1163], ['resized', 1024, 768], ['mobile', 390, 844]]) {
          await page.setViewportSize({ width, height })
          await page.waitForFunction(({ width, height }) => {
            const canvas = document.querySelector('.force-graph-container canvas').getBoundingClientRect()
            const nav = document.querySelector('.VPNav').getBoundingClientRect()
            return Math.abs(canvas.width - width) < 1 && Math.abs(canvas.height + nav.bottom - height) < 1
          }, { width, height })
          await canvas.evaluate(element => { element.graphStable = null })
          await waitForGraph(page)
          const bounds = await canvas.boundingBox()
          const nav = await page.locator('.VPNav').boundingBox()
          if (process.env.GRAPH_SCREENSHOT_DIR) {
            mkdirSync(process.env.GRAPH_SCREENSHOT_DIR, { recursive: true })
            await page.screenshot({ path: join(process.env.GRAPH_SCREENSHOT_DIR, `${screenshotName}-${name}.png`) })
          }
          const frame = await canvas.evaluate(element => element.graphFrame)
          assertReadableLabels(frame, width, bounds.height, titles)
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
        await waitForGraph(page)
        const remountedFrame = await canvas.evaluate(element => element.graphFrame)
        const target = remountedFrame.labels.find(label => titles.some(title => matchesTitle(label, title)))
        assert.ok(target, 'Remounted graph must still expose clickable titles')
        const targetTitle = titles.find(title => matchesTitle(target, title))
        await page.mouse.click(remounted.x + target.x, remounted.y + target.y + target.height / 2)
        await page.waitForURL(url => url.pathname !== path)
        assert.equal((await page.locator('h1').first().textContent()).trim(), targetTitle, 'Clicking the title must navigate to its article')
        assert.deepEqual(errors, [], 'Resizing, toggling and article navigation must not cause browser errors')
      } finally {
        await page.close()
      }
    })
  }
})
