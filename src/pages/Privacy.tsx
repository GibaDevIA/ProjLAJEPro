import { Button } from '@/components/ui/button'
import { LayoutTemplate, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
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

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Política de Privacidade
        </h1>
        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                1. Coleta de Informações
              </h2>
              <p>
                Coletamos informações que você nos fornece diretamente, como
                quando você cria uma conta, atualiza seu perfil ou utiliza
                nossos serviços de desenho. Isso pode incluir seu nome, endereço
                de e-mail e dados de projetos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                2. Uso das Informações
              </h2>
              <p>
                Utilizamos as informações coletadas para operar, manter e
                melhorar nossos serviços, processar transações, enviar
                notificações técnicas e responder a seus comentários e
                solicitações de suporte.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                3. Compartilhamento de Informações
              </h2>
              <p>
                Não vendemos ou alugamos suas informações pessoais para
                terceiros. Podemos compartilhar informações com prestadores de
                serviços que nos ajudam a operar nosso negócio, sujeitos a
                obrigações de confidencialidade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                4. Segurança de Dados
              </h2>
              <p>
                Adotamos medidas de segurança adequadas para proteger contra
                acesso não autorizado, alteração, divulgação ou destruição de
                suas informações pessoais e dados de projetos armazenados em
                nossos servidores.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                5. Cookies e Tecnologias Semelhantes
              </h2>
              <p>
                Utilizamos cookies para melhorar sua experiência, entender como
                o serviço é usado e personalizar conteúdo. Você pode configurar
                seu navegador para recusar cookies, mas isso pode afetar a
                funcionalidade do serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                6. Seus Direitos
              </h2>
              <p>
                Você tem o direito de acessar, corrigir ou excluir suas
                informações pessoais. Você pode gerenciar suas informações
                através das configurações de sua conta ou entrando em contato
                conosco.
              </p>
            </section>

            <p className="text-sm text-slate-500 mt-8">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
