import React, { useMemo } from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { generateSlabReportData } from '@/lib/geometry'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const SlabReportTable: React.FC = () => {
  const { shapes } = useDrawing()

  const reportData = useMemo(() => generateSlabReportData(shapes), [shapes])

  if (reportData.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-md text-center">
        Nenhum cômodo encontrado.
      </div>
    )
  }

  return (
    <div className="rounded-md border mt-8">
      <div className="p-4 bg-muted/30 border-b">
        <h3 className="font-semibold">Detalhamento por Cômodo</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Identificação</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Material</TableHead>
            <TableHead className="text-right">Largura (m)</TableHead>
            <TableHead className="text-right">Comprimento (m)</TableHead>
            <TableHead className="text-right">Área (m²)</TableHead>
            <TableHead className="text-right">Qtd. Vigotas</TableHead>
            <TableHead className="text-right">Qtd. Enchimento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportData.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.label}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.material}</TableCell>
              <TableCell className="text-right">
                {item.width.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {item.height.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {item.area.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">{item.vigotaCount}</TableCell>
              <TableCell className="text-right">
                {item.fillerCount > 0 ? item.fillerCount : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
