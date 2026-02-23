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
            console.error("Upload failed:", error.response?.data ?? error)

            // Drill through all possible error shapes the API may return
            const data = error.response?.data
            const message =
                data?.error?.message ||   // { error: { message: "..." } }
                data?.message ||           // { message: "..." }
                data?.error ||             // { error: "string" }
                error.message ||
                "Unknown error"

            const details = data?.error?.details
                ? ` — ${JSON.stringify(data.error.details)}`
                : ""

            toast.error(`Upload Failed: ${message}${details}`)
        }
    })
}
