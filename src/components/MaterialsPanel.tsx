import React, { useMemo } from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { generateSlabReportData } from '@/lib/geometry'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  FileText,
  Layers,
  Hammer,
  Ruler,
  Package,
  ArrowUpRight,
  Info,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export const MaterialsPanel = ({ className }: { className?: string }) => {
  const { shapes, projectName } = useDrawing()

  const reportData = useMemo(() => generateSlabReportData(shapes), [shapes])

  const totals = useMemo(() => {
    let ceramic = 0
    let eps = 0
    let totalArea = 0

    reportData.forEach((item) => {
      if (item.materialType === 'ceramic') ceramic += item.fillerCount || 0
      if (item.materialType === 'eps') eps += item.fillerCount || 0
      totalArea += item.area
    })

    return { ceramic, eps, totalArea }
  }, [reportData])

  return (
    <Card
      className={cn(
        'h-full flex flex-col border-none shadow-none rounded-none bg-gray-50/50',
        className,
      )}
    >
      <CardHeader className="px-4 py-3 border-b bg-white sticky top-0 z-10 shadow-sm">
        <CardTitle className="text-base flex items-center gap-2 text-slate-800">
          <FileText className="h-4 w-4 text-primary" />
          Relatório de Materiais
        </CardTitle>
        <CardDescription className="text-xs truncate font-medium">
          {projectName || 'Projeto Sem Nome'}
        </CardDescription>
      </CardHeader>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {reportData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-60">
              <Layers className="h-10 w-10 mb-2 stroke-1" />
              <p className="text-sm text-center">
                Nenhuma laje desenhada.
                <br />
                Utilize as ferramentas de desenho.
              </p>
            </div>
          ) : (
            reportData.map((slab) => (
              <div
                key={slab.id}
                className="bg-white border rounded-lg p-3 shadow-sm space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1 rounded">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800">
                      {slab.label}
                    </h4>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {slab.area.toFixed(2)}m²
                  </Badge>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-[10px]">
                      Tipo
                    </span>
                    <span className="font-medium text-slate-700">
                      {slab.type}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-[10px]">
                      Material
                    </span>
                    <span className="font-medium text-slate-700">
                      {slab.material}
                    </span>
                  </div>
                </div>

                {/* Vigotas Section */}
                {slab.vigotaCount > 0 && (
                  <div className="bg-slate-50 rounded p-2 text-xs space-y-2 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-800 font-semibold border-b border-slate-200 pb-1">
                      <ArrowUpRight className="h-3 w-3 text-blue-600" />
                      <span>Vigotas ({slab.vigotaCount} un)</span>
                    </div>

                    <div className="space-y-1.5">
                      {slab.vigotaDetails.map((group, idx) => (
                        <div key={idx} className="group">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-700">
                              {group.count}x {group.length}m
                            </span>
                          </div>
                          {/* Reinforcement Text for this group */}
                          {group.reinforcementText &&
                            group.reinforcementText.length > 0 && (
                              <div className="pl-2 border-l-2 border-blue-200 mt-0.5 text-[10px] text-slate-500">
                                {group.reinforcementText.map((text, tIdx) => (
                                  <div key={tIdx}>{text}</div>
                                ))}
                              </div>
                            )}
                        </div>
                      ))}

                      {slab.hasExtraVigotas && (
                        <p className="text-[10px] text-amber-600 italic mt-1 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          {slab.extraVigotaCount} vigota(s) desenhada(s)
                          manualmente
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Reinforcement Summary (Cut List) */}
                {slab.reinforcementLines &&
                  slab.reinforcementLines.length > 0 && (
                    <div className="bg-slate-50 rounded p-2 text-xs space-y-2 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold border-b border-slate-200 pb-1">
                        <Hammer className="h-3 w-3 text-slate-600" />
                        <span>Aço Adicional (Resumo)</span>
                      </div>
                      <ul className="space-y-1 pl-1">
                        {slab.reinforcementLines.map((line, idx) => (
                          <li
                            key={idx}
                            className="text-slate-600 flex items-center gap-1.5"
                          >
                            <div className="h-1 w-1 rounded-full bg-slate-400" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Ribs Section */}
                {slab.ribsData && slab.ribsData.length > 0 && (
                  <div className="bg-orange-50/50 rounded p-2 text-xs space-y-2 border border-orange-100">
                    <div className="flex items-center gap-1.5 text-orange-800 font-semibold border-b border-orange-200 pb-1">
                      <Ruler className="h-3 w-3" />
                      <span>Nervuras Transversais</span>
                    </div>
                    <div className="space-y-3">
                      {slab.ribsData.map((rib, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between font-medium text-slate-700">
                            <span>
                              {rib.count}x{' '}
                              {rib.channelType === 'plastic'
                                ? 'Plástica'
                                : 'Cerâmica'}
                            </span>
                            <span>Total: {rib.totalLength.toFixed(2)}m</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-orange-200">
                            <div>
                              <span className="text-[10px] text-muted-foreground block">
                                Canaletas
                              </span>
                              <span className="font-medium">
                                {Math.ceil(rib.channelCount)} un
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground block">
                                Aço ({rib.steelDiameter}mm)
                              </span>
                              <span className="font-medium">
                                {rib.steelTotalLength.toFixed(2)}m
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filler Section */}
                {slab.materialType !== 'concrete' && (
                  <div className="flex items-center justify-between bg-secondary/30 p-2 rounded border border-secondary/50">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-xs font-medium text-slate-700">
                        Enchimento
                      </span>
                    </div>
                    <div className="text-xs text-right">
                      <span className="font-bold text-primary block">
                        {slab.fillerCount} un
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {slab.fillerType}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Totals Footer */}
      {(totals.ceramic > 0 || totals.eps > 0 || totals.totalArea > 0) && (
        <div className="border-t bg-white p-4 space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <h4 className="font-bold text-sm text-slate-800 mb-1">Total Geral</h4>

          {totals.ceramic > 0 && (
            <div className="flex justify-between text-sm items-center p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-600 text-xs font-medium">
                Total Lajota Cerâmica
              </span>
              <span className="font-bold text-primary">
                {totals.ceramic} un
              </span>
            </div>
          )}

          {totals.eps > 0 && (
            <div className="flex justify-between text-sm items-center p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-600 text-xs font-medium">
                Total Lajota EPS
              </span>
              <span className="font-bold text-primary">{totals.eps} un</span>
            </div>
          )}

          <div className="flex justify-between text-sm items-center pt-1">
            <span className="text-slate-500 text-xs">Total Área Quadrada</span>
            <span className="font-bold text-slate-800">
              {totals.totalArea.toFixed(2)} m²
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}
