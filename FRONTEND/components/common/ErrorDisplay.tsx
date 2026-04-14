"use client"

import { AlertCircle, RefreshCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/global/use-auth"

interface ErrorDisplayProps {
    error: Error & { digest?: string }
    reset: () => void
    title?: string
    description?: string
}

export function ErrorDisplay({
    error,
    reset,
    title = "Something went wrong",
    description = "An unexpected error occurred while loading this section of the dashboard."
}: ErrorDisplayProps) {
    const router = useRouter()
    const { user, isSuperAdmin } = useAuth()

    const getHomePath = () => {
        if (!user) return "/"
        switch (user.role) {
            case "SUPER_ADMIN": return "/admin/super-admin"
            case "AUDITOR": return "/admin/auditor"
            case "REGULATOR": return "/admin/regulator"
            case "COMPANY_MANAGER": return "/company/manager"
            case "COMPANY_USER": return "/company/employee"
            default: return "/"
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[400px] w-full p-4 animate-in fade-in duration-500">
            <Card className="max-w-md w-full border-destructive/20 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {description}
                    </p>
                    {error.digest && (
                        <div className="bg-muted p-2 rounded text-[10px] font-mono text-muted-foreground break-all">
                            ID: {error.digest}
                        </div>
                    )}
                    {(isSuperAdmin || process.env.NODE_ENV === 'development') && (
                        <div className="text-left bg-destructive/5 p-3 rounded border border-destructive/10 max-h-[150px] overflow-auto">
                            <p className="text-xs font-semibold text-destructive mb-1">Developer Error Log:</p>
                            <code className="text-[10px] text-destructive/80 whitespace-pre-wrap">
                                {error.message}
                            </code>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                        variant="outline"
                        className="flex-1 gap-2 h-10"
                        onClick={() => reset()}
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Try Again
                    </Button>
                    <Button
                        className="flex-1 gap-2 h-10 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm transition-all"
                        onClick={() => router.push(getHomePath())}
                    >
                        <Home className="h-4 w-4" />
                        Go Home
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
