import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import {
  LogOut,
  Plus,
  User,
  LayoutTemplate,
  Loader2,
  FileEdit,
  Trash2,
  CreditCard,
  AlertTriangle,
  Lock,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { getProjects, createProject, deleteProject } from '@/services/projects'
import { Project } from '@/services/projects'
import {
  getSubscription,
  checkMaxProjectsLimit,
  isSubscriptionActive,
  Subscription,
  Plan,
} from '@/services/subscription'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

const Dashboard = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  // Subscription State
  const [subscription, setSubscription] = useState<
    (Subscription & { plans: Plan }) | null
  >(null)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  // Create Project State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)

  // Delete Project State
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true)
    const { data, error } = await getProjects()
    if (error) {
      toast.error('Erro ao carregar projetos.')
      console.error(error)
    } else {
      setProjects(data || [])
    }
    setLoadingProjects(false)
  }, [])

  const fetchSubscription = useCallback(async () => {
    if (!user) return
    const { data, error } = await getSubscription(user.id)
    if (error) {
      console.error('Error fetching subscription:', error)
    } else if (data) {
      setSubscription(data)

      const { isActive } = isSubscriptionActive(data)
      setIsExpired(!isActive)

      if (data.status === 'trialing' && data.trial_end) {
        const end = parseISO(data.trial_end)
        const now = new Date()
        const diff = differenceInDays(end, now)
        setDaysRemaining(diff)
      }
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchProjects()
      fetchSubscription()
    }
  }, [user, fetchProjects, fetchSubscription])

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

  const openCreateDialog = async () => {
    if (!user) return

    if (isExpired) {
      toast.error('Sua assinatura expirou. Renove para criar novos projetos.')
      return
    }

    // Check Limits
    const limitCheck = await checkMaxProjectsLimit(user.id)
    if (limitCheck.error) {
      toast.error('Erro ao verificar limites do plano.')
      return
    }

    if (limitCheck.allowed === false) {
      if (limitCheck.reason === 'expired') {
        toast.error('Sua assinatura expirou.')
        setIsExpired(true)
        return
      }
      toast.error(
        `Você atingiu o limite de ${limitCheck.limit} projetos do seu plano atual.`,
      )
      return
    }

    setIsCreateDialogOpen(true)
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) {
      toast.error('O nome do projeto é obrigatório.')
      return
    }

    setCreatingProject(true)
    const { data, error } = await createProject(newProjectName)

    if (error) {
      toast.error('Erro ao criar projeto: ' + error.message)
      setCreatingProject(false)
    } else if (data) {
      toast.success('Projeto criado com sucesso!')
      setIsCreateDialogOpen(false)
      setNewProjectName('')
      navigate(`/project/${data.id}`)
    }
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) return

    const { error } = await deleteProject(projectToDelete)
    if (error) {
      toast.error('Erro ao excluir projeto.')
    } else {
      toast.success('Projeto excluído.')
      fetchProjects() // Refresh list
    }
    setProjectToDelete(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm">
        <div className="font-bold text-xl font-montserrat text-slate-800 flex items-center gap-2">
          <LayoutTemplate className="h-6 w-6 text-primary" />
          ProjLAJE
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            {user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="mb-8 max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900">Bem-vindo!</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus projetos e perfil a partir deste painel.
          </p>
        </div>

        {/* Status Notifications */}
        <div className="max-w-5xl mx-auto mb-8 space-y-4">
          {/* Expired Notification */}
          {isExpired && (
            <Alert
              variant="destructive"
              className="bg-red-50 border-red-200 text-red-800"
            >
              <Lock className="h-4 w-4" />
              <AlertTitle>Assinatura Expirada</AlertTitle>
              <AlertDescription className="flex justify-between items-center flex-wrap gap-2">
                <span>
                  Sua assinatura ou período de avaliação expirou. Você pode
                  visualizar seus projetos, mas não pode criar novos ou editar
                  os existentes.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white whitespace-nowrap hover:bg-red-50 border-red-200"
                  asChild
                >
                  <Link to="/pricing">Renovar Agora</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Free Trial Notification */}
          {!isExpired &&
            subscription &&
            subscription.status === 'trialing' &&
            daysRemaining !== null && (
              <Alert
                variant={daysRemaining <= 3 ? 'destructive' : 'default'}
                className={
                  daysRemaining <= 3
                    ? 'bg-orange-50 border-orange-200 text-orange-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Período de Avaliação</AlertTitle>
                <AlertDescription className="flex justify-between items-center flex-wrap gap-2">
                  <span>
                    Você está usando o plano Free Trial. Seu acesso de avaliação
                    expira em <strong>{Math.max(0, daysRemaining)} dias</strong>
                    .
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white whitespace-nowrap"
                    asChild
                  >
                    <Link to="/pricing">Assinar Agora</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {/* New Project Card */}
          <Card
            className={cn(
              'transition-all duration-300 border-primary/20 group',
              isExpired
                ? 'bg-gray-100 cursor-not-allowed opacity-80'
                : 'hover:shadow-lg cursor-pointer bg-blue-50/50',
            )}
            onClick={isExpired ? undefined : openCreateDialog}
          >
            <CardHeader>
              <CardTitle
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  isExpired ? 'text-gray-500' : 'group-hover:text-primary',
                )}
              >
                {isExpired ? (
                  <Lock className="h-6 w-6" />
                ) : (
                  <Plus className="h-6 w-6 text-primary" />
                )}
                Novo Projeto
              </CardTitle>
              <CardDescription>
                {isExpired
                  ? 'Assinatura expirada.'
                  : 'Inicie um novo projeto de laje do zero.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={isExpired}>
                {isExpired ? 'Bloqueado' : 'Começar'}
              </Button>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                <User className="h-6 w-6 text-slate-700" />
                Meu Perfil
              </CardTitle>
              <CardDescription>Gerencie conta e senha.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/profile">Acessar Perfil</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                <CreditCard className="h-6 w-6 text-slate-700" />
                Assinatura
              </CardTitle>
              <CardDescription>
                {subscription?.plans?.name || 'Gerencie seu plano'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/dashboard/subscription">Ver Assinatura</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* My Projects Section */}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Meus Projetos</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProjects}
              disabled={loadingProjects}
            >
              Atualizar
            </Button>
          </div>

          {loadingProjects ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <LayoutTemplate className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-slate-900">
                  Nenhum projeto encontrado
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isExpired
                    ? 'Você não possui projetos criados.'
                    : 'Crie seu primeiro projeto para começar a desenhar.'}
                </p>
                {!isExpired && (
                  <Button onClick={openCreateDialog}>Criar Novo Projeto</Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="hover:shadow-md transition-shadow flex flex-col"
                >
                  <CardHeader className="pb-2">
                    <CardTitle
                      className="text-lg truncate"
                      title={project.name}
                    >
                      {project.name}
                    </CardTitle>
                    <CardDescription>
                      Atualizado em{' '}
                      {project.updated_at
                        ? format(
                            new Date(project.updated_at),
                            "dd/MM/yyyy 'às' HH:mm",
                            { locale: ptBR },
                          )
                        : 'N/A'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 flex-1">
                    {/* Placeholder for thumbnail or summary stats if available in future */}
                    <div className="h-24 bg-gray-100 rounded flex items-center justify-center text-muted-foreground text-xs">
                      Pré-visualização não disponível
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0 mt-auto flex gap-2">
                    <Button
                      asChild
                      className="flex-1"
                      variant={isExpired ? 'secondary' : 'default'}
                      size="sm"
                    >
                      <Link to={`/project/${project.id}`}>
                        {isExpired ? (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </>
                        ) : (
                          <>
                            <FileEdit className="mr-2 h-4 w-4" />
                            Abrir
                          </>
                        )}
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setProjectToDelete(project.id)}
                      disabled={isExpired}
                      title={
                        isExpired
                          ? 'Não é possível excluir projetos expirados'
                          : 'Excluir projeto'
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Projeto</DialogTitle>
            <DialogDescription>
              Dê um nome para o seu novo projeto de laje.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Projeto</Label>
                <Input
                  id="name"
                  placeholder="Ex: Laje Residencial Silva"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creatingProject}>
                {creatingProject && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar Projeto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O projeto será permanentemente
              removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Dashboard
