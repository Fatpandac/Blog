import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

function assertReadableLabels(frame, width, height, titles, checkEdges = true) {
  const visibleNodes = frame.nodes.filter(node => node.x >= 0 && node.x <= width && node.y >= 0 && node.y <= height)
  const visibleArticles = visibleNodes.filter(node => ['#9b9af5', '#6366f1'].includes(node.color))
  assert.ok(frame.labels.filter(label => titles.some(title => matchesTitle(label, title))).length >= visibleArticles.length, 'Visible articles must keep their titles while zooming or panning')
  assert.equal(frame.labels.length, visibleNodes.length, 'Every visible article, category and tag must have a label; offscreen labels must not pile onto the viewport edges')
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
  await page.locator('.force-graph-container canvas').first().evaluate(canvas => { canvas.graphStable = null })
  await page.waitForFunction(() => {
    const canvas = document.querySelector('.force-graph-container canvas')
    if (!canvas?.graphFrame?.nodes.length) return false
    const positions = [...canvas.graphFrame.nodes, ...canvas.graphFrame.labels].map(item => `${item.x.toFixed(1)},${item.y.toFixed(1)}`).join(';')
    if (canvas.graphStable?.positions !== positions) {
      canvas.graphStable = { positions, since: performance.now() }
      return false
    }
    return performance.now() - canvas.graphStable.since > 200
  })
}

async function assertNodeDragKeepsTitleOffset(page, canvas, titles) {
  const before = await canvas.evaluate(element => element.graphFrame)
  const nodeIndex = before.nodes.findIndex(node => ['#9b9af5', '#6366f1'].includes(node.color))
  const node = before.nodes[nodeIndex]
  const label = before.labels.find(label => matchesTitle(label, titles[0]))
  assert.ok(node && label)
  const bounds = await canvas.boundingBox()
  await page.mouse.move(bounds.x + node.x, bounds.y + node.y)
  await page.mouse.down()
  await page.mouse.move(bounds.x + node.x + 60, bounds.y + node.y + 40, { steps: 8 })
  await page.mouse.up()
  await page.mouse.move(10, 20)
  await canvas.evaluate(element => { element.graphStable = null })
  await waitForGraph(page)
  const after = await canvas.evaluate(element => element.graphFrame)
  const nextNode = after.nodes[nodeIndex]
  const nextLabel = after.labels.find(candidate => candidate.text === label.text)
  assert.ok(nextLabel, 'The dragged article title must return after leaving the graph')
  assert.ok(Math.abs((nextLabel.x - nextNode.x) - (label.x - node.x)) < 1 && Math.abs((nextLabel.y - nextNode.y) - (label.y - node.y)) < 1, 'Dragging a node must keep its title offset after the simulation settles')
}

