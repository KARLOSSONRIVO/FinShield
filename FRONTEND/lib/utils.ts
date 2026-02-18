import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeInput(input: string): string {
  if (!input) return ""
  return input
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") 
    .replace(/javascript:/gim, "") 
    .replace(/on\w+=/gim, "") 
    .trim()
}
