"use client"

import { useEffect } from "react"
import { ErrorDisplay } from "@/components/common/ErrorDisplay"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Dashboard Segment Error:", error)
    }, [error])

    return (
        <ErrorDisplay
            error={error}
            reset={reset}
            description="We encountered an issue loading this page. Please try refreshing this section or using the sidebar to navigate."
        />
    )
}
