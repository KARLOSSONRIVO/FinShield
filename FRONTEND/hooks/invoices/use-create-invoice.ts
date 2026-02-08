"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { useToast } from "@/hooks/use-toast"

export function useCreateInvoice() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: InvoiceService.upload,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] })
            toast({
                title: "Upload Successful",
                description: "Your invoice has been uploaded and queued for anchoring.",
            })
        },
        onError: (error: any) => {
            console.error("Upload failed:", error)
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: error.response?.data?.message || "There was a problem uploading your invoice.",
            })
        }
    })
}
