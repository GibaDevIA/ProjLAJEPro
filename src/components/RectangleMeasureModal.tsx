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

interface RectangleMeasureModalProps {
  position: Point
  onConfirm: (width: number, height: number) => void
  onCancel: () => void
  initialWidth?: number
  initialHeight?: number
}

export const RectangleMeasureModal: React.FC<RectangleMeasureModalProps> = ({
  position,
  onConfirm,
  onCancel,
  initialWidth = 0,
  initialHeight = 0,
}) => {
  const [width, setWidth] = useState(initialWidth.toFixed(2))
  const [height, setHeight] = useState(initialHeight.toFixed(2))
  const [isDirty, setIsDirty] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  useEffect(() => {
    if (!isDirty) {
      setWidth(initialWidth.toFixed(2))
      setHeight(initialHeight.toFixed(2))
    }
  }, [initialWidth, initialHeight, isDirty])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const w = parseFloat(width)
    const h = parseFloat(height)
    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0) return
    onConfirm(w, h)
  }

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidth(e.target.value)
    setIsDirty(true)
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeight(e.target.value)
    setIsDirty(true)
  }

  return (
    <div
      className="absolute z-50 animate-scale-up"
      style={{
        left: position.x + 20,
        top: position.y + 20,
      }}
    >
      <Card className="w-64 shadow-elevation">
        <form onSubmit={handleSubmit}>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-medium">
              Definir Dimensões
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="width" className="text-xs">
                Largura (m)
              </Label>
              <Input
                id="width"
                ref={inputRef}
                type="number"
                step="0.01"
                min="0.01"
                value={width}
                onChange={handleWidthChange}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="height" className="text-xs">
                Comprimento (m)
              </Label>
              <Input
                id="height"
                type="number"
                step="0.01"
                min="0.01"
                value={height}
                onChange={handleHeightChange}
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
