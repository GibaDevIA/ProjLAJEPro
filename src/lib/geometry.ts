import {
  Point,
  ViewState,
  SnapResult,
  Shape,
  SlabReportItem,
  SlabConfig,
  RibReportData,
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

function distanceToSegment(p: Point, v: Point, w: Point): number {
  const closest = getClosestPointOnSegment(p, v, w)
  return distance(p, closest)
}

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
  const screenPoints = shape.points.map((p) => worldToScreen(p, view))
  const tolerance = 5

  if (
    shape.type === 'line' ||
    shape.type === 'arrow' ||
    shape.type === 'vigota' ||
    shape.type === 'rib'
  ) {
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
    if (isPointInPolygon(point, screenPoints)) return true

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
        point: vertex.point,
        targetPoint: screenVertex,
        distance: dist,
        type: 'vertex',
      }
    }
  }

  if (closest) return closest

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

export function areLinesParallel(
  l1Start: Point,
  l1End: Point,
  l2Start: Point,
  l2End: Point,
  toleranceDegrees: number = 10,
): boolean {
  let angle1 = calculateAngle(l1Start, l1End)
  let angle2 = calculateAngle(l2Start, l2End)

  if (angle1 < 0) angle1 += 180
  if (angle1 >= 180) angle1 -= 180
  if (angle2 < 0) angle2 += 180
  if (angle2 >= 180) angle2 -= 180

  const diff = Math.abs(angle1 - angle2)
  return diff < toleranceDegrees || Math.abs(diff - 180) < toleranceDegrees
}

