import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, LayoutTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'

const Success = () => {
  const navigate = useNavigate()

  useEffect(() => {
    toast.success('Pagamento confirmado com sucesso!')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardHeader className="flex flex-col items-center space-y-4 pb-2">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">
            Pagamento Confirmado!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            Obrigado por assinar o ProjLAJE. Seu plano foi atualizado com
            sucesso e você já pode aproveitar todos os benefícios.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-8">
          <Button
            size="lg"
            className="w-full font-semibold"
            onClick={() => navigate('/dashboard')}
          >
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Ir para o Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Success
