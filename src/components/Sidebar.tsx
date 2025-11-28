import React, { useState, useEffect } from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ZoomIn,
  ZoomOut,
  Save,
  FolderOpen,
  Grid3X3,
  Trash2,
  ArrowUpRight,
  FileText,
  FileImage,
  Square,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  calculatePolygonArea,
  isWorldPointInShape,
  calculateVigotaLengths,
} from '@/lib/geometry'
import { Shape, ViewState } from '@/types/drawing'

export const Sidebar: React.FC = () => {
  const {
    tool,
    setTool,
    view,
    setView,
    gridVisible,
    setGridVisible,
    exportToJSON,
    loadFromJSON,
    setShapes,
    drawingStart,
    setDrawingStart,
    addRectangle,
    shapes,
    activeShapeId,
    updateShape,
  } = useDrawing()

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // State for Rectangle Dimensions Panel
  const [rectWidth, setRectWidth] = useState('0.00')
  const [rectLength, setRectLength] = useState('0.00')

  // State for Move Object Panel
  const [moveDistance, setMoveDistance] = useState('0.10')

  useEffect(() => {
    if (tool === 'rectangle') {
      setRectWidth('0.00')
      setRectLength('0.00')
    }
  }, [tool])

  const handleZoom = (delta: number) => {
    setView((prev) => ({
      ...prev,
      scale: Math.max(1, prev.scale + delta),
    }))
  }

  const generateReportSVG = (
    currentShapes: Shape[],
    currentView: ViewState,
    svgWidth: number,
    svgHeight: number,
  ) => {
    const slabs = currentShapes.filter(
      (s) => s.type === 'rectangle' || s.type === 'polygon',
    )
    if (slabs.length === 0) return ''

    // Calculate Total Area
    const totalArea = slabs.reduce((acc, s) => {
      const area = s.properties?.area || calculatePolygonArea(s.points)
      return acc + area
    }, 0)

    // Prepare data for the report
    const reportData = slabs.map((slab, index) => {
      const area = slab.properties?.area || calculatePolygonArea(slab.points)
      const label = slab.properties?.label || `Laje ${index + 1}`
      const type = slab.properties?.slabConfig?.type || '-'
      const material =
        slab.properties?.slabConfig?.material === 'ceramic'
          ? 'Cerâmica'
          : slab.properties?.slabConfig?.material === 'eps'
            ? 'EPS'
            : '-'

      // Find associated joist arrow
      const joistArrow = currentShapes.find(
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

      let vigotaSummary = ''
      let vigotaCount = 0

      if (joistArrow && slab.properties?.slabConfig) {
        const lengths = calculateVigotaLengths(slab, joistArrow)
        vigotaCount = lengths.length

        const groups: Record<string, number> = {}

        if (slab.type === 'polygon') {
          // Polygon: Round up to nearest integer
          lengths.forEach((l) => {
            const rounded = Math.ceil(Number(l.toFixed(4)))
            const key = rounded.toString()
            groups[key] = (groups[key] || 0) + 1
          })
        } else {
          // Rectangle: Exact value (2 decimals)
          lengths.forEach((l) => {
            const val = l.toFixed(2)
            groups[val] = (groups[val] || 0) + 1
          })
        }

        // Format summary
        const sortedLengths = Object.keys(groups).sort(
          (a, b) => Number(b) - Number(a),
        )
        vigotaSummary = sortedLengths
          .map((len) => `${groups[len]}x ${len}m`)
          .join(', ')
      }

      return {
        label,
        area,
        type,
        material,
        vigotaCount,
        vigotaSummary,
      }
    })

    const tableWidth = 350
    const padding = 15
    const lineHeight = 18
    const headerHeight = 30
    const footerHeight = 30
    const rowSpacing = 10

    // Calculate total height dynamically
    let contentHeight = headerHeight
    reportData.forEach((data) => {
      contentHeight += lineHeight // First line (Label, Area, Type)
      if (data.vigotaSummary) {
        contentHeight += lineHeight // Second line (Vigotas)
      }
      contentHeight += rowSpacing
    })
    contentHeight += footerHeight + padding * 2

    // Position in bottom-right corner
    const x = svgWidth - tableWidth - 20
    const y = svgHeight - contentHeight - 20

    let svgContent = `
        <g transform="translate(${x}, ${y})">
          <rect width="${tableWidth}" height="${contentHeight}" fill="white" stroke="#e2e8f0" rx="4" />
          <text x="${padding}" y="${20}" font-family="Inter, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">Relatório de Lajes</text>
          <line x1="0" y1="${headerHeight}" x2="${tableWidth}" y2="${headerHeight}" stroke="#e2e8f0" />
      `

    let currentY = headerHeight + 15

    reportData.forEach((data) => {
      const displayLabel =
        data.vigotaCount > 0
          ? `${data.label} (${data.vigotaCount}vt)`
          : data.label

      // Row 1: Label | Area | Type
      svgContent += `
          <text x="${padding}" y="${currentY}" font-family="Inter, sans-serif" font-size="12" font-weight="bold" fill="#334155">${displayLabel}</text>
          <text x="${120}" y="${currentY}" font-family="Inter, sans-serif" font-size="12" fill="#334155">${data.area.toFixed(2)}m²</text>
          <text x="${200}" y="${currentY}" font-family="Inter, sans-serif" font-size="12" fill="#334155">${data.type} ${data.material}</text>
        `
      currentY += lineHeight

      // Row 2: Vigotas details
      if (data.vigotaSummary) {
        svgContent += `
            <text x="${padding}" y="${currentY}" font-family="Inter, sans-serif" font-size="11" fill="#64748b">Vigotas: ${data.vigotaSummary}</text>
          `
        currentY += lineHeight
      }

      // Separator line (optional, or just spacing)
      currentY += rowSpacing
    })

    // Add Total Section
    const totalYPos = contentHeight - padding
    svgContent += `
          <line x1="0" y1="${totalYPos - 25}" x2="${tableWidth}" y2="${totalYPos - 25}" stroke="#e2e8f0" />
          <text x="${padding}" y="${totalYPos}" font-family="Inter, sans-serif" font-size="12" font-weight="bold" fill="#0f172a">Total Geral</text>
          <text x="${120}" y="${totalYPos}" font-family="Inter, sans-serif" font-size="12" font-weight="bold" fill="#0f172a">${totalArea.toFixed(2)}m²</text>
      `

    svgContent += `</g>`
    return svgContent
  }

  const handleExportJPG = () => {
    const svg = document.querySelector('#canvas-container svg') as SVGSVGElement
    if (!svg) return

    const serializer = new XMLSerializer()
    let source = serializer.serializeToString(svg)

    // Inject Report
    const reportSVG = generateReportSVG(
      shapes,
      view,
      svg.clientWidth,
      svg.clientHeight,
    )
    source = source.replace('</svg>', `${reportSVG}</svg>`)

    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = svg.clientWidth
      canvas.height = svg.clientHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        const jpgUrl = canvas.toDataURL('image/jpeg', 0.9)
        const a = document.createElement('a')
        a.href = jpgUrl
        a.download = 'planta.jpg'
        a.click()
        toast.success('Imagem JPG exportada!')
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  const handleExportPDF = () => {
    const svg = document.querySelector('#canvas-container svg') as SVGSVGElement
    if (!svg) return

    const serializer = new XMLSerializer()
    let source = serializer.serializeToString(svg)

    // Inject Report
    const reportSVG = generateReportSVG(
      shapes,
      view,
      svg.clientWidth,
      svg.clientHeight,
    )
    source = source.replace('</svg>', `${reportSVG}</svg>`)

    // Open new window for printing
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
          <html>
            <head>
              <title>Planta - ProjeLAJE</title>
              <style>
                @page { size: landscape; margin: 0; }
                body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                svg { width: 100%; height: 100%; max-height: 100vh; }
              </style>
            </head>
            <body>
              ${source}
              <script>
                window.onload = () => {
                  window.print();
                  window.onafterprint = () => window.close();
                }
              </script>
            </body>
          </html>
        `)
      printWindow.document.close()
    } else {
      toast.error('Permita popups para exportar PDF.')
    }
  }

  const handleClearAll = () => {
    if (confirm('Tem certeza que deseja apagar tudo?')) {
      setShapes([])
      toast.success('Desenho limpo.')
    }
  }

  const handleConfirmRectangle = () => {
    // Use drawingStart or default to origin (0,0) if not set
    const start = drawingStart || { x: 0, y: 0 }

    // Handle comma as decimal separator
    const w = parseFloat(rectWidth.replace(',', '.'))
    const h = parseFloat(rectLength.replace(',', '.'))

    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0) {
      toast.error('Dimensões inválidas.')
      return
    }

    // Create rectangle assuming positive direction from start point
    const endPoint = {
      x: start.x + w,
      y: start.y + h,
    }

    const success = addRectangle(start, endPoint)
    if (success) {
      setDrawingStart(null)
      setTool('select')
      toast.success('Laje criada com sucesso.')
    } else {
      toast.error('Erro ao criar laje. Verifique as dimensões.')
    }
  }

  const handleCancelRectangle = () => {
    setDrawingStart(null)
    setTool('select')
  }

  const handleMoveShape = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!activeShapeId) return
    const shape = shapes.find((s) => s.id === activeShapeId)
    if (!shape) return

    const dist = parseFloat(moveDistance.replace(',', '.'))
    if (isNaN(dist) || dist === 0) {
      toast.error('Distância inválida')
      return
    }

    let dx = 0
    let dy = 0

    switch (direction) {
      case 'up':
        dy = -dist
        break
      case 'down':
        dy = dist
        break
      case 'left':
        dx = -dist
        break
      case 'right':
        dx = dist
        break
    }

    const newPoints = shape.points.map((p) => ({
      x: p.x + dx,
      y: p.y + dy,
    }))

    updateShape(activeShapeId, { points: newPoints })
  }

  return (
    <ScrollArea className="h-full w-full bg-white border-r border-border no-print">
      <div className="p-4 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Ferramentas</h2>
          <p className="text-sm text-muted-foreground">Opções Adicionais</p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button
            variant={tool === 'rectangle' ? 'default' : 'outline'}
            className="justify-start"
            onClick={() => setTool('rectangle')}
          >
            <Square className="mr-2 h-4 w-4" />
            Lançar Laje
          </Button>
          <Button
            variant={tool === 'slab_joist' ? 'default' : 'outline'}
            className="justify-start"
            onClick={() => setTool('slab_joist')}
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Lançar Vigota
          </Button>
        </div>

        {tool === 'rectangle' && (
          <div className="p-4 border rounded-md bg-gray-50 space-y-4 animate-fade-in">
            <h3 className="font-medium text-sm">Definir Dimensões</h3>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="rect-width" className="text-xs">
                  Largura (m)
                </Label>
                <Input
                  id="rect-width"
                  type="number"
                  step="0.01"
                  min="0"
                  value={rectWidth}
                  onChange={(e) => setRectWidth(e.target.value)}
                  className="h-8 text-sm bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rect-length" className="text-xs">
                  Comprimento (m)
                </Label>
                <Input
                  id="rect-length"
                  type="number"
                  step="0.01"
                  min="0"
                  value={rectLength}
                  onChange={(e) => setRectLength(e.target.value)}
                  className="h-8 text-sm bg-white"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleCancelRectangle}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleConfirmRectangle}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}

        {activeShapeId && (
          <div className="p-4 border rounded-md bg-gray-50 space-y-4 animate-fade-in">
            <h3 className="font-medium text-sm">Mover Seleção</h3>
            <div className="space-y-2">
              <Label htmlFor="move-dist" className="text-xs">
                Distância (m)
              </Label>
              <Input
                id="move-dist"
                type="number"
                step="0.01"
                min="0"
                value={moveDistance}
                onChange={(e) => setMoveDistance(e.target.value)}
                className="h-8 text-sm bg-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 justify-items-center">
              <div />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMoveShape('up')}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <div />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMoveShape('left')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMoveShape('down')}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMoveShape('right')}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Visualização</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleZoom(10)}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleZoom(-10)}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant={gridVisible ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setGridVisible(!gridVisible)}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <Label>Escala (px/m)</Label>
            <Input
              type="number"
              value={Math.round(view.scale)}
              onChange={(e) =>
                setView((prev) => ({ ...prev, scale: Number(e.target.value) }))
              }
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Arquivo</h3>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={exportToJSON}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar JSON
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Abrir JSON
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={(e) => {
                if (e.target.files?.[0]) loadFromJSON(e.target.files[0])
              }}
            />
            <Button
              variant="outline"
              className="justify-start"
              onClick={handleExportJPG}
            >
              <FileImage className="mr-2 h-4 w-4" />
              Exportar JPG
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={handleExportPDF}
            >
              <FileText className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button
              variant="destructive"
              className="justify-start"
              onClick={handleClearAll}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar Tudo
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
