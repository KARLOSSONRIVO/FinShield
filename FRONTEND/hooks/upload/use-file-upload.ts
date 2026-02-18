"use client"

import { useState, useCallback } from "react"

interface UseFileUploadOptions {
    maxSize?: number 
    acceptedTypes?: string[]
    onSuccess?: () => void
    onError?: (error: string) => void
    resetDelay?: number 
}

interface UseFileUploadReturn {
    file: File | null
    isUploading: boolean
    uploadSuccess: boolean
    error: string | null
    progress: number
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleDrop: (e: React.DragEvent<HTMLElement>) => void
    handleDragOver: (e: React.DragEvent<HTMLElement>) => void
    upload: () => Promise<void>
    reset: () => void
    removeFile: () => void
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
    const {
        maxSize = 10 * 1024 * 1024, 
        acceptedTypes = [".pdf", ".docx"], 
        onSuccess,
        onError,
        resetDelay = 3000,
    } = options

    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)

    const validateFile = useCallback(
        (selectedFile: File): string | null => {
            
            if (selectedFile.size > maxSize) {
                return `File size exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`
            }

            
            const fileExtension = "." + selectedFile.name.split(".").pop()?.toLowerCase()
            const fileType = selectedFile.type

            const isValidType = acceptedTypes.some((type) => {
                if (type.startsWith(".")) {
                    return fileExtension === type.toLowerCase()
                }
                return fileType === type
            })

            if (!isValidType) {
                return `Invalid file type. Accepted: ${acceptedTypes.join(", ")}`
            }

            return null
        },
        [maxSize, acceptedTypes]
    )

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setError(null)
            if (e.target.files && e.target.files[0]) {
                const selectedFile = e.target.files[0]
                const validationError = validateFile(selectedFile)

                if (validationError) {
                    setError(validationError)
                    onError?.(validationError)
                    return
                }

                setFile(selectedFile)
            }
        },
        [validateFile, onError]
    )

    const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setError(null)

            const droppedFile = e.dataTransfer.files[0]
            if (droppedFile) {
                const validationError = validateFile(droppedFile)

                if (validationError) {
                    setError(validationError)
                    onError?.(validationError)
                    return
                }

                setFile(droppedFile)
            }
        },
        [validateFile, onError]
    )

    const upload = useCallback(async () => {
        if (!file) {
            setError("No file selected")
            return
        }

        setIsUploading(true)
        setProgress(0)
        setError(null)

        try {
            
            for (let i = 0; i <= 100; i += 10) {
                await new Promise((resolve) => setTimeout(resolve, 100))
                setProgress(i)
            }

            setIsUploading(false)
            setUploadSuccess(true)
            onSuccess?.()

            
            if (resetDelay > 0) {
                setTimeout(() => {
                    setFile(null)
                    setUploadSuccess(false)
                    setProgress(0)
                }, resetDelay)
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Upload failed"
            setError(errorMessage)
            setIsUploading(false)
            onError?.(errorMessage)
        }
    }, [file, resetDelay, onSuccess, onError])

    const reset = useCallback(() => {
        setFile(null)
        setIsUploading(false)
        setUploadSuccess(false)
        setError(null)
        setProgress(0)
    }, [])

    const removeFile = useCallback(() => {
        setFile(null)
        setError(null)
    }, [])

    return {
        file,
        isUploading,
        uploadSuccess,
        error,
        progress,
        handleFileChange,
        handleDrop,
        handleDragOver,
        upload,
        reset,
        removeFile,
    }
}
