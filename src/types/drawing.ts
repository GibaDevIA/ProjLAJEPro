export type Point = {
  x: number
  y: number
}

export type ShapeType = 'line' | 'rectangle' | 'polygon'

export interface Shape {
  id: string
  type: ShapeType
  points: Point[]
  properties?: {
    color?: string
    width?: number
    height?: number
    area?: number
    length?: number
    angle?: number
  }
}

export interface ViewState {
  scale: number // pixels per meter
  offset: Point // in pixels
}

export type ToolType = 'select' | 'line' | 'rectangle' | 'pan'

export interface SnapResult {
  point: Point
  targetPoint: Point
  distance: number
}
