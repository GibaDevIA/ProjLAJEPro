import React, { useMemo } from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { generateDetailedProjectSummary } from '@/lib/geometry'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'

export const ProjectSummaryTable: React.FC = () => {
  const { shapes } = useDrawing()

  const summary = useMemo(
    () => generateDetailedProjectSummary(shapes),
    [shapes],
  )

  if (summary.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-md text-center">
        Sem dados para resumo.
      </div>
    )
  }

  const grandTotalArea = summary.reduce((acc, item) => acc + item.totalArea, 0)

  return (
    <div className="rounded-md border">
      <div className="p-4 bg-muted/30 border-b">
        <h3 className="font-semibold">Resumo Geral do Projeto</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo de Laje</TableHead>
            <TableHead className="text-center">Área Total (m²)</TableHead>
            <TableHead>Qtde. Enchimento por Tipo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.slabType}</TableCell>
              <TableCell className="text-center">
                {item.totalArea.toFixed(2)}
              </TableCell>
              <TableCell>
                {item.fillerDetails.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {item.fillerDetails.map((filler, fIndex) => (
                      <span key={fIndex}>
                        {filler.description} - {filler.count} peças
                      </span>
                    ))}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={1} className="font-bold">
              TOTAL GERAL
            </TableCell>
            <TableCell className="text-center font-bold">
              {grandTotalArea.toFixed(2)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
