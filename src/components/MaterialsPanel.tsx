import React from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  calculatePolygonArea,
  calculateBoundingBox,
  isPointInShape,
  getProjectedLength,
} from '@/lib/geometry'

export const MaterialsPanel: React.FC = () => {
  const { shapes, view } = useDrawing()

  // Filter for slabs (rectangles and polygons)
  const slabs = shapes.filter(
    (s) => s.type === 'rectangle' || s.type === 'polygon',
  )

  const totalArea = slabs.reduce((acc, s) => {
    const area = s.properties?.area || calculatePolygonArea(s.points)
    return acc + area
  }, 0)

  return (
    <div className="h-full flex flex-col bg-white w-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Descritivo dos Materiais</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {slabs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma laje criada.
            </p>
          )}
          {slabs.map((slab, index) => {
            let width = slab.properties?.width
            let height = slab.properties?.height
            const area =
              slab.properties?.area || calculatePolygonArea(slab.points)

            if (!width || !height) {
              const bbox = calculateBoundingBox(slab.points)
              width = bbox.width
              height = bbox.height
            }

            // Find associated joist arrow
            const joistArrow = shapes.find(
              (s) =>
                s.type === 'arrow' &&
                s.properties?.isJoist &&
                isPointInShape(
                  {
                    x: (s.points[0].x + s.points[1].x) / 2,
                    y: (s.points[0].y + s.points[1].y) / 2,
                  },
                  slab,
                  view,
                ),
            )

            let beamCount = 0
            if (joistArrow && slab.properties?.slabConfig) {
              const interEixoMeters = slab.properties.slabConfig.interEixo / 100
              // Calculate length perpendicular to beam direction
              const arrowVec = {
                x: joistArrow.points[1].x - joistArrow.points[0].x,
                y: joistArrow.points[1].y - joistArrow.points[0].y,
              }
              // Perpendicular vector
              const perpVec = { x: -arrowVec.y, y: arrowVec.x }

              const projectedLen = getProjectedLength(slab.points, perpVec)
              beamCount = Math.ceil(projectedLen / interEixoMeters)
            }

            return (
              <div key={slab.id} className="text-sm">
                <div className="font-medium flex items-center justify-between">
                  <span>Laje {index + 1}</span>
                  <span className="text-xs text-muted-foreground uppercase">
                    {slab.type === 'rectangle' ? 'Retangular' : 'Poligonal'}
                  </span>
                </div>
                <div className="text-muted-foreground mt-1">
                  {width.toFixed(2)}m x {height.toFixed(2)}m ({area.toFixed(2)}
                  m²)
                </div>
                {slab.properties?.slabConfig && (
                  <div className="mt-2 text-xs text-muted-foreground space-y-1 bg-gray-50 p-2 rounded">
                    <div>Tipo: {slab.properties.slabConfig.type}</div>
                    <div>
                      Material:{' '}
                      {slab.properties.slabConfig.material === 'ceramic'
                        ? 'Cerâmica'
                        : 'EPS'}
                    </div>
                    {beamCount > 0 ? (
                      <div className="font-semibold text-primary">
                        {beamCount} Vigotas
                      </div>
                    ) : (
                      <div className="text-amber-600">
                        Defina a direção (Vigota)
                      </div>
                    )}
                  </div>
                )}
                <Separator className="my-2" />
              </div>
            )
          })}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-gray-50">
        <div className="flex justify-between items-center font-bold text-lg">
          <span>Total</span>
          <span>{totalArea.toFixed(2)}m²</span>
        </div>
      </div>
    </div>
  )
}
