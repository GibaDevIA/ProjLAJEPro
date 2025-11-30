import { useAuth } from '@/context/AuthContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Plus, User, ArrowRight, LayoutTemplate } from 'lucide-react'
import { toast } from 'sonner'

const Dashboard = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        toast.error('Erro ao sair: ' + error.message)
      } else {
        navigate('/login')
      }
    } catch (e) {
      toast.error('Erro inesperado ao sair')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm">
        <div className="font-bold text-xl font-montserrat text-slate-800 flex items-center gap-2">
          <LayoutTemplate className="h-6 w-6 text-primary" />
          ProjLAJE
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            {user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="mb-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900">Bem-vindo!</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus projetos e perfil a partir deste painel.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* New Project Card */}
          <Card className="hover:shadow-lg transition-all duration-300 border-primary/20 cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                <Plus className="h-6 w-6 text-primary" />
                Novo Projeto
              </CardTitle>
              <CardDescription>
                Acesse o ambiente de desenho CAD para iniciar ou continuar um
                projeto de laje.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg">
                <Link to="/project">
                  Ir para Projetos <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                <User className="h-6 w-6 text-slate-700" />
                Meu Perfil
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais, altere sua senha e gerencie
                sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link to="/profile">Acessar Perfil</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
