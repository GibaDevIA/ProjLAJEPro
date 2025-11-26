import { Point, ViewState, SnapResult, Shape } from '@/types/drawing'

export const SNAP_THRESHOLD_PX = 8

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

export function getSnapPoint(
  cursorScreenPos: Point,
  shapes: Shape[],
  view: ViewState,
  excludePoints: Point[] = [],
): SnapResult | null {
  let closest: SnapResult | null = null
  let minDist = SNAP_THRESHOLD_PX

  const cursorWorld = screenToWorld(cursorScreenPos, view)

  // Collect all vertices
  const vertices: Point[] = []
  shapes.forEach((shape) => {
    shape.points.forEach((p) => vertices.push(p))
  })

  // Check distance in screen pixels
  for (const vertex of vertices) {
    // Skip excluded points (e.g. the point we are currently dragging/creating if needed)
    if (excludePoints.some((p) => p.x === vertex.x && p.y === vertex.y))
      continue

    const screenVertex = worldToScreen(vertex, view)
    const dist = distance(cursorScreenPos, screenVertex)

    if (dist < minDist) {
      minDist = dist
      closest = {
        point: vertex, // The world coordinate of the snap target
        targetPoint: screenVertex, // The screen coordinate for visual feedback
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
