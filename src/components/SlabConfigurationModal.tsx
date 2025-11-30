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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SlabConfig } from '@/types/drawing'

interface SlabConfigurationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (config: SlabConfig) => void
  initialConfig?: SlabConfig
}

export const SlabConfigurationModal: React.FC<SlabConfigurationModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  initialConfig,
}) => {
  const [type, setType] = useState<SlabConfig['type']>('H8')
  const [material, setMaterial] = useState<SlabConfig['material']>('ceramic')
  const [unitHeight, setUnitHeight] = useState('7')
  const [unitWidth, setUnitWidth] = useState('30')
  const [unitLength, setUnitLength] = useState('20')
  const [beamWidth, setBeamWidth] = useState('12')
  const [initialExclusion, setInitialExclusion] = useState('0')
  const [finalExclusion, setFinalExclusion] = useState('0')

  useEffect(() => {
    if (open && initialConfig) {
      setType(initialConfig.type)
      setMaterial(initialConfig.material)
      setUnitHeight(initialConfig.unitHeight.toString())
      setUnitWidth(initialConfig.unitWidth.toString())
      setUnitLength(initialConfig.unitLength.toString())
      setBeamWidth(initialConfig.beamWidth.toString())
      setInitialExclusion(initialConfig.initialExclusion?.toString() || '0')
      setFinalExclusion(initialConfig.finalExclusion?.toString() || '0')
    } else if (open) {
      // Defaults
      setType('H8')
      setMaterial('ceramic')
      setUnitHeight('7')
      setUnitWidth('30')
      setUnitLength('20')
      setBeamWidth('12')
      setInitialExclusion('0')
      setFinalExclusion('0')
    }
  }, [open, initialConfig])

  const calculateInterEixo = () => {
    const w = parseFloat(unitWidth) || 0
    const b = parseFloat(beamWidth) || 0
    return w + b
  }

  const handleConfirm = () => {
    const config: SlabConfig = {
      type,
      material,
      unitHeight: parseFloat(unitHeight) || 0,
      unitWidth: parseFloat(unitWidth) || 0,
      unitLength: parseFloat(unitLength) || 0,
      beamWidth: parseFloat(beamWidth) || 0,
      interEixo: calculateInterEixo(),
      initialExclusion: parseFloat(initialExclusion) || 0,
      finalExclusion: parseFloat(finalExclusion) || 0,
    }

    onConfirm(config)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar Vigotas da Laje</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Laje</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as SlabConfig['type'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {['H8', 'H12', 'H16', 'H20', 'H25', 'H30'].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Material de Enchimento</Label>
              <RadioGroup
                value={material}
                onValueChange={(v) => setMaterial(v as SlabConfig['material'])}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ceramic" id="ceramic" />
                  <Label htmlFor="ceramic">Lajota Cerâmica</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="eps" id="eps" />
                  <Label htmlFor="eps">Lajota EPS</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Dimensões da Lajota (cm)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="u-height" className="text-xs">
                  Altura
                </Label>
                <Input
                  id="u-height"
                  type="number"
                  value={unitHeight}
                  onChange={(e) => setUnitHeight(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="u-width" className="text-xs">
                  Largura
                </Label>
                <Input
                  id="u-width"
                  type="number"
                  value={unitWidth}
                  onChange={(e) => setUnitWidth(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="u-length" className="text-xs">
                  Comprimento
                </Label>
                <Input
                  id="u-length"
                  type="number"
                  value={unitLength}
                  onChange={(e) => setUnitLength(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="beam-width">Largura da Vigota (cm)</Label>
              <Input
                id="beam-width"
                type="number"
                value={beamWidth}
                onChange={(e) => setBeamWidth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Inter Eixo (cm)</Label>
              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {calculateInterEixo()}
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t pt-2">
            <Label className="font-semibold">Zonas de Exclusão (cm)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="initial-exclusion" className="text-xs">
                  Distância Inicial
                </Label>
                <Input
                  id="initial-exclusion"
                  type="number"
                  value={initialExclusion}
                  onChange={(e) => setInitialExclusion(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="final-exclusion" className="text-xs">
                  Distância Final
                </Label>
                <Input
                  id="final-exclusion"
                  type="number"
                  value={finalExclusion}
                  onChange={(e) => setFinalExclusion(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar e Desenhar Seta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
