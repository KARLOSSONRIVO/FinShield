"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { toast } from "sonner"

export function useCreateInvoice() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ file }: { file: File }) => InvoiceService.upload(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] })
            toast.success("Upload Successful", {
                description: "Your invoice has been uploaded and queued for anchoring.",
            })
        },
        onError: (error: any) => {
            const data = error.response?.data
            const message = typeof data?.message === 'string'
                ? data.message
                : (typeof data?.error === 'string' ? data.error : "Failed to upload invoice")

            const details = data?.error?.details
                ? ` — ${JSON.stringify(data.error.details)}`
                : ""

            toast.error(`Upload Failed: ${message}${details}`)
        }
    })
}
