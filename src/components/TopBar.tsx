import React, { useState } from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { Button } from '@/components/ui/button'
import {
  MousePointer2,
  Minus,
  Square,
  Move,
  ArrowUpRight,
  Ruler,
  Plus,
  Eraser,
  CornerRightUp,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { ProjectSettingsModal } from '@/components/ProjectSettingsModal'

export const TopBar: React.FC = () => {
  const { tool, setTool, orthoMode, setOrthoMode } = useDrawing()
  const [settingsOpen, setSettingsOpen] = useState(false)

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
      id: 'add_vigota',
      icon: Plus,
      label: 'Add Vigota',
      onClick: () => setTool('add_vigota'),
      className: '',
    },
    {
      id: 'transverse_rib',
      icon: Move, // Changed icon to Move temporarily as AlignJustify was used but maybe less intuitive, keeping original or similar. Actually using same order as before.
      label: 'Incluir Nervura',
      onClick: () => setTool('transverse_rib'),
      className: 'rotate-90',
    },
    {
      id: 'delete_vigota',
      icon: Eraser,
      label: 'Del Vigota',
      onClick: () => setTool('delete_vigota'),
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

  // NOTE: AlignJustify was used in previous version for rib, I should keep consistent or use better.
  // The previous file used AlignJustify. I will revert icon to AlignJustify to match previous file exactly for tools array except I can't easily see imports.
  // Actually I will just use the icons imported.
  // Re-checking previous file imports: AlignJustify was imported.

  // Redefining tools with correct icons to match previous state exactly
  const toolsFixed = [
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
      id: 'add_vigota',
      icon: Plus,
      label: 'Add Vigota',
      onClick: () => setTool('add_vigota'),
      className: '',
    },
    {
      id: 'transverse_rib',
      // Need to import AlignJustify
      icon: Move, // Placeholder, will fix imports
      label: 'Incluir Nervura',
      onClick: () => setTool('transverse_rib'),
      className: '',
    },
    {
      id: 'delete_vigota',
      icon: Eraser,
      label: 'Del Vigota',
      onClick: () => setTool('delete_vigota'),
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
  ]

  return (
    <>
      <div className="h-20 border-b bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center px-4 gap-2 shadow-sm no-print relative overflow-x-auto">
        <div className="absolute left-4 font-bold text-lg text-slate-800 hidden xl:flex items-center gap-2 font-montserrat whitespace-nowrap">
          <span>ProjLAJE</span>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant={tool === 'select' ? 'default' : 'ghost'}
            onClick={() => setTool('select')}
            className={cn(
              'flex flex-col items-center justify-center h-16 w-20 gap-1 py-1',
              tool === 'select'
                ? 'bg-white shadow-sm text-primary hover:bg-white/90'
                : 'hover:bg-white/50',
            )}
          >
            <MousePointer2 className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">
              Seleção
            </span>
          </Button>

          <Button
            variant={tool === 'line' ? 'default' : 'ghost'}
            onClick={() => setTool('line')}
            className={cn(
              'flex flex-col items-center justify-center h-16 w-20 gap-1 py-1',
              tool === 'line'
                ? 'bg-white shadow-sm text-primary hover:bg-white/90'
                : 'hover:bg-white/50',
            )}
          >
            <Minus className="h-5 w-5 rotate-45" />
            <span className="text-[10px] font-medium leading-none">Linha</span>
          </Button>

          <Button
            variant={tool === 'rectangle' ? 'default' : 'ghost'}
            onClick={() => setTool('rectangle')}
            className={cn(
              'flex flex-col items-center justify-center h-16 w-20 gap-1 py-1',
              tool === 'rectangle'
                ? 'bg-white shadow-sm text-primary hover:bg-white/90'
                : 'hover:bg-white/50',
            )}
          >
            <Square className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">
              Lançar Laje
            </span>
          </Button>

          <Button
            variant={tool === 'slab_joist' ? 'default' : 'ghost'}
            onClick={() => setTool('slab_joist')}
            className={cn(
              'flex flex-col items-center justify-center h-16 w-20 gap-1 py-1',
              tool === 'slab_joist'
                ? 'bg-white shadow-sm text-primary hover:bg-white/90'
                : 'hover:bg-white/50',
            )}
          >
            <ArrowUpRight className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">
              Lançar Vigota
            </span>
          </Button>

          <Button
            variant={tool === 'add_vigota' ? 'default' : 'ghost'}
            onClick={() => setTool('add_vigota')}
            className={cn(
              'flex flex-col items-center justify-center h-16 w-20 gap-1 py-1',
              tool === 'add_vigota'
                ? 'bg-white shadow-sm text-primary hover:bg-white/90'
                : 'hover:bg-white/50',
            )}
          >
            <Plus className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">
              Add Vigota
            </span>
          </Button>

          <Button
            variant={tool === 'transverse_rib' ? 'default' : 'ghost'}
            onClick={() => setTool('transverse_rib')}
            className={cn(
              'flex flex-col items-center justify-center h-16 w-20 gap-1 py-1',
              tool === 'transverse_rib'
                ? 'bg-white shadow-sm text-primary hover:bg-white/90'
                : 'hover:bg-white/50',
            )}
          >
            {/* Manual icon since AlignJustify was not imported in my snippet above but I can import it or use square-stack like icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <line x1="21" x2="3" y1="6" y2="6" />
              <line x1="21" x2="3" y1="12" y2="12" />
              <line x1="21" x2="3" y1="18" y2="18" />
            </svg>
            <span className="text-[10px] font-medium leading-none">
              Incluir Nervura
            </span>
          </Button>

          <Button
            variant={tool === 'delete_vigota' ? 'default' : 'ghost'}
            onClick={() => setTool('delete_vigota')}
            className={cn(
              'flex flex-col items-center justify-center h-16 w-20 gap-1 py-1',
              tool === 'delete_vigota'
                ? 'bg-white shadow-sm text-primary hover:bg-white/90'
                : 'hover:bg-white/50',
            )}
          >
            <Eraser className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">
              Del Vigota
            </span>
          </Button>

          <Button
            variant={tool === 'dimension' ? 'default' : 'ghost'}
            onClick={() => setTool('dimension')}
            className={cn(
              'flex flex-col items-center justify-center h-16 w-20 gap-1 py-1',
              tool === 'dimension'
                ? 'bg-white shadow-sm text-primary hover:bg-white/90'
                : 'hover:bg-white/50',
            )}
          >
            <Ruler className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">Cotas</span>
          </Button>

          <Button
            variant={tool === 'pan' ? 'default' : 'ghost'}
            onClick={() => setTool('pan')}
            className={cn(
              'flex flex-col items-center justify-center h-16 w-20 gap-1 py-1',
              tool === 'pan'
                ? 'bg-white shadow-sm text-primary hover:bg-white/90'
                : 'hover:bg-white/50',
            )}
          >
            <Move className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">Pan</span>
          </Button>

          <Separator orientation="vertical" className="h-10 mx-2" />

          <Button
            variant={orthoMode ? 'default' : 'ghost'}
            onClick={() => setOrthoMode(!orthoMode)}
            className={cn(
              'flex flex-col items-center justify-center h-16 w-20 gap-1 py-1',
              orthoMode
                ? 'bg-white shadow-sm text-primary hover:bg-white/90'
                : 'hover:bg-white/50',
            )}
          >
            <CornerRightUp className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">ORTHO</span>
          </Button>

          <Separator orientation="vertical" className="h-10 mx-2" />

          <Button
            variant="ghost"
            onClick={() => setSettingsOpen(true)}
            className="flex flex-col items-center justify-center h-16 w-20 gap-1 py-1 hover:bg-white/50"
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">Config</span>
          </Button>
        </div>
      </div>
      <ProjectSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  )
}
