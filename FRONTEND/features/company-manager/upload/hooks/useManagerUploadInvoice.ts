"use client"

import type React from "react"
import { useState } from "react"

export function useManagerUploadInvoice() {
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [values, setValues] = useState({
        invoiceNo: "",
        invoiceDate: "",
        amount: "",
    })

    // Simple Value change handler
    const setValue = (field: string, value: string) => {
        setValues((prev) => ({ ...prev, [field]: value }))
    }

    // File change handler
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    // Submit handler
    const upload = async () => {
        setIsUploading(true)

        // Simulate upload delay
        await new Promise((resolve) => setTimeout(resolve, 2000))

        setIsUploading(false)
        setUploadSuccess(true)

        // Reset form after success
        setTimeout(() => {
            setFile(null)
            setValues({ invoiceNo: "", invoiceDate: "", amount: "" })
            setUploadSuccess(false)
        }, 3000)
    }

    return {
        file,
        values,
        isUploading,
        uploadSuccess,
        handleFileChange,
        setValue,
        upload
    }
}
