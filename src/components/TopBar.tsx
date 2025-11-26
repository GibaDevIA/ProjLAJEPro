import React from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { Button } from '@/components/ui/button'
import { MousePointer2, Minus, Square, Move } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export const TopBar: React.FC = () => {
  const { tool, setTool } = useDrawing()

  return (
    <div className="h-14 border-b bg-white flex items-center justify-center px-4 gap-2 shadow-sm no-print">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={tool === 'select' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setTool('select')}
            className="h-9 w-9"
          >
            <MousePointer2 className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Seleção</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={tool === 'line' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setTool('line')}
            className="h-9 w-9"
          >
            <Minus className="h-5 w-5 rotate-45" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Linha</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={tool === 'rectangle' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setTool('rectangle')}
            className="h-9 w-9"
          >
            <Square className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Retângulo por Medida</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={tool === 'pan' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setTool('pan')}
            className="h-9 w-9"
          >
            <Move className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Pan</TooltipContent>
      </Tooltip>
    </div>
  )
}
