import React, { useMemo } from 'react'
import { Shape, ViewState } from '@/types/drawing'
import {
  worldToScreen,
  calculatePolygonArea,
  calculateNetSlabArea,
  calculateLineLength,
  generateBeamLines,
  getSlabJoistCount,
  getJoistReinforcementDetails,
  getSlabReinforcementSummary,
} from '@/lib/geometry'
import { formatDimension } from '@/lib/utils'

interface ShapeRendererProps {
  shape: Shape
  view: ViewState
  isSelected: boolean
  joistArrow?: Shape
}

const DimensionRenderer: React.FC<ShapeRendererProps> = ({
  shape,
  view,
  isSelected,
}) => {
  const screenPoints = shape.points.map((p) => worldToScreen(p, view))
  const p1 = screenPoints[0]
  const p2 = screenPoints[1]
  const length =
    shape.properties?.length ??
    calculateLineLength(shape.points[0], shape.points[1])
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2

  return (
    <g className="group">
      {/* Main Dimension Line */}
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={isSelected ? '#16a34a' : '#333'}
        strokeWidth={1}
        markerStart="url(#dim-arrow-start)"
        markerEnd="url(#dim-arrow-end)"
      />
      {/* Text Background */}
      <rect
        x={midX - 20}
        y={midY - 8}
        width="40"
        height="16"
        fill="white"
        fillOpacity="0.9"
        rx="2"
      />
      {/* Text Value */}
      <text
        x={midX}
        y={midY}
        dy="4"
        textAnchor="middle"
        className="text-[10px] font-bold select-none"
        fill={isSelected ? '#16a34a' : '#333'}
        style={{ fontSize: '10px', fontFamily: 'Inter' }}
      >
        {formatDimension(length)}m
      </text>
    </g>
  )
}

