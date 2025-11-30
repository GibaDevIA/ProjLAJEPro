import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Canvas } from '@/components/Canvas'
import { useDrawing } from '@/context/DrawingContext'
import { getProject } from '@/services/projects'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const Index = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    setShapes,
    setView,
    setProjectId,
    setProjectName,
    isLoadingProject,
    setIsLoadingProject,
  } = useDrawing()

  useEffect(() => {
    const loadProject = async (projectId: string) => {
      setIsLoadingProject(true)
      setProjectId(projectId) // Set ID immediately

      const { data, error } = await getProject(projectId)

      if (error) {
        console.error('Error loading project:', error)
        toast.error('Erro ao carregar projeto. Redirecionando...')
        setTimeout(() => navigate('/dashboard'), 2000)
      } else if (data) {
        setProjectName(data.name)
        if (data.content) {
          // Load content
          if (data.content.shapes) setShapes(data.content.shapes)
          if (data.content.view) setView(data.content.view)
        } else {
          // New project might have empty content, ensure clean slate
          setShapes([])
        }
      }
      setIsLoadingProject(false)
    }

    if (id) {
      loadProject(id)
    } else {
      // If no ID, we are in scratchpad or new project mode (but typically Dashboard handles creation)
      // Reset context for fresh start
      setProjectId(null)
      setProjectName(null)
      setShapes([])
      setIsLoadingProject(false)
    }
  }, [
    id,
    navigate,
    setShapes,
    setView,
    setProjectId,
    setProjectName,
    setIsLoadingProject,
  ])

  if (isLoadingProject) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando projeto...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-white">
      <Canvas />
    </div>
  )
}

export default Index
