"use client"

import type React from "react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { toast } from "sonner"

export function useManagerUploadInvoice() {
    const [file, setFile] = useState<File | null>(null)
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

    // Mutation
    const { mutate: upload, isPending: isUploading } = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error("No file selected")
            // Pass values if backend supported them, currently ignored
            return await InvoiceService.upload({ file })
        },
        onSuccess: (data) => {
            console.log("Upload success:", data)
            setUploadSuccess(true)
            // Reset form after success
            setTimeout(() => {
                setFile(null)
                setValues({ invoiceNo: "", invoiceDate: "", amount: "" })
                setUploadSuccess(false)
            }, 3000)
        },
        onError: (error: any) => {
            console.error("Upload failed", error)
            toast.error("Upload failed: " + (error.response?.data?.message || error.message))
        }
    })

    return {
        file,
        values,
        isUploading,
        uploadSuccess,
        handleFileChange,
        setValue,
        upload: () => upload()
    }
}
