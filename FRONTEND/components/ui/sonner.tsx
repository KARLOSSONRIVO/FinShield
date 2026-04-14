'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'
import { CircleCheck, CircleX } from 'lucide-react'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "group-[.toast]:bg-transparent group-[.toast]:text-foreground group-[.toast]:border-border group-[.toast]:hover:bg-black/10 dark:group-[.toast]:hover:bg-white/10 visible opacity-100",
          success: "group-[.toaster]:!bg-green-600 group-[.toaster]:!text-white group-[.toaster]:!border-green-600",
          error: "group-[.toaster]:!bg-red-600 group-[.toaster]:!text-white group-[.toaster]:!border-red-600",
        },
        style: {
          zIndex: 9999, // Ensure it's above everything including Radix dialogs (z-50)
        }
      }}
      icons={{
        success: <CircleCheck className="h-5 w-5 text-white" />,
        error: <CircleX className="h-5 w-5 text-white" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          zIndex: 9999, // Also apply to the wrapper
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
