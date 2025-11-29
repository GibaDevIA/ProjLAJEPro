import React from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { generateSlabReportData } from '@/lib/geometry'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const MaterialsPanel: React.FC = () => {
  const { shapes } = useDrawing()
  const reportData = generateSlabReportData(shapes)

  const totalArea = reportData.reduce((acc, item) => acc + item.area, 0)

  return (
    <div className="h-full flex flex-col bg-gray-50 w-full">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-semibold text-lg">Descritivo dos Materiais</h2>
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
                    {item.vigotaDetails.length > 0 ? (
                      <div className="pt-1 mt-1 border-t border-gray-200">
                        <div className="font-semibold text-primary mb-1">
                          Vigotas
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {item.vigotaDetails.map((detail) => (
                            <div
                              key={detail.length}
                              className="flex justify-between bg-white px-1.5 py-0.5 rounded border border-gray-100"
                            >
                              <span>{detail.count}x</span>
                              <span className="font-medium">
                                {detail.length}m
                              </span>
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
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-gray-50">
        <div className="flex justify-between items-center font-bold text-lg">
          <span>Total Geral</span>
          <span>{totalArea.toFixed(2)}m²</span>
        </div>
      </div>
    </div>
  )
}
