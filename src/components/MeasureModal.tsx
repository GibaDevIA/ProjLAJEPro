import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Point } from '@/types/drawing'

interface MeasureModalProps {
  position: Point
  onConfirm: (length: number, angle?: number) => void
  onCancel: () => void
  initialLength?: number
  initialAngle?: number
}

export const MeasureModal: React.FC<MeasureModalProps> = ({
  position,
  onConfirm,
  onCancel,
  initialLength = 0,
  initialAngle = 0,
}) => {
  const [length, setLength] = useState(initialLength.toFixed(2))
  const [angle, setAngle] = useState(initialAngle.toFixed(2))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  useEffect(() => {
    setLength(initialLength.toFixed(2))
    setAngle(initialAngle.toFixed(2))
  }, [initialLength, initialAngle])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const l = parseFloat(length)
    const a = parseFloat(angle)
    if (isNaN(l) || l < 0) return
    onConfirm(l, isNaN(a) ? undefined : a)
  }

  return (
    <div
      className="fixed z-50 animate-scale-up"
      style={{
        left: position.x + 20,
        top: position.y + 20,
      }}
    >
      <Card className="w-64 shadow-elevation">
        <form onSubmit={handleSubmit}>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-medium">
              Definir Medidas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="length" className="text-xs">
                Comprimento (m)
              </Label>
              <Input
                id="length"
                ref={inputRef}
                type="number"
                step="0.01"
                min="0"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="angle" className="text-xs">
                Ângulo (°)
              </Label>
              <Input
                id="angle"
                type="number"
                step="0.1"
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </CardContent>
          <CardFooter className="p-3 pt-0 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-7 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs bg-primary text-primary-foreground"
            >
              Confirmar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
