import assert from 'node:assert/strict'
import { test } from 'node:test'
import { placeGraphLabel } from '../docs/.vitepress/theme/utils/graphLabels.mts'

const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

test('dense article titles use free viewport space without overlapping', () => {
  const viewport = { width: 390, height: 780 }
  const anchor = { x: 195, y: 390, radius: 8 }
  const occupied = [{ left: 185, top: 380, right: 205, bottom: 400 }]
  for (let i = 0; i < 50; i++) {
    const box = placeGraphLabel(anchor, { width: 160, height: 16 }, viewport, occupied)
    assert.ok(box, `Article ${i + 1} must get a label position`)
    assert.ok(box.left >= 8 && box.top >= 8 && box.right <= 382 && box.bottom <= 772)
    assert.ok(occupied.every(other => !overlaps(box, other)))
    occupied.push(box)
  }
})

test('labels near viewport edges remain inside the canvas', () => {
  for (const x of [0, 389]) {
    for (const y of [0, 779]) {
      const box = placeGraphLabel({ x, y, radius: 8 }, { width: 160, height: 16 }, { width: 390, height: 780 }, [])
      assert.ok(box && box.left >= 8 && box.top >= 8 && box.right <= 382 && box.bottom <= 772)
    }
  }
})

test('a full or undersized viewport never falls back to overlapping text', () => {
  const anchor = { x: 195, y: 390, radius: 8 }
  const size = { width: 160, height: 16 }
  assert.equal(placeGraphLabel(anchor, size, { width: 390, height: 780 }, [{ left: 0, top: 0, right: 390, bottom: 780 }]), null)
  assert.equal(placeGraphLabel(anchor, size, { width: 100, height: 20 }, []), null)
})
