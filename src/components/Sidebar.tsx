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
import { ProjectContent, updateProject } from '@/services/projects'

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

    // 1. Prepare Drawing (Page 1) - Landscape
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

    // 3. Generate HTML for Table Rows
    const rowsHtml = reportData
      .map((slab) => {
        const areaStr = slab.area.toFixed(2).replace('.', ',')

        // Column 1: Basic Info
        const basicInfoHtml = `
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px; color: #0f172a;">${slab.label}</div>
          <div style="font-size: 10px; color: #334155;">
            <div><strong>Área Total:</strong> ${areaStr} m²</div>
            <div><strong>Tipo:</strong> ${slab.type}</div>
            <div><strong>Material:</strong> ${slab.material}</div>
          </div>
        `

        // Column 2: Vigotas
        let vigotasHtml = ''
        if (slab.vigotaCount > 0) {
          const detailsHtml = slab.vigotaDetails
            .map((d) => {
              const lenStr = d.length.replace('.', ',')
              const reinfHtml = d.reinforcementText
                .map((rt) => `<div style="color: #64748b;">• ${rt}</div>`)
                .join('')

              return `
              <div style="margin-bottom: 4px;">
                <strong>${d.count}x</strong> Vigotas de <strong>${lenStr}m</strong>
                <div style="font-size: 9px; margin-left: 6px;">${reinfHtml}</div>
              </div>
            `
            })
            .join('')

          vigotasHtml = `
            ${detailsHtml}
            <div style="margin-top: 6px; font-weight: bold; font-size: 10px; border-top: 1px dashed #cbd5e1; padding-top: 2px;">
              Total: ${slab.vigotaCount} unidades
            </div>
          `
        } else {
          vigotasHtml =
            '<div style="color: #94a3b8; font-style: italic;">-</div>'
        }

        // Column 3: Complements (Nervuras, Aço, Enchimento)
        let complementsHtml = ''

        // Nervuras
        if (slab.ribsData && slab.ribsData.length > 0) {
          const ribsList = slab.ribsData
            .map((rib) => {
              const typeName =
                rib.channelType === 'plastic' ? 'Plástica' : 'Cerâmica'
              const steelLen = rib.steelTotalLength.toFixed(2).replace('.', ',')
              return `
              <div style="margin-bottom: 4px;">
                <strong>${rib.count}x</strong> Nervuras (${typeName})
                <div style="font-size: 9px; margin-left: 6px; color: #64748b;">
                   • Comp. Total: ${rib.totalLength.toFixed(2).replace('.', ',')}m<br/>
                   • Canaletas: ${Math.ceil(rib.channelCount)} un<br/>
                   • Aço (${rib.steelDiameter}mm): ${steelLen}m
                </div>
              </div>
            `
            })
            .join('')
          complementsHtml += `<div style="margin-bottom: 8px;"><strong>Nervuras Transversais:</strong>${ribsList}</div>`
        }

        // Aço Adicional
        if (slab.reinforcementLines && slab.reinforcementLines.length > 0) {
          const acoList = slab.reinforcementLines
            .map((line) => `<div style="color: #64748b;">• ${line}</div>`)
            .join('')
          complementsHtml += `<div style="margin-bottom: 8px;"><strong>Aço Adicional:</strong><div style="font-size: 9px; margin-left: 6px;">${acoList}</div></div>`
        }

        // Enchimento
        if (
          slab.materialType !== 'concrete' &&
          slab.fillerCount &&
          slab.fillerCount > 0
        ) {
          complementsHtml += `
            <div>
              <strong>Enchimento:</strong>
              <div style="font-size: 9px; margin-left: 6px; color: #64748b;">
                • ${slab.material}: ${slab.fillerCount} unidades <br/> (${slab.fillerType})
              </div>
            </div>
          `
        }

        if (!complementsHtml) {
          complementsHtml =
            '<div style="color: #94a3b8; font-style: italic;">-</div>'
        }

        return `
          <tr>
            <td style="background-color: #f8fafc;">${basicInfoHtml}</td>
            <td>${vigotasHtml}</td>
            <td>${complementsHtml}</td>
          </tr>
        `
      })
      .join('')

    const noDataHtml =
      '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #64748b;">Nenhum cômodo encontrado neste projeto.</td></tr>'

    // Calculate Summary Data
    const summaryData = reportData.reduce(
      (acc, item) => {
        const key = `${item.type}-${item.slabThickness || 0}`
        if (!acc[key]) {
          acc[key] = {
            type: item.type,
            height: item.slabThickness || 0,
            area: 0,
            joists: 0,
          }
        }
        acc[key].area += item.area
        acc[key].joists += item.vigotaCount
        return acc
      },
      {} as Record<
        string,
        { type: string; height: number; area: number; joists: number }
      >,
    )

    const totalArea = reportData.reduce((sum, item) => sum + item.area, 0)
    const totalJoists = reportData.reduce(
      (sum, item) => sum + item.vigotaCount,
      0,
    )

    const summaryRows = Object.values(summaryData)
      .sort((a, b) => a.type.localeCompare(b.type))
      .map((row) => {
        return `
        <tr>
          <td>${row.type}</td>
          <td>${row.height > 0 ? `${row.height} cm` : '-'}</td>
          <td>${row.area.toFixed(2).replace('.', ',')} m²</td>
          <td>${row.joists} un</td>
        </tr>
      `
      })
      .join('')

    const summaryHtml = `
      <div style="margin-top: 30px; page-break-inside: avoid;">
        <h3 style="font-size: 14px; margin-bottom: 8px; color: #0f172a; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">Resumo Geral do Projeto</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr>
              <th style="background-color: #e2e8f0; text-align: left; padding: 6px; border: 1px solid #cbd5e1;">Tipo de Laje</th>
              <th style="background-color: #e2e8f0; text-align: left; padding: 6px; border: 1px solid #cbd5e1;">Altura Base</th>
              <th style="background-color: #e2e8f0; text-align: left; padding: 6px; border: 1px solid #cbd5e1;">Área Total</th>
              <th style="background-color: #e2e8f0; text-align: left; padding: 6px; border: 1px solid #cbd5e1;">Qtd. Vigotas</th>
            </tr>
          </thead>
          <tbody>
            ${
              summaryRows ||
              '<tr><td colspan="4" style="text-align:center; padding:8px;">Sem dados para resumo.</td></tr>'
            }
          </tbody>
          <tfoot>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
               <td colspan="2" style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">TOTAL GERAL</td>
               <td style="padding: 6px; border: 1px solid #cbd5e1;">${totalArea.toFixed(2).replace('.', ',')} m²</td>
               <td style="padding: 6px; border: 1px solid #cbd5e1;">${totalJoists} un</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `

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
              
              @page { size: A4 landscape; margin: 10mm; }
              body { margin: 0; font-family: 'Inter', sans-serif; color: #1e293b; background: white; }
              
              .print-page {
                width: 100%;
                height: 100vh; /* Full viewport height for page 1 */
                display: flex;
                flex-direction: column;
                page-break-after: always;
                box-sizing: border-box;
              }
              
              .report-page {
                width: 100%;
                min-height: 100vh;
                box-sizing: border-box;
                padding-top: 10mm;
              }

              .header {
                text-align: center;
                margin-bottom: 10px;
                border-bottom: 2px solid #0f172a;
                padding-bottom: 10px;
              }
              
              .header h1 {
                font-size: 20px;
                font-weight: 800;
                margin: 0;
                text-transform: uppercase;
                color: #0f172a;
              }
              
              .header p {
                font-size: 11px;
                color: #64748b;
                margin: 4px 0 0 0;
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
                margin-bottom: 10px;
              }

              /* Page 2+ - Report Table */
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
              }
              
              th, td {
                border: 1px solid #cbd5e1;
                padding: 8px;
                vertical-align: top;
              }
              
              th {
                background-color: #e2e8f0;
                text-align: left;
                font-weight: 700;
                color: #334155;
                text-transform: uppercase;
                font-size: 9px;
              }

              /* Prevent page break inside rows if possible */
              tr { page-break-inside: avoid; }
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

            <!-- Page 2+: Report Table -->
            <div class="report-page">
               <div class="header">
                <h1>Relatório de Materiais</h1>
                <p>Detalhamento por Cômodo</p>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th style="width: 20%;">Cômodo / Dados Básicos</th>
                    <th style="width: 40%;">Vigotas e Armação</th>
                    <th style="width: 40%;">Complementos (Nervuras, Aço Adicional, Enchimento)</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml || noDataHtml}
                </tbody>
              </table>

              ${summaryHtml}
            </div>

            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
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
