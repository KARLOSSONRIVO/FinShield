import * as React from "react"

// Simplified version of use-toast for build fix
type ToastProps = {
    title?: string
    description?: string
    action?: React.ReactNode
    variant?: "default" | "destructive"
}

export function useToast() {
    const [toasts, setToasts] = React.useState<ToastProps[]>([])

    const toast = React.useCallback((props: ToastProps) => {
        setToasts((prev) => [...prev, props])
        // Mock logic: remove after 3s
        setTimeout(() => {
            setToasts((prev) => prev.slice(1))
        }, 3000)
    }, [])

    return {
        toast,
        toasts,
        dismiss: (id?: string) => { }
    }
}
