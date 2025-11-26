import { Point, ViewState, SnapResult, Shape } from '@/types/drawing'

export const SNAP_THRESHOLD_PX = 10

export function screenToWorld(point: Point, view: ViewState): Point {
  return {
    x: (point.x - view.offset.x) / view.scale,
    y: (point.y - view.offset.y) / view.scale,
  }
}

export function worldToScreen(point: Point, view: ViewState): Point {
  return {
    x: point.x * view.scale + view.offset.x,
    y: point.y * view.scale + view.offset.y,
  }
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

// Helper to get distance from point to line segment
function distanceToSegment(p: Point, v: Point, w: Point): number {
  const l2 = distance(v, w) ** 2
  if (l2 === 0) return distance(p, v)
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
  t = Math.max(0, Math.min(1, t))
  const projection = {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y),
  }
  return distance(p, projection)
}

// Check if point is inside polygon using ray casting
function isPointInPolygon(p: Point, vertices: Point[]): boolean {
  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x,
      yi = vertices[i].y
    const xj = vertices[j].x,
      yj = vertices[j].y

    const intersect =
      yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function isPointInShape(
  point: Point,
  shape: Shape,
  view: ViewState,
): boolean {
  // Convert shape points to screen for checking against screen cursor position
  const screenPoints = shape.points.map((p) => worldToScreen(p, view))
  const tolerance = 5 // pixels

  if (shape.type === 'line') {
    // Check distance to each segment
    for (let i = 0; i < screenPoints.length - 1; i++) {
      if (
        distanceToSegment(point, screenPoints[i], screenPoints[i + 1]) <=
        tolerance
      ) {
        return true
      }
    }
    return false
  } else {
    // Polygon or Rectangle
    // Check if inside
    if (isPointInPolygon(point, screenPoints)) return true

    // Also check edges for better UX
    for (let i = 0; i < screenPoints.length; i++) {
      const j = (i + 1) % screenPoints.length
      if (
        distanceToSegment(point, screenPoints[i], screenPoints[j]) <= tolerance
      ) {
        return true
      }
    }
    return false
  }
}

export function getSnapPoint(
  cursorScreenPos: Point,
  shapes: Shape[],
  view: ViewState,
  excludeShapeIds: string[] = [],
  snapToGrid: boolean = true,
): SnapResult | null {
  let closest: SnapResult | null = null
  let minDist = SNAP_THRESHOLD_PX

  // 1. Snap to Vertices
  const vertices: { point: Point; shapeId: string }[] = []
  shapes.forEach((shape) => {
    if (excludeShapeIds.includes(shape.id)) return
    shape.points.forEach((p) => vertices.push({ point: p, shapeId: shape.id }))
  })

  for (const vertex of vertices) {
    const screenVertex = worldToScreen(vertex.point, view)
    const dist = distance(cursorScreenPos, screenVertex)

    if (dist < minDist) {
      minDist = dist
      closest = {
        point: vertex.point, // The world coordinate of the snap target
        targetPoint: screenVertex, // The screen coordinate for visual feedback
        distance: dist,
      }
    }
  }

  // 2. Snap to Grid
  if (snapToGrid) {
    const cursorWorld = screenToWorld(cursorScreenPos, view)
    const gridPointWorld = {
      x: Math.round(cursorWorld.x),
      y: Math.round(cursorWorld.y),
    }
    const gridPointScreen = worldToScreen(gridPointWorld, view)
    const dist = distance(cursorScreenPos, gridPointScreen)

    if (dist < minDist) {
      minDist = dist
      closest = {
        point: gridPointWorld,
        targetPoint: gridPointScreen,
        distance: dist,
      }
    }
  }

  return closest
}

export function calculatePolygonArea(points: Point[]): number {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return Math.abs(area / 2)
}

export function calculateLineLength(p1: Point, p2: Point): number {
  return distance(p1, p2)
}

export function calculateAngle(p1: Point, p2: Point): number {
  return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI
}

export function getPointFromLengthAndAngle(
  start: Point,
  length: number,
  angleDegrees: number,
): Point {
  const angleRad = (angleDegrees * Math.PI) / 180
  return {
    x: start.x + length * Math.cos(angleRad),
    y: start.y + length * Math.sin(angleRad),
  }
}

export function findClosedCycle(
  lines: Shape[],
): { lineIds: string[]; points: Point[] } | null {
  const adj = new Map<string, { id: string; other: string }[]>()
  const pointMap = new Map<string, Point>()
  const key = (p: Point) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`

  // Build Graph
  for (const line of lines) {
    if (line.type !== 'line' || line.points.length < 2) continue
    const p1 = line.points[0]
    const p2 = line.points[1]
    const k1 = key(p1)
    const k2 = key(p2)

    pointMap.set(k1, p1)
    pointMap.set(k2, p2)

    if (!adj.has(k1)) adj.set(k1, [])
    if (!adj.has(k2)) adj.set(k2, [])

    adj.get(k1)!.push({ id: line.id, other: k2 })
    adj.get(k2)!.push({ id: line.id, other: k1 })
  }

  function dfs(
    curr: string,
    start: string,
    currentPath: { node: string; edgeId: string }[],
  ): { lineIds: string[]; points: Point[] } | null {
    const neighbors = adj.get(curr)
    if (!neighbors) return null

    for (const edge of neighbors) {
      // Don't go back through the same edge we just came from
      if (
        currentPath.length > 0 &&
        edge.id === currentPath[currentPath.length - 1].edgeId
      )
        continue

      // If we found the start node and path is long enough (at least 2 edges before closing, so 3 edges total)
      if (edge.other === start && currentPath.length >= 2) {
        const cycleEdges = [...currentPath.map((p) => p.edgeId), edge.id]
        const cyclePoints = currentPath.map((p) => pointMap.get(p.node)!)
        cyclePoints.push(pointMap.get(curr)!)
        return { lineIds: cycleEdges, points: cyclePoints }
      }

      // If not visited in this path (avoid loops within path)
      if (!currentPath.some((p) => p.node === edge.other)) {
        const result = dfs(edge.other, start, [
          ...currentPath,
          { node: curr, edgeId: edge.id },
        ])
        if (result) return result
      }
    }
    return null
  }

  // Iterate all nodes to find a cycle
  for (const [nodeKey, neighbors] of adj.entries()) {
    if (neighbors.length < 2) continue
    const result = dfs(nodeKey, nodeKey, [])
    if (result) return result
  }

  return null
}
