import { Point as PointType } from '@/types/drawing' // Self reference hack to keep imports if needed

export type Point = {
  x: number
  y: number
}

export type ShapeType =
  | 'line'
  | 'rectangle'
  | 'polygon'
  | 'arrow'
  | 'dimension'
  | 'vigota'
  | 'rib'

export interface ReinforcementConfig {
  id: string
  quantity: number
  steelType: 'CA50' | 'CA60'
  diameter: string
  anchorage: number // cm
}

export interface SlabConfig {
  type: 'H8' | 'H12' | 'H16' | 'H20' | 'H25' | 'H30'
  material: 'ceramic' | 'eps' | 'concrete'
  unitHeight: number // cm
  unitWidth: number // cm
  unitLength: number // cm
  beamWidth: number // cm
  interEixo: number // cm
  initialExclusion?: number // cm
  finalExclusion?: number // cm
  reinforcement?: ReinforcementConfig[]
}

export interface TransverseRibConfig {
  steelQuantity: number
  steelDiameter: string
  ribType: 'plastic' | 'ceramic'
  width: number // meters
  piecesPerMeter: number
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
    ribConfig?: TransverseRibConfig
  }
}

export interface ViewState {
  scale: number // pixels per meter
  offset: Point // in pixels
}

export type ToolType =
  | 'select'
  | 'line'
  | 'rectangle'
  | 'pan'
  | 'slab_joist'
  | 'dimension'
  | 'add_vigota'
  | 'delete_vigota'
  | 'transverse_rib'

export interface SnapResult {
  point: Point
  targetPoint: Point
  distance: number
  type: 'vertex' | 'edge' | 'grid' | 'midpoint'
}

export interface RibReportData {
  count: number
  totalLength: number
  channelCount: number
  channelType: 'plastic' | 'ceramic'
  steelTotalLength: number
  steelDiameter: string
  steelQuantity: number
}

export interface SlabReportItem {
  id: string
  label: string
  area: number
  width: number
  height: number
  type: string
  material: string
  vigotaCount: number
  vigotaSummary: string
  vigotaDetails: {
    length: string
    count: number
    reinforcementText: string[]
  }[]
  hasExtraVigotas: boolean
  extraVigotaCount: number
  reinforcementSummary?: string
  reinforcementLines: string[]
  ribsData?: RibReportData[]
}
