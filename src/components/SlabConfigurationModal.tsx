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
import { SlabConfig, ReinforcementConfig } from '@/types/drawing'
import { generateId } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'

interface SlabConfigurationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (config: SlabConfig) => void
  initialConfig?: SlabConfig
}

const STEEL_TYPES = ['CA50', 'CA60'] as const
const DIAMETERS_CA50 = ['6.3', '8', '10', '12.5', '16']
const DIAMETERS_CA60 = ['4.2', '5', '6', '7', '8', '9.5']

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
  const [interEixo, setInterEixo] = useState('42')
  const [initialExclusion, setInitialExclusion] = useState('0')
  const [finalExclusion, setFinalExclusion] = useState('0')
  const [reinforcement, setReinforcement] = useState<ReinforcementConfig[]>([])

  useEffect(() => {
    if (open && initialConfig) {
      setType(initialConfig.type)
      setMaterial(initialConfig.material)
      setUnitHeight(initialConfig.unitHeight.toString())
      setUnitWidth(initialConfig.unitWidth.toString())
      setUnitLength(initialConfig.unitLength.toString())
      setBeamWidth(initialConfig.beamWidth.toString())
      setInterEixo(initialConfig.interEixo.toString())
      setInitialExclusion(initialConfig.initialExclusion?.toString() || '0')
      setFinalExclusion(initialConfig.finalExclusion?.toString() || '0')
      setReinforcement(initialConfig.reinforcement || [])
    } else if (open) {
      // Defaults
      setType('H8')
      setMaterial('ceramic')
      setUnitHeight('7')
      setUnitWidth('30')
      setUnitLength('20')
      setBeamWidth('12')
      setInterEixo('42')
      setInitialExclusion('0')
      setFinalExclusion('0')
      setReinforcement([])
    }
  }, [open, initialConfig])

  const handleAddReinforcement = () => {
    if (reinforcement.length >= 2) return
    setReinforcement([
      ...reinforcement,
      {
        id: generateId(),
        quantity: 1,
        steelType: 'CA50',
        diameter: '8',
        anchorage: 0,
      },
    ])
  }

  const handleRemoveReinforcement = (id: string) => {
    setReinforcement(reinforcement.filter((r) => r.id !== id))
  }

  const updateReinforcement = (
    id: string,
    field: keyof ReinforcementConfig,
    value: any,
  ) => {
    setReinforcement(
      reinforcement.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value }
          // Reset diameter if type changes and current diameter is not valid
          if (field === 'steelType') {
            const validDiameters =
              value === 'CA50' ? DIAMETERS_CA50 : DIAMETERS_CA60
            if (!validDiameters.includes(updated.diameter)) {
              updated.diameter = validDiameters[0]
            }
          }
          return updated
        }
        return r
      }),
    )
  }

  const handleConfirm = () => {
    const config: SlabConfig = {
      type,
      material,
      unitHeight: parseFloat(unitHeight) || 0,
      unitWidth: parseFloat(unitWidth) || 0,
      unitLength: parseFloat(unitLength) || 0,
      beamWidth: parseFloat(beamWidth) || 0,
      interEixo: parseFloat(interEixo) || 0,
      initialExclusion: parseFloat(initialExclusion) || 0,
      finalExclusion: parseFloat(finalExclusion) || 0,
      reinforcement,
    }

    onConfirm(config)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="concrete" id="concrete" />
                  <Label htmlFor="concrete">Concreto Maciço</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {material !== 'concrete' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
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
          )}

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
              <Label htmlFor="inter-eixo">Inter Eixo (cm)</Label>
              <Input
                id="inter-eixo"
                type="number"
                value={interEixo}
                onChange={(e) => setInterEixo(e.target.value)}
              />
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

          <div className="space-y-2 border-t pt-2">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">
                Adicional Positivo na Vigota
              </Label>
              {reinforcement.length < 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddReinforcement}
                  className="h-7 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              )}
            </div>

            {reinforcement.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                Nenhum adicional configurado.
              </p>
            )}

            <div className="space-y-3">
              {reinforcement.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-end border p-2 rounded-md bg-muted/20"
                >
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px]">Qtd.</Label>
                    <Input
                      type="number"
                      min="1"
                      className="h-8 text-xs"
                      value={item.quantity}
                      onChange={(e) =>
                        updateReinforcement(
                          item.id,
                          'quantity',
                          parseInt(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-[10px]">Tipo</Label>
                    <Select
                      value={item.steelType}
                      onValueChange={(v) =>
                        updateReinforcement(item.id, 'steelType', v)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STEEL_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-[10px]">Bitola (mm)</Label>
                    <Select
                      value={item.diameter}
                      onValueChange={(v) =>
                        updateReinforcement(item.id, 'diameter', v)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(item.steelType === 'CA50'
                          ? DIAMETERS_CA50
                          : DIAMETERS_CA60
                        ).map((d) => (
                          <SelectItem key={d} value={d} className="text-xs">
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-[10px]">Ancoragem (cm)</Label>
                    <Input
                      type="number"
                      min="0"
                      className="h-8 text-xs"
                      value={item.anchorage}
                      onChange={(e) =>
                        updateReinforcement(
                          item.id,
                          'anchorage',
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div className="col-span-1 flex justify-end pb-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveReinforcement(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
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
