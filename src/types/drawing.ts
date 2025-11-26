export type Point = {
  x: number
  y: number
}

export type ShapeType = 'line' | 'rectangle' | 'polygon' | 'arrow'

export interface SlabConfig {
  type: 'H8' | 'H12' | 'H16' | 'H20' | 'H25' | 'H30'
  material: 'ceramic' | 'eps'
  unitHeight: number // cm
  unitWidth: number // cm
  unitLength: number // cm
  beamWidth: number // cm
  interEixo: number // cm (calculated)
}

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
    isJoist?: boolean
    label?: string
    slabConfig?: SlabConfig
  }
}

export interface ViewState {
  scale: number // pixels per meter
  offset: Point // in pixels
}

export type ToolType = 'select' | 'line' | 'rectangle' | 'pan' | 'slab_joist'

export interface SnapResult {
  point: Point
  targetPoint: Point
  distance: number
}
