import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, LayoutTemplate } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localLoading, setLocalLoading] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (localLoading) return

    setLocalLoading(true)

    try {
      // signIn now waits for profile check (is_active)
      const { error } = await signIn(email, password)

      if (error) {
        // Error is already toasted in AuthContext for inactive users,
        // but we can toast generic errors here if needed.
        // Usually AuthContext returns specific error objects.
        if (error.message !== 'Conta inativa.') {
          toast.error('Erro ao fazer login: ' + error.message)
        }
      } else {
        toast.success('Login realizado com sucesso!')
        navigate('/dashboard')
      }
    } catch (error) {
      toast.error('Ocorreu um erro inesperado.')
      console.error(error)
    } finally {
      setLocalLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        toast.error('Erro ao iniciar login com Google: ' + error.message)
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro inesperado.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary p-2 rounded-lg">
              <LayoutTemplate className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-montserrat text-slate-800">
              ProjLAJE
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Bem-vindo de volta
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Entre com suas credenciais para acessar sua conta
          </p>
        </div>

        <Card className="shadow-xl border-slate-200">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-xl font-semibold text-center">
              Login
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={localLoading}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={localLoading}
                  className="bg-white"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full font-semibold"
                disabled={localLoading}
              >
                {localLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Entrar
              </Button>

              <div className="relative w-full py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Ou continue com
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-white"
                onClick={handleGoogleLogin}
                disabled={localLoading}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                  ></path>
                </svg>
                Google
              </Button>

              <div className="text-center text-sm text-muted-foreground mt-4">
                Não tem uma conta?{' '}
                <Link
                  to="/register"
                  className="text-primary hover:underline font-medium"
                >
                  Registre-se
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default Login
