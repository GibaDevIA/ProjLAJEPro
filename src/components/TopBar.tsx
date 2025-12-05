import React, { useState, useEffect } from 'react'
import { useDrawing } from '@/context/DrawingContext'
import { useAuth } from '@/context/AuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Save,
  Download,
  Upload,
  FileText,
  Menu,
  Loader2,
  LayoutTemplate,
  LogOut,
  Palette,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { updateProject } from '@/services/projects'
import {
  generateDetailedProjectSummary,
  generateSlabReportData,
} from '@/lib/geometry'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const TopBar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const {
    shapes,
    projectName,
    setProjectName,
    projectId,
    view,
    exportToJSON,
    loadFromJSON,
    resetView,
    isLoadingProject,
    colorBySlabType,
    setColorBySlabType,
  } = useDrawing()

  const [isSaving, setIsSaving] = useState(false)
  const [nameInput, setNameInput] = useState(projectName || '')
  const [isEditingName, setIsEditingName] = useState(false)

  const isDashboard = location.pathname === '/dashboard'

  useEffect(() => {
    setNameInput(projectName || '')
  }, [projectName])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameInput(e.target.value)
  }

  const handleNameBlur = () => {
    setIsEditingName(false)
    if (nameInput.trim() !== projectName) {
      setProjectName(nameInput.trim() || 'Sem Título')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur()
    }
  }

  const handleSave = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para salvar.')
      return
    }

    if (!projectId) {
      toast.error('ID do projeto não encontrado.')
      return
    }

    setIsSaving(true)
    try {
      const content = {
        shapes,
        view,
        version: '1.0',
        dateCreated: new Date().toISOString(),
        units: 'meters',
      }

      const { error } = await updateProject(projectId, {
        name: projectName || 'Sem Título',
        content,
      })

      if (error) {
        throw error
      }

      toast.success('Projeto salvo com sucesso!')
    } catch (error: any) {
      console.error('Error saving project:', error)
      toast.error(
        'Erro ao salvar projeto: ' + (error.message || 'Erro desconhecido'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        toast.error('Erro ao sair: ' + error.message)
      } else {
        navigate('/login')
      }
    } catch (e) {
      toast.error('Erro inesperado ao sair')
    }
  }

  const handleExportPDF = () => {
    if (shapes.length === 0) {
      toast.error('O projeto está vazio. Adicione elementos antes de exportar.')
      return
    }

    const summary = generateDetailedProjectSummary(shapes)
    const details = generateSlabReportData(shapes)
    const totalArea = summary.reduce((acc, item) => acc + item.totalArea, 0)

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Por favor, permita popups para gerar o relatório.')
      return
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório - ${projectName || 'Projeto'}</title>
        <style>
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; max-width: 1000px; margin: 0 auto; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          .project-info h1 { margin: 0 0 5px 0; font-size: 28px; color: #0f172a; }
          .subtitle { color: #64748b; font-size: 14px; }
          .meta { text-align: right; font-size: 13px; color: #64748b; }
          h2 { font-size: 18px; color: #334155; border-left: 4px solid #2563eb; padding-left: 12px; margin: 40px 0 20px 0; text-transform: uppercase; letter-spacing: 0.05em; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: 600; color: #475569; text-transform: uppercase; font-size: 12px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .total-row { background-color: #e2e8f0 !important; font-weight: bold; }
          .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
          .page-break { page-break-before: always; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; background: #e2e8f0; font-size: 11px; margin-right: 4px; }
          .detail-text { font-size: 12px; color: #475569; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="project-info">
            <h1>${projectName || 'Projeto Sem Título'}</h1>
            <div class="subtitle">Relatório de Cálculo de Lajes - ProjLAJE</div>
          </div>
          <div class="meta">
            <div><strong>Data:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
            <div><strong>Usuário:</strong> ${user?.email || 'Anônimo'}</div>
          </div>
        </div>

        <h2>Resumo Geral do Projeto</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 25%">Tipo de Laje</th>
              <th class="text-center" style="width: 25%">Área Total (m²)</th>
              <th style="width: 50%">Qtde. Enchimento por Tipo</th>
            </tr>
          </thead>
          <tbody>
            ${
              summary.length > 0
                ? summary
                    .map(
                      (item) => `
              <tr>
                <td class="font-bold">${item.slabType}</td>
                <td class="text-center">${item.totalArea.toFixed(2)}</td>
                <td>
                  ${
                    item.fillerDetails.length > 0
                      ? item.fillerDetails
                          .map(
                            (f) =>
                              `<div>• ${f.description}: <strong>${f.count}</strong> peças</div>`,
                          )
                          .join('')
                      : '-'
                  }
                </td>
              </tr>
            `,
                    )
                    .join('')
                : '<tr><td colspan="3" class="text-center">Nenhum dado disponível</td></tr>'
            }
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td>TOTAL GERAL</td>
              <td class="text-center">${totalArea.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        ${
          details.length > 0
            ? `
          <div class="page-break"></div>
          <h2>Detalhamento das Lajes</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 15%">Laje</th>
                <th style="width: 10%">Tipo</th>
                <th class="text-center" style="width: 10%">Área (m²)</th>
                <th class="text-center" style="width: 10%">Vigotas</th>
                <th style="width: 25%">Enchimento</th>
                <th style="width: 30%">Detalhamento Técnica</th>
              </tr>
            </thead>
            <tbody>
              ${details
                .map(
                  (item) => `
                <tr>
                  <td class="font-bold">${item.label}</td>
                  <td>${item.type}</td>
                  <td class="text-center">${item.area.toFixed(2)}</td>
                  <td class="text-center">${item.vigotaCount}</td>
                  <td>
                     ${item.fillerCount > 0 ? `${item.fillerCount}x ${item.fillerType}` : '-'}
                  </td>
                  <td class="detail-text">
                    ${item.vigotaSummary ? `<div style="margin-bottom: 4px;"><strong>Vigotas:</strong> ${item.vigotaSummary}</div>` : ''}
                    ${item.reinforcementSummary ? `<div style="margin-bottom: 4px;"><strong>Aço:</strong> ${item.reinforcementSummary}</div>` : ''}
                    ${item.vigotaDetails.map((d) => d.reinforcementText.map((t) => `<div style="padding-left: 8px; border-left: 2px solid #e2e8f0; margin-top: 2px;">${t}</div>`).join('')).join('')}
                  </td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }

        <div class="footer">
          Relatório gerado automaticamente por ProjLAJE.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      loadFromJSON(file)
      e.target.value = '' // Reset input
    }
  }

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6 shadow-sm z-10 relative">
      <div className="flex items-center gap-4">
        {!isDashboard ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-muted-foreground hover:text-primary"
            >
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <Input
                    value={nameInput}
                    onChange={handleNameChange}
                    onBlur={handleNameBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="h-8 w-48 md:w-64 font-semibold"
                  />
                ) : (
                  <h1
                    onClick={() => setIsEditingName(true)}
                    className="font-semibold text-lg text-slate-800 cursor-pointer hover:bg-slate-100 px-2 py-0.5 rounded transition-colors flex items-center gap-2"
                    title="Clique para editar"
                  >
                    {projectName || 'Sem Título'}
                  </h1>
                )}
                <span className="text-xs text-muted-foreground hidden sm:inline-block bg-slate-100 px-2 py-0.5 rounded">
                  v0.95
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="font-bold text-xl font-montserrat text-slate-800 flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 text-primary" />
            ProjLAJE
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isDashboard ? (
          <>
            <div className="hidden md:flex items-center gap-2 mr-2">
              {/* Toggle Slab Coloring */}
              <Button
                variant={colorBySlabType ? 'secondary' : 'outline'}
                size="sm"
                className={`gap-2 ${colorBySlabType ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300' : ''}`}
                onClick={() => setColorBySlabType(!colorBySlabType)}
                title="Colorir por Tipo de Laje"
              >
                <Palette className="h-4 w-4" />
                <span className="hidden xl:inline">Colorir Lajes</span>
              </Button>

              <div className="h-6 w-px bg-slate-200 mx-1" />

              {/* File Input for JSON Upload */}
              <input
                type="file"
                accept=".json"
                className="hidden"
                id="json-upload"
                onChange={handleFileUpload}
              />

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => document.getElementById('json-upload')?.click()}
              >
                <Upload className="h-4 w-4" />
                <span className="hidden lg:inline">Abrir</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={exportToJSON}
              >
                <Download className="h-4 w-4" />
                <span className="hidden lg:inline">Baixar JSON</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={handleExportPDF}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden lg:inline">Relatório PDF</span>
              </Button>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />

            <Button
              onClick={handleSave}
              disabled={isSaving || isLoadingProject}
              size="sm"
              className="gap-2 min-w-[100px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-1">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setColorBySlabType(!colorBySlabType)}
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Colorir por Tipo de Laje
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <LayoutTemplate className="mr-2 h-4 w-4" />
                  Voltar ao Painel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={resetView}>
                  Centralizar Vista
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="md:hidden">
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Relatório PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      document.getElementById('json-upload')?.click()
                    }
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Abrir JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToJSON}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
