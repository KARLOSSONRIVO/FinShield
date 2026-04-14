import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// Basic input sanitization to prevent XSS
export function sanitizeInput(input: string): string {
  if (!input) return ""
  return input
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Remove script tags
    .replace(/javascript:/gim, "") // Remove javascript: protocol
    .replace(/on\w+=/gim, "") // Remove event handlers like onClick
    .trim()
}
