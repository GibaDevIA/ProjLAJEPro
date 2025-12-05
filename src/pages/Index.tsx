import React, { useRef } from 'react'
import { Canvas } from '@/components/Canvas'
import { Sidebar } from '@/components/Sidebar'
import { ShapeRenderer } from '@/components/ShapeRenderer'
import { ProjectSummaryTable } from '@/components/ProjectSummaryTable'
import { SlabReportTable } from '@/components/SlabReportTable'
import { MaterialsPanel } from '@/components/MaterialsPanel'
import { useDrawing } from '@/context/DrawingContext'
import { cn } from '@/lib/utils'

export default function Index() {
  const { activeShapeId, shapes } = useDrawing()
  // Although TopBar is in Layout, we need Sidebar here for tools/export
  // Layout provides the TopBar.

  const handleExportPDF = () => {
    window.print()
  }

  return (
    <div className="flex flex-1 h-full relative">
      {/* Screen View */}
      <Sidebar onExportPDF={handleExportPDF} />

      <div className="flex-1 relative bg-slate-50 overflow-hidden no-print">
        <Canvas>
          <ShapeRenderer shapes={shapes} activeShapeId={activeShapeId} />
        </Canvas>
      </div>

      <div className="w-80 border-l bg-white overflow-y-auto no-print">
        <MaterialsPanel />
        <div className="p-4">
          <ProjectSummaryTable />
        </div>
      </div>

      {/* Print View - Only visible when printing */}
      <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:z-50 p-8 overflow-visible">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Relatório de Projeto
          </h1>
          <p className="text-sm text-slate-500">
            Gerado em {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <ProjectSummaryTable />
          </section>

          <section className="break-before-page">
            <SlabReportTable />
          </section>

          {/* Note: The drawing canvas is tricky to print directly from here without image export. 
              Usually we would export the canvas to an image and display it here. 
              For this implementation, we satisfy the table requirements. 
          */}
        </div>
      </div>
    </div>
  )
}
