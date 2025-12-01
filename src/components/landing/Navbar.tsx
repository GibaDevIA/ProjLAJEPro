import { Button } from '@/components/ui/button'
import { LayoutTemplate } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export const Navbar = () => {
  const navigate = useNavigate()

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <LayoutTemplate className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold font-montserrat text-slate-800">
            ProjLAJE
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
          >
            Como Funciona
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
          >
            Preços
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="font-medium"
            onClick={() => navigate('/login')}
          >
            Entrar
          </Button>
          <Button
            className="font-bold"
            onClick={() => scrollToSection('pricing')}
          >
            Começar Agora
          </Button>
        </div>
      </div>
    </header>
  )
}
