import React from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { calculatePolygonArea, calculateBoundingBox } from '@/lib/geometry'

export const MaterialsPanel: React.FC = () => {
  const { shapes } = useDrawing()

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
