import React, { useMemo } from 'react'
import { Shape, ViewState } from '@/types/drawing'
import {
  worldToScreen,
  calculatePolygonArea,
  calculateLineLength,
  generateBeamLines,
} from '@/lib/geometry'

interface ShapeRendererProps {
  shape: Shape
  view: ViewState
  isSelected: boolean
  joistArrow?: Shape
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = React.memo(
  ({ shape, view, isSelected, joistArrow }) => {
    const screenPoints = shape.points.map((p) => worldToScreen(p, view))

    const beamLines = useMemo(() => {
      if (
        (shape.type === 'rectangle' || shape.type === 'polygon') &&
        joistArrow &&
        shape.properties?.slabConfig
      ) {
        const interEixoMeters = shape.properties.slabConfig.interEixo / 100
        return generateBeamLines(
          shape.points,
          joistArrow.points[0],
          joistArrow.points[1],
          interEixoMeters,
        )
      }
      return []
    }, [shape, joistArrow])

    if (shape.type === 'arrow') {
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
            stroke={isSelected ? '#007bff' : '#ef4444'}
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

    if (shape.type === 'line') {
      const p1 = screenPoints[0]
      const p2 = screenPoints[1]
      const length = calculateLineLength(shape.points[0], shape.points[1])
      const midX = (p1.x + p2.x) / 2
      const midY = (p1.y + p2.y) / 2

      return (
        <g className="group">
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={isSelected ? '#007bff' : '#343a40'}
            strokeWidth={isSelected ? 3 : 2}
            strokeLinecap="round"
            className="transition-colors duration-150"
          />
          <circle cx={p1.x} cy={p1.y} r={4} fill="#343a40" />
          <circle cx={p2.x} cy={p2.y} r={4} fill="#343a40" />

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
              {length.toFixed(2)} m
            </text>
          </g>
        </g>
      )
    }

    if (shape.type === 'rectangle' || shape.type === 'polygon') {
      const pathData = `M ${screenPoints.map((p) => `${p.x},${p.y}`).join(' L ')} Z`
      const area = calculatePolygonArea(shape.points)

      const centroid = screenPoints.reduce(
        (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
        { x: 0, y: 0 },
      )
      centroid.x /= screenPoints.length
      centroid.y /= screenPoints.length

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
              {shape.properties.width.toFixed(1)}m
            </text>
            <text
              x={rightMid.x}
              y={rightMid.y}
              textAnchor="middle"
              className="text-[10px] font-bold pointer-events-none select-none"
              fill="#1f2937"
              style={{ fontSize: '10px', fontFamily: 'Inter' }}
            >
              {shape.properties.height.toFixed(1)}m
            </text>
          </>
        )
      }

      return (
        <g className="group">
          <path
            d={pathData}
            fill="#e0f7fa"
            fillOpacity="0.3"
            stroke={isSelected ? '#007bff' : '#343a40'}
            strokeWidth={isSelected ? 3 : 2}
            strokeLinejoin="round"
            className="transition-colors duration-150"
          />

          {/* Render Beams */}
          {beamLines.map((line, i) => {
            const p1 = worldToScreen(line[0], view)
            const p2 = worldToScreen(line[1], view)
            return (
              <line
                key={`beam-${i}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#6b7280"
                strokeWidth={1}
                strokeOpacity={0.6}
              />
            )
          })}

          {screenPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={4} fill="#343a40" />
          ))}

          <g transform={`translate(${centroid.x}, ${centroid.y})`}>
            <rect
              x="-30"
              y="-10"
              width="60"
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
              {area.toFixed(2)} m²
            </text>
          </g>
          {dimensions}
        </g>
      )
    }

    return null
  },
)
