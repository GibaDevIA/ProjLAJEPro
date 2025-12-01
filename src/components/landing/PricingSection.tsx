import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const plans = [
  {
    name: 'Gratuito 7 dias',
    priceDisplay: (
      <span className="text-4xl font-extrabold text-slate-900">R$ 0</span>
    ),
    description: 'Gratuito 7 dias, até 5 panos por projeto.',
    features: [
      'Até 3 projetos',
      'Ferramentas básicas de desenho',
      'Exportação em JPG',
      'Suporte comunitário',
    ],
    buttonText: 'Começar Grátis',
    highlight: false,
  },
  {
    name: 'Profissional',
    priceDisplay: (
      <div className="flex flex-col">
        <span className="text-sm text-slate-500 line-through font-medium">
          de R$ 297
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm text-slate-600 font-bold">por</span>
          <span className="text-4xl font-extrabold text-primary">R$ 147</span>
          <span className="text-slate-500">/mês</span>
        </div>
      </div>
    ),
    description: 'Para arquitetos e engenheiros autônomos.',
    features: [
      'Projetos ilimitados',
      'Exportação em PDF e JPG',
      'Cálculo automático de materiais',
      'Suporte prioritário',
    ],
    buttonText: 'Assinar Profissional',
    highlight: true,
  },
]

export const PricingSection = () => {
  const navigate = useNavigate()

  return (
    <section id="pricing" className="py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
            Planos e Preços
          </h2>
          <p className="text-lg text-slate-600">
            Escolha o plano ideal para suas necessidades. Comece pequeno e
            cresça conforme sua demanda.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`flex flex-col ${
                plan.highlight
                  ? 'border-primary shadow-xl scale-105 z-10'
                  : 'border-slate-200 shadow-md'
              }`}
            >
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-800">
                  {plan.name}
                </CardTitle>
                <CardDescription className="min-h-[40px] flex items-center">
                  {plan.description}
                </CardDescription>
                <div className="mt-4 min-h-[64px] flex items-center">
                  {plan.priceDisplay}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-slate-600"
                    >
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.highlight ? 'default' : 'outline'}
                  onClick={() => navigate('/register')}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
