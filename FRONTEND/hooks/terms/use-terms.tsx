import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { termsService, Terms, CreateTermsRequest, UpdateTermsRequest } from '@/services/terms.service'
import { toast } from 'sonner'

export function useTerms() {
    const queryClient = useQueryClient()
    const queryKey = ['terms']

    // Fetch all terms
    const {
        data,
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey,
        queryFn: async () => {
            const response = await termsService.getAllTerms()
            return response.data || []
        }
    })

    const terms = data || []

    // Create terms
    const createMutation = useMutation({
        mutationFn: (data: CreateTermsRequest) => termsService.createTerms(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
            toast.success('Terms created successfully')
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || error.message || 'Failed to create terms'
            toast.error(message)
        }
    })

    // Update terms
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateTermsRequest }) =>
            termsService.updateTerms(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
            toast.success('Terms updated successfully')
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || error.message || 'Failed to update terms'
            toast.error(message)
        }
    })

    // Delete terms
    const deleteMutation = useMutation({
        mutationFn: (id: string) => termsService.deleteTerms(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
            toast.success('Terms deleted successfully')
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || error.message || 'Failed to delete terms'
            toast.error(message)
        }
    })

    return {
        terms,
        isLoading,
        isError,
        error,
        refetch,
        createTerms: createMutation.mutate,
        updateTerms: updateMutation.mutate,
        deleteTerms: deleteMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending
    }
}
