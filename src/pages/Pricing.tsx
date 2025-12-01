import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getPlans, createCheckoutSession, Plan } from '@/services/subscription'
import { getProfile } from '@/services/profile'
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
import { Loader2, Check, LayoutTemplate, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const Pricing = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch Plans
        const { data: plansData, error: plansError } = await getPlans()
        if (plansError) {
          toast.error('Erro ao carregar planos.')
          console.error(plansError)
        } else {
          setPlans(plansData || [])
        }

        // Fetch Current User Plan if authenticated
        if (user) {
          const { data: profile, error: profileError } = await getProfile(
            user.id,
          )
          if (profile) {
            setCurrentPlanId(profile.plan_id)
          } else if (profileError) {
            console.error(profileError)
          }
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      navigate(
        '/register?plan=' +
          (plan.name === 'Profissional' ? 'professional' : 'free'),
      )
      return
    }

    if (!plan.stripe_price_id) {
      // Assuming free plan doesn't have a stripe price ID for checkout or it's handled differently
      // If it's a free plan, maybe just updating the profile plan_id is enough?
      // For this user story, we focus on "Subscribe to a selected plan" which usually implies payment.
      // If the user selects a free plan while on a paid plan, they might need to cancel via portal.
      // But here we assume we are selecting a paid plan.
      return
    }

    setProcessingId(plan.id)
    try {
      const { data, error } = await createCheckoutSession(plan.stripe_price_id)

      if (error) {
        toast.error(
          'Erro ao iniciar checkout: ' + (error.message || 'Erro desconhecido'),
        )
      } else if (data?.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error(error)
      toast.error('Ocorreu um erro inesperado.')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Simple Header */}
      <header className="bg-white border-b h-16 flex items-center px-4 lg:px-8 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <LayoutTemplate className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold font-montserrat text-slate-800">
              ProjLAJE
            </span>
          </div>
          {user ? (
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Ir para Dashboard
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Entrar
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Planos e Preços
          </h1>
          <p className="text-lg text-slate-600">
            Escolha o plano ideal para suas necessidades. Desbloqueie recursos
            avançados e potencialize seus projetos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto justify-center">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlanId === plan.id
            const isProfessional = plan.name === 'Profissional'
            const isFree = plan.price === 0

            return (
              <Card
                key={plan.id}
                className={`flex flex-col relative ${
                  isProfessional
                    ? 'border-primary shadow-xl scale-105 z-10'
                    : 'border-slate-200 shadow-md'
                }`}
              >
                {isProfessional && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-white px-3 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="min-h-[40px] flex items-center">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4 min-h-[64px] flex items-center">
                    {isFree ? (
                      <span className="text-4xl font-extrabold text-slate-900">
                        Grátis
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-primary">
                          R$ {plan.price}
                        </span>
                        <span className="text-slate-500">/mês</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-slate-600">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm">
                        {plan.max_panos_per_project
                          ? `Até ${plan.max_panos_per_project} panos por projeto`
                          : 'Panos ilimitados'}
                      </span>
                    </li>
                    {isProfessional && (
                      <>
                        <li className="flex items-center gap-2 text-slate-600">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm">Exportação PDF e JPG</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-600">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm">
                            Cálculo automático de materiais
                          </span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-600">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm">Suporte prioritário</span>
                        </li>
                      </>
                    )}
                    {isFree && (
                      <>
                        <li className="flex items-center gap-2 text-slate-600">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm">Exportação em JPG</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-600">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm">Ferramentas básicas</span>
                        </li>
                      </>
                    )}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={
                      isCurrentPlan
                        ? 'secondary'
                        : isProfessional
                          ? 'default'
                          : 'outline'
                    }
                    onClick={() => !isCurrentPlan && handleSubscribe(plan)}
                    disabled={
                      isCurrentPlan ||
                      !!processingId ||
                      (isFree && user !== null)
                    }
                  >
                    {processingId === plan.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      'Plano Atual'
                    ) : isFree && user ? (
                      'Plano Gratuito'
                    ) : isFree ? (
                      'Começar Grátis'
                    ) : (
                      'Assinar Agora'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default Pricing
