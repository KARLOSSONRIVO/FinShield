"use client"

import { useState, useCallback } from "react"

interface UsePasswordVisibilityReturn {
    showPassword: boolean
    toggle: () => void
    inputType: "text" | "password"
    Icon: "Eye" | "EyeOff"
}

export function usePasswordVisibility(initialVisible = false): UsePasswordVisibilityReturn {
    const [showPassword, setShowPassword] = useState(initialVisible)

    const toggle = useCallback(() => {
        setShowPassword((prev) => !prev)
    }, [])

    return {
        showPassword,
        toggle,
        inputType: showPassword ? "text" : "password",
        Icon: showPassword ? "EyeOff" : "Eye",
    }
}

// For managing multiple password fields (e.g., password + confirm password)
interface UseMultiPasswordVisibilityReturn {
    visibility: Record<string, boolean>
    toggle: (field: string) => void
    getInputType: (field: string) => "text" | "password"
    getIcon: (field: string) => "Eye" | "EyeOff"
    showAll: () => void
    hideAll: () => void
}

export function useMultiPasswordVisibility(
    fields: string[] = ["password", "confirmPassword"]
): UseMultiPasswordVisibilityReturn {
    const [visibility, setVisibility] = useState<Record<string, boolean>>(
        Object.fromEntries(fields.map((field) => [field, false]))
    )

    const toggle = useCallback((field: string) => {
        setVisibility((prev) => ({
            ...prev,
            [field]: !prev[field],
        }))
    }, [])

    const getInputType = useCallback(
        (field: string): "text" | "password" => {
            return visibility[field] ? "text" : "password"
        },
        [visibility]
    )

    const getIcon = useCallback(
        (field: string): "Eye" | "EyeOff" => {
            return visibility[field] ? "EyeOff" : "Eye"
        },
        [visibility]
    )

    const showAll = useCallback(() => {
        setVisibility((prev) =>
            Object.fromEntries(Object.keys(prev).map((key) => [key, true]))
        )
    }, [])

    const hideAll = useCallback(() => {
        setVisibility((prev) =>
            Object.fromEntries(Object.keys(prev).map((key) => [key, false]))
        )
    }, [])

    return {
        visibility,
        toggle,
        getInputType,
        getIcon,
        showAll,
        hideAll,
    }
}
