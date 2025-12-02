import React from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { generateSlabReportData } from '@/lib/geometry'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Layers } from 'lucide-react'

export const MaterialsPanel: React.FC = () => {
  const { shapes } = useDrawing()
  const reportData = generateSlabReportData(shapes)

  const totalArea = reportData.reduce((acc, item) => acc + item.area, 0)
  const totalFillers = reportData.reduce(
    (acc, item) => acc + (item.fillerCount || 0),
    0,
  )

  return (
    <div className="h-full flex flex-col bg-gray-50 w-full">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-semibold text-lg">Descritivo dos Materiais</h2>
      </div>

      <div className="bg-white p-4 border-b flex flex-col gap-2 shadow-sm z-10">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">
            Total Geral de Área
          </span>
          <span className="font-bold text-lg text-slate-800">
            {totalArea.toFixed(2)}m²
          </span>
        </div>
        {totalFillers > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Layers className="h-4 w-4" /> Total de Lajotas/EPS
            </span>
            <span className="font-bold text-lg text-primary">
              {totalFillers} un
            </span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 bg-gray-50">
        <div className="p-4 space-y-4">
          {reportData.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma laje criada.
            </p>
          )}
          {reportData.map((item) => (
            <Card key={item.id} className="shadow-sm border-gray-200 bg-white">
              <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  {item.label}
                  {item.vigotaCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1">
                      {item.vigotaCount} vt
                    </Badge>
                  )}
                </CardTitle>
                <span className="text-xs text-muted-foreground font-mono">
                  {item.area.toFixed(2)}m²
                </span>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xs text-muted-foreground mb-2">
                  Dim: {item.width.toFixed(2)}m x {item.height.toFixed(2)}m
                </div>

                {item.type !== '-' && (
                  <div className="bg-gray-50 p-2 rounded border border-gray-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{item.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Material:</span>
                      <span className="font-medium">{item.material}</span>
                    </div>

                    {/* Filler Count */}
                    {item.fillerCount !== undefined && item.fillerCount > 0 && (
                      <div className="mt-2 bg-blue-50 p-1.5 rounded border border-blue-100 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="font-semibold text-blue-900">
                            Enchimento (Lajota)
                          </span>
                          <span className="text-[10px] text-blue-700">
                            {item.fillerType}
                          </span>
                        </div>
                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                          {item.fillerCount} un
                        </Badge>
                      </div>
                    )}

                    {item.vigotaDetails.length > 0 ? (
                      <div className="pt-1 mt-1 border-t border-gray-200">
                        <div className="font-semibold text-primary mb-1">
                          Vigotas
                        </div>
                        <div className="space-y-2">
                          {item.vigotaDetails.map((detail) => (
                            <div
                              key={detail.length}
                              className="flex flex-col bg-white px-1.5 py-1 rounded border border-gray-100"
                            >
                              <div className="flex justify-between font-medium">
                                <span>{detail.count}x</span>
                                <span>{detail.length}m</span>
                              </div>
                              {detail.reinforcementText &&
                                detail.reinforcementText.length > 0 && (
                                  <div className="mt-1 text-[10px] text-muted-foreground border-t border-gray-50 pt-1">
                                    {detail.reinforcementText.map(
                                      (line, idx) => (
                                        <div key={idx}>{line}</div>
                                      ),
                                    )}
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                        {item.hasExtraVigotas && (
                          <div className="mt-2 text-amber-600 font-semibold italic border-t border-amber-100 pt-1">
                            * {item.extraVigotaCount} Vigotas extra adicionadas
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-amber-600 mt-1 font-medium">
                        Defina a direção (Vigota)
                      </div>
                    )}

                    {item.reinforcementLines &&
                      item.reinforcementLines.length > 0 && (
                        <div className="pt-1 mt-1 border-t border-gray-200">
                          <div className="font-semibold text-primary mb-1">
                            Resumo do Aço
                          </div>
                          <div className="space-y-0.5">
                            {item.reinforcementLines.map((line, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-gray-700 font-medium"
                              >
                                {line}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {item.ribsData && item.ribsData.length > 0 && (
                      <div className="pt-1 mt-1 border-t border-gray-200">
                        <div className="font-semibold text-primary mb-1">
                          Nervuras
                        </div>
                        <div className="space-y-2">
                          {item.ribsData.map((rib, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col bg-white px-1.5 py-1 rounded border border-gray-100 text-[10px]"
                            >
                              <div className="font-medium">
                                {rib.count}x Nervuras (
                                {rib.channelType === 'plastic'
                                  ? 'Plástica'
                                  : 'Cerâmica'}
                                )
                              </div>
                              <div className="text-muted-foreground">
                                Total Linear: {rib.totalLength.toFixed(2)}m
                              </div>
                              <div className="text-muted-foreground">
                                Canaletas: {Math.ceil(rib.channelCount)} un
                              </div>
                              <div className="text-muted-foreground">
                                Aço: {rib.steelQuantity}x {rib.steelDiameter}mm
                                ({rib.steelTotalLength.toFixed(2)}m)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
