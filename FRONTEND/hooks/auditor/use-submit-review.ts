"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { ReviewPayload } from "@/lib/types"
import { toast } from "sonner"

/**
 * Mutation hook for submitting or updating an auditor review.
 * Always calls PATCH /invoice/:id/review — backend returns isUpdate=true if overwriting.
 */
export function useSubmitReview(invoiceId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: ReviewPayload) =>
            InvoiceService.submitReview(invoiceId, payload),

        onSuccess: (res) => {
            const isUpdate = res.data?.isUpdate ?? false
            toast.success(isUpdate ? "Review Updated" : "Review Submitted", {
                description: isUpdate
                    ? "Your review decision has been updated successfully."
                    : "Your review has been submitted successfully.",
            })
            queryClient.invalidateQueries({ queryKey: ["invoice-detail", invoiceId] })
        },

        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to submit review. Please try again."

            toast.error("Review Failed", { description: message })
        },
    })
}
