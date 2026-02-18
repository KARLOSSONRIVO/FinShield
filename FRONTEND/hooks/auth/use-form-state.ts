"use client"

import { useState, useCallback } from "react"

type FormErrors<T> = Partial<Record<keyof T, string>>
type ValidationRules<T> = Partial<Record<keyof T, (value: any, values: T) => string | null>>

interface UseFormStateOptions<T> {
    initialValues: T
    validationRules?: ValidationRules<T>
    onSubmit?: (values: T) => Promise<void> | void
}

interface UseFormStateReturn<T> {
    values: T
    errors: FormErrors<T>
    isSubmitting: boolean
    isValid: boolean
    isDirty: boolean
    setValue: <K extends keyof T>(key: K, value: T[K]) => void
    setValues: (newValues: Partial<T>) => void
    setError: (key: keyof T, error: string | null) => void
    clearErrors: () => void
    validate: () => boolean
    handleSubmit: (e?: React.FormEvent) => Promise<void>
    reset: () => void
    getFieldProps: (name: keyof T) => {
        value: T[keyof T]
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
        onBlur: () => void
    }
}

export function useFormState<T extends Record<string, any>>({
    initialValues,
    validationRules = {},
    onSubmit,
}: UseFormStateOptions<T>): UseFormStateReturn<T> {
    const [values, setValuesState] = useState<T>(initialValues)
    const [errors, setErrors] = useState<FormErrors<T>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [touched, setTouched] = useState<Set<keyof T>>(new Set())

    const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues)

    const validateField = useCallback(
        (key: keyof T, value: any): string | null => {
            const rule = validationRules[key]
            if (rule) {
                return rule(value, values)
            }
            return null
        },
        [validationRules, values]
    )

    const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
        setValuesState((prev) => ({ ...prev, [key]: value }))
        setTouched((prev) => new Set(prev).add(key))

        
        setErrors((prev) => {
            if (prev[key]) {
                const newErrors = { ...prev }
                delete newErrors[key]
                return newErrors
            }
            return prev
        })
    }, [])

    const setValues = useCallback((newValues: Partial<T>) => {
        setValuesState((prev) => ({ ...prev, ...newValues }))
        Object.keys(newValues).forEach((key) => {
            setTouched((prev) => new Set(prev).add(key as keyof T))
        })
    }, [])

    const setError = useCallback((key: keyof T, error: string | null) => {
        setErrors((prev) => {
            if (error === null) {
                const newErrors = { ...prev }
                delete newErrors[key]
                return newErrors
            }
            return { ...prev, [key]: error }
        })
    }, [])

    const clearErrors = useCallback(() => {
        setErrors({})
    }, [])

    const validate = useCallback((): boolean => {
        const newErrors: FormErrors<T> = {}
        let isValid = true

        Object.keys(validationRules).forEach((key) => {
            const fieldKey = key as keyof T
            const error = validateField(fieldKey, values[fieldKey])
            if (error) {
                newErrors[fieldKey] = error
                isValid = false
            }
        })

        setErrors(newErrors)
        return isValid
    }, [validationRules, validateField, values])

    const handleSubmit = useCallback(
        async (e?: React.FormEvent) => {
            e?.preventDefault()

            if (!validate()) {
                return
            }

            setIsSubmitting(true)

            try {
                await onSubmit?.(values)
            } finally {
                setIsSubmitting(false)
            }
        },
        [validate, onSubmit, values]
    )

    const reset = useCallback(() => {
        setValuesState(initialValues)
        setErrors({})
        setTouched(new Set())
        setIsSubmitting(false)
    }, [initialValues])

    const getFieldProps = useCallback(
        (name: keyof T) => ({
            value: values[name],
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                const value = e.target.type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
                    : e.target.value
                setValue(name, value as T[keyof T])
            },
            onBlur: () => {
                const error = validateField(name, values[name])
                if (error) {
                    setError(name, error)
                }
            },
        }),
        [values, setValue, validateField, setError]
    )

    const isValid = Object.keys(errors).length === 0

    return {
        values,
        errors,
        isSubmitting,
        isValid,
        isDirty,
        setValue,
        setValues,
        setError,
        clearErrors,
        validate,
        handleSubmit,
        reset,
        getFieldProps,
    }
}


export const validators = {
    required: (message = "This field is required") => (value: any) => {
        if (value === undefined || value === null || value === "") {
            return message
        }
        return null
    },

    email: (message = "Invalid email address") => (value: string) => {
        if (!value) return null
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value) ? null : message
    },

    minLength: (min: number, message?: string) => (value: string) => {
        if (!value) return null
        return value.length >= min ? null : message || `Must be at least ${min} characters`
    },

    maxLength: (max: number, message?: string) => (value: string) => {
        if (!value) return null
        return value.length <= max ? null : message || `Must be at most ${max} characters`
    },

    pattern: (regex: RegExp, message = "Invalid format") => (value: string) => {
        if (!value) return null
        return regex.test(value) ? null : message
    },

    number: (message = "Must be a number") => (value: any) => {
        if (value === "" || value === undefined || value === null) return null
        return isNaN(Number(value)) ? message : null
    },

    positive: (message = "Must be a positive number") => (value: any) => {
        if (value === "" || value === undefined || value === null) return null
        const num = Number(value)
        return !isNaN(num) && num > 0 ? null : message
    },
}
