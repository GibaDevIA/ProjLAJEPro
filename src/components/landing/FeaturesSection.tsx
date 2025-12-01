import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Layout,
  MousePointerClick,
  FileOutput,
  Smartphone,
  Zap,
} from 'lucide-react'

const features = [
  {
    icon: MousePointerClick,
    title: 'Intuitivo e Preciso',
    description:
      'Crie desenhos técnicos com precisão milimétrica utilizando ferramentas de snap, grid e medidas exatas.',
  },
  {
    icon: Layout,
    title: 'Fluxo Otimizado',
    description:
      'Interface familiar, com comandos de linha, retângulo e polígono otimizados para produtividade.',
  },
  {
    icon: FileOutput,
    title: 'Relatórios Automáticos',
    description:
      'Gere automaticamente o quantitativo de vigotas, áreas de laje e materiais necessários para a obra.',
  },
  {
    icon: Zap,
    title: 'Eficiência no Design',
    description:
      'Acelere seu processo de criação com atalhos inteligentes e uma interface limpa focada no que importa.',
  },
  {
    icon: Smartphone,
    title: 'Acesse de Qualquer Lugar',
    description:
      'Sendo baseado na nuvem, seus projetos estão disponíveis em qualquer dispositivo, sem instalações pesadas.',
  },
]

export const FeaturesSection = () => {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
            Como Funciona
          </h2>
          <p className="text-lg text-slate-600">
            O ProjLAJE transforma o processo de criação de panos de laje: você
            insere as medidas, o sistema gera o desenho automaticamente e
            permite ajustar tudo de forma visual e intuitiva. Simples, rápido e
            sem precisar de conhecimento técnico ou softwares complexos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-slate-200 hover:shadow-lg transition-shadow duration-300"
            >
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
