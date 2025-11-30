import React, { useState, useEffect } from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { useAuth } from '@/context/AuthContext'
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
  FileText,
  FileImage,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  LogOut,
} from 'lucide-react'
import { toast } from 'sonner'
import { generateSlabReportData, worldToScreen } from '@/lib/geometry'
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
    removeShape,
  } = useDrawing()

  const { signOut } = useAuth()

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
    const reportData = generateSlabReportData(currentShapes)
    if (reportData.length === 0) return ''

    const totalArea = reportData.reduce((acc, item) => acc + item.area, 0)

    // Grid Layout Configuration
    const columns = Math.min(reportData.length, 3)
    const cellWidth = 220
    const cellPadding = 10
    const cellGap = 10
    const headerHeight = 30
    const footerHeight = 30
    const titleHeight = 30

    const getRowHeight = (startIndex: number, count: number) => {
      let maxH = 100 // Base height
      for (let i = 0; i < count; i++) {
        if (startIndex + i < reportData.length) {
          const item = reportData[startIndex + i]
          const summaryLines = Math.ceil((item.vigotaSummary.length || 1) / 30)
          let itemH = 80 + summaryLines * 15
          if (item.hasExtraVigotas) itemH += 15 // Extra space for note
          if (itemH > maxH) maxH = itemH
        }
      }
      return maxH
    }

    const rows = Math.ceil(reportData.length / 3)
    let totalContentHeight = titleHeight + footerHeight + (rows - 1) * cellGap

    const rowHeights: number[] = []
    for (let r = 0; r < rows; r++) {
      const h = getRowHeight(r * 3, 3)
      rowHeights.push(h)
      totalContentHeight += h
    }

    // Total Table Size
    const tableWidth =
      columns * cellWidth + (columns > 0 ? (columns - 1) * cellGap : 0)
    const tableHeight = totalContentHeight + 20 // + padding

    // Position Bottom Right
    const x = svgWidth - tableWidth - 20
    const y = svgHeight - tableHeight - 20

    let svgContent = `
                <g transform="translate(${x}, ${y})">
                  <!-- Background -->
                  <rect width="${tableWidth}" height="${tableHeight}" fill="white" stroke="#e2e8f0" rx="4" filter="drop-shadow(0 4px 6px rgb(0 0 0 / 0.1))" />
                  
                  <!-- Title -->
                  <text x="${10}" y="${20}" font-family="Inter, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">Descritivo dos Materiais</text>
                  <line x1="0" y1="${titleHeight}" x2="${tableWidth}" y2="${titleHeight}" stroke="#e2e8f0" />
              `

    let currentY = titleHeight + 10

    for (let r = 0; r < rows; r++) {
      const rowH = rowHeights[r]
      for (let c = 0; c < 3; c++) {
        const index = r * 3 + c
        if (index >= reportData.length) break

        const item = reportData[index]
        const cellX = c * (cellWidth + cellGap)

        // Cell Group
        svgContent += `<g transform="translate(${cellX}, ${currentY})">`

        // Item Label & Area
        svgContent += `
                    <rect x="0" y="0" width="${cellWidth}" height="${rowH}" fill="#f8fafc" rx="4" stroke="#f1f5f9" />
                    <text x="${10}" y="${20}" font-family="Inter, sans-serif" font-size="12" font-weight="bold" fill="#334155">${item.label}</text>
                    <text x="${cellWidth - 10}" y="${20}" text-anchor="end" font-family="Inter, sans-serif" font-size="12" font-weight="bold" fill="#334155">${item.area.toFixed(2)}m²</text>
                    <line x1="5" y1="28" x2="${cellWidth - 5}" y2="28" stroke="#e2e8f0" />
                  `

        // Details
        let detailY = 45
        svgContent += `
                    <text x="${10}" y="${detailY}" font-family="Inter, sans-serif" font-size="11" fill="#475569">Tipo: ${item.type} | ${item.material}</text>
                  `
        detailY += 15

        if (item.vigotaCount > 0) {
          svgContent += `
                      <text x="${10}" y="${detailY}" font-family="Inter, sans-serif" font-size="11" font-weight="bold" fill="#475569">Vigotas (${item.vigotaCount}):</text>
                    `
          detailY += 15

          // Wrap text logic for SVG is manual
          const words = item.vigotaSummary.split(' ')
          let line = ''
          words.forEach((word) => {
            if ((line + word).length > 32) {
              svgContent += `<text x="${10}" y="${detailY}" font-family="Inter, sans-serif" font-size="10" fill="#64748b">${line}</text>`
              line = word + ' '
              detailY += 12
            } else {
              line += word + ' '
            }
          })
          if (line) {
            svgContent += `<text x="${10}" y="${detailY}" font-family="Inter, sans-serif" font-size="10" fill="#64748b">${line}</text>`
            detailY += 12
          }

          if (item.hasExtraVigotas) {
            svgContent += `<text x="${10}" y="${detailY}" font-family="Inter, sans-serif" font-size="10" fill="#d97706" font-style="italic">* ${item.extraVigotaCount} Vigotas extra adicionadas</text>`
          }
        } else {
          svgContent += `
                      <text x="${10}" y="${detailY}" font-family="Inter, sans-serif" font-size="10" fill="#d97706" font-style="italic">Sem vigotas definidas</text>
                    `
        }

        svgContent += `</g>`
      }
      currentY += rowH + cellGap
    }

    // Footer (Total)
    const footerY = tableHeight - footerHeight + 20
    svgContent += `
                  <line x1="0" y1="${tableHeight - footerHeight}" x2="${tableWidth}" y2="${tableHeight - footerHeight}" stroke="#e2e8f0" />
                  <text x="${10}" y="${footerY}" font-family="Inter, sans-serif" font-size="12" font-weight="bold" fill="#0f172a">Total Geral</text>
                  <text x="${tableWidth - 10}" y="${footerY}" text-anchor="end" font-family="Inter, sans-serif" font-size="12" font-weight="bold" fill="#0f172a">${totalArea.toFixed(2)}m²</text>
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

    // 1. Prepare Drawing (Page 1)
    // Clone the SVG to manipulate it for printing without affecting the UI
    const clone = svg.cloneNode(true) as SVGSVGElement

    // Calculate Bounding Box of all shapes to Auto-Fit
    if (shapes.length > 0) {
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      shapes.forEach((s) => {
        s.points.forEach((p) => {
          const screenP = worldToScreen(p, view)
          if (screenP.x < minX) minX = screenP.x
          if (screenP.y < minY) minY = screenP.y
          if (screenP.x > maxX) maxX = screenP.x
          if (screenP.y > maxY) maxY = screenP.y
        })
      })

      // Add padding
      const padding = 40
      const width = maxX - minX + padding * 2
      const height = maxY - minY + padding * 2

      // Set viewBox to the bounding box of the content
      clone.setAttribute(
        'viewBox',
        `${minX - padding} ${minY - padding} ${width} ${height}`,
      )
      clone.style.width = '100%'
      clone.style.height = '100%'
      clone.removeAttribute('width')
      clone.removeAttribute('height')
    }

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clone)

    // 2. Prepare Report (Page 2)
    const reportData = generateSlabReportData(shapes)
    const totalArea = reportData.reduce((acc, item) => acc + item.area, 0)

    const reportRows = reportData
      .map(
        (item) => `
              <tr>
                <td>${item.label}</td>
                <td>${item.area.toFixed(2)} m²</td>
                <td>${item.type}</td>
                <td>${item.material === 'ceramic' ? 'Cerâmica' : item.material === 'eps' ? 'EPS' : item.material}</td>
                <td>${item.vigotaCount}</td>
                <td>
                  ${item.vigotaSummary || '-'}
                  ${item.hasExtraVigotas ? `<br/><span style="color: #d97706; font-style: italic; font-size: 10px;">* ${item.extraVigotaCount} Vigotas extra adicionadas</span>` : ''}
                </td>
              </tr>
            `,
      )
      .join('')

    const reportHTML = `
              <div class="print-page page-break">
                <div class="header">Descritivo dos Materiais</div>
                <div class="report-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Elemento</th>
                        <th>Área</th>
                        <th>Tipo</th>
                        <th>Material</th>
                        <th>Qtd. Vigotas</th>
                        <th>Detalhe Vigotas</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${reportRows}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="1" style="font-weight:bold">Total Geral</td>
                        <td style="font-weight:bold">${totalArea.toFixed(2)} m²</td>
                        <td colspan="4"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            `

    // 3. Open Print Window
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
                <html>
                  <head>
                    <title>Projeto - ProjLAJE</title>
                    <style>
                      @page { size: landscape; margin: 0; }
                      body { margin: 0; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                      
                      .print-page {
                        width: 100vw;
                        height: 100vh;
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        padding: 20px;
                        box-sizing: border-box;
                      }
                      
                      .page-break {
                        page-break-before: always;
                      }
        
                      .header {
                        text-align: center;
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        padding-bottom: 10px;
                        border-bottom: 2px solid #0f172a;
                        text-transform: uppercase;
                        color: #0f172a;
                      }
        
                      .drawing-container {
                        flex: 1;
                        width: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        overflow: hidden;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                      }
        
                      /* Report Table Styles */
                      .report-container {
                        width: 100%;
                        margin-top: 20px;
                      }
                      table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 12px;
                      }
                      th, td {
                        border: 1px solid #e2e8f0;
                        padding: 8px 12px;
                        text-align: left;
                        color: #334155;
                      }
                      th {
                        background-color: #f8fafc;
                        font-weight: bold;
                        color: #0f172a;
                      }
                      tr:nth-child(even) {
                        background-color: #f8fafc;
                      }
                      tfoot td {
                        background-color: #f1f5f9;
                        border-top: 2px solid #cbd5e1;
                        color: #0f172a;
                      }
                    </style>
                  </head>
                  <body>
                    <!-- Page 1: Drawing -->
                    <div class="print-page">
                      <div class="header">Croqui de Montagem Laje</div>
                      <div class="drawing-container">
                        ${svgString}
                      </div>
                    </div>
        
                    <!-- Page 2: Report -->
                    ${reportHTML}
        
                    <script>
                      window.onload = () => {
                        setTimeout(() => {
                          window.print();
                          window.onafterprint = () => window.close();
                        }, 500);
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

  const handleLogout = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        toast.error('Erro ao sair: ' + error.message)
      } else {
        toast.success('Saiu com sucesso')
      }
    } catch (e) {
      toast.error('Erro inesperado ao sair')
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
    <ScrollArea className="h-full w-full bg-gradient-to-b from-gray-50 to-gray-100 border-r border-border no-print">
      <div className="p-4 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Ferramentas</h2>
          <p className="text-sm text-muted-foreground">Opções Adicionais</p>
        </div>

        {tool === 'rectangle' && (
          <div className="p-4 border rounded-md bg-white/50 space-y-4 animate-fade-in">
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
          <div className="p-4 border rounded-md bg-white/50 space-y-4 animate-fade-in">
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
                className="h-8 w-8 bg-white"
                onClick={() => handleMoveShape('up')}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <div />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white"
                onClick={() => handleMoveShape('left')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white"
                onClick={() => handleMoveShape('down')}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white"
                onClick={() => handleMoveShape('right')}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full mt-2"
              onClick={() => activeShapeId && removeShape(activeShapeId)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Visualização</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-white"
              onClick={() => handleZoom(10)}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-white"
              onClick={() => handleZoom(-10)}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant={gridVisible ? 'secondary' : 'outline'}
              size="icon"
              className={gridVisible ? '' : 'bg-white'}
              onClick={() => setGridVisible(!gridVisible)}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <Label>Escala (px/m)</Label>
            <Input
              type="number"
              className="bg-white"
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
              className="justify-start bg-white"
              onClick={exportToJSON}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar JSON
            </Button>
            <Button
              variant="outline"
              className="justify-start bg-white"
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
              className="justify-start bg-white"
              onClick={handleExportJPG}
            >
              <FileImage className="mr-2 h-4 w-4" />
              Exportar JPG
            </Button>
            <Button
              variant="outline"
              className="justify-start bg-white"
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

        <Separator />

        <div className="space-y-4">
          <Button
            variant="secondary"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}
