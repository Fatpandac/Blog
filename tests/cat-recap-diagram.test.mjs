import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

// Run after `pnpm build` to check the actual VitePress locale rendering.
for (const [language, path, expected] of [
  ['Chinese', '2026/11/catRecap.html', ['检测流', '高清录像', '活动判定', '事件触发', '检测链路只分析']],
  ['English', 'en/2026/11/catRecap.html', ['Detect', 'HD recording', 'Activity', 'Event trigger', 'The detection pipeline']],
]) {
  test(`catRecap diagram renders in ${language}`, () => {
    const html = readFileSync(new URL(`../public/${path}`, import.meta.url), 'utf8')
    const figure = html.match(/<figure\b[^>]*class="cat-recap-diagram[^>]*>[\s\S]*?<\/figure>/)?.[0]
    assert.ok(figure, 'The built article must include the diagram')
    for (const text of expected) assert.ok(figure.includes(text), `Missing translation: ${text}`)
    assert.match(figure, /<title\b[^>]*>[^<]+<\/title>/)
    assert.match(figure, /<desc\b[^>]*>[^<]+<\/desc>/)
    if (language === 'English') assert.doesNotMatch(figure, /\p{Script=Han}/u)
  })
}
