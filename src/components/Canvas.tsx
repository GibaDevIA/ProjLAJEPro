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
  isWorldPointInShape,
  getOrthogonalPoint,
  areLinesParallel,
  SNAP_THRESHOLD_PX,
} from '@/lib/geometry'
import { Point, Shape, SlabConfig, TransverseRibConfig } from '@/types/drawing'
import { ShapeRenderer } from './ShapeRenderer'
import { MeasureModal } from './MeasureModal'
import { SlabConfigurationModal } from './SlabConfigurationModal'
import { TransverseRibModal } from './TransverseRibModal'
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
    addPolygon,
    updateShape,
    removeShape,
    view,
    setView,
    tool,
    setTool,
    activeShapeId,
    setActiveShapeId,
    gridVisible,
    checkAndMergeLines,
    drawingStart,
    setDrawingStart,
    addRectangle,
    orthoMode,
    pendingRibConfig,
    setPendingRibConfig,
    colorBySlabType,
  } = useDrawing()

  // State for panning
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<Point | null>(null)

  // State for drawing
  const [polyPoints, setPolyPoints] = useState<Point[]>([])
  const [showMeasureModal, setShowMeasureModal] = useState(false)
  const [modalPosition, setModalPosition] = useState<Point>({ x: 0, y: 0 })

  // State for Slab Joist Workflow
  const [showSlabConfigModal, setShowSlabConfigModal] = useState(false)
  const [pendingSlabId, setPendingSlabId] = useState<string | null>(null)
  const [drawingJoistForSlabId, setDrawingJoistForSlabId] = useState<
    string | null
  >(null)

  // State for Rib Workflow
  const [showRibModal, setShowRibModal] = useState(false)

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
    type: 'vertex' | 'edge' | 'grid' | 'midpoint'
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

  // Listen for Transverse Rib Tool activation to open modal
  useEffect(() => {
    if (tool === 'transverse_rib' && !drawingStart && !pendingRibConfig) {
      setShowRibModal(true)
    }
  }, [tool, drawingStart, pendingRibConfig])

  // Keyboard shortcuts for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeShapeId) {
        if (e.key === 'Backspace') e.preventDefault()
        removeShape(activeShapeId)
      }
      if (e.key === 'Escape') {
        setDrawingStart(null)
        setPolyPoints([])
        setShowMeasureModal(false)
        setDrawingJoistForSlabId(null)
        if (tool === 'transverse_rib') {
          setPendingRibConfig(null)
          setTool('select')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    activeShapeId,
    removeShape,
    setDrawingStart,
    tool,
    setTool,
    setPendingRibConfig,
  ])

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
      let clickedShapeId: string | null = null
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (isPointInShape(mousePos, shapes[i], view)) {
          clickedShapeId = shapes[i].id
          break
        }
      }

      if (clickedShapeId) {
        setActiveShapeId(clickedShapeId)
        if (!('button' in e) || (e as React.MouseEvent).button === 0) {
          setIsMovingShape(true)
          setMoveStartScreen(mousePos)
          const shape = shapes.find((s) => s.id === clickedShapeId)
          if (shape) {
            setOriginalShapePoints([...shape.points])
          }
        }
      } else {
        if (!('button' in e) || (e as React.MouseEvent).button === 0) {
          setActiveShapeId(null)
        }
      }
      return
    }

    // Handle Delete Vigota Tool
    if (tool === 'delete_vigota') {
      let clickedVigotaId: string | null = null
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (
          shapes[i].type === 'vigota' &&
          isPointInShape(mousePos, shapes[i], view)
        ) {
          clickedVigotaId = shapes[i].id
          break
        }
      }
      if (clickedVigotaId) {
        removeShape(clickedVigotaId)
        toast.success('Vigota removida.')
      }
      return
    }

    // Handle Drawing Tools (Left click only)
    if (
      tool !== 'select' &&
      tool !== 'pan' &&
      tool !== 'delete_vigota' &&
      (!('button' in e) || (e as React.MouseEvent).button === 0)
    ) {
      if (tool === 'line' || tool === 'add_vigota') {
        const startPoint = snapPoint ? snapPoint.point : worldPos

        if (polyPoints.length === 0) {
          setPolyPoints([startPoint])
          setDrawingStart(startPoint)
          setModalPosition(mousePos)
          if (tool === 'line') setShowMeasureModal(true)
        } else {
          const firstPoint = polyPoints[0]
          const distToStart = calculateLineLength(startPoint, firstPoint)
          const thresholdMeters = 8 / view.scale

          if (
            tool === 'line' &&
            polyPoints.length >= 3 &&
            distToStart < thresholdMeters
          ) {
            // Closing the polygon manually
            addPolygon([...polyPoints])
            setPolyPoints([])
            setDrawingStart(null)
            setShowMeasureModal(false)
          } else {
            // Finish line or vigota segment
            let endPoint = startPoint

            // Apply Ortho if enabled and drawing line
            if (tool === 'line' && orthoMode && drawingStart) {
              endPoint = getOrthogonalPoint(drawingStart, worldPos)
            }

            const newShape: Shape = {
              id: generateId(),
              type: tool === 'add_vigota' ? 'vigota' : 'line',
              points: [polyPoints[polyPoints.length - 1], endPoint],
            }
            addShape(newShape)

            if (tool === 'add_vigota') {
              // Vigota is single segment usually, reset
              setPolyPoints([])
              setDrawingStart(null)
              toast.success('Vigota adicionada.')
            } else {
              // Line tool continues
              setPolyPoints([...polyPoints, endPoint])
              setDrawingStart(endPoint)
              setModalPosition(mousePos)
              setShowMeasureModal(true)
            }
          }
        }
      } else if (tool === 'rectangle') {
        if (drawingStart) {
          // Second click (finish rectangle)
          const endWorld = snapPoint ? snapPoint.point : worldPos
          const success = addRectangle(drawingStart, endWorld)
          if (success) setDrawingStart(null)
        } else {
          // First click (start rectangle)
          const startPoint = snapPoint ? snapPoint.point : worldPos
          setDrawingStart(startPoint)
        }
      } else if (tool === 'dimension') {
        if (drawingStart) {
          // Second click (finish dimension)
          const endWorld = snapPoint ? snapPoint.point : worldPos
          const length = calculateLineLength(drawingStart, endWorld)
          if (length > 0.01) {
            const newShape: Shape = {
              id: generateId(),
              type: 'dimension',
              points: [drawingStart, endWorld],
              properties: {
                length: length,
              },
            }
            addShape(newShape)
            toast.success('Cota criada.')
          }
          setDrawingStart(null)
        } else {
          // First click (start dimension)
          const startPoint = snapPoint ? snapPoint.point : worldPos
          setDrawingStart(startPoint)
        }
      } else if (tool === 'slab_joist') {
        if (drawingJoistForSlabId) {
          // We are in "draw arrow" mode for a specific slab
          const slab = shapes.find((s) => s.id === drawingJoistForSlabId)
          if (slab && isPointInShape(mousePos, slab, view)) {
            setDrawingStart(worldPos)
          } else {
            toast.error('Comece o desenho da seta dentro da laje selecionada.')
          }
        } else {
          // We need to select a slab to configure
          const polygons = shapes.filter(
            (s) => s.type === 'polygon' || s.type === 'rectangle',
          )
          let clickedSlabId: string | null = null
          for (let i = polygons.length - 1; i >= 0; i--) {
            if (isPointInShape(mousePos, polygons[i], view)) {
              clickedSlabId = polygons[i].id
              break
            }
          }

          if (clickedSlabId) {
            setPendingSlabId(clickedSlabId)
            setShowSlabConfigModal(true)
          } else {
            toast.error('Clique em uma laje para configurar as vigotas.')
          }
        }
      } else if (tool === 'transverse_rib') {
        if (drawingStart) {
          // Finish drawing rib
          // Snap/Ortho logic happens in render/preview, but we need end point
          let endPoint = snapPoint ? snapPoint.point : worldPos

          // Force Ortho
          endPoint = getOrthogonalPoint(drawingStart, endPoint)

          const length = calculateLineLength(drawingStart, endPoint)
          if (length < 0.01) return

          // Check parallelism with Joist
          // 1. Find Slab at midpoint
          const midPoint = {
            x: (drawingStart.x + endPoint.x) / 2,
            y: (drawingStart.y + endPoint.y) / 2,
          }

          const polygons = shapes.filter(
            (s) => s.type === 'polygon' || s.type === 'rectangle',
          )
          const slab = polygons.find((s) => isWorldPointInShape(midPoint, s))

          if (slab) {
            // Find associated arrow
            const arrow = shapes.find(
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

            if (arrow) {
              // Check angle
              if (
                areLinesParallel(
                  drawingStart,
                  endPoint,
                  arrow.points[0],
                  arrow.points[1],
                  5, // Tolerance
                )
              ) {
                toast.error('A nervura só pode ser transversal à vigota.', {
                  duration: 4000,
                  icon: '⚠️',
                })
                return // Prevent drawing
              }
            }
          }

          if (pendingRibConfig) {
            const newShape: Shape = {
              id: generateId(),
              type: 'rib',
              points: [drawingStart, endPoint],
              properties: {
                ribConfig: pendingRibConfig,
              },
            }
            addShape(newShape)
            toast.success('Nervura adicionada.')
          } else {
            toast.error('Configuração da nervura perdida.')
          }
          setDrawingStart(null)
        } else {
          // Start drawing rib
          const startPoint = snapPoint ? snapPoint.point : worldPos
          setDrawingStart(startPoint)
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

    if (
      isMovingShape &&
      moveStartScreen &&
      activeShapeId &&
      originalShapePoints
    ) {
      const dxScreen = mousePos.x - moveStartScreen.x
      const dyScreen = mousePos.y - moveStartScreen.y
      const dxWorld = dxScreen / view.scale
      const dyWorld = dyScreen / view.scale

      const proposedPoints = originalShapePoints.map((p) => ({
        x: p.x + dxWorld,
        y: p.y + dyWorld,
      }))

      let bestSnap: {
        delta: Point
        target: Point
        type: 'vertex' | 'midpoint' | 'edge' | 'grid'
        distance: number
      } | null = null

      const priorityMap: Record<string, number> = {
        vertex: 4,
        midpoint: 3,
        edge: 2,
        grid: 1,
      }

      for (const p of proposedPoints) {
        const pScreen = worldToScreen(p, view)
        const snap = getSnapPoint(
          pScreen,
          shapes,
          view,
          [activeShapeId],
          gridVisible,
        )

        if (snap) {
          let isBetter = false
          if (!bestSnap) {
            isBetter = true
          } else {
            const currentPriority = priorityMap[snap.type] || 0
            const bestPriority = priorityMap[bestSnap.type] || 0

            if (currentPriority > bestPriority) {
              isBetter = true
            } else if (currentPriority === bestPriority) {
              if (snap.distance < bestSnap.distance) {
                isBetter = true
              }
            }
          }

          if (isBetter) {
            const adjustment = {
              x: snap.point.x - p.x,
              y: snap.point.y - p.y,
            }
            bestSnap = {
              delta: adjustment,
              target: snap.targetPoint,
              type: snap.type,
              distance: snap.distance,
            }
          }
        }
      }

      let finalPoints = proposedPoints
      if (bestSnap) {
        finalPoints = proposedPoints.map((p) => ({
          x: p.x + bestSnap!.delta.x,
          y: p.y + bestSnap!.delta.y,
        }))
        setSnapPoint({
          point: screenToWorld(bestSnap.target, view),
          targetPoint: bestSnap.target,
          type: bestSnap.type,
        })
      } else {
        setSnapPoint(null)
      }

      updateShape(activeShapeId, { points: finalPoints })
      return
    }

    if (
      tool === 'line' ||
      tool === 'rectangle' ||
      tool === 'dimension' ||
      tool === 'add_vigota' ||
      tool === 'transverse_rib'
    ) {
      // If Ortho is ON and drawing a line, disable snapping to ensure strict orthogonality
      if (tool === 'line' && orthoMode && drawingStart) {
        setSnapPoint(null)
      } else {
        const snap = getSnapPoint(mousePos, shapes, view, [], gridVisible)
        setSnapPoint(snap)
      }
    } else {
      if (!isMovingShape) setSnapPoint(null)
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setPanStart(null)

    if (isMovingShape) {
      checkAndMergeLines()
    }

    if (tool === 'rectangle' && drawingStart && currentMousePos) {
      const endWorld = snapPoint
        ? snapPoint.point
        : screenToWorld(currentMousePos, view)
      const width = Math.abs(endWorld.x - drawingStart.x)
      const height = Math.abs(endWorld.y - drawingStart.y)

      if (width > 0.1 && height > 0.1) {
        // It was a drag, finish rectangle
        const success = addRectangle(drawingStart, endWorld)
        if (success) setDrawingStart(null)
      }
      // If it was just a click (width/height small), we keep drawingStart
      // to allow the user to either type in the sidebar or click a second point.
    }

    if (tool === 'slab_joist' && drawingStart && currentMousePos) {
      let endWorld = screenToWorld(currentMousePos, view)

      // Snap to orthogonal
      endWorld = getOrthogonalPoint(drawingStart, endWorld)

      const length = calculateLineLength(drawingStart, endWorld)

      if (length > 0.1) {
        const newShape: Shape = {
          id: generateId(),
          type: 'arrow',
          points: [drawingStart, endWorld],
          properties: {
            isJoist: true,
          },
        }
        addShape(newShape)
        setDrawingJoistForSlabId(null) // Reset after drawing one arrow
        toast.success('Direção das vigotas definida.')
      }
      setDrawingStart(null)
    }

    setIsMovingShape(false)
    setMoveStartScreen(null)
    setOriginalShapePoints(null)
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
        let currentWorld = snapPoint
          ? snapPoint.point
          : screenToWorld(currentMousePos, view)

        // Apply Ortho if enabled
        if (orthoMode && drawingStart) {
          currentWorld = getOrthogonalPoint(drawingStart, currentWorld)
        }

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
      properties: {
        length: length, // Store the exact input length
      },
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

  const handleSlabConfigConfirm = (config: SlabConfig) => {
    if (pendingSlabId) {
      updateShape(pendingSlabId, {
        properties: {
          ...shapes.find((s) => s.id === pendingSlabId)?.properties,
          slabConfig: config,
        },
      })
      setDrawingJoistForSlabId(pendingSlabId)
      setPendingSlabId(null)
      toast.info('Agora desenhe a seta indicando a direção das vigotas.')
    }
  }

  const handleRibConfigConfirm = (config: TransverseRibConfig) => {
    setPendingRibConfig(config)
    setShowRibModal(false)
    toast.info(
      'Configuração salva. Desenhe a nervura (interseção de dois pontos).',
    )
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
    if (
      (tool === 'line' || tool === 'add_vigota') &&
      drawingStart &&
      currentMousePos
    ) {
      const startScreen = worldToScreen(drawingStart, view)
      let endScreen = snapPoint ? snapPoint.targetPoint : currentMousePos

      let currentWorld = snapPoint
        ? snapPoint.point
        : screenToWorld(currentMousePos, view)

      // Apply Ortho if enabled
      if (tool === 'line' && orthoMode && drawingStart) {
        currentWorld = getOrthogonalPoint(drawingStart, currentWorld)
        endScreen = worldToScreen(currentWorld, view)
      }

      const length = calculateLineLength(drawingStart, currentWorld)
      const angle = calculateAngle(drawingStart, currentWorld)

      return (
        <g>
          <line
            x1={startScreen.x}
            y1={startScreen.y}
            x2={endScreen.x}
            y2={endScreen.y}
            stroke={tool === 'add_vigota' ? '#6b7280' : '#334155'}
            strokeWidth={2}
            strokeDasharray="5 5"
            className="animate-pulse"
          />
          <text
            x={endScreen.x + 10}
            y={endScreen.y + 10}
            className="text-xs font-bold"
            fill={tool === 'add_vigota' ? '#6b7280' : '#334155'}
            style={{ fontSize: '12px', fontFamily: 'Inter' }}
          >
            {length.toFixed(2)}m {angle.toFixed(1)}°
          </text>
        </g>
      )
    }
    if (tool === 'transverse_rib' && drawingStart && currentMousePos) {
      const startScreen = worldToScreen(drawingStart, view)

      let currentWorld = snapPoint
        ? snapPoint.point
        : screenToWorld(currentMousePos, view)

      // Always force orthogonal for ribs
      currentWorld = getOrthogonalPoint(drawingStart, currentWorld)
      const endScreen = worldToScreen(currentWorld, view)

      return (
        <g>
          <line
            x1={startScreen.x}
            y1={startScreen.y}
            x2={endScreen.x}
            y2={endScreen.y}
            stroke="#dc2626" // Red
            strokeWidth={2}
            strokeDasharray="6 3" // Dashed
          />
        </g>
      )
    }
    if (tool === 'rectangle' && drawingStart && currentMousePos) {
      const startScreen = worldToScreen(drawingStart, view)
      const endScreen = snapPoint ? snapPoint.targetPoint : currentMousePos
      const width = Math.abs(
        (snapPoint
          ? snapPoint.point.x
          : screenToWorld(currentMousePos, view).x) - drawingStart.x,
      )
      const height = Math.abs(
        (snapPoint
          ? snapPoint.point.y
          : screenToWorld(currentMousePos, view).y) - drawingStart.y,
      )

      return (
        <g>
          <rect
            x={Math.min(startScreen.x, endScreen.x)}
            y={Math.min(startScreen.y, endScreen.y)}
            width={Math.abs(endScreen.x - startScreen.x)}
            height={Math.abs(endScreen.y - startScreen.y)}
            fill="#e0f7fa"
            fillOpacity="0.3"
            stroke="#334155"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <text
            x={Math.min(startScreen.x, endScreen.x)}
            y={Math.min(startScreen.y, endScreen.y) - 10}
            className="text-xs font-bold"
            fill="#334155"
            style={{ fontSize: '12px', fontFamily: 'Inter' }}
          >
            {width.toFixed(2)}m x {height.toFixed(2)}m
          </text>
        </g>
      )
    }
    if (tool === 'dimension' && drawingStart && currentMousePos) {
      const startScreen = worldToScreen(drawingStart, view)
      const endScreen = snapPoint ? snapPoint.targetPoint : currentMousePos
      const currentWorld = snapPoint
        ? snapPoint.point
        : screenToWorld(currentMousePos, view)
      const length = calculateLineLength(drawingStart, currentWorld)

      return (
        <g>
          <line
            x1={startScreen.x}
            y1={startScreen.y}
            x2={endScreen.x}
            y2={endScreen.y}
            stroke="#f59e0b"
            strokeWidth={1}
            strokeDasharray="5 5"
          />
          <text
            x={(startScreen.x + endScreen.x) / 2}
            y={(startScreen.y + endScreen.y) / 2 - 10}
            textAnchor="middle"
            className="text-xs font-bold"
            fill="#f59e0b"
            style={{ fontSize: '12px', fontFamily: 'Inter' }}
          >
            {length.toFixed(2)}m
          </text>
        </g>
      )
    }
    if (tool === 'slab_joist' && drawingStart && currentMousePos) {
      const currentWorld = screenToWorld(currentMousePos, view)
      const snappedWorld = getOrthogonalPoint(drawingStart, currentWorld)

      const startScreen = worldToScreen(drawingStart, view)
      const endScreen = worldToScreen(snappedWorld, view)

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

  // Calculate initial values for MeasureModal
  let initialLength = 0
  let initialAngle = 0
  if (drawingStart && currentMousePos) {
    let currentWorld = snapPoint
      ? snapPoint.point
      : screenToWorld(currentMousePos, view)

    if (tool === 'line' && orthoMode) {
      currentWorld = getOrthogonalPoint(drawingStart, currentWorld)
    }

    initialLength = calculateLineLength(drawingStart, currentWorld)
    initialAngle = calculateAngle(drawingStart, currentWorld)
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
              'cursor-pointer':
                tool === 'delete_vigota' &&
                currentMousePos &&
                shapes.some(
                  (s) =>
                    s.type === 'vigota' &&
                    isPointInShape(currentMousePos, s, view),
                ),
            })}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            onContextMenu={(e) => {}}
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
                {/* Dimension Markers */}
                <marker
                  id="dim-arrow-end"
                  markerWidth="8"
                  markerHeight="8"
                  refX="8"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#333" />
                </marker>
                <marker
                  id="dim-arrow-start"
                  markerWidth="8"
                  markerHeight="8"
                  refX="0"
                  refY="4"
                  orient="auto"
                >
                  <path d="M8,0 L0,4 L8,8 L6,4 Z" fill="#333" />
                </marker>
              </defs>

              {renderGrid()}

              {shapes.map((shape) => {
                let joistArrow: Shape | undefined
                if (shape.type === 'rectangle' || shape.type === 'polygon') {
                  joistArrow = shapes.find(
                    (s) =>
                      s.type === 'arrow' &&
                      s.properties?.isJoist &&
                      isWorldPointInShape(
                        {
                          x: (s.points[0].x + s.points[1].x) / 2,
                          y: (s.points[0].y + s.points[1].y) / 2,
                        },
                        shape,
                      ),
                  )
                }

                return (
                  <ShapeRenderer
                    key={shape.id}
                    shape={shape}
                    view={view}
                    isSelected={activeShapeId === shape.id}
                    joistArrow={joistArrow}
                    colorBySlabType={colorBySlabType}
                  />
                )
              })}

              {renderPreview()}

              {snapPoint && (
                <g>
                  {/* Outer Ping Animation */}
                  <circle
                    cx={snapPoint.targetPoint.x}
                    cy={snapPoint.targetPoint.y}
                    r={snapPoint.type === 'edge' ? 6 : 8}
                    fill="none"
                    stroke={
                      snapPoint.type === 'vertex'
                        ? '#ef4444' // Red for vertex
                        : snapPoint.type === 'midpoint'
                          ? '#06b6d4' // Cyan for midpoint
                          : snapPoint.type === 'edge'
                            ? '#f59e0b' // Orange for edge
                            : '#6b7280' // Gray for grid
                    }
                    strokeWidth={2}
                    className="animate-ping"
                  />

                  {/* Inner Marker */}
                  {snapPoint.type === 'vertex' && (
                    <rect
                      x={snapPoint.targetPoint.x - 4}
                      y={snapPoint.targetPoint.y - 4}
                      width={8}
                      height={8}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={2}
                    />
                  )}

                  {snapPoint.type === 'midpoint' && (
                    <polygon
                      points={`${snapPoint.targetPoint.x},${snapPoint.targetPoint.y - 5} ${snapPoint.targetPoint.x - 4},${snapPoint.targetPoint.y + 3} ${snapPoint.targetPoint.x + 4},${snapPoint.targetPoint.y + 3}`}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={2}
                    />
                  )}

                  {snapPoint.type === 'edge' && (
                    <g
                      transform={`translate(${snapPoint.targetPoint.x}, ${snapPoint.targetPoint.y}) rotate(45)`}
                    >
                      <rect
                        x="-3"
                        y="-3"
                        width="6"
                        height="6"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={2}
                      />
                    </g>
                  )}

                  {snapPoint.type === 'grid' && (
                    <circle
                      cx={snapPoint.targetPoint.x}
                      cy={snapPoint.targetPoint.y}
                      r={3}
                      fill="#6b7280"
                    />
                  )}
                </g>
              )}
            </svg>
          </div>

          {showMeasureModal && drawingStart && currentMousePos && (
            <MeasureModal
              position={modalPosition}
              onConfirm={handleModalConfirm}
              onCancel={() => {
                setShowMeasureModal(false)
                setPolyPoints([])
                setDrawingStart(null)
              }}
              initialLength={initialLength}
              initialAngle={initialAngle}
              isOrtho={orthoMode}
            />
          )}

          <SlabConfigurationModal
            open={showSlabConfigModal}
            onOpenChange={setShowSlabConfigModal}
            onConfirm={handleSlabConfigConfirm}
            initialConfig={
              pendingSlabId
                ? shapes.find((s) => s.id === pendingSlabId)?.properties
                    ?.slabConfig
                : undefined
            }
          />

          <TransverseRibModal
            open={showRibModal}
            onOpenChange={(open) => {
              setShowRibModal(open)
              if (!open && !pendingRibConfig) setTool('select')
            }}
            onConfirm={handleRibConfigConfirm}
          />

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
