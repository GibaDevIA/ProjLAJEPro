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
import { GripHorizontal } from 'lucide-react'

interface MeasureModalProps {
  position: Point
  onConfirm: (length: number, angle?: number) => void
  onCancel: () => void
  initialLength?: number
  initialAngle?: number
  isOrtho?: boolean
}

const STORAGE_KEY = 'measure-modal-position'

export const MeasureModal: React.FC<MeasureModalProps> = ({
  position: propPosition,
  onConfirm,
  onCancel,
  initialLength = 0,
  initialAngle = 0,
  isOrtho = false,
}) => {
  // Initialize position from localStorage or props
  const [position, setPosition] = useState<Point>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (
          parsed &&
          typeof parsed.x === 'number' &&
          typeof parsed.y === 'number'
        ) {
          return parsed
        }
      } catch (e) {
        console.error('Failed to parse saved modal position', e)
      }
    }
    // Default to prop position (with offset) if no saved position
    return { x: propPosition.x + 20, y: propPosition.y + 20 }
  })

  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{
    startX: number
    startY: number
    initialPos: Point
    lastPos?: Point
  } | null>(null)

  const [length, setLength] = useState(initialLength.toFixed(2))
  const [angle, setAngle] = useState(initialAngle.toFixed(2))
  const inputRef = useRef<HTMLInputElement>(null)

  // Update position from props ONLY if the user hasn't moved/saved the modal manually
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      setPosition({ x: propPosition.x + 20, y: propPosition.y + 20 })
    }
  }, [propPosition])

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

  // Global drag event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return

      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY

      const newPos = {
        x: dragRef.current.initialPos.x + dx,
        y: dragRef.current.initialPos.y + dy,
      }

      setPosition(newPos)
      dragRef.current.lastPos = newPos
    }

    const handleMouseUp = () => {
      if (isDragging && dragRef.current) {
        setIsDragging(false)
        // Save final position to localStorage
        const finalPos = dragRef.current.lastPos || dragRef.current.initialPos
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPos))
        dragRef.current = null
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleDragStart = (e: React.MouseEvent) => {
    // Only allow left click drag
    if (e.button !== 0) return

    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPos: position,
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const l = parseFloat(length)
    const a = parseFloat(angle)
    if (isNaN(l) || l < 0) return
    onConfirm(l, isOrtho || isNaN(a) ? undefined : a)
  }

  // Stop propagation to prevent drawing on canvas when clicking modal
  const handleModalInteraction = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      className="absolute z-50 animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onMouseDown={handleModalInteraction}
    >
      <Card className="w-64 shadow-elevation select-none border-border/50">
        <form onSubmit={handleSubmit}>
          <CardHeader
            className="p-3 pb-2 cursor-grab active:cursor-grabbing bg-muted/40 border-b rounded-t-lg space-y-0"
            onMouseDown={handleDragStart}
          >
            <CardTitle className="text-sm font-medium flex items-center gap-2 select-none">
              <GripHorizontal className="w-4 h-4 text-muted-foreground" />
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
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            {!isOrtho && (
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
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 pt-0 flex justify-end gap-2 border-t bg-muted/10 mt-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-7 text-xs"
              onMouseDown={(e) => e.stopPropagation()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs bg-primary text-primary-foreground"
              onMouseDown={(e) => e.stopPropagation()}
            >
              Confirmar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
