import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react'
import {
  Shape,
  ViewState,
  ToolType,
  Point,
  TransverseRibConfig,
} from '@/types/drawing'
import { findClosedCycle, calculatePolygonArea } from '@/lib/geometry'
import { generateId } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { checkProjectLimit } from '@/services/subscription'
import { toast } from 'sonner'

interface DrawingContextType {
  shapes: Shape[]
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
  addShape: (shape: Shape) => void
  addPolygon: (points: Point[]) => void
  updateShape: (id: string, updates: Partial<Shape>) => void
  removeShape: (id: string) => void
  view: ViewState
  setView: React.Dispatch<React.SetStateAction<ViewState>>
  tool: ToolType
  setTool: (tool: ToolType) => void
  activeShapeId: string | null
  setActiveShapeId: (id: string | null) => void
  gridVisible: boolean
  setGridVisible: (visible: boolean) => void
  resetView: () => void
  exportToJSON: () => void
  loadFromJSON: (file: File) => void
  checkAndMergeLines: () => boolean
  drawingStart: Point | null
  setDrawingStart: React.Dispatch<React.SetStateAction<Point | null>>
  addRectangle: (start: Point, end: Point) => Promise<boolean>
  orthoMode: boolean
  setOrthoMode: (enabled: boolean) => void
  projectId: string | null
  setProjectId: (id: string | null) => void
  projectName: string | null
  setProjectName: (name: string | null) => void
  isLoadingProject: boolean
  setIsLoadingProject: (loading: boolean) => void
  checkLimits: () => Promise<boolean>
  pendingRibConfig: TransverseRibConfig | null
  setPendingRibConfig: React.Dispatch<
    React.SetStateAction<TransverseRibConfig | null>
  >
  colorBySlabType: boolean
  setColorBySlabType: (enabled: boolean) => void
}

const DrawingContext = createContext<DrawingContextType | undefined>(undefined)

