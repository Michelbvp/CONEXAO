import { type ClassValue, clsx } from 'clsx'

export function cn(...entradas: ClassValue[]) {
  return clsx(entradas)
}
