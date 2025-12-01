import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export const HeroSection = () => {
  const scrollToPricing = () => {
    const element = document.getElementById('pricing')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            ProjLAJE — Desenhe panos de laje em minutos,
            <span className="text-primary block mt-2">
              sem precisar de CAD.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            O ProjLAJE automatiza todo o processo: você coloca as medidas e o
            sistema gera os panos, calcula vigotas, áreas e materiais
            automaticamente. Arraste os panos no projeto, veja tudo se encaixar
            — simples, rápido e 100% online.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              className="h-12 px-8 text-lg w-full sm:w-auto"
              onClick={scrollToPricing}
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-lg w-full sm:w-auto"
              onClick={() =>
                document
                  .getElementById('how-it-works')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Como Funciona
            </Button>
          </div>

          <div className="pt-8 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Sem instalação necessária
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Exportação PDF e JPG
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Cálculo automático de materiais
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-10 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] bg-blue-400/30 rounded-full blur-3xl" />
      </div>
    </section>
  )
}
