import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

export function formatDimension(value: number): string {
  // Rounds to 4 decimal places to avoid floating point errors (e.g. 3.0000000004 -> 3)
  // Then converts to string, which removes trailing zeros (e.g. 3.5000 -> "3.5")
  return parseFloat(value.toFixed(4)).toString()
}
