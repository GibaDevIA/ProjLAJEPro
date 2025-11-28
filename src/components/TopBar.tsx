import React from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { Button } from '@/components/ui/button'
import {
  MousePointer2,
  Minus,
  Square,
  Move,
  ArrowUpRight,
  Ruler,
} from 'lucide-react'
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
      id: 'slab_joist',
      icon: ArrowUpRight,
      label: 'Lançar Vigota',
      onClick: () => setTool('slab_joist'),
      className: '',
    },
    {
      id: 'dimension',
      icon: Ruler,
      label: 'Cotas',
      onClick: () => setTool('dimension'),
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
    <div className="h-20 border-b bg-blue-50 flex items-center justify-center px-4 gap-2 shadow-sm no-print relative">
      <div className="absolute left-4 font-semibold text-lg text-slate-800">
        ProjeLAJE1.0
      </div>
      <div className="flex gap-2">
        {tools.map((t) => (
          <Button
            key={t.id}
            variant={tool === t.id ? 'default' : 'ghost'}
            onClick={t.onClick}
            className={cn(
              'flex flex-col items-center justify-center h-16 w-20 gap-1 py-1',
              tool === t.id
                ? 'bg-white shadow-sm text-primary hover:bg-white/90'
                : 'hover:bg-white/50',
            )}
          >
            <t.icon className={cn('h-5 w-5', t.className)} />
            <span className="text-[10px] font-medium leading-none">
              {t.label}
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}
