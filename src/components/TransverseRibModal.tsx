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
import { TransverseRibConfig } from '@/types/drawing'

interface TransverseRibModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (config: TransverseRibConfig) => void
}

const DIAMETERS_CA50 = ['6.3', '8', '10', '12.5', '16']
const DIAMETERS_CA60 = ['4.2', '5', '6', '7', '8', '9.5']

export const TransverseRibModal: React.FC<TransverseRibModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [ribType, setRibType] =
    useState<TransverseRibConfig['ribType']>('plastic')
  const [width, setWidth] = useState('10') // cm
  const [piecesPerMeter, setPiecesPerMeter] = useState('2.38')
  const [steelQuantity, setSteelQuantity] = useState('2')
  const [steelDiameter, setSteelDiameter] = useState('6.3')
  const [steelType, setSteelType] = useState<'CA50' | 'CA60'>('CA50')

  // Reset/Defaults when opening
  useEffect(() => {
    if (open) {
      setRibType('plastic')
      setWidth('10')
      setPiecesPerMeter('2.38')
      setSteelQuantity('2')
      setSteelDiameter('6.3')
      setSteelType('CA50')
    }
  }, [open])

  const handleConfirm = () => {
    const config: TransverseRibConfig = {
      ribType,
      width: (parseFloat(width) || 10) / 100, // Convert cm to meters
      piecesPerMeter: parseFloat(piecesPerMeter) || 2.38,
      steelQuantity: parseInt(steelQuantity) || 2,
      steelDiameter,
    }
    onConfirm(config)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Configurar Nervura Transversal</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Rib Form */}
          <div className="space-y-2">
            <Label className="font-semibold">Tipo de Canaleta</Label>
            <RadioGroup
              value={ribType}
              onValueChange={(v) =>
                setRibType(v as TransverseRibConfig['ribType'])
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="plastic" id="plastic" />
                <Label htmlFor="plastic">Plástica</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ceramic" id="ceramic" />
                <Label htmlFor="ceramic">Cerâmica</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Largura (cm)</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ppm">Peças / m</Label>
              <Input
                id="ppm"
                type="number"
                step="0.01"
                value={piecesPerMeter}
                onChange={(e) => setPiecesPerMeter(e.target.value)}
              />
            </div>
          </div>

          {/* Steel Reinforcement */}
          <div className="space-y-2 border-t pt-2">
            <Label className="font-semibold">Armadura (Aço)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={steelQuantity}
                  onChange={(e) => setSteelQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo Aço</Label>
                <Select
                  value={steelType}
                  onValueChange={(v) => setSteelType(v as 'CA50' | 'CA60')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CA50">CA50</SelectItem>
                    <SelectItem value="CA60">CA60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Bitola (mm)</Label>
                <Select value={steelDiameter} onValueChange={setSteelDiameter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(steelType === 'CA50'
                      ? DIAMETERS_CA50
                      : DIAMETERS_CA60
                    ).map((d) => (
                      <SelectItem key={d} value={d}>
                        {d} mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