export function findClosedCycle(
  lines: Shape[],
): { lineIds: string[]; points: Point[] } | null {
  const adj = new Map<string, { id: string; other: string }[]>()
  const pointMap = new Map<string, Point>()
  const key = (p: Point) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`

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
      if (
        currentPath.length > 0 &&
        edge.id === currentPath[currentPath.length - 1].edgeId
      )
        continue

      if (edge.other === start && currentPath.length >= 2) {
        const cycleEdges = [...currentPath.map((p) => p.edgeId), edge.id]
        const cyclePoints = currentPath.map((p) => pointMap.get(p.node)!)
        cyclePoints.push(pointMap.get(curr)!)
        return { lineIds: cycleEdges, points: cyclePoints }
      }

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

export function generateBeamLines(
  polygonPoints: Point[],
  arrowStart: Point,
  arrowEnd: Point,
  spacing: number,
  initialExclusion: number = 0,
  finalExclusion: number = 0,
): Point[][] {
  if (spacing <= 0) return []

  const dx = arrowEnd.x - arrowStart.x
  const dy = arrowEnd.y - arrowStart.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return []

  const ax = dx / len
  const ay = dy / len

  const bx = ax
  const by = ay

  const px = -ay
  const py = ax

  let minProj = Infinity
  let maxProj = -Infinity

  for (const p of polygonPoints) {
    const proj = p.x * px + p.y * py
    if (proj < minProj) minProj = proj
    if (proj > maxProj) maxProj = proj
  }

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

  const centerLines = generateBeamLines(
    slab.points,
    joistArrow.points[0],
    joistArrow.points[1],
    interEixoMeters,
    initialExclusion,
    finalExclusion,
  )

  return centerLines.map((line) => {
    const p1 = line[0]
    const p2 = line[1]
    return calculateLineLength(p1, p2)
  })
}

function clipPolygon(
  points: Point[],
  normal: Point,
  limit: number,
  keepAbove: boolean,
): Point[] {
  const output: Point[] = []
  if (points.length === 0) return output

  let a = points[points.length - 1]

  for (const b of points) {
    const valA = a.x * normal.x + a.y * normal.y
    const valB = b.x * normal.x + b.y * normal.y

    const aIn = keepAbove ? valA >= limit : valA <= limit
    const bIn = keepAbove ? valB >= limit : valB <= limit

    if (bIn) {
      if (!aIn) {
        if (Math.abs(valB - valA) > 1e-9) {
          const t = (limit - valA) / (valB - valA)
          output.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) })
        } else {
          output.push(a)
        }
      }
      output.push(b)
    } else {
      if (aIn) {
        if (Math.abs(valB - valA) > 1e-9) {
          const t = (limit - valA) / (valB - valA)
          output.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) })
        } else {
          output.push(b)
        }
      }
    }
    a = b
  }
  return output
}

export function calculateNetSlabArea(slab: Shape, joistArrow: Shape): number {
  if (!slab.properties?.slabConfig) return calculatePolygonArea(slab.points)

  const config = slab.properties.slabConfig
  const initialExclusion = (config.initialExclusion || 0) / 100
  const finalExclusion = (config.finalExclusion || 0) / 100

  if (initialExclusion === 0 && finalExclusion === 0) {
    return calculatePolygonArea(slab.points)
  }

  const arrowStart = joistArrow.points[0]
  const arrowEnd = joistArrow.points[1]
  const dx = arrowEnd.x - arrowStart.x
  const dy = arrowEnd.y - arrowStart.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return calculatePolygonArea(slab.points)

  const ax = dx / len
  const ay = dy / len

  const px = -ay
  const py = ax

  let minProj = Infinity
  let maxProj = -Infinity

  for (const p of slab.points) {
    const proj = p.x * px + p.y * py
    if (proj < minProj) minProj = proj
    if (proj > maxProj) maxProj = proj
  }

  const limit1 = minProj + initialExclusion
  const limit2 = maxProj - finalExclusion

  if (limit1 >= limit2) return 0

  let clipped = clipPolygon(slab.points, { x: px, y: py }, limit1, true)
  clipped = clipPolygon(clipped, { x: px, y: py }, limit2, false)

  return calculatePolygonArea(clipped)
}

function getRibPolygon(rib: Shape): Point[] {
  if (
    rib.type !== 'rib' ||
    !rib.properties?.ribConfig ||
    rib.points.length < 2
  ) {
    return []
  }

  const p1 = rib.points[0]
  const p2 = rib.points[1]
  const width = rib.properties.ribConfig.width

  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const len = Math.sqrt(dx * dx + dy * dy)

  if (len === 0) return []

  const nx = -dy / len
  const ny = dx / len

  const halfWidth = width / 2

  return [
    { x: p1.x + nx * halfWidth, y: p1.y + ny * halfWidth },
    { x: p2.x + nx * halfWidth, y: p2.y + ny * halfWidth },
    { x: p2.x - nx * halfWidth, y: p2.y - ny * halfWidth },
    { x: p1.x - nx * halfWidth, y: p1.y - ny * halfWidth },
  ]
}

function getSegmentPolygonIntersectionLength(
  p1: Point,
  p2: Point,
  polygon: Point[],
): number {
  if (polygon.length < 3) return 0

  let t0 = 0
  let t1 = 1
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    const edgeP1 = polygon[i]
    const edgeP2 = polygon[j]

    const edgeDx = edgeP2.x - edgeP1.x
    const edgeDy = edgeP2.y - edgeP1.y

    // Outward normal if CCW: (edgeDy, -edgeDx)
    const nx = edgeDy
    const ny = -edgeDx

    const denom = nx * dx + ny * dy
    const num = nx * (edgeP1.x - p1.x) + ny * (edgeP1.y - p1.y)

    if (Math.abs(denom) < 1e-9) {
      // Parallel
      if (num < 0) {
        // Outside (if num < 0) for outward normals
        return 0
      }
    } else {
      const t = num / denom
      if (denom > 0) {
        // Exiting (Normal and Ray in same direction -> Exiting for outward)
        t1 = Math.min(t1, t)
      } else {
        // Entering
        t0 = Math.max(t0, t)
      }
    }

    if (t0 > t1) return 0
  }

  return (t1 - t0) * Math.sqrt(dx * dx + dy * dy)
}

function calculateFillerCount(
  slab: Shape,
  joistArrow: Shape,
  ribs: Shape[],
): { count: number; type: string } {
  if (!slab.properties?.slabConfig) return { count: 0, type: '-' }
  const config = slab.properties.slabConfig

  if (config.material === 'concrete') {
    return { count: 0, type: '-' }
  }

  const unitLength = config.unitLength / 100
  if (unitLength <= 0) return { count: 0, type: '-' }

  const interEixoMeters = (config.interEixo || 42) / 100
  const initialExclusion = (config.initialExclusion || 0) / 100
  const finalExclusion = (config.finalExclusion || 0) / 100

  const strips = generateBeamLines(
    slab.points,
    joistArrow.points[0],
    joistArrow.points[1],
    interEixoMeters,
    initialExclusion,
    finalExclusion,
  )

  let totalCount = 0

  strips.forEach((strip) => {
    const stripLen = calculateLineLength(strip[0], strip[1])
    let intersectionLen = 0

    ribs.forEach((rib) => {
      const poly = getRibPolygon(rib)

      let signedArea = 0
      for (let i = 0; i < poly.length; i++) {
        const j = (i + 1) % poly.length
        signedArea += poly[i].x * poly[j].y - poly[j].x * poly[i].y
      }
      if (signedArea < 0) poly.reverse() // Ensure CCW

      const len = getSegmentPolygonIntersectionLength(strip[0], strip[1], poly)
      intersectionLen += len
    })

    const effectiveLen = Math.max(0, stripLen - intersectionLen)

    if (effectiveLen > 0) {
      totalCount += Math.ceil(effectiveLen / unitLength)
    }
  })

  const typeLabel = `Lajota ${config.type} (${config.unitWidth}x${config.unitLength})`

  return { count: totalCount, type: typeLabel }
}

export function generateSlabReportData(shapes: Shape[]): SlabReportItem[] {
  const slabs = shapes.filter(
    (s) => s.type === 'rectangle' || s.type === 'polygon',
  )
  const manualVigotas = shapes.filter((s) => s.type === 'vigota')
  const ribs = shapes.filter((s) => s.type === 'rib')

  return slabs.map((slab, index) => {
    const label = slab.properties?.label || `Laje ${index + 1}`
    const config = slab.properties?.slabConfig
    const type = config?.type || '-'
    const materialKey = config?.material || 'concrete'
    const material =
      materialKey === 'ceramic'
        ? 'Cerâmica'
        : materialKey === 'eps'
          ? 'EPS'
          : materialKey === 'concrete'
            ? 'Concreto Maciço'
            : '-'

    let width = slab.properties?.width
    let height = slab.properties?.height

    if (!width || !height) {
      const bbox = calculateBoundingBox(slab.points)
      width = bbox.width
      height = bbox.height
    }

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

    let area = slab.properties?.area || calculatePolygonArea(slab.points)
    if (joistArrow) {
      area = calculateNetSlabArea(slab, joistArrow)
    }

    let vigotaCount = 0
    let vigotaSummary = ''
    let vigotaDetails: {
      length: string
      count: number
      reinforcementText: string[]
    }[] = []
    let generatedLengths: number[] = []
    let reinforcementSummary = ''
    let reinforcementLines: string[] = []

    let fillerCount = 0
    let fillerType = '-'

    const slabRibs = ribs.filter((r) => {
      const mid = {
        x: (r.points[0].x + r.points[1].x) / 2,
        y: (r.points[0].y + r.points[1].y) / 2,
      }
      return isWorldPointInShape(mid, slab)
    })

    if (joistArrow && config) {
      generatedLengths = calculateVigotaLengths(slab, joistArrow)

      if (config.reinforcement && config.reinforcement.length > 0) {
        const steelTotals: Record<string, number> = {}

        config.reinforcement.forEach((r) => {
          const key = `${r.steelType} ${r.diameter}mm`
          if (!steelTotals[key]) steelTotals[key] = 0

          const quantity = r.quantity || 1
          const anchorageMeters = (r.anchorage || 0) / 100

          generatedLengths.forEach((len) => {
            const totalLenPerVigota = len + anchorageMeters
            steelTotals[key] += totalLenPerVigota * quantity
          })
        })

        reinforcementSummary = Object.entries(steelTotals)
          .map(([k, v]) => `${v.toFixed(2)}m ${k}`)
          .join(', ')

        reinforcementLines = getSlabReinforcementSummary(slab, joistArrow)
      }

      const fillerResult = calculateFillerCount(slab, joistArrow, slabRibs)
      fillerCount = fillerResult.count
      fillerType = fillerResult.type
    }

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
        allLengths.forEach((l) => {
          const val = Number(l.toFixed(4))
          const rounded = Math.ceil(val * 10) / 10
          const key = rounded.toFixed(2)
          groups[key] = (groups[key] || 0) + 1
        })
      } else {
        allLengths.forEach((l) => {
          const val = l.toFixed(2)
          groups[val] = (groups[val] || 0) + 1
        })
      }

      const sortedLengths = Object.keys(groups).sort(
        (a, b) => Number(b) - Number(a),
      )

      vigotaDetails = sortedLengths.map((len) => {
        const lengthNum = parseFloat(len)
        return {
          length: len,
          count: groups[len],
          reinforcementText: getJoistReinforcementDetails(lengthNum, config),
        }
      })

      vigotaSummary = sortedLengths
        .map((len) => `${groups[len]}x ${len}m`)
        .join(', ')
    }

    const ribsData: RibReportData[] = []
    const ribGroups = new Map<string, RibReportData>()

    slabRibs.forEach((rib) => {
      if (!rib.properties?.ribConfig) return
      const conf = rib.properties.ribConfig
      const length = calculateLineLength(rib.points[0], rib.points[1])

      const key = `${conf.ribType}-${conf.steelDiameter}-${conf.steelQuantity}-${conf.piecesPerMeter}`

      if (!ribGroups.has(key)) {
        ribGroups.set(key, {
          count: 0,
          totalLength: 0,
          channelCount: 0,
          channelType: conf.ribType,
          steelTotalLength: 0,
          steelDiameter: conf.steelDiameter,
          steelQuantity: conf.steelQuantity,
        })
      }

      const group = ribGroups.get(key)!
      group.count++
      group.totalLength += length

      const channels = length * conf.piecesPerMeter
      group.channelCount += channels

      const steel = length * conf.steelQuantity
      group.steelTotalLength += steel
    })

    ribsData.push(...Array.from(ribGroups.values()))

    return {
      id: slab.id,
      label,
      area,
      width,
      height,
      type,
      material,
      materialType: materialKey,
      vigotaCount,
      vigotaSummary,
      vigotaDetails,
      hasExtraVigotas: manualLengths.length > 0,
      extraVigotaCount: manualLengths.length,
      reinforcementSummary,
      reinforcementLines,
      ribsData,
      fillerCount,
      fillerType,
    }
  })
}

export function formatJoistReinforcementText(
  quantity: number,
  diameter: string,
  totalLength: number,
): string {
  return `${quantity} fio de ${diameter}mm c/${totalLength.toFixed(2).replace('.', ',')}m`
}

export function formatSlabSummaryText(
  quantity: number,
  diameter: string,
  totalLength: number,
): string {
  return `${quantity} fios de ${diameter}mm c/${totalLength.toFixed(2).replace('.', ',')}m`
}

export function getJoistReinforcementDetails(
  joistLength: number,
  config?: SlabConfig,
): string[] {
  if (!config || !config.reinforcement || config.reinforcement.length === 0)
    return []

  return config.reinforcement.map((r) => {
    const totalLen = joistLength + (r.anchorage || 0) / 100
    return formatJoistReinforcementText(r.quantity, r.diameter, totalLen)
  })
}

export function getSlabReinforcementSummary(
  slab: Shape,
  joistArrow: Shape,
): string[] {
  const lengths = calculateVigotaLengths(slab, joistArrow)
  const config = slab.properties?.slabConfig

  if (!config || !config.reinforcement || config.reinforcement.length === 0)
    return []

  const summaryMap = new Map<
    string,
    { quantity: number; diameter: string; length: number }
  >()

  lengths.forEach((len) => {
    config.reinforcement!.forEach((r) => {
      const totalLen = len + (r.anchorage || 0) / 100
      const lenKey = totalLen.toFixed(2)
      const key = `${r.diameter}-${lenKey}`

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          quantity: 0,
          diameter: r.diameter,
          length: parseFloat(lenKey),
        })
      }

      const entry = summaryMap.get(key)!
      entry.quantity += r.quantity
    })
  })

  const entries = Array.from(summaryMap.values()).sort(
    (a, b) => b.length - a.length,
  )

  return entries.map((e) =>
    formatSlabSummaryText(e.quantity, e.diameter, e.length),
  )
}
