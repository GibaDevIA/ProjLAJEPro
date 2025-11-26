import React, { useRef, useState, useEffect } from 'react'
import { useDrawing } from '@/context/DrawingContext'
import {
  screenToWorld,
  worldToScreen,
  getSnapPoint,
  calculateLineLength,
  calculateAngle,
  getPointFromLengthAndAngle,
} from '@/lib/geometry'
import { Point, Shape } from '@/types/drawing'
import { ShapeRenderer } from './ShapeRenderer'
import { MeasureModal } from './MeasureModal'
import { generateId, cn } from '@/lib/utils'

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    shapes,
    addShape,
    view,
    setView,
    tool,
    activeShapeId,
    setActiveShapeId,
    gridVisible,
  } = useDrawing()

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [drawingStart, setDrawingStart] = useState<Point | null>(null)
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null)
  const [snapPoint, setSnapPoint] = useState<{
    point: Point
    targetPoint: Point
  } | null>(null)
  const [showMeasureModal, setShowMeasureModal] = useState(false)
  const [modalPosition, setModalPosition] = useState<Point>({ x: 0, y: 0 })

  const [polyPoints, setPolyPoints] = useState<Point[]>([])
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current && containerRef.current) {
      if (view.offset.x === 0 && view.offset.y === 0) {
        setView((prev) => ({
          ...prev,
          offset: {
            x: containerRef.current!.clientWidth / 2,
            y: containerRef.current!.clientHeight / 2,
          },
        }))
      }
      initializedRef.current = true
    }
  }, [view.offset.x, view.offset.y, setView])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomSensitivity = 0.001
    const delta = -e.deltaY * zoomSensitivity
    const newScale = Math.max(1, Math.min(500, view.scale * (1 + delta)))

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const worldPos = screenToWorld({ x: mouseX, y: mouseY }, view)

    const newOffset = {
      x: mouseX - worldPos.x * newScale,
      y: mouseY - worldPos.y * newScale,
    }

    setView({ scale: newScale, offset: newOffset })
  }

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX =
      'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY =
      'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const mousePos = { x: clientX - rect.left, y: clientY - rect.top }
    const worldPos = snapPoint ? snapPoint.point : screenToWorld(mousePos, view)

    if (
      tool === 'pan' ||
      ('button' in e && (e as React.MouseEvent).button === 1) ||
      ('button' in e &&
        (e as React.MouseEvent).button === 0 &&
        (e as React.MouseEvent).getModifierState('Space'))
    ) {
      setIsDragging(true)
      setDragStart(mousePos)
      return
    }

    if (tool === 'line') {
      if (polyPoints.length === 0) {
        setPolyPoints([worldPos])
        setDrawingStart(worldPos)
        setModalPosition(mousePos)
        setShowMeasureModal(true)
      } else {
        const startPoint = polyPoints[0]
        const distToStart = calculateLineLength(worldPos, startPoint)
        const thresholdMeters = 8 / view.scale

        if (polyPoints.length >= 3 && distToStart < thresholdMeters) {
          const newShape: Shape = {
            id: generateId(),
            type: 'polygon',
            points: [...polyPoints],
          }
          addShape(newShape)
          setPolyPoints([])
          setDrawingStart(null)
          setShowMeasureModal(false)
        } else {
          setPolyPoints([...polyPoints, worldPos])
          setDrawingStart(worldPos)
          setModalPosition(mousePos)
          setShowMeasureModal(true)

          const newShape: Shape = {
            id: generateId(),
            type: 'line',
            points: [polyPoints[polyPoints.length - 1], worldPos],
          }
          addShape(newShape)
        }
      }
    } else if (tool === 'select') {
      setActiveShapeId(null)
    }
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX =
      'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY =
      'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const mousePos = { x: clientX - rect.left, y: clientY - rect.top }
    setCurrentMousePos(mousePos)

    if (isDragging && dragStart) {
      const dx = mousePos.x - dragStart.x
      const dy = mousePos.y - dragStart.y
      setView({
        ...view,
        offset: { x: view.offset.x + dx, y: view.offset.y + dy },
      })
      setDragStart(mousePos)
      return
    }

    if (tool === 'line' || tool === 'rectangle') {
      const snap = getSnapPoint(mousePos, shapes, view)
      setSnapPoint(snap)
    } else {
      setSnapPoint(null)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
  }

  const handleModalConfirm = (length: number, angle?: number) => {
    if (!drawingStart) return

    let endPoint: Point

    if (angle !== undefined) {
      endPoint = getPointFromLengthAndAngle(drawingStart, length, angle)
    } else {
      if (currentMousePos) {
        const currentWorld = screenToWorld(currentMousePos, view)
        const currentAngle = calculateAngle(drawingStart, currentWorld)
        endPoint = getPointFromLengthAndAngle(
          drawingStart,
          length,
          currentAngle,
        )
      } else {
        endPoint = getPointFromLengthAndAngle(drawingStart, length, 0)
      }
    }

    const newShape: Shape = {
      id: generateId(),
      type: 'line',
      points: [drawingStart, endPoint],
    }
    addShape(newShape)

    if (polyPoints.length > 0) {
      setPolyPoints([...polyPoints, endPoint])
    } else {
      setPolyPoints([drawingStart, endPoint])
    }

    setDrawingStart(endPoint)
    const newScreenPos = worldToScreen(endPoint, view)
    setModalPosition(newScreenPos)
  }

  const handleModalCancel = () => {
    setShowMeasureModal(false)
    setPolyPoints([])
    setDrawingStart(null)
  }

  const renderGrid = () => {
    if (!gridVisible) return null

    const width = containerRef.current?.clientWidth || 0
    const height = containerRef.current?.clientHeight || 0

    const topLeft = screenToWorld({ x: 0, y: 0 }, view)
    const bottomRight = screenToWorld({ x: width, y: height }, view)

    const startX = Math.floor(topLeft.x)
    const endX = Math.ceil(bottomRight.x)
    const startY = Math.floor(topLeft.y)
    const endY = Math.ceil(bottomRight.y)

    const lines = []

    for (let x = startX; x <= endX; x++) {
      const screenX = x * view.scale + view.offset.x
      lines.push(
        <line
          key={`v-${x}`}
          x1={screenX}
          y1={0}
          x2={screenX}
          y2={height}
          stroke={x === 0 ? '#adb5bd' : '#e9ecef'}
          strokeWidth={x === 0 ? 2 : 1}
        />,
      )
      const screenXSub = (x + 0.5) * view.scale + view.offset.x
      lines.push(
        <line
          key={`v-sub-${x}`}
          x1={screenXSub}
          y1={0}
          x2={screenXSub}
          y2={height}
          stroke="#f1f3f5"
          strokeWidth={1}
          strokeDasharray="4 4"
        />,
      )
    }

    for (let y = startY; y <= endY; y++) {
      const screenY = y * view.scale + view.offset.y
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={screenY}
          x2={width}
          y2={screenY}
          stroke={y === 0 ? '#adb5bd' : '#e9ecef'}
          strokeWidth={y === 0 ? 2 : 1}
        />,
      )
      const screenYSub = (y + 0.5) * view.scale + view.offset.y
      lines.push(
        <line
          key={`h-sub-${y}`}
          x1={0}
          y1={screenYSub}
          x2={width}
          y2={screenYSub}
          stroke="#f1f3f5"
          strokeWidth={1}
          strokeDasharray="4 4"
        />,
      )
    }

    return <g>{lines}</g>
  }

  const renderPreview = () => {
    if (tool === 'line' && drawingStart && currentMousePos) {
      const startScreen = worldToScreen(drawingStart, view)
      const endScreen = snapPoint ? snapPoint.targetPoint : currentMousePos

      const currentWorld = snapPoint
        ? snapPoint.point
        : screenToWorld(currentMousePos, view)
      const length = calculateLineLength(drawingStart, currentWorld)
      const angle = calculateAngle(drawingStart, currentWorld)

      return (
        <g>
          <line
            x1={startScreen.x}
            y1={startScreen.y}
            x2={endScreen.x}
            y2={endScreen.y}
            stroke="#007bff"
            strokeWidth={2}
            strokeDasharray="5 5"
            className="animate-pulse"
          />
          <text
            x={endScreen.x + 10}
            y={endScreen.y + 10}
            className="text-xs font-bold"
            fill="#007bff"
            style={{ fontSize: '12px', fontFamily: 'Inter' }}
          >
            {length.toFixed(2)}m {angle.toFixed(1)}°
          </text>
        </g>
      )
    }
    return null
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-white select-none touch-none">
      <div
        ref={containerRef}
        className={cn('w-full h-full cursor-crosshair', {
          'cursor-grab': tool === 'pan' && !isDragging,
          'cursor-grabbing': tool === 'pan' && isDragging,
        })}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <svg
          width="100%"
          height="100%"
          className="absolute inset-0 pointer-events-none"
        >
          {renderGrid()}

          {shapes.map((shape) => (
            <ShapeRenderer
              key={shape.id}
              shape={shape}
              view={view}
              isSelected={activeShapeId === shape.id}
            />
          ))}

          {renderPreview()}

          {snapPoint && (
            <circle
              cx={snapPoint.targetPoint.x}
              cy={snapPoint.targetPoint.y}
              r={8}
              fill="none"
              stroke="#dc3545"
              strokeWidth={2}
              className="animate-ping"
            />
          )}
          {snapPoint && (
            <circle
              cx={snapPoint.targetPoint.x}
              cy={snapPoint.targetPoint.y}
              r={4}
              fill="#dc3545"
            />
          )}
        </svg>
      </div>

      {showMeasureModal && drawingStart && currentMousePos && (
        <MeasureModal
          position={modalPosition}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
          initialLength={calculateLineLength(
            drawingStart,
            screenToWorld(currentMousePos, view),
          )}
          initialAngle={calculateAngle(
            drawingStart,
            screenToWorld(currentMousePos, view),
          )}
        />
      )}

      <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded shadow text-xs font-mono">
        Scale: 1m = {view.scale.toFixed(0)}px
      </div>
    </div>
  )
}
