import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDrawing } from '@/context/DrawingContext'
import { updateProject } from '@/services/projects'
import { toast } from 'sonner'

interface ProjectSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { projectId, projectName, setProjectName } = useDrawing()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(projectName || '')
    }
  }, [open, projectName])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('O nome do projeto não pode estar vazio.')
      return
    }

    setLoading(true)
    try {
      // If we have a projectId (saved project), update it in DB
      if (projectId) {
        const { error } = await updateProject(projectId, { name })
        if (error) throw error
      }

      // Always update context state
      setProjectName(name)
      toast.success('Nome do projeto atualizado com sucesso!')
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao atualizar nome do projeto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurações do Projeto</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Nome do Projeto"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
