import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { Loader2, ArrowLeft } from 'lucide-react'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { resetPasswordForEmail } = useAuth()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await resetPasswordForEmail(email)
      if (error) {
        toast.error('Erro ao enviar email: ' + error.message)
      } else {
        setSubmitted(true)
        toast.success('Email de recuperação enviado!')
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
            Recuperar Senha
          </CardTitle>
          <CardDescription className="text-center">
            {submitted
              ? 'Verifique seu email para continuar'
              : 'Digite seu email para receber o link de recuperação'}
          </CardDescription>
        </CardHeader>
        {submitted ? (
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Se um conta existir para <strong>{email}</strong>, você receberá
              um link para redefinir sua senha em breve.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSubmitted(false)}
            >
              Tentar outro email
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleReset}>
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
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Enviar Link
              </Button>
            </CardFooter>
          </form>
        )}
        <CardFooter className="pt-0 justify-center">
          <Link
            to="/login"
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ForgotPassword
