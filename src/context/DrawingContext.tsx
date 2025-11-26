import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { Shape, ViewState, ToolType } from '@/types/drawing'

interface DrawingContextType {
  shapes: Shape[]
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>
  addShape: (shape: Shape) => void
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
}

const DrawingContext = createContext<DrawingContextType | undefined>(undefined)

export const DrawingProvider = ({ children }: { children: ReactNode }) => {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [view, setView] = useState<ViewState>({
    scale: 50,
    offset: { x: 0, y: 0 },
  })
  const [tool, setTool] = useState<ToolType>('select')
  const [activeShapeId, setActiveShapeId] = useState<string | null>(null)
  const [gridVisible, setGridVisible] = useState(true)

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
    a.download = `croqui-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [shapes, view])

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

  return (
    <DrawingContext.Provider
      value={{
        shapes,
        setShapes,
        addShape,
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
