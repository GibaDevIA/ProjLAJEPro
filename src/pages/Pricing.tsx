import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  getPlans,
  createCheckoutSession,
  getPlanByName,
  Plan,
} from '@/services/subscription'
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
import {
  Loader2,
  Check,
  LayoutTemplate,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react'
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

    setProcessingId(plan.id)
    try {
      let stripePriceId = plan.stripe_price_id

      // Dynamic retrieval and validation for "Profissional" plan
      if (plan.name === 'Profissional') {
        const { data: professionalPlan, error: planError } =
          await getPlanByName('Profissional')

        if (
          planError ||
          !professionalPlan ||
          !professionalPlan.is_active ||
          !professionalPlan.stripe_price_id
        ) {
          toast.error(
            'Erro ao iniciar checkout: Plano Profissional não encontrado.',
          )
          setProcessingId(null)
          return
        }
        stripePriceId = professionalPlan.stripe_price_id
      }

      if (!stripePriceId) {
        setProcessingId(null)
        return
      }

      const { data, error } = await createCheckoutSession(stripePriceId)

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

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      'Olá! Gostaria de saber mais sobre o plano Premium do ProjLAJE.',
    )
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank')
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              onClick={handleWhatsAppContact}
            >
              <MessageCircle className="h-4 w-4" />
              Fale no WhatsApp
            </Button>
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
            const isProfessional =
              plan.name === 'Profissional' ||
              plan.name.toLowerCase().includes('professional')
            const isFree = plan.price === 0

            // Display max projects if available (it might be in future plans)
            const maxProjects = (plan as any).max_projects

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
                    {maxProjects !== null && maxProjects !== undefined && (
                      <li className="flex items-center gap-2 text-slate-600">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">
                          Limite de {maxProjects} projetos
                        </span>
                      </li>
                    )}
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

                <CardFooter className="flex flex-col gap-3">
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
                  {isProfessional && !isCurrentPlan && (
                    <Button
                      className="w-full text-green-700 border-green-200 hover:bg-green-50"
                      variant="outline"
                      onClick={handleWhatsAppContact}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Assinar via WhatsApp
                    </Button>
                  )}
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
