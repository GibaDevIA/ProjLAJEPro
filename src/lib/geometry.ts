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
