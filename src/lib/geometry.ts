import {
  Point,
  ViewState,
  SnapResult,
  Shape,
  SlabReportItem,
} from '@/types/drawing'

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

export function getClosestPointOnSegment(p: Point, v: Point, w: Point): Point {
  const l2 = Math.pow(w.x - v.x, 2) + Math.pow(w.y - v.y, 2)
  if (l2 === 0) return v
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
  t = Math.max(0, Math.min(1, t))
  return {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y),
  }
}

// Helper to get distance from point to line segment
function distanceToSegment(p: Point, v: Point, w: Point): number {
  const closest = getClosestPointOnSegment(p, v, w)
  return distance(p, closest)
}

// Check if point is inside polygon using ray casting
export function isPointInPolygon(p: Point, vertices: Point[]): boolean {
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

  if (
    shape.type === 'line' ||
    shape.type === 'arrow' ||
    shape.type === 'vigota'
  ) {
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

export function isWorldPointInShape(point: Point, shape: Shape): boolean {
  if (shape.type === 'rectangle' || shape.type === 'polygon') {
    return isPointInPolygon(point, shape.points)
  }
  return false
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
        type: 'vertex',
      }
    }
  }

  if (closest) return closest

  // 2. Snap to Midpoints
  shapes.forEach((shape) => {
    if (excludeShapeIds.includes(shape.id)) return
    if (['line', 'rectangle', 'polygon'].includes(shape.type)) {
      const numSegments =
        shape.type === 'line' ? shape.points.length - 1 : shape.points.length

      for (let i = 0; i < numSegments; i++) {
        const p1 = shape.points[i]
        const p2 = shape.points[(i + 1) % shape.points.length]

        const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
        const screenMid = worldToScreen(mid, view)
        const dist = distance(cursorScreenPos, screenMid)

        if (dist < minDist) {
          minDist = dist
          closest = {
            point: mid,
            targetPoint: screenMid,
            distance: dist,
            type: 'midpoint',
          }
        }
      }
    }
  })

  if (closest) return closest

  // 3. Snap to Edges (Nearest)
  shapes.forEach((shape) => {
    if (excludeShapeIds.includes(shape.id)) return
    if (['line', 'rectangle', 'polygon'].includes(shape.type)) {
      const numSegments =
        shape.type === 'line' ? shape.points.length - 1 : shape.points.length

      for (let i = 0; i < numSegments; i++) {
        const p1 = shape.points[i]
        const p2 = shape.points[(i + 1) % shape.points.length]

        const p1Screen = worldToScreen(p1, view)
        const p2Screen = worldToScreen(p2, view)

        const closestScreen = getClosestPointOnSegment(
          cursorScreenPos,
          p1Screen,
          p2Screen,
        )
        const dist = distance(cursorScreenPos, closestScreen)

        if (dist < minDist) {
          minDist = dist
          closest = {
            point: screenToWorld(closestScreen, view),
            targetPoint: closestScreen,
            distance: dist,
            type: 'edge',
          }
        }
      }
    }
  })

  if (closest) return closest

  // 4. Snap to Grid
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
        type: 'grid',
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

export function getOrthogonalPoint(start: Point, current: Point): Point {
  const dx = Math.abs(current.x - start.x)
  const dy = Math.abs(current.y - start.y)

  if (dx >= dy) {
    return { x: current.x, y: start.y }
  } else {
    return { x: start.x, y: current.y }
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

export function calculateBoundingBox(points: Point[]): {
  width: number
  height: number
} {
  if (points.length === 0) return { width: 0, height: 0 }
  let minX = points[0].x
  let maxX = points[0].x
  let minY = points[0].y
  let maxY = points[0].y

  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  return { width: maxX - minX, height: maxY - minY }
}

// --- Beam Generation Helpers ---

// Helper to get intersections of a ray with a polygon
// Returns sorted t values (distance from origin along dir)
function getRayPolygonIntersections(
  points: Point[],
  origin: Point,
  dir: Point,
): number[] {
  const intersections: number[] = []
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i]
    const p2 = points[(i + 1) % points.length]

    const sx = p2.x - p1.x
    const sy = p2.y - p1.y

    const rxs = dir.x * sy - dir.y * sx
    if (Math.abs(rxs) < 1e-9) continue

    const qpx = p1.x - origin.x
    const qpy = p1.y - origin.y

    const t = (qpx * sy - qpy * sx) / rxs
    const u = (qpx * dir.y - qpy * dir.x) / rxs

    if (u >= 0 && u <= 1) {
      intersections.push(t)
    }
  }
  return intersections.sort((a, b) => a - b)
}

