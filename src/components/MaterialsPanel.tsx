import React, { useMemo } from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { generateSlabReportData } from '@/lib/geometry'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FileText } from 'lucide-react'

export const MaterialsPanel = ({ className }: { className?: string }) => {
  const { shapes, projectName } = useDrawing()

  const reportData = useMemo(() => generateSlabReportData(shapes), [shapes])

  const totals = useMemo(() => {
    let ceramic = 0
    let eps = 0
    // We don't count concrete fillers in this total

    reportData.forEach((item) => {
      if (item.materialType === 'ceramic') ceramic += item.fillerCount || 0
      if (item.materialType === 'eps') eps += item.fillerCount || 0
    })

    return { ceramic, eps }
  }, [reportData])

  return (
    <Card
      className={cn(
        'h-full flex flex-col border-none shadow-none rounded-none bg-transparent',
        className,
      )}
    >
      <CardHeader className="px-4 py-3 border-b bg-card">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Relatório de Materiais
        </CardTitle>
        <CardDescription className="text-xs">
          {projectName || 'Projeto Sem Nome'}
        </CardDescription>
      </CardHeader>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {reportData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma laje encontrada.
            </p>
          ) : (
            reportData.map((slab) => (
              <div key={slab.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-primary">
                    {slab.label}
                  </h4>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {slab.area.toFixed(2)}m²
                  </span>
                </div>

                <div className="text-xs grid grid-cols-2 gap-x-2 gap-y-1 text-muted-foreground border-l-2 border-muted pl-3">
                  <span>Tipo:</span>
                  <span className="text-foreground">{slab.type}</span>

                  <span>Material:</span>
                  <span className="text-foreground">{slab.material}</span>

                  <span>Vigotas:</span>
                  <span className="text-foreground">{slab.vigotaCount} un</span>

                  {slab.materialType !== 'concrete' && (
                    <>
                      <span>Enchimento:</span>
                      <span className="text-foreground font-medium">
                        {slab.fillerCount} un ({slab.fillerType})
                      </span>
                    </>
                  )}

                  {/* Ribs Summary */}
                  {slab.ribsData && slab.ribsData.length > 0 && (
                    <div className="col-span-2 mt-1 pt-1 border-t border-dotted">
                      <span className="block font-medium text-foreground mb-0.5">
                        Nervuras:
                      </span>
                      {slab.ribsData.map((rib, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {rib.count}x{' '}
                            {rib.channelType === 'plastic'
                              ? 'Plástica'
                              : 'Cerâmica'}
                          </span>
                          <span>{rib.totalLength.toFixed(2)}m</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {(totals.ceramic > 0 || totals.eps > 0) && (
        <div className="border-t bg-card p-4 space-y-2 shadow-sm">
          <h4 className="font-semibold text-sm mb-2">Total do Projeto</h4>
          {totals.ceramic > 0 && (
            <div className="flex justify-between text-sm items-center p-2 bg-muted/30 rounded border border-muted/50">
              <span className="text-muted-foreground">
                Total Lajota Cerâmica
              </span>
              <span className="font-bold text-primary">
                {totals.ceramic} un
              </span>
            </div>
          )}
          {totals.eps > 0 && (
            <div className="flex justify-between text-sm items-center p-2 bg-muted/30 rounded border border-muted/50">
              <span className="text-muted-foreground">Total Lajota EPS</span>
              <span className="font-bold text-primary">{totals.eps} un</span>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
