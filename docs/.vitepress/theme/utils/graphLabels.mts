export type LabelBox = { left: number; top: number; right: number; bottom: number }

export function placeGraphLabel(
  anchor: { x: number; y: number; radius: number },
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  occupied: LabelBox[],
): LabelBox | null {
  const maxLeft = viewport.width - 8 - size.width
  const maxTop = viewport.height - 8 - size.height
  if (maxLeft < 8 || maxTop < 8) return null

  const boxAt = (left: number, top: number): LabelBox => {
    left = Math.max(8, Math.min(left, maxLeft))
    top = Math.max(8, Math.min(top, maxTop))
    return { left, top, right: left + size.width, bottom: top + size.height }
  }
  const fits = (box: LabelBox) => !occupied.some(other =>
    box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top
  )
  const gap = anchor.radius + 4
  const nearby = [
    boxAt(anchor.x - size.width / 2, anchor.y + gap),
    boxAt(anchor.x - size.width / 2, anchor.y - gap - size.height),
    boxAt(anchor.x + gap, anchor.y - size.height / 2),
    boxAt(anchor.x - gap - size.width, anchor.y - size.height / 2),
  ].find(fits)
  if (nearby) return nearby

  const candidates: LabelBox[] = []
  for (let top = 8; top <= maxTop; top += size.height + 4) {
    for (let left = 8; left <= maxLeft; left += size.width + 4) {
      candidates.push(boxAt(left, top))
    }
    candidates.push(boxAt(maxLeft, top))
  }
  const distance = (box: LabelBox) =>
    (box.left + size.width / 2 - anchor.x) ** 2 + (box.top + size.height / 2 - anchor.y) ** 2
  candidates.sort((a, b) => distance(a) - distance(b))
  return candidates.find(fits) || null
}

type Point = { x: number; y: number }

export function isInHoverCorridor(point: Point, source: Point, targets: LabelBox[]): boolean {
  const cross = (a: Point, b: Point, p: Point) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)
  return targets.some(box => {
    if (point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom) return true
    const corners = [
      { x: box.left, y: box.top }, { x: box.right, y: box.top },
      { x: box.right, y: box.bottom }, { x: box.left, y: box.bottom },
    ]
    return corners.some((a, index) => {
      const b = corners[(index + 1) % corners.length]
      if (Math.abs(cross(source, a, b)) < 1e-8) return false
      const signs = [cross(source, a, point), cross(a, b, point), cross(b, source, point)]
      return signs.every(value => value >= -1e-8) || signs.every(value => value <= 1e-8)
    })
  })
}