export function calculateJoistCount(
  transversalLength: number,
  interAxis: number,
): number {
  if (interAxis <= 0) return 0
  return Math.floor(transversalLength / interAxis + 0.5)
}

export function getSlabJoistCount(slab: Shape, joistArrow: Shape): number {
  if (!slab.properties?.slabConfig) return 0
  const config = slab.properties.slabConfig
  const interEixoMeters = (config.interEixo || 42) / 100
  const initialExclusion = (config.initialExclusion || 0) / 100
  const finalExclusion = (config.finalExclusion || 0) / 100

  const lines = generateBeamLines(
    slab.points,
    joistArrow.points[0],
    joistArrow.points[1],
    interEixoMeters,
    initialExclusion,
    finalExclusion,
  )
  return lines.length
}

// Generate beam lines inside a polygon
export function generateBeamLines(
  polygonPoints: Point[],
  arrowStart: Point,
  arrowEnd: Point,
  spacing: number, // in meters
  initialExclusion: number = 0, // in meters
  finalExclusion: number = 0, // in meters
): Point[][] {
  if (spacing <= 0) return []

  // Direction of the arrow
  const dx = arrowEnd.x - arrowStart.x
  const dy = arrowEnd.y - arrowStart.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return []

  // Normalized arrow direction
  const ax = dx / len
  const ay = dy / len

  // Beam direction (parallel to arrow)
  const bx = ax
  const by = ay

  // Projection direction (perpendicular to arrow)
  // Rotate 90 degrees: (-y, x)
  const px = -ay
  const py = ax

  // We need to cover the polygon with lines parallel to (bx, by).
  // To do this, we project the polygon onto the Perpendicular Direction (px, py).
  let minProj = Infinity
  let maxProj = -Infinity

  for (const p of polygonPoints) {
    const proj = p.x * px + p.y * py
    if (proj < minProj) minProj = proj
    if (proj > maxProj) maxProj = proj
  }

  // Generate lines starting from adjusted start to adjusted end with spacing
  const lines: Point[][] = []

  const effectiveStart = minProj + initialExclusion
  const effectiveEnd = maxProj - finalExclusion

  if (effectiveStart >= effectiveEnd) {
    return []
  }

  for (let d = effectiveStart + spacing / 2; d <= effectiveEnd; d += spacing) {
    const origin = { x: d * px, y: d * py }
    const dir = { x: bx, y: by }

    const intersections = getRayPolygonIntersections(polygonPoints, origin, dir)

    // Create segments from pairs of intersections
    for (let i = 0; i < intersections.length; i += 2) {
      if (i + 1 < intersections.length) {
        const t1 = intersections[i]
        const t2 = intersections[i + 1]
        const segStart = { x: origin.x + t1 * bx, y: origin.y + t1 * by }
        const segEnd = { x: origin.x + t2 * bx, y: origin.y + t2 * by }
        lines.push([segStart, segEnd])
      }
    }
  }

  return lines
}

