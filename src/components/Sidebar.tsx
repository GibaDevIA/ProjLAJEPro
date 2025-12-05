import React from 'react'
import { FileOutput } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarProps {
  onExportPDF?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ onExportPDF }) => {
  return (
    <div className="w-16 border-r bg-white flex flex-col items-center py-4 gap-4 z-10 no-print">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExportPDF}
            className="hover:bg-slate-100"
          >
            <FileOutput className="h-5 w-5" />
            <span className="sr-only">Exportar PDF</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Exportar PDF</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
