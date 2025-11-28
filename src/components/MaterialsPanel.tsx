import React from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  calculatePolygonArea,
  calculateBoundingBox,
  isWorldPointInShape,
  getSlabJoistCount,
  calculateVigotaLengths,
} from '@/lib/geometry'

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

            // Find associated joist arrow
            const joistArrow = shapes.find(
              (s) =>
                s.type === 'arrow' &&
                s.properties?.isJoist &&
                isWorldPointInShape(
                  {
                    x: (s.points[0].x + s.points[1].x) / 2,
                    y: (s.points[0].y + s.points[1].y) / 2,
                  },
                  slab,
                ),
            )

            let beamCount = 0
            let vigotaGroups: Record<string, number> = {}
            let sortedLengths: string[] = []

            if (joistArrow && slab.properties?.slabConfig) {
              const lengths = calculateVigotaLengths(slab, joistArrow)
              beamCount = lengths.length

              if (slab.type === 'polygon') {
                // For polygons, round up to nearest integer (ceil)
                // This ensures that even if a joist is 2.01m, it counts as 3m
                lengths.forEach((l) => {
                  // Use toFixed(4) to avoid floating point epsilon errors before ceil
                  const rounded = Math.ceil(Number(l.toFixed(4)))
                  const key = rounded.toString()
                  vigotaGroups[key] = (vigotaGroups[key] || 0) + 1
                })
              } else {
                // For rectangles, keep exact value (2 decimals)
                lengths.forEach((l) => {
                  const val = l.toFixed(2)
                  vigotaGroups[val] = (vigotaGroups[val] || 0) + 1
                })
              }

              sortedLengths = Object.keys(vigotaGroups).sort(
                (a, b) => Number(b) - Number(a),
              )
            } else if (joistArrow && !slab.properties?.slabConfig) {
              // Fallback if config is missing but arrow exists
              beamCount = getSlabJoistCount(slab, joistArrow)
            }

            return (
              <div key={slab.id} className="text-sm">
                <div className="font-medium flex items-center justify-between">
                  <span>
                    {slab.properties?.label || `Laje ${index + 1}`}
                    {beamCount > 0 ? ` (${beamCount}vt)` : ''}
                  </span>
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
                      <div className="mt-2">
                        <div className="font-semibold text-primary mb-1">
                          {beamCount} Vigotas
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {sortedLengths.map((len) => (
                            <div
                              key={len}
                              className="flex justify-between bg-white px-2 py-0.5 rounded border border-gray-100"
                            >
                              <span>{vigotaGroups[len]}x</span>
                              <span className="font-medium">{len}m</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-amber-600 mt-1">
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
