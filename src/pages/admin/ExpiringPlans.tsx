import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  getExpiringSubscriptions,
  ExpiringSubscription,
} from '@/services/admin'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Clock, Loader2, ArrowLeft, Mail, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ExpiringPlans() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<ExpiringSubscription[]>([])
  const [loading, setLoading] = useState(true)

  const fetchExpiring = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getExpiringSubscriptions(30) // Next 30 days

    if (error) {
      toast.error('Erro ao carregar assinaturas expirando.')
      console.error(error)
    } else {
      setSubscriptions(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchExpiring()
  }, [fetchExpiring])

  const getDaysRemaining = (dateStr: string) => {
    const end = new Date(dateStr)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    return differenceInDays(end, now)
  }

  const getStatusColor = (days: number) => {
    if (days <= 3) return 'text-red-600 font-bold'
    if (days <= 7) return 'text-orange-600 font-semibold'
    return 'text-slate-600'
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-xl font-montserrat text-slate-800">
          <Clock className="h-6 w-6 text-orange-500" />
          Planos Expirando
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Painel Admin
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Assinaturas Profissionais em Vencimento
          </h1>
          <p className="text-muted-foreground mt-2">
            Usuários com planos Professional expirando nos próximos 30 dias.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Próximos Vencimentos ({subscriptions.length})
            </CardTitle>
            <CardDescription>
              Monitore e gerencie renovações. Notificações automáticas são
              enviadas com 7 e 3 dias de antecedência.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Dias Restantes</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Nenhuma assinatura expirando nos próximos 30 dias.
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptions.map((sub) => {
                        const days = getDaysRemaining(sub.current_period_end)
                        return (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">
                              {sub.profiles?.full_name || 'Sem nome'}
                            </TableCell>
                            <TableCell>{sub.profiles?.email}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {sub.plans?.name}
                              </span>
                            </TableCell>
                            <TableCell>
                              {format(
                                new Date(sub.current_period_end),
                                'dd/MM/yyyy',
                                { locale: ptBR },
                              )}
                            </TableCell>
                            <TableCell className={getStatusColor(days)}>
                              {days === 0
                                ? 'Hoje'
                                : days < 0
                                  ? 'Expirado'
                                  : `${days} dias`}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  window.location.href = `mailto:${sub.profiles?.email}?subject=Renovação de Assinatura ProjLAJE`
                                }}
                                title="Enviar email manual"
                              >
                                <Mail className="h-4 w-4 text-slate-500" />
                                <span className="sr-only">Email</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
