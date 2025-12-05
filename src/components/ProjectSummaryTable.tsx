import React, { useMemo } from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { generateProjectSlabSummary } from '@/lib/geometry'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const ProjectSummaryTable: React.FC = () => {
  const { shapes } = useDrawing()

  const summary = useMemo(() => generateProjectSlabSummary(shapes), [shapes])

  if (summary.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-md text-center">
        Nenhuma lajota encontrada no projeto.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="p-4 bg-muted/30 border-b">
        <h3 className="font-semibold">Resumo Geral do Projeto (Lajotas)</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo de Lajota</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.typeLabel}</TableCell>
              <TableCell className="text-right">{item.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
