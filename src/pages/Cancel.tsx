import { useNavigate } from 'react-router-dom'
import { XCircle, LayoutTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const Cancel = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardHeader className="flex flex-col items-center space-y-4 pb-2">
          <div className="bg-red-100 p-3 rounded-full">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-700">
            Pagamento Cancelado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            O processo de pagamento foi cancelado. Nenhuma cobrança foi
            realizada em seu cartão.
          </p>
          <p className="text-sm text-muted-foreground">
            Se você teve algum problema durante o pagamento, por favor tente
            novamente ou entre em contato com o suporte.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 justify-center pb-8">
          <Button
            size="lg"
            className="w-full font-semibold"
            onClick={() => navigate('/pricing')}
          >
            Tentar Novamente
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/dashboard')}
          >
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Cancel
