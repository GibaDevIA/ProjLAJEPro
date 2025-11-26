import React, { useState } from 'react'
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
  ImageDown,
  Grid3X3,
  Trash2,
  ArrowUpRight,
  FileText,
  FileImage,
} from 'lucide-react'
import { generateId } from '@/lib/utils'
import { Shape } from '@/types/drawing'
import { toast } from 'sonner'

export const Sidebar: React.FC = () => {
  const {
    tool,
    setTool,
    addShape,
    view,
    setView,
    gridVisible,
    setGridVisible,
    exportToJSON,
    loadFromJSON,
    setShapes,
  } = useDrawing()

  const [rectWidth, setRectWidth] = useState('5')
  const [rectHeight, setRectHeight] = useState('4')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleCreateRect = () => {
    const w = parseFloat(rectWidth)
    const h = parseFloat(rectHeight)

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      toast.error('Por favor, insira dimensões válidas.')
      return
    }

    const halfW = w / 2
    const halfH = h / 2

    const newShape: Shape = {
      id: generateId(),
      type: 'rectangle',
      points: [
        { x: -halfW, y: -halfH },
        { x: halfW, y: -halfH },
        { x: halfW, y: halfH },
        { x: -halfW, y: halfH },
      ],
      properties: { width: w, height: h },
    }

    addShape(newShape)

    setView((prev) => ({
      ...prev,
      offset: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      },
    }))
    toast.success('Retângulo criado com sucesso!')
  }

  const handleZoom = (delta: number) => {
    setView((prev) => ({
      ...prev,
      scale: Math.max(1, prev.scale + delta),
    }))
  }

  const handleExportJPG = () => {
    const svg = document.querySelector('svg')
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
    // Since we cannot use external libraries like jspdf, we use the browser's print functionality
    // which allows saving as PDF. We style the page to only show the canvas.
    window.print()
    toast.info('Selecione "Salvar como PDF" na janela de impressão.')
  }

  const handleClearAll = () => {
    if (confirm('Tem certeza que deseja apagar tudo?')) {
      setShapes([])
      toast.success('Desenho limpo.')
    }
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
            variant={tool === 'slab_joist' ? 'default' : 'outline'}
            className="justify-start"
            onClick={() => setTool('slab_joist')}
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Lançar Laje
          </Button>
        </div>

        <Separator />

        {tool === 'rectangle' && (
          <div className="space-y-4 animate-accordion-down">
            <h3 className="text-sm font-medium">Criar Retângulo</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="width">Largura (m)</Label>
                <Input
                  id="width"
                  type="number"
                  value={rectWidth}
                  onChange={(e) => setRectWidth(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="height">Comp. (m)</Label>
                <Input
                  id="height"
                  type="number"
                  value={rectHeight}
                  onChange={(e) => setRectHeight(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleCreateRect}>
              Criar Retângulo
            </Button>
          </div>
        )}

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
