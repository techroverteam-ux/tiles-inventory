import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

export function generateOrderNumber(prefix: string): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}${timestamp}${random}`
}

export function formatMmToFeetInches(mm: number): string {
  if (!mm || isNaN(mm)) return '0"'
  const totalInches = Math.round(mm / 25.4)
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  
  if (feet === 0) return `${inches}"`
  if (inches === 0) return `${feet}'`
  return `${feet}' ${inches}"`
}