import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-secondary/20">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Planos e Preços
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Escolha o plano ideal para sua necessidade. Comece gratuitamente.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 mt-12 md:grid-cols-2 lg:gap-8 lg:max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="flex flex-col p-6 bg-background rounded-xl shadow-lg border border-border">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Gratuito 7 dias</h3>
              <p className="text-muted-foreground">
                Perfeito para testar a ferramenta.
              </p>
            </div>
            <div className="mt-4 flex items-baseline text-5xl font-bold">
              R$ 0
              <span className="ml-2 text-xl font-medium text-muted-foreground">
                / 7 dias
              </span>
            </div>
            <ul className="mt-6 space-y-4 flex-1">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Acesso total por 7 dias</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Até 20 panos por projeto</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Até 5 projetos</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Exportação de imagens</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Relatórios de vigotas e enchimentos</span>
              </li>
            </ul>
            <div className="mt-8">
              <Button asChild className="w-full" variant="outline" size="lg">
                <Link to="/register">Começar Agora</Link>
              </Button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="flex flex-col p-6 bg-background rounded-xl shadow-lg border-2 border-primary relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
              Mais Popular
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Profissional</h3>
              <p className="text-muted-foreground">
                Para engenheiros e projetistas ativos.
              </p>
            </div>
            <div className="mt-4 flex items-baseline text-5xl font-bold">
              R$ 147
              <span className="ml-2 text-xl font-medium text-muted-foreground">
                / mês
              </span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground line-through">
              De R$ 297 por mês
            </div>
            <ul className="mt-6 space-y-4 flex-1">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Projetos ilimitados</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Panos ilimitados</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Todas as ferramentas de desenho</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Suporte prioritário</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Atualizações antecipadas</span>
              </li>
            </ul>
            <div className="mt-8">
              <Button asChild className="w-full" size="lg">
                <Link to="/register?plan=professional">
                  Assinar Profissional
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