export const DrawingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [shapes, setShapes] = useState<Shape[]>([])
  const [view, setView] = useState<ViewState>({
    scale: 50,
    offset: { x: 0, y: 0 },
  })
  const [tool, setTool] = useState<ToolType>('select')
  const [activeShapeId, setActiveShapeId] = useState<string | null>(null)
  const [gridVisible, setGridVisible] = useState(true)
  const [drawingStart, setDrawingStart] = useState<Point | null>(null)
  const [orthoMode, setOrthoMode] = useState(false)
  const [colorBySlabType, setColorBySlabType] = useState(false)

  // Rib Configuration State
  const [pendingRibConfig, setPendingRibConfig] =
    useState<TransverseRibConfig | null>(null)

  // Project State
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState<string | null>(null)
  const [isLoadingProject, setIsLoadingProject] = useState(false)

  const [panosCount, setPanosCount] = useState(0)

  useEffect(() => {
    const count = shapes.filter(
      (s) => s.type === 'rectangle' || s.type === 'polygon',
    ).length
    setPanosCount(count)
  }, [shapes])

  const checkLimits = useCallback(async () => {
    if (!user) return true // Should be authenticated
    const currentCount = shapes.filter(
      (s) => s.type === 'rectangle' || s.type === 'polygon',
    ).length
    const { allowed, limit } = await checkProjectLimit(user.id, currentCount)

    if (!allowed) {
      toast.error(
        `Limite de ${limit} panos atingido neste plano. Atualize para Profissional.`,
      )
      return false
    }
    return true
  }, [user, shapes])

  const addShape = useCallback((shape: Shape) => {
    setShapes((prev) => [...prev, shape])
  }, [])

  const updateShape = useCallback((id: string, updates: Partial<Shape>) => {
    setShapes((prev) =>
      prev.map((shape) => (shape.id === id ? { ...shape, ...updates } : shape)),
    )
  }, [])

  const removeShape = useCallback(
    (id: string) => {
      setShapes((prev) => prev.filter((s) => s.id !== id))
      if (activeShapeId === id) setActiveShapeId(null)
    },
    [activeShapeId],
  )

  const resetView = useCallback(() => {
    setView({
      scale: 50,
      offset: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    })
  }, [])

  const exportToJSON = useCallback(() => {
    const data = {
      version: '1.0',
      dateCreated: new Date().toISOString(),
      units: 'meters',
      shapes,
      view,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName || 'croqui'}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [shapes, view, projectName])

  const loadFromJSON = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        if (data.shapes && Array.isArray(data.shapes)) {
          setShapes(data.shapes)
        }
        if (data.view) {
          setView(data.view)
        }
      } catch (error) {
        console.error('Failed to parse JSON', error)
        alert('Erro ao carregar arquivo. Formato inválido.')
      }
    }
    reader.readAsText(file)
  }, [])

  const getNextSlabLabel = (currentShapes: Shape[]) => {
    const slabs = currentShapes.filter(
      (s) => s.type === 'rectangle' || s.type === 'polygon',
    )
    const existingNumbers = slabs.map((s) => {
      const match = s.properties?.label?.match(/^L(\d+)$/)
      return match ? parseInt(match[1], 10) : 0
    })
    const nextNumber =
      existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
    return `L${nextNumber}`
  }

  const checkAndMergeLines = useCallback(async () => {
    // Check limits before merging (creating a polygon)
    if (!(await checkLimits())) return false

    const lines = shapes.filter((s) => s.type === 'line')
    const cycle = findClosedCycle(lines)

    if (cycle) {
      setShapes((prev) => {
        const label = getNextSlabLabel(prev)
        const newPolygon: Shape = {
          id: generateId(),
          type: 'polygon',
          points: cycle.points,
          properties: {
            area: calculatePolygonArea(cycle.points),
            label: label,
          },
        }
        const remaining = prev.filter((s) => !cycle.lineIds.includes(s.id))
        setTimeout(() => setActiveShapeId(newPolygon.id), 0)
        return [...remaining, newPolygon]
      })

      return true
    }
    return false
  }, [shapes, checkLimits])

  const addRectangle = useCallback(
    async (start: Point, end: Point) => {
      // Check limits first
      if (!(await checkLimits())) return false

      const width = Math.abs(end.x - start.x)
      const height = Math.abs(end.y - start.y)

      if (width >= 0.01 && height >= 0.01) {
        setShapes((prev) => {
          const label = getNextSlabLabel(prev)
          const newShape: Shape = {
            id: generateId(),
            type: 'rectangle',
            points: [
              start,
              { x: end.x, y: start.y },
              end,
              { x: start.x, y: end.y },
            ],
            properties: {
              width,
              height,
              label,
              area: width * height,
            },
          }
          return [...prev, newShape]
        })
        return true
      }
      return false
    },
    [checkLimits],
  )

  const addPolygon = useCallback(
    async (points: Point[]) => {
      if (!(await checkLimits())) return

      setShapes((prev) => {
        const label = getNextSlabLabel(prev)
        const newShape: Shape = {
          id: generateId(),
          type: 'polygon',
          points,
          properties: {
            area: calculatePolygonArea(points),
            label,
          },
        }
        return [...prev, newShape]
      })
    },
    [checkLimits],
  )

  return (
    <DrawingContext.Provider
      value={{
        shapes,
        setShapes,
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
        setGridVisible,
        resetView,
        exportToJSON,
        loadFromJSON,
        checkAndMergeLines,
        drawingStart,
        setDrawingStart,
        addRectangle,
        orthoMode,
        setOrthoMode,
        projectId,
        setProjectId,
        projectName,
        setProjectName,
        isLoadingProject,
        setIsLoadingProject,
        checkLimits,
        pendingRibConfig,
        setPendingRibConfig,
        colorBySlabType,
        setColorBySlabType,
      }}
    >
      {children}
    </DrawingContext.Provider>
  )
}

export const useDrawing = () => {
  const context = useContext(DrawingContext)
  if (!context) {
    throw new Error('useDrawing must be used within a DrawingProvider')
  }
  return context
}
