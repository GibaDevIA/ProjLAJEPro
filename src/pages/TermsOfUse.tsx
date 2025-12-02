import { Button } from '@/components/ui/button'
import { LayoutTemplate, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function TermsOfUse() {
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
          Termos de Uso
        </h1>
        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                1. Aceitação dos Termos
              </h2>
              <p>
                Ao acessar e usar o ProjLAJE, você concorda em cumprir e estar
                vinculado aos seguintes termos e condições de uso. Se você não
                concordar com qualquer parte destes termos, você não deve usar
                nosso serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                2. Descrição do Serviço
              </h2>
              <p>
                O ProjLAJE é uma ferramenta online para desenho e cálculo de
                panos de laje. Fornecemos recursos para criar projetos, calcular
                materiais e exportar relatórios. Reservamo-nos o direito de
                modificar ou descontinuar o serviço a qualquer momento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                3. Uso Aceitável
              </h2>
              <p>
                Você concorda em usar o serviço apenas para fins legais e de
                acordo com estes termos. Você não deve usar o serviço de
                qualquer maneira que possa danificar, desativar, sobrecarregar
                ou prejudicar nossos servidores ou redes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                4. Contas e Assinaturas
              </h2>
              <p>
                Para acessar certos recursos, você pode precisar criar uma
                conta. Você é responsável por manter a confidencialidade de sua
                senha. Assinaturas pagas são renovadas automaticamente, a menos
                que sejam canceladas antes do final do período atual.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                5. Propriedade Intelectual
              </h2>
              <p>
                Todo o conteúdo, recursos e funcionalidades do serviço são de
                propriedade exclusiva do ProjLAJE e estão protegidos por leis de
                direitos autorais e propriedade intelectual. Os projetos criados
                por você são de sua propriedade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                6. Limitação de Responsabilidade
              </h2>
              <p>
                O serviço é fornecido "como está". Não garantimos que o serviço
                será ininterrupto ou livre de erros. Em nenhuma circunstância o
                ProjLAJE será responsável por quaisquer danos diretos,
                indiretos, incidentais ou consequenciais decorrentes do uso do
                serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">
                7. Alterações nos Termos
              </h2>
              <p>
                Podemos revisar estes termos a qualquer momento. Ao continuar a
                usar o serviço após essas alterações, você concorda em ficar
                vinculado aos termos revisados.
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
