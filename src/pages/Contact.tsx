import { Button } from '@/components/ui/button'
import { LayoutTemplate, ArrowLeft, Mail, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <LayoutTemplate className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold font-montserrat text-slate-800">
              ProjLAJE
            </span>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-slate-900">Fale Conosco</h1>
            <p className="text-lg text-slate-600">
              Estamos aqui para ajudar. Entre em contato conosco através dos
              canais abaixo para suporte, dúvidas ou parcerias.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow border-slate-200">
              <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Email</CardTitle>
                <CardDescription>Envie suas dúvidas por email</CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <a
                  href="mailto:sistemas.campos@gmail.com"
                  className="text-lg font-medium text-slate-900 hover:text-primary transition-colors break-all"
                >
                  sistemas.campos@gmail.com
                </a>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-slate-200">
              <CardHeader className="text-center">
                <div className="mx-auto bg-green-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
                  <Phone className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Telefone / WhatsApp</CardTitle>
                <CardDescription>Atendimento rápido</CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <a
                  href="tel:+5515997240924"
                  className="text-lg font-medium text-slate-900 hover:text-green-600 transition-colors"
                >
                  (15) 99724-0924
                </a>
              </CardContent>
            </Card>
          </div>

          <div className="text-center pt-8">
            <p className="text-slate-500 text-sm">
              Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