async function assertCategoryDoubleClickReflows(page, canvas, titles) {
  const before = await canvas.evaluate(element => element.graphFrame)
  const category = before.nodes.find(node => ['#5eead4', '#0f766e'].includes(node.color))
  assert.ok(category)
  const bounds = await canvas.boundingBox()
  await page.mouse.click(bounds.x + category.x, bounds.y + category.y)
  await page.mouse.move(10, 20)
  await waitForGraph(page)
  const singleClick = await canvas.evaluate(element => element.graphFrame)
  assert.ok(before.nodes.every((node, index) => Math.abs(node.x - singleClick.nodes[index].x) < 1 && Math.abs(node.y - singleClick.nodes[index].y) < 1), 'A single category click must not reflow nodes')
  await page.mouse.dblclick(bounds.x + category.x, bounds.y + category.y)
  await page.mouse.move(10, 20)
  await canvas.evaluate(element => { element.graphStable = null })
  await waitForGraph(page)
  const after = await canvas.evaluate(element => element.graphFrame)
  assert.ok(before.nodes.some((node, index) => Math.hypot(node.x - after.nodes[index].x, node.y - after.nodes[index].y) > 1), 'Double-clicking a category must reflow the graph')
  assert.equal(after.nodes.length, before.nodes.length, 'Reflow must retain every node')
  assertReadableLabels(after, bounds.width, bounds.height, titles)
  const categoryTitle = after.labels.find(label => ['技文', '杂文', '小样', 'Tech', 'Other', 'Demo'].includes(label.text))
  assert.ok(categoryTitle)
  await page.mouse.dblclick(bounds.x + categoryTitle.x, bounds.y + categoryTitle.y + categoryTitle.height / 2)
  await page.mouse.move(10, 20)
  await canvas.evaluate(element => { element.graphStable = null })
  await waitForGraph(page)
  const repeated = await canvas.evaluate(element => element.graphFrame)
  assert.ok(after.nodes.some((node, index) => Math.hypot(node.x - repeated.nodes[index].x, node.y - repeated.nodes[index].y) > 1), 'Double-clicking category text must also reflow the graph')
  assertReadableLabels(repeated, bounds.width, bounds.height, titles)
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
              if (method === 'clearRect') {
                if (this.canvas.graphFrame?.nodes.length && getComputedStyle(this.canvas).visibility === 'visible') {
                  this.canvas.graphFirstVisibleFrame ||= this.canvas.graphFrame
                }
                this.canvas.graphFrame = { nodes: [], labels: [] }
              }
              const frame = this.canvas.graphFrame
              if (frame && method === 'arc') {
                const transform = this.getTransform()
                const point = new DOMPoint(args[0], args[1]).matrixTransform(transform)
                frame.transform = { a: transform.a, e: transform.e, f: transform.f }
                this.graphArc = { x: point.x, y: point.y, radius: args[2] * transform.a, color: this.fillStyle, alpha: this.globalAlpha }
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
        const firstVisible = await canvas.evaluate(element => element.graphFirstVisibleFrame)
        assert.ok(firstVisible?.nodes.length, 'The graph must record a visible initial frame')
        assert.equal(firstVisible.nodes.length, overview.nodes.length)
        assert.ok(firstVisible.nodes.every((node, index) => Math.abs(node.x - overview.nodes[index].x) < 1 && Math.abs(node.y - overview.nodes[index].y) < 1), 'The first visible frame must already be settled and centered, without an initial jump')
        assert.ok(overview.labels.length === overview.nodes.length, 'All article, category and tag titles must be visible by default')
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
        await waitForGraph(page)
        const titleOnlyHover = await canvas.evaluate(element => element.graphFrame)
        assert.ok(titleOnlyHover.nodes.every((node, index) => Math.hypot(node.x - overview.nodes[index].x, node.y - overview.nodes[index].y) < 1), 'Hovering an inactive title must not spread any nodes')
        assert.equal(titleOnlyHover.labels.length, overview.labels.length, 'Inactive title hover must keep the overview labels visible')
        const articleNode = overview.nodes.find(node => ['#9b9af5', '#6366f1'].includes(node.color))
        assert.ok(articleNode)
        await page.mouse.move(canvasBounds.x + articleNode.x, canvasBounds.y + articleNode.y)
        await page.locator('.float-tooltip-kap').waitFor({ state: 'visible' })
        assert.ok(titles.includes((await page.locator('.float-tooltip-kap').textContent()).trim()), 'Hovering a title must reveal the full article name')
        const focusedFrame = await canvas.evaluate(element => element.graphFrame)
        await waitForGraph(page)
        const expanded = await canvas.evaluate(element => element.graphFrame)
        assert.ok(expanded.nodes.some((node, index) => Math.hypot(node.x - overview.nodes[index].x, node.y - overview.nodes[index].y) > 10), 'Hover must spread associated nodes apart')
        assert.ok(expanded.labels.length > 1 && expanded.labels.length < overview.labels.length, 'Hover must focus labels on the selected node and its immediate neighbors')
        assert.ok(Math.abs(expanded.transform.a - overview.transform.a) < 0.001 && Math.abs(expanded.transform.e - overview.transform.e) < 1 && Math.abs(expanded.transform.f - overview.transform.f) < 1, 'Hover must preserve the camera')
        assert.ok(focusedFrame.nodes.length === expanded.nodes.length)
        for (let i = 0; i < expanded.labels.length; i++) {
          const a = expanded.labels[i]
          for (const b of expanded.labels.slice(i + 1)) {
            assert.ok(!(a.x - a.width / 2 < b.x + b.width / 2 && a.x + a.width / 2 > b.x - b.width / 2 && a.y < b.y + b.height && a.y + a.height > b.y), `Focused labels must not overlap: ${a.text} / ${b.text}`)
          }
        }
        const destination = expanded.labels.find(label => label.text !== articleLabel.text && ['技文', 'Tech'].includes(label.text))
        assert.ok(destination, 'The expanded article must expose its category')
        const start = { x: articleNode.x, y: articleNode.y }
        const end = { x: destination.x, y: destination.y + destination.height / 2 }
        for (let step = 1; step <= 4; step++) {
          await page.mouse.move(canvasBounds.x + start.x + (end.x - start.x) * step / 8, canvasBounds.y + start.y + (end.y - start.y) * step / 8)
          await page.waitForTimeout(40)
          const current = await canvas.evaluate(element => element.graphFrame)
          assert.equal(current.labels.length, expanded.labels.length, 'Crossing the safe triangle gap must keep the old group open until reaching a node')
          assert.ok(expanded.labels.every(label => current.labels.some(next => next.text === label.text && Math.hypot(next.x - label.x, next.y - label.y) < 1)), 'The old layout must stay stable while crossing a gap')
        }
        await page.mouse.move(canvasBounds.x + end.x, canvasBounds.y + end.y)
        await waitForGraph(page)
        const reached = await canvas.evaluate(element => element.graphFrame)
        assert.ok(reached.labels.length > expanded.labels.length, 'Reaching the category must expand its own related nodes, not keep the old article group')
        assert.ok(reached.nodes.some((node, index) => Math.hypot(node.x - expanded.nodes[index].x, node.y - expanded.nodes[index].y) > 10), 'Switching the active node must change associated node positions')
        assert.ok(reached.nodes.filter(node => ['#9b9af5', '#6366f1'].includes(node.color) && node.alpha === 1).length > 1, 'The new category must highlight its related articles')
        const nextDestination = reached.labels.find(label => matchesTitle(label, titles[1]))
        assert.ok(nextDestination)
        await page.mouse.move(canvasBounds.x + nextDestination.x, canvasBounds.y + nextDestination.y + nextDestination.height / 2)
        await waitForGraph(page)
        const switched = await canvas.evaluate(element => element.graphFrame)
        assert.ok(switched.labels.length < reached.labels.length, 'Entering another article must replace the category group with that article and its neighbors')
        const postIndices = overview.nodes.flatMap((node, index) => ['#9b9af5', '#6366f1'].includes(node.color) ? [index] : [])
        const unrelatedIndex = postIndices[2]
        assert.ok(Math.hypot(switched.nodes[unrelatedIndex].x - overview.nodes[unrelatedIndex].x, switched.nodes[unrelatedIndex].y - overview.nodes[unrelatedIndex].y) < 1, 'Previously expanded nodes unrelated to the new selection must return to their original positions')
        assert.equal(switched.nodes[unrelatedIndex].alpha, 0.12, 'Unrelated old nodes must no longer remain highlighted')
        assert.ok(Math.abs(switched.transform.a - overview.transform.a) < 0.001 && Math.abs(switched.transform.e - overview.transform.e) < 1 && Math.abs(switched.transform.f - overview.transform.f) < 1, 'Switching groups must not move the camera')
        if (process.env.GRAPH_SCREENSHOT_DIR) {
          mkdirSync(process.env.GRAPH_SCREENSHOT_DIR, { recursive: true })
          await page.screenshot({ path: join(process.env.GRAPH_SCREENSHOT_DIR, `${screenshotName}-hover.png`) })
        }
        await page.mouse.move(canvasBounds.x + 5, canvasBounds.y + canvasBounds.height - 5)
        await waitForGraph(page)
        const outsideGroup = await canvas.evaluate(element => element.graphFrame)
        assert.ok(outsideGroup.nodes.every((node, index) => Math.hypot(node.x - overview.nodes[index].x, node.y - overview.nodes[index].y) < 1), 'Leaving the safe area inside the canvas must restore the original layout')
        await page.mouse.move(10, 20)
        await waitForGraph(page)
        const panStart = await canvas.evaluate(element => element.graphFrame)
        assert.ok(panStart.nodes.every((node, index) => Math.hypot(node.x - overview.nodes[index].x, node.y - overview.nodes[index].y) < 1), 'Leaving a hovered node must restore the original layout')
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

        await assertNodeDragKeepsTitleOffset(page, canvas, titles)
        await assertCategoryDoubleClickReflows(page, canvas, titles)
        if (process.env.GRAPH_SCREENSHOT_DIR) {
          await page.screenshot({ path: join(process.env.GRAPH_SCREENSHOT_DIR, `${screenshotName}-reflow.png`) })
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
        const category = remountedFrame.nodes.find(node => ['#5eead4', '#0f766e'].includes(node.color))
        assert.ok(category)
        await page.mouse.move(remounted.x + category.x, remounted.y + category.y)
        await waitForGraph(page)
        const categoryGroup = await canvas.evaluate(element => element.graphFrame)
        assert.ok(categoryGroup.labels.length > 10, 'Hovering the main category must expose its article group')
        for (let i = 0; i < categoryGroup.labels.length; i++) {
          const a = categoryGroup.labels[i]
          for (const b of categoryGroup.labels.slice(i + 1)) {
            assert.ok(!(a.x - a.width / 2 < b.x + b.width / 2 && a.x + a.width / 2 > b.x - b.width / 2 && a.y < b.y + b.height && a.y + a.height > b.y), `Category labels must not overlap: ${a.text} / ${b.text}`)
          }
        }
        const target = categoryGroup.labels.find(label => titles.some(title => matchesTitle(label, title)))
        assert.ok(target, 'Expanded category must expose clickable article titles')
        const targetTitle = titles.find(title => matchesTitle(target, title))
        await page.mouse.move(remounted.x + target.x, remounted.y + target.y + target.height / 2)
        await waitForGraph(page)
        const articleGroup = await canvas.evaluate(element => element.graphFrame)
        assert.ok(articleGroup.labels.length < categoryGroup.labels.length, 'Arriving at an article title must expand the article rather than retain its category group')
        if (process.env.GRAPH_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.GRAPH_SCREENSHOT_DIR, `${screenshotName}-safe-navigation.png`) })
        await page.mouse.click(remounted.x + target.x, remounted.y + target.y + target.height / 2)
        await page.waitForURL(url => url.pathname !== path)
        assert.equal((await page.locator('h1').first().textContent()).trim(), targetTitle, 'Clicking the title must navigate to its article')
        await page.goBack()
        await canvas.waitFor({ state: 'visible' })
        await waitForGraph(page)
        const inactive = await canvas.evaluate(element => element.graphFrame)
        const inactiveLabel = inactive.labels.find(label => titles.some(title => matchesTitle(label, title)))
        assert.ok(inactiveLabel)
        const inactiveTitle = titles.find(title => matchesTitle(inactiveLabel, title))
        const inactiveBounds = await canvas.boundingBox()
        await page.mouse.move(inactiveBounds.x + inactiveLabel.x, inactiveBounds.y + inactiveLabel.y + inactiveLabel.height / 2)
        await waitForGraph(page)
        assert.equal((await canvas.evaluate(element => element.graphFrame)).labels.length, inactive.labels.length, 'An inactive title must remain passive before clicking')
        await page.mouse.click(inactiveBounds.x + inactiveLabel.x, inactiveBounds.y + inactiveLabel.y + inactiveLabel.height / 2)
        await page.waitForURL(url => url.pathname !== path)
        assert.equal((await page.locator('h1').first().textContent()).trim(), inactiveTitle, 'An inactive article title must still be clickable')
        assert.deepEqual(errors, [], 'Resizing, toggling and article navigation must not cause browser errors')
      } finally {
        await page.close()
      }
    })
  }
})
