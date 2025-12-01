import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  getSubscription,
  getPlans,
  createCheckoutSession,
  createPortalSession,
  Subscription as SubscriptionType,
  Plan,
} from '@/services/subscription'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Loader2,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

export default function Subscription() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<
    (SubscriptionType & { plans: Plan }) | null
  >(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [processing, setProcessing] = useState(false)

  // Fetch user subscription
  const fetchSubscription = useCallback(async () => {
    setLoading(true)
    if (user) {
      const { data, error } = await getSubscription(user.id)
      if (error) {
        toast.error('Erro ao carregar assinatura.')
      } else {
        setSubscription(data)
      }
    }
    setLoading(false)
  }, [user])

  // Fetch available plans
  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await getPlans()
      if (!error && data) {
        setPlans(data)
      }
    }
    fetchPlans()
  }, [])

  useEffect(() => {
    if (user) {
      fetchSubscription()
    }
  }, [user, fetchSubscription])

  const handleUpgrade = async () => {
    setProcessing(true)
    try {
      // Find the Professional plan dynamically
      // We check for both 'Professional' (English) and 'Profissional' (Portuguese) to be safe
      const professionalPlan = plans.find(
        (p) => p.name === 'Professional' || p.name === 'Profissional',
      )

      if (!professionalPlan) {
        throw new Error('Plano Profissional não encontrado.')
      }

      if (!professionalPlan.stripe_price_id) {
        throw new Error('ID do preço Stripe não configurado para este plano.')
      }

      const { data, error } = await createCheckoutSession(
        professionalPlan.stripe_price_id,
      )

      if (error) throw error
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      toast.error(
        'Erro ao iniciar checkout: ' + (error.message || 'Erro desconhecido'),
      )
    } finally {
      setProcessing(false)
    }
  }

  const handleManageBilling = async () => {
    setProcessing(true)
    try {
      const { data, error } = await createPortalSession()

      if (error) throw error
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      toast.error(
        'Erro ao abrir portal: ' + (error.message || 'Erro desconhecido'),
      )
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const planName = subscription?.plans?.name || 'Plano Gratuito'
  const isTrial = subscription?.status === 'trialing'
  const isPro =
    subscription?.plans?.name === 'Profissional' &&
    subscription?.status === 'active'
  const limit = subscription?.plans?.max_panos_per_project
  const limitDisplay = limit ? `${limit} panos` : 'Ilimitado'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b h-16 flex items-center px-4 lg:px-8 mb-8">
        <Button variant="ghost" asChild className="gap-2">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </header>

      <div className="container max-w-4xl mx-auto px-4 space-y-8 pb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Minha Assinatura
          </h1>
          <p className="text-muted-foreground">
            Gerencie seu plano, cobranças e limites.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Plan Details Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{planName}</CardTitle>
                  <CardDescription>
                    {subscription?.plans?.description}
                  </CardDescription>
                </div>
                <Badge
                  variant={isPro ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  {subscription?.status === 'active'
                    ? 'Ativo'
                    : subscription?.status === 'trialing'
                      ? 'Em Teste'
                      : subscription?.status === 'past_due'
                        ? 'Pagamento Pendente'
                        : subscription?.status === 'canceled'
                          ? 'Cancelado'
                          : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">
                    Limite de Panos/Projeto
                  </span>
                  <p className="font-medium">{limitDisplay}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Valor</span>
                  <p className="font-medium">
                    {subscription?.plans?.price
                      ? `R$ ${subscription.plans.price}/mês`
                      : 'Gratuito'}
                  </p>
                </div>
              </div>

              {isTrial && subscription?.trial_end && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Período de Teste
                    </p>
                    <p className="text-xs text-amber-700">
                      Seu teste gratuito expira em{' '}
                      {format(
                        new Date(subscription.trial_end),
                        "dd 'de' MMMM",
                        { locale: ptBR },
                      )}
                      . Faça o upgrade para continuar usando todos os recursos.
                    </p>
                  </div>
                </div>
              )}

              {subscription?.current_period_end && (
                <p className="text-sm text-muted-foreground">
                  Próxima renovação:{' '}
                  {format(
                    new Date(subscription.current_period_end),
                    'dd/MM/yyyy',
                    { locale: ptBR },
                  )}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex gap-3 justify-end">
              {!isPro && (
                <Button
                  onClick={handleUpgrade}
                  disabled={processing}
                  className="bg-gradient-to-r from-indigo-600 to-primary"
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Upgrade para Profissional
                </Button>
              )}
              {(isPro || subscription?.stripe_subscription_id) && (
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Gerenciar Assinatura
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Benefits / Promo Card */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <CardHeader>
              <CardTitle className="text-lg">Plano Profissional</CardTitle>
              <CardDescription className="text-slate-300">
                Desbloqueie todo o potencial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Projetos Ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Exportação PDF e JPG
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Cálculo de Materiais Avançado
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Suporte Prioritário
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Billing History Placeholder */}
        <div className="pt-8">
          <h3 className="text-lg font-semibold mb-4">Histórico de Cobrança</h3>
          <Card>
            <CardContent className="p-0">
              <div className="text-center py-8 text-muted-foreground text-sm">
                Para ver faturas detalhadas e recibos, acesse o portal de
                gerenciamento.
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 p-4 justify-center">
              <Button
                variant="link"
                onClick={handleManageBilling}
                disabled={processing}
              >
                Acessar Portal Financeiro
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
