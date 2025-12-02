import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  getUsers,
  getAllPlans,
  updateUserRole,
  updateUserStatus,
  updateUserDetails,
  updateUserPlan,
  AdminProfile,
  Plan,
} from '@/services/admin'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Shield,
  ShieldAlert,
  Search,
  Loader2,
  Edit2,
  UserCheck,
  UserX,
  LayoutDashboard,
  LogOut,
  ArrowUpDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PER_PAGE = 10

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminProfile[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [totalUsers, setTotalUsers] = useState(0)

  // Filtering & Sorting
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'full_name' | 'email' | 'created_at'>(
    'created_at',
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Editing State
  const [editingUser, setEditingUser] = useState<AdminProfile | null>(null)
  const [editName, setEditName] = useState('')
  const [editIsAdmin, setEditIsAdmin] = useState(false)
  const [editPlanId, setEditPlanId] = useState('')
  const [savingUser, setSavingUser] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true)
    const { data, count, error } = await getUsers({
      page,
      perPage: PER_PAGE,
      sortBy,
      sortOrder,
      search: search.trim() || undefined,
    })

    if (error) {
      toast.error('Erro ao carregar usuários.')
      console.error(error)
    } else {
      setUsers(data || [])
      setTotalUsers(count || 0)
    }
    setLoadingUsers(false)
  }, [page, sortBy, sortOrder, search])

  const fetchPlans = useCallback(async () => {
    const { data, error } = await getAllPlans()
    if (error) {
      console.error('Error fetching plans:', error)
    } else {
      setPlans(data || [])
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchPlans()
  }, [fetchUsers, fetchPlans])

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const openEditDialog = (user: AdminProfile) => {
    setEditingUser(user)
    setEditName(user.full_name || '')
    setEditIsAdmin(user.is_admin)
    setEditPlanId(user.plan_id || '')
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    setSavingUser(true)

    try {
      let hasChanges = false

      if (editingUser.full_name !== editName) {
        await updateUserDetails(editingUser.id, editName)
        hasChanges = true
      }

      if (editingUser.is_admin !== editIsAdmin) {
        await updateUserRole(editingUser.id, editIsAdmin)
        hasChanges = true
      }

      if (editingUser.plan_id !== editPlanId && editPlanId) {
        const { error } = await updateUserPlan(editingUser.id, editPlanId)
        if (error) {
          toast.error('Erro ao atualizar plano.')
          console.error(error)
        } else {
          hasChanges = true
        }
      }

      if (hasChanges) {
        toast.success('Usuário atualizado com sucesso!')
        fetchUsers()
      } else {
        toast.info('Nenhuma alteração realizada.')
      }
      setEditingUser(null)
    } catch (error) {
      toast.error('Erro ao atualizar usuário.')
      console.error(error)
    } finally {
      setSavingUser(false)
    }
  }

  const handleToggleActive = async (user: AdminProfile) => {
    const newStatus = !user.is_active
    // Optimistic update
    setUsers(
      users.map((u) => (u.id === user.id ? { ...u, is_active: newStatus } : u)),
    )

    const { error } = await updateUserStatus(user.id, newStatus)
    if (error) {
      toast.error('Erro ao alterar status do usuário.')
      // Revert
      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, is_active: !newStatus } : u,
        ),
      )
    } else {
      toast.success(
        `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso.`,
      )
    }
  }

  const totalPages = Math.ceil(totalUsers / PER_PAGE)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-xl font-montserrat text-slate-800">
          <Shield className="h-6 w-6 text-indigo-600" />
          Admin Dashboard
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Voltar ao App
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            {user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Administração</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie usuários e configurações do sistema.
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-2">
              <ShieldAlert className="h-4 w-4" />
              Visão Geral do Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <span>Usuários Registrados ({totalUsers})</span>
                  <form
                    onSubmit={handleSearch}
                    className="relative w-full sm:w-64"
                  >
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </form>
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie permissões de acesso.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <Button
                                variant="ghost"
                                onClick={() => handleSort('full_name')}
                                className="font-bold"
                              >
                                Nome <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button
                                variant="ghost"
                                onClick={() => handleSort('email')}
                                className="font-bold"
                              >
                                Email <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button
                                variant="ghost"
                                onClick={() => handleSort('created_at')}
                                className="font-bold"
                              >
                                Criado em{' '}
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </Button>
                            </TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead className="text-center">Role</TableHead>
                            <TableHead className="text-center">
                              Status
                            </TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="h-24 text-center"
                              >
                                Nenhum usuário encontrado.
                              </TableCell>
                            </TableRow>
                          ) : (
                            users.map((u) => (
                              <TableRow key={u.id}>
                                <TableCell className="font-medium">
                                  {u.full_name || 'Sem nome'}
                                </TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                  {u.created_at
                                    ? format(
                                        new Date(u.created_at),
                                        'dd/MM/yyyy',
                                        { locale: ptBR },
                                      )
                                    : '-'}
                                </TableCell>
                                <TableCell>
                                  {u.plans?.name || 'Desconhecido'}
                                </TableCell>
                                <TableCell className="text-center">
                                  {u.is_admin ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                      Admin
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      User
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {u.is_active ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Ativo
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Inativo
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Editar Detalhes"
                                      onClick={() => openEditDialog(u)}
                                    >
                                      <Edit2 className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title={
                                        u.is_active ? 'Desativar' : 'Ativar'
                                      }
                                      onClick={() => handleToggleActive(u)}
                                    >
                                      {u.is_active ? (
                                        <UserX className="h-4 w-4 text-red-600" />
                                      ) : (
                                        <UserCheck className="h-4 w-4 text-green-600" />
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() =>
                                  setPage((p) => Math.max(1, p - 1))
                                }
                                className={
                                  page === 1
                                    ? 'pointer-events-none opacity-50'
                                    : 'cursor-pointer'
                                }
                              />
                            </PaginationItem>
                            {Array.from({ length: totalPages }).map((_, i) => (
                              <PaginationItem key={i}>
                                <PaginationLink
                                  isActive={page === i + 1}
                                  onClick={() => setPage(i + 1)}
                                  className="cursor-pointer"
                                >
                                  {i + 1}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  setPage((p) => Math.min(totalPages, p + 1))
                                }
                                className={
                                  page === totalPages
                                    ? 'pointer-events-none opacity-50'
                                    : 'cursor-pointer'
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Visão Geral do Sistema</CardTitle>
                <CardDescription>
                  Métricas e configurações gerais da plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg m-6">
                <ShieldAlert className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Em Desenvolvimento</p>
                <p className="text-sm">
                  Estatísticas e configurações globais serão implementadas aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit User Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações, plano e permissões do usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="plan">Plano de Assinatura</Label>
              <Select value={editPlanId} onValueChange={setEditPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.duration_days || 30} dias)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
              <div className="space-y-1">
                <Label htmlFor="is-admin">Acesso Administrativo</Label>
                <p className="text-xs text-muted-foreground">
                  Concede acesso total ao painel de administração.
                </p>
              </div>
              <Switch
                id="is-admin"
                checked={editIsAdmin}
                onCheckedChange={setEditIsAdmin}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={savingUser}>
              {savingUser ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
