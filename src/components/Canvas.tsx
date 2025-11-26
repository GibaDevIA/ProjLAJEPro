import React, { useRef, useState, useEffect } from 'react'
import { useDrawing } from '@/context/DrawingContext'
import {
  screenToWorld,
  worldToScreen,
  getSnapPoint,
  calculateLineLength,
  calculateAngle,
  getPointFromLengthAndAngle,
  isPointInShape,
  isPointInPolygon,
} from '@/lib/geometry'
import { Point, Shape } from '@/types/drawing'
import { ShapeRenderer } from './ShapeRenderer'
import { MeasureModal } from './MeasureModal'
import { generateId, cn } from '@/lib/utils'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { toast } from 'sonner'

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    shapes,
    addShape,
    updateShape,
    removeShape,
    view,
    setView,
    tool,
    activeShapeId,
    setActiveShapeId,
    gridVisible,
    checkAndMergeLines,
  } = useDrawing()

  // State for panning
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<Point | null>(null)

  // State for drawing
  const [drawingStart, setDrawingStart] = useState<Point | null>(null)
  const [polyPoints, setPolyPoints] = useState<Point[]>([])
  const [showMeasureModal, setShowMeasureModal] = useState(false)
  const [modalPosition, setModalPosition] = useState<Point>({ x: 0, y: 0 })

  // State for moving objects
  const [isMovingShape, setIsMovingShape] = useState(false)
  const [moveStartScreen, setMoveStartScreen] = useState<Point | null>(null)
  const [originalShapePoints, setOriginalShapePoints] = useState<
    Point[] | null
  >(null)

  // General mouse state
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null)
  const [snapPoint, setSnapPoint] = useState<{
    point: Point
    targetPoint: Point
  } | null>(null)

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

  // Keyboard shortcuts for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeShapeId) {
        // Prevent backspace from navigating back
        if (e.key === 'Backspace') e.preventDefault()
        removeShape(activeShapeId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeShapeId, removeShape])

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
    const worldPos = screenToWorld(mousePos, view)

    // Handle Pan Tool or Middle Click or Spacebar
    if (
      tool === 'pan' ||
      ('button' in e && (e as React.MouseEvent).button === 1) ||
      ('button' in e &&
        (e as React.MouseEvent).button === 0 &&
        (e as React.MouseEvent).getModifierState('Space'))
    ) {
      setIsPanning(true)
      setPanStart(mousePos)
      return
    }

    // Handle Select Tool or Right Click (Context Menu)
    if (
      tool === 'select' ||
      ('button' in e && (e as React.MouseEvent).button === 2)
    ) {
      // Check if clicked on a shape
      // We iterate in reverse to select top-most shape first
      let clickedShapeId: string | null = null
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (isPointInShape(mousePos, shapes[i], view)) {
          clickedShapeId = shapes[i].id
          break
        }
      }

      if (clickedShapeId) {
        setActiveShapeId(clickedShapeId)
        // Only start moving if left click
        if (!('button' in e) || (e as React.MouseEvent).button === 0) {
          setIsMovingShape(true)
          setMoveStartScreen(mousePos)
          const shape = shapes.find((s) => s.id === clickedShapeId)
          if (shape) {
            setOriginalShapePoints([...shape.points])
          }
        }
      } else {
        // Only deselect if left click on empty space
        if (!('button' in e) || (e as React.MouseEvent).button === 0) {
          setActiveShapeId(null)
        }
      }
      return
    }

    // Handle Drawing Tools (Left click only)
    if (
      tool !== 'select' &&
      tool !== 'pan' &&
      (!('button' in e) || (e as React.MouseEvent).button === 0)
    ) {
      if (tool === 'line') {
        // Use snapped point if available, otherwise raw world pos
        const startPoint = snapPoint ? snapPoint.point : worldPos

        if (polyPoints.length === 0) {
          setPolyPoints([startPoint])
          setDrawingStart(startPoint)
          setModalPosition(mousePos)
          setShowMeasureModal(true)
        } else {
          const firstPoint = polyPoints[0]
          const distToStart = calculateLineLength(startPoint, firstPoint)
          const thresholdMeters = 8 / view.scale

          // Close polygon if near start
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
            // Continue line
            setPolyPoints([...polyPoints, startPoint])
            setDrawingStart(startPoint)
            setModalPosition(mousePos)
            setShowMeasureModal(true)

            const newShape: Shape = {
              id: generateId(),
              type: 'line',
              points: [polyPoints[polyPoints.length - 1], startPoint],
            }
            addShape(newShape)
          }
        }
      } else if (tool === 'slab_joist') {
        // Check if inside a polygon or rectangle
        const polygons = shapes.filter(
          (s) => s.type === 'polygon' || s.type === 'rectangle',
        )
        let insideShape = false
        for (const poly of polygons) {
          const screenPoints = poly.points.map((p) => worldToScreen(p, view))
          if (isPointInPolygon(mousePos, screenPoints)) {
            insideShape = true
            break
          }
        }

        if (insideShape) {
          setDrawingStart(worldPos)
        } else {
          toast.error(
            'Clique dentro de uma laje (polígono fechado) para lançar a vigota.',
          )
        }
      }
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

    // Handle Panning
    if (isPanning && panStart) {
      const dx = mousePos.x - panStart.x
      const dy = mousePos.y - panStart.y
      setView({
        ...view,
        offset: { x: view.offset.x + dx, y: view.offset.y + dy },
      })
      setPanStart(mousePos)
      return
    }

    // Handle Moving Shape
    if (
      isMovingShape &&
      moveStartScreen &&
      activeShapeId &&
      originalShapePoints
    ) {
      const dxScreen = mousePos.x - moveStartScreen.x
      const dyScreen = mousePos.y - moveStartScreen.y

      // Convert screen delta to world delta
      const dxWorld = dxScreen / view.scale
      const dyWorld = dyScreen / view.scale

      // Calculate proposed new points
      const proposedPoints = originalShapePoints.map((p) => ({
        x: p.x + dxWorld,
        y: p.y + dyWorld,
      }))

      // Check for snapping
      // We check each vertex of the moving shape against vertices of other shapes
      let bestSnap: { delta: Point; target: Point } | null = null
      let minSnapDist = 8 // pixels

      // Iterate over moving shape vertices
      for (const p of proposedPoints) {
        const pScreen = worldToScreen(p, view)
        // Check snap against other shapes and grid
        const snap = getSnapPoint(
          pScreen,
          shapes,
          view,
          [activeShapeId],
          gridVisible,
        )

        if (snap && snap.distance < minSnapDist) {
          minSnapDist = snap.distance
          // Calculate the adjustment needed to align p with snap.point
          // snap.point is the target world coordinate
          // p is the current proposed world coordinate
          const adjustment = {
            x: snap.point.x - p.x,
            y: snap.point.y - p.y,
          }
          bestSnap = { delta: adjustment, target: snap.targetPoint }
        }
      }

      let finalPoints = proposedPoints
      if (bestSnap) {
        // Apply adjustment to all points
        finalPoints = proposedPoints.map((p) => ({
          x: p.x + bestSnap.delta.x,
          y: p.y + bestSnap.delta.y,
        }))
        setSnapPoint({
          point: screenToWorld(bestSnap.target, view),
          targetPoint: bestSnap.target,
        })
      } else {
        setSnapPoint(null)
      }

      updateShape(activeShapeId, { points: finalPoints })
      return
    }

    // Handle Snapping for Drawing Tools
    if (tool === 'line' || tool === 'rectangle') {
      const snap = getSnapPoint(mousePos, shapes, view, [], gridVisible)
      setSnapPoint(snap)
    } else {
      if (!isMovingShape) setSnapPoint(null)
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setPanStart(null)

    if (isMovingShape) {
      // Check if we formed a polygon by connecting lines
      checkAndMergeLines()
    }

    if (tool === 'slab_joist' && drawingStart && currentMousePos) {
      const endWorld = screenToWorld(currentMousePos, view)
      const length = calculateLineLength(drawingStart, endWorld)

      if (length > 0.1) {
        // Calculate next label
        const joists = shapes.filter((s) => s.properties?.isJoist)
        const existingNumbers = joists.map((j) => {
          const match = j.properties?.label?.match(/^L(\d+)$/)
          return match ? parseInt(match[1], 10) : 0
        })
        const nextNumber =
          existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1

        // Minimum length check
        const newShape: Shape = {
          id: generateId(),
          type: 'arrow',
          points: [drawingStart, endWorld],
          properties: {
            isJoist: true,
            label: `L${nextNumber}`,
          },
        }
        addShape(newShape)
      }
      setDrawingStart(null)
    }

    setIsMovingShape(false)
    setMoveStartScreen(null)
    setOriginalShapePoints(null)
    // Snap point might be lingering from move, clear it
    if (tool === 'select') {
      setSnapPoint(null)
    }
  }

  const handleModalConfirm = (length: number, angle?: number) => {
    if (!drawingStart) return

    let endPoint: Point

    if (angle !== undefined) {
      endPoint = getPointFromLengthAndAngle(drawingStart, length, angle)
    } else {
      if (currentMousePos) {
        const currentWorld = snapPoint
          ? snapPoint.point
          : screenToWorld(currentMousePos, view)
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
    if (tool === 'slab_joist' && drawingStart && currentMousePos) {
      const startScreen = worldToScreen(drawingStart, view)
      const endScreen = currentMousePos
      return (
        <g>
          <line
            x1={startScreen.x}
            y1={startScreen.y}
            x2={endScreen.x}
            y2={endScreen.y}
            stroke="#ef4444"
            strokeWidth={2}
            markerEnd="url(#arrowhead-preview)"
            markerStart="url(#arrowhead-start-preview)"
          />
        </g>
      )
    }
    return null
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full h-full block">
        <div
          id="canvas-container"
          className="relative w-full h-full overflow-hidden bg-white select-none touch-none"
        >
          <div
            ref={containerRef}
            className={cn('w-full h-full cursor-crosshair', {
              'cursor-grab': tool === 'pan' && !isPanning,
              'cursor-grabbing': tool === 'pan' && isPanning,
              'cursor-move':
                tool === 'select' &&
                activeShapeId &&
                currentMousePos &&
                shapes.find((s) => s.id === activeShapeId) &&
                isPointInShape(
                  currentMousePos,
                  shapes.find((s) => s.id === activeShapeId)!,
                  view,
                ),
              'cursor-default': tool === 'select' && !activeShapeId,
            })}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            onContextMenu={(e) => {
              // Prevent default context menu, but allow our custom one
              // e.preventDefault() is handled by ContextMenuTrigger usually,
              // but we might need to ensure selection happens first in handleMouseDown
            }}
          >
            <svg
              width="100%"
              height="100%"
              className="absolute inset-0 pointer-events-none"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
                <marker
                  id="arrowhead-start"
                  markerWidth="10"
                  markerHeight="7"
                  refX="1"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="10 0, 0 3.5, 10 7" fill="#ef4444" />
                </marker>
                <marker
                  id="arrowhead-preview"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
                <marker
                  id="arrowhead-start-preview"
                  markerWidth="10"
                  markerHeight="7"
                  refX="1"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="10 0, 0 3.5, 10 7" fill="#ef4444" />
                </marker>
              </defs>

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

          <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded shadow text-xs font-mono pointer-events-none no-print">
            Scale: 1m = {view.scale.toFixed(0)}px
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          disabled={!activeShapeId}
          onClick={() => activeShapeId && removeShape(activeShapeId)}
        >
          Excluir Elemento
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
