import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Loader2 } from 'lucide-react'

const ResetPassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword, session } = useAuth()
  const navigate = useNavigate()

  // Check if user is authenticated (which happens automatically via magic link)
  useEffect(() => {
    if (!session && !loading) {
      // If not session, likely accessed directly without magic link or link expired
      // However, AuthContext loading might take a moment initially.
      // We let the user see the form, but submission will fail if not auth.
    }
  }, [session, loading])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('As senhas não conferem.')
      return
    }

    if (!session) {
      toast.error('Sessão inválida ou expirada. Solicite um novo link.')
      return
    }

    setLoading(true)

    try {
      const { error } = await updatePassword(password)
      if (error) {
        toast.error('Erro ao redefinir senha: ' + error.message)
      } else {
        toast.success('Senha redefinida com sucesso! Faça login.')
        navigate('/login')
      }
    } catch (error) {
      toast.error('Ocorreu um erro inesperado.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Redefinir Senha
          </CardTitle>
          <CardDescription className="text-center">
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleReset}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Redefinir Senha
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default ResetPassword
