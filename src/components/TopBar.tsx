import React from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { Button } from '@/components/ui/button'
import { MousePointer2, Minus, Square, Move } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export const TopBar: React.FC = () => {
  const { tool, setTool } = useDrawing()

  const tools = [
    {
      id: 'select',
      icon: MousePointer2,
      label: 'Seleção',
      onClick: () => setTool('select'),
      className: '',
    },
    {
      id: 'line',
      icon: Minus,
      label: 'Linha',
      onClick: () => setTool('line'),
      className: 'rotate-45',
    },
    {
      id: 'rectangle',
      icon: Square,
      label: 'Lançar Laje',
      onClick: () => setTool('rectangle'),
      className: '',
    },
    {
      id: 'pan',
      icon: Move,
      label: 'Pan',
      onClick: () => setTool('pan'),
      className: '',
    },
  ] as const

  return (
    <div className="h-14 border-b bg-white flex items-center justify-center px-4 gap-2 shadow-sm no-print relative">
      <div className="absolute left-4 font-semibold text-lg">ProjeLAJE1.0</div>
      {tools.map((t) => (
        <Tooltip key={t.id}>
          <TooltipTrigger asChild>
            <Button
              variant={tool === t.id ? 'default' : 'ghost'}
              size="icon"
              onClick={t.onClick}
              className="h-9 w-9"
            >
              <t.icon className={cn('h-5 w-5', t.className)} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
