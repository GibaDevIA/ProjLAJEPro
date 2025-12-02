import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
  CloudUpload,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { generateSlabReportData, worldToScreen } from '@/lib/geometry'
import { Shape, ViewState } from '@/types/drawing'
import { updateProject, ProjectContent } from '@/services/projects'

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
    projectId,
    projectName,
  } = useDrawing()

  const { signOut } = useAuth()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // State for Rectangle Dimensions Panel
  const [rectWidth, setRectWidth] = useState('0.00')
  const [rectLength, setRectLength] = useState('0.00')

  // State for Move Object Panel
  const [moveDistance, setMoveDistance] = useState('0.10')

  // State for Saving
  const [isSaving, setIsSaving] = useState(false)

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

  const handleSaveProject = async () => {
    if (!projectId) {
      toast.error('Projeto não salvo no banco de dados. Use Exportar JSON.')
      return
    }

    setIsSaving(true)
    const content: ProjectContent = {
      shapes,
      view,
      version: '1.0',
      dateCreated: new Date().toISOString(),
      units: 'meters',
    }

    const { error } = await updateProject(projectId, { content })

    if (error) {
      toast.error('Erro ao salvar projeto: ' + error.message)
    } else {
      toast.success('Projeto salvo com sucesso!')
    }
    setIsSaving(false)
  }

  const handleExportJPG = () => {
    const svg = document.querySelector('#canvas-container svg') as SVGSVGElement
    if (!svg) return

    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svg)

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
    const clone = svg.cloneNode(true) as SVGSVGElement

    // Calculate Bounding Box of all shapes to Auto-Fit
    if (shapes.length > 0) {
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      let hasShapes = false
      shapes.forEach((s) => {
        if (s.points.length > 0) {
          hasShapes = true
          s.points.forEach((p) => {
            const screenP = worldToScreen(p, view)
            if (screenP.x < minX) minX = screenP.x
            if (screenP.y < minY) minY = screenP.y
            if (screenP.x > maxX) maxX = screenP.x
            if (screenP.y > maxY) maxY = screenP.y
          })
        }
      })

      if (hasShapes) {
        // Add padding
        const padding = 50
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
    }

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clone)

    // 2. Prepare Report Data
    const reportData = generateSlabReportData(shapes)
    const today = new Date().toLocaleDateString('pt-BR')

    // 3. Generate HTML for Slabs
    const slabsHtml = reportData
      .map((slab) => {
        const areaStr = slab.area.toFixed(2).replace('.', ',')

        // Vigotas Section
        let vigotasHtml = ''
        if (slab.vigotaCount > 0) {
          const listHtml = slab.vigotaDetails
            .map((d) => {
              const lenStr = d.length.replace('.', ',')
              const reinfHtml = d.reinforcementText
                .map(
                  (rt) => `
              <div style="font-size: 10px; color: #666; margin-left: 10px;">• ${rt}</div>
            `,
                )
                .join('')

              return `
              <div style="margin-bottom: 4px;">
                <strong>${d.count}x</strong> Vigotas de <strong>${lenStr}m</strong>
                ${reinfHtml}
              </div>
            `
            })
            .join('')

          vigotasHtml = `
            <div class="section-block">
              <div class="section-title">--- Vigotas ---</div>
              ${listHtml}
              <div style="margin-top: 6px; font-weight: bold; font-size: 11px;">
                Total de Vigotas: ${slab.vigotaCount} unidades
              </div>
            </div>
          `
        }

        // Nervuras Section
        let nervurasHtml = ''
        if (slab.ribsData && slab.ribsData.length > 0) {
          const listHtml = slab.ribsData
            .map((rib) => {
              const typeName =
                rib.channelType === 'plastic' ? 'Plástica' : 'Cerâmica'
              const totalLen = rib.totalLength.toFixed(2).replace('.', ',')
              const steelLen = rib.steelTotalLength.toFixed(2).replace('.', ',')

              return `
              <div style="margin-bottom: 6px;">
                <div><strong>${rib.count}x</strong> Nervuras (${typeName})</div>
                <ul style="margin: 2px 0 0 15px; padding: 0; list-style-type: disc; font-size: 10px; color: #444;">
                   <li>Total: ${totalLen}m</li>
                   <li>Canaletas: ${Math.ceil(rib.channelCount)} unidades</li>
                   <li>Aço (${rib.steelDiameter}mm): ${steelLen}m</li>
                </ul>
              </div>
            `
            })
            .join('')

          nervurasHtml = `
            <div class="section-block">
              <div class="section-title">--- Nervuras Transversais ---</div>
              ${listHtml}
            </div>
          `
        }

        // Aço Adicional Section
        let acoHtml = ''
        if (slab.reinforcementLines && slab.reinforcementLines.length > 0) {
          const listHtml = slab.reinforcementLines
            .map(
              (line) => `
             <div>• ${line}</div>
           `,
            )
            .join('')

          acoHtml = `
            <div class="section-block">
              <div class="section-title">--- Aço Adicional ---</div>
              <div style="font-size: 11px;">
                ${listHtml}
              </div>
            </div>
           `
        }

        // Enchimento Section
        let enchimentoHtml = ''
        if (
          slab.materialType !== 'concrete' &&
          slab.fillerCount &&
          slab.fillerCount > 0
        ) {
          enchimentoHtml = `
            <div class="section-block">
              <div class="section-title">--- Enchimento ---</div>
              <div style="font-size: 11px;">
                ${slab.material}: <strong>${slab.fillerCount} unidades</strong> (${slab.fillerType})
              </div>
            </div>
          `
        }

        return `
          <div class="slab-container">
             <div class="slab-header">--- Cômodo: ${slab.label} ---</div>
             <div class="slab-stats">
               <span><strong>Área Total:</strong> ${areaStr} m²</span>
               <span><strong>Tipo:</strong> ${slab.type}</span>
               <span><strong>Material:</strong> ${slab.material}</span>
             </div>
             
             <div class="slab-content">
                ${vigotasHtml}
                ${nervurasHtml}
                ${acoHtml}
                ${enchimentoHtml}
             </div>
          </div>
        `
      })
      .join('')

    // 4. Open Print Window
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Relatório de Materiais - ${projectName || 'ProjLAJE'}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
              
              @page { size: A4; margin: 15mm; }
              body { margin: 0; font-family: 'Inter', sans-serif; color: #1e293b; background: white; }
              
              .print-page {
                width: 100%;
                min-height: 95vh;
                position: relative;
                display: flex;
                flex-direction: column;
              }
              
              .page-break {
                page-break-before: always;
              }

              .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #0f172a;
                padding-bottom: 10px;
              }
              
              .header h1 {
                font-size: 24px;
                font-weight: 800;
                margin: 0;
                text-transform: uppercase;
                color: #0f172a;
              }
              
              .header p {
                font-size: 12px;
                color: #64748b;
                margin: 5px 0 0 0;
              }

              /* Page 1 - Visualization */
              .drawing-container {
                flex: 1;
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 10px;
              }

              /* Page 2+ - Report */
              .report-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                align-items: start;
              }
              
              @media print {
                 .report-grid { display: block; } /* Fallback for cleaner print sometimes */
                 .slab-container { break-inside: avoid; margin-bottom: 20px; }
              }

              .slab-container {
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 20px;
                background-color: #f8fafc;
              }

              .slab-header {
                font-size: 14px;
                font-weight: 700;
                text-align: center;
                margin-bottom: 10px;
                color: #0f172a;
                text-transform: uppercase;
                border-bottom: 1px dashed #cbd5e1;
                padding-bottom: 5px;
              }

              .slab-stats {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                margin-bottom: 15px;
                background: white;
                padding: 8px;
                border-radius: 4px;
                border: 1px solid #e2e8f0;
              }

              .section-block {
                margin-bottom: 12px;
                font-size: 11px;
              }

              .section-title {
                font-size: 11px;
                font-weight: 700;
                color: #334155;
                margin-bottom: 4px;
                text-decoration: underline;
                text-decoration-color: #cbd5e1;
              }
            </style>
          </head>
          <body>
            <!-- Page 1: Drawing -->
            <div class="print-page">
              <div class="header">
                <h1>Projeto: ${projectName || 'Sem Nome'}</h1>
                <p>Croqui de Montagem - Gerado em ${today}</p>
              </div>
              <div class="drawing-container">
                ${svgString}
              </div>
            </div>

            <!-- Page 2+: Report -->
            <div class="page-break">
               <div class="header">
                <h1>Relatório de Materiais</h1>
                <p>Detalhamento por Cômodo</p>
              </div>
              
              <div class="report-content">
                ${slabsHtml || '<p style="text-align:center; color: #666;">Nenhum cômodo encontrado neste projeto.</p>'}
              </div>
            </div>

            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  // window.close(); // Optional: close after print
                }, 800);
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

  const handleConfirmRectangle = async () => {
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

    const success = await addRectangle(start, endPoint)
    if (success) {
      setDrawingStart(null)
      setTool('select')
      toast.success('Laje criada com sucesso.')
    } else {
      // Error message handled inside addRectangle if limit reached, or generic here
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
        {projectName && (
          <div className="bg-primary/5 p-3 rounded border border-primary/10">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Projeto
            </p>
            <p className="font-bold text-primary truncate">{projectName}</p>
          </div>
        )}

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
            {projectId && (
              <Button
                variant="default"
                className="justify-start"
                onClick={handleSaveProject}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CloudUpload className="mr-2 h-4 w-4" />
                )}
                Salvar
              </Button>
            )}

            <Button
              variant="outline"
              className="justify-start bg-white"
              onClick={exportToJSON}
            >
              <Save className="mr-2 h-4 w-4" />
              Exportar JSON
            </Button>
            <Button
              variant="outline"
              className="justify-start bg-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Importar JSON
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
              Relatório PDF
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

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start bg-white"
            asChild
          >
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Button>
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