export function calculateVigotaLengths(
  slab: Shape,
  joistArrow: Shape,
): number[] {
  if (!slab.properties?.slabConfig) return []
  const config = slab.properties.slabConfig
  const interEixoMeters = (config.interEixo || 42) / 100
  const initialExclusion = (config.initialExclusion || 0) / 100
  const finalExclusion = (config.finalExclusion || 0) / 100

  // Get the center lines of the joists
  // This corresponds exactly to the visual representation (dashed lines)
  const centerLines = generateBeamLines(
    slab.points,
    joistArrow.points[0],
    joistArrow.points[1],
    interEixoMeters,
    initialExclusion,
    finalExclusion,
  )

  // Calculate length of each line segment directly
  return centerLines.map((line) => {
    const p1 = line[0]
    const p2 = line[1]
    return calculateLineLength(p1, p2)
  })
}

export function generateSlabReportData(shapes: Shape[]): SlabReportItem[] {
  const slabs = shapes.filter(
    (s) => s.type === 'rectangle' || s.type === 'polygon',
  )
  const manualVigotas = shapes.filter((s) => s.type === 'vigota')

  return slabs.map((slab, index) => {
    const area = slab.properties?.area || calculatePolygonArea(slab.points)
    const label = slab.properties?.label || `Laje ${index + 1}`
    const type = slab.properties?.slabConfig?.type || '-'
    const material =
      slab.properties?.slabConfig?.material === 'ceramic'
        ? 'Cerâmica'
        : slab.properties?.slabConfig?.material === 'eps'
          ? 'EPS'
          : '-'

    let width = slab.properties?.width
    let height = slab.properties?.height

    if (!width || !height) {
      const bbox = calculateBoundingBox(slab.points)
      width = bbox.width
      height = bbox.height
    }

    // Find associated joist arrow
    const joistArrow = shapes.find(
      (s) =>
        s.type === 'arrow' &&
        s.properties?.isJoist &&
        isWorldPointInShape(
          {
            x: (s.points[0].x + s.points[1].x) / 2,
            y: (s.points[0].y + s.points[1].y) / 2,
          },
          slab,
        ),
    )

    let vigotaCount = 0
    let vigotaSummary = ''
    let vigotaDetails: { length: string; count: number }[] = []
    let generatedLengths: number[] = []

    if (joistArrow && slab.properties?.slabConfig) {
      generatedLengths = calculateVigotaLengths(slab, joistArrow)
    }

    // Find manual vigotas inside this slab
    const slabManualVigotas = manualVigotas.filter((v) => {
      const mid = {
        x: (v.points[0].x + v.points[1].x) / 2,
        y: (v.points[0].y + v.points[1].y) / 2,
      }
      return isWorldPointInShape(mid, slab)
    })

    const manualLengths = slabManualVigotas.map((v) =>
      calculateLineLength(v.points[0], v.points[1]),
    )

    const allLengths = [...generatedLengths, ...manualLengths]
    vigotaCount = allLengths.length

    if (vigotaCount > 0) {
      const groups: Record<string, number> = {}

      if (slab.type === 'polygon') {
        // Polygon: Round up to nearest 0.10m increment
        allLengths.forEach((l) => {
          const val = Number(l.toFixed(4))
          const rounded = Math.ceil(val * 10) / 10
          const key = rounded.toFixed(2)
          groups[key] = (groups[key] || 0) + 1
        })
      } else {
        // Rectangle: Exact value (2 decimals)
        allLengths.forEach((l) => {
          const val = l.toFixed(2)
          groups[val] = (groups[val] || 0) + 1
        })
      }

      const sortedLengths = Object.keys(groups).sort(
        (a, b) => Number(b) - Number(a),
      )

      vigotaDetails = sortedLengths.map((len) => ({
        length: len,
        count: groups[len],
      }))

      vigotaSummary = sortedLengths
        .map((len) => `${groups[len]}x ${len}m`)
        .join(', ')
    }

    return {
      id: slab.id,
      label,
      area,
      width,
      height,
      type,
      material,
      vigotaCount,
      vigotaSummary,
      vigotaDetails,
      hasExtraVigotas: manualLengths.length > 0,
      extraVigotaCount: manualLengths.length,
    }
  })
}
