import { Navbar } from '@/components/landing/Navbar'
import { PricingSection } from '@/components/landing/PricingSection'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <PricingSection />

        <section className="py-24 bg-background">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter mb-4">
              Dúvidas sobre os planos?
            </h2>
            <p className="text-muted-foreground max-w-[600px] mx-auto mb-8">
              Entre em contato com nossa equipe de suporte para esclarecer
              qualquer questão sobre as funcionalidades ou formas de pagamento.
            </p>
            <Button asChild variant="outline">
              <Link to="/contact">Fale Conosco</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-6 md:px-8 md:py-0 bg-secondary/20">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; 2025 ProjLAJE. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:underline">
              Termos
            </Link>
            <Link to="/privacy" className="hover:underline">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Pricing