const ArrowRenderer: React.FC<ShapeRendererProps> = ({
  shape,
  view,
  isSelected,
}) => {
  const screenPoints = shape.points.map((p) => worldToScreen(p, view))
  const p1 = screenPoints[0]
  const p2 = screenPoints[1]
  const isJoist = shape.properties?.isJoist
  const label = shape.properties?.label

  // Calculate midpoint for label
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2

  return (
    <g className="group">
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={isSelected ? '#16a34a' : '#ef4444'}
        strokeWidth={isSelected ? 3 : 2}
        markerEnd="url(#arrowhead)"
        markerStart={isJoist ? 'url(#arrowhead-start)' : undefined}
        className="transition-colors duration-150"
      />
      {isJoist && label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <circle r="10" fill="white" stroke="#ef4444" strokeWidth="1" />
          <text
            x="0"
            y="0"
            dy="3"
            textAnchor="middle"
            className="text-[10px] font-bold select-none"
            fill="#ef4444"
            style={{ fontSize: '10px', fontFamily: 'Inter' }}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  )
}

const VigotaRenderer: React.FC<ShapeRendererProps> = ({
  shape,
  view,
  isSelected,
}) => {
  const screenPoints = shape.points.map((p) => worldToScreen(p, view))
  const p1 = screenPoints[0]
  const p2 = screenPoints[1]
  return (
    <g className="group">
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={isSelected ? '#16a34a' : '#6b7280'}
        strokeWidth={2}
        strokeDasharray="4 4"
        className="transition-colors duration-150"
      />
      {/* Small markers at ends to make it easier to see/select */}
      <circle cx={p1.x} cy={p1.y} r={2} fill="#6b7280" />
      <circle cx={p2.x} cy={p2.y} r={2} fill="#6b7280" />
    </g>
  )
}

const LineRenderer: React.FC<ShapeRendererProps> = ({
  shape,
  view,
  isSelected,
}) => {
  const screenPoints = shape.points.map((p) => worldToScreen(p, view))
  const p1 = screenPoints[0]
  const p2 = screenPoints[1]
  // Use stored length if available (from manual input), otherwise calculate
  const length =
    shape.properties?.length ??
    calculateLineLength(shape.points[0], shape.points[1])
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2

  return (
    <g className="group">
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={isSelected ? '#16a34a' : '#343a40'}
        strokeWidth={isSelected ? 3 : 2}
        strokeLinecap="round"
        className="transition-colors duration-150"
      />
      <circle
        cx={p1.x}
        cy={p1.y}
        r={4}
        fill={isSelected ? '#16a34a' : '#343a40'}
      />
      <circle
        cx={p2.x}
        cy={p2.y}
        r={4}
        fill={isSelected ? '#16a34a' : '#343a40'}
      />

      <g transform={`translate(${midX}, ${midY})`}>
        <rect
          x="-24"
          y="-10"
          width="48"
          height="20"
          rx="2"
          fill="white"
          fillOpacity="0.8"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          className="text-[10px] font-bold pointer-events-none select-none"
          fill="#1f2937"
          style={{ fontSize: '10px', fontFamily: 'Inter' }}
        >
          {formatDimension(length)} m
        </text>
      </g>
    </g>
  )
}

const SlabRenderer: React.FC<ShapeRendererProps> = ({
  shape,
  view,
  isSelected,
  joistArrow,
}) => {
  const screenPoints = shape.points.map((p) => worldToScreen(p, view))

  const beamLines = useMemo(() => {
    if (joistArrow && shape.properties?.slabConfig) {
      const config = shape.properties.slabConfig
      const interEixoMeters = (config.interEixo || 42) / 100
      const initialExclusion = (config.initialExclusion || 0) / 100
      const finalExclusion = (config.finalExclusion || 0) / 100

      return generateBeamLines(
        shape.points,
        joistArrow.points[0],
        joistArrow.points[1],
        interEixoMeters,
        initialExclusion,
        finalExclusion,
      )
    }
    return []
  }, [shape, joistArrow])

  const joistCount = useMemo(() => {
    if (joistArrow) {
      return getSlabJoistCount(shape, joistArrow)
    }
    return 0
  }, [shape, joistArrow])

  const area = useMemo(() => {
    if (joistArrow) {
      return calculateNetSlabArea(shape, joistArrow)
    }
    return calculatePolygonArea(shape.points)
  }, [shape, joistArrow])

  // Get Slab Summary
  const slabSummary = useMemo(() => {
    if (joistArrow && shape.properties?.slabConfig) {
      return getSlabReinforcementSummary(shape, joistArrow)
    }
    return []
  }, [shape, joistArrow])

  const pathData = `M ${screenPoints.map((p) => `${p.x},${p.y}`).join(' L ')} Z`

  const centroid = screenPoints.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 },
  )
  if (screenPoints.length > 0) {
    centroid.x /= screenPoints.length
    centroid.y /= screenPoints.length
  }

  // Calculate dimensions for rectangle
  let dimensions = null
  if (
    shape.type === 'rectangle' &&
    shape.properties?.width &&
    shape.properties?.height
  ) {
    // Assuming points are ordered: top-left, top-right, bottom-right, bottom-left
    // Top edge center
    const topMid = {
      x: (screenPoints[0].x + screenPoints[1].x) / 2,
      y: (screenPoints[0].y + screenPoints[1].y) / 2 - 15,
    }
    // Right edge center
    const rightMid = {
      x: (screenPoints[1].x + screenPoints[2].x) / 2 + 25,
      y: (screenPoints[1].y + screenPoints[2].y) / 2,
    }

    dimensions = (
      <>
        <text
          x={topMid.x}
          y={topMid.y}
          textAnchor="middle"
          className="text-[10px] font-bold pointer-events-none select-none"
          fill="#1f2937"
          style={{ fontSize: '10px', fontFamily: 'Inter' }}
        >
          {formatDimension(shape.properties.width)}m
        </text>
        <text
          x={rightMid.x}
          y={rightMid.y}
          textAnchor="middle"
          className="text-[10px] font-bold pointer-events-none select-none"
          fill="#1f2937"
          style={{ fontSize: '10px', fontFamily: 'Inter' }}
        >
          {formatDimension(shape.properties.height)}m
        </text>
      </>
    )
  }

  // Slab Label Properties
  const labelText = `${shape.properties?.label || `Laje`} (${area.toFixed(2)} m²)`
  const joistCountText = joistCount > 0 ? `(${joistCount}vt)` : ''

  // Calculate label box height
  // Base height for Label + Count: 20px
  // Each summary line: ~10px
  const labelBoxHeight = 20 + Math.max(0, slabSummary.length * 12)
  const labelBoxY = -10 - (slabSummary.length * 12) / 2 // Center vertically

  return (
    <g className="group">
      <path
        d={pathData}
        fill="#e0f7fa"
        fillOpacity="0.3"
        stroke={isSelected ? '#16a34a' : '#343a40'}
        strokeWidth={isSelected ? 3 : 2}
        strokeLinejoin="round"
        className="transition-colors duration-150"
      />

      {/* Render Beams and their details */}
      {beamLines.map((line, i) => {
        const p1 = worldToScreen(line[0], view)
        const p2 = worldToScreen(line[1], view)
        const worldLength = calculateLineLength(line[0], line[1])

        // Generate individual joist reinforcement details
        const reinfDetails = getJoistReinforcementDetails(
          worldLength,
          shape.properties?.slabConfig,
        )

        // Calculate angle for text rotation
        const angleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x)
        let angleDeg = (angleRad * 180) / Math.PI
        if (angleDeg > 90) angleDeg -= 180
        if (angleDeg < -90) angleDeg += 180

        const midX = (p1.x + p2.x) / 2
        const midY = (p1.y + p2.y) / 2

        return (
          <g key={`beam-${i}`}>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#6b7280"
              strokeWidth={1}
              strokeOpacity={0.6}
              strokeDasharray="4 4"
            />
            {reinfDetails.map((text, idx) => (
              <g
                key={`reinf-${idx}`}
                transform={`translate(${midX}, ${midY}) rotate(${angleDeg})`}
              >
                <text
                  x="0"
                  y={12 + idx * 10} // Position below the line
                  textAnchor="middle"
                  className="text-[8px] font-normal select-none pointer-events-none"
                  fill="#374151"
                  style={{ fontSize: '8px', fontFamily: 'Inter' }}
                >
                  {text}
                </text>
              </g>
            ))}
          </g>
        )
      })}

      {screenPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill={isSelected ? '#16a34a' : '#343a40'}
        />
      ))}

      {/* Slab Label & Summary */}
      <g transform={`translate(${centroid.x}, ${centroid.y})`}>
        <rect
          x="-50"
          y={labelBoxY}
          width="100"
          height={labelBoxHeight}
          rx="2"
          fill="white"
          fillOpacity="0.85"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        <text
          x="0"
          y={labelBoxY + 14}
          textAnchor="middle"
          className="text-[10px] font-bold pointer-events-none select-none"
          fill="#1f2937"
          style={{ fontSize: '10px', fontFamily: 'Inter' }}
        >
          {labelText} {joistCountText}
        </text>
        {/* Summary Lines */}
        {slabSummary.map((line, idx) => (
          <text
            key={`sum-${idx}`}
            x="0"
            y={labelBoxY + 26 + idx * 12}
            textAnchor="middle"
            className="text-[9px] font-medium pointer-events-none select-none"
            fill="#4b5563"
            style={{ fontSize: '9px', fontFamily: 'Inter' }}
          >
            {line}
          </text>
        ))}
      </g>
      {dimensions}
    </g>
  )
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = React.memo(
  (props) => {
    const { shape } = props

    if (shape.type === 'dimension') return <DimensionRenderer {...props} />
    if (shape.type === 'arrow') return <ArrowRenderer {...props} />
    if (shape.type === 'vigota') return <VigotaRenderer {...props} />
    if (shape.type === 'line') return <LineRenderer {...props} />
    if (shape.type === 'rectangle' || shape.type === 'polygon') {
      return <SlabRenderer {...props} />
    }

    return null
  },
)
