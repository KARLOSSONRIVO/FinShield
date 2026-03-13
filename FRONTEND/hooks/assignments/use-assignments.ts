import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AssignmentService } from "@/services/assignment.service"
import { OrganizationService, Organization } from "@/services/organization.service"
import { UserService } from "@/services/user.service"
import { components } from "@/lib/api-types"
import { useUrlPagination } from "../common/use-url-pagination"
import { toast } from "sonner"

type User = components["schemas"]["User"]

export interface RealAssignment {
    id: string;
    companyOrgId: string;
    auditorUserId: string;
    status: "ACTIVE" | "INACTIVE";
    notes?: string;
    assignedAt?: string;
    assignedByUserId?: string;

    // Populated fields from backend
    company?: {
        id: string;
        name: string;
        type: string;
    } | null;
    auditor?: {
        id: string;
        email: string;
        username: string;
        role: string;
    } | null;
    assignedBy?: {
        id: string;
        email: string;
        username: string;
    } | null;
}

export function useAssignments({ initialLimit = 10 } = {}) {
    const queryClient = useQueryClient()
    const {
        page, limit, search, sortBy, order, queryParams,
        setPage, setSearch, setSort
    } = useUrlPagination(initialLimit)

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newAssignment, setNewAssignment] = useState({ companyOrgId: "", auditorUserId: "", status: "active" })

    // Fetch Base Collections for lookups (Roles/Companies)
    const { data: auditors = [] } = useQuery({
        queryKey: ["users", "auditors"],
        queryFn: async () => {
            // API guide states listUsers supports role filter if search/sort is passed, but maybe not explicitly.
            // Best to just fetch standard users and filter on frontend for now to avoid breaking changes if backend doesn't support 'role' query param yet
            const res = await UserService.listUsers({ limit: 100 }) // Assuming max limit for dropdowns
            return (res.data?.items || []).filter((u: any) => u.role === "AUDITOR") as any[]
        }
    })

    const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
        queryKey: ["organizations", "companies"],
        queryFn: async () => {
            const res = await OrganizationService.listOrganizations({ limit: 100 })
            return (res.data?.items || []) as any[]
        }
    })

    // Helpers for Lookups (Fallback if backend doesn't populate)
    const getCompanyName = (orgId: string) => companies.find((c: any) => c.id === orgId || c._id === orgId)?.name || "Unknown Company"
    const getAuditorName = (userId: string) => {
        const user = auditors.find((u: any) => u.id === userId || u._id === userId)
        return user ? user.username || `${user.firstName} ${user.lastName}` : "Unknown Auditor"
    }

    // Fetch Assignments Paginated
    const { data, isLoading: isLoadingAssignments, isError } = useQuery({
        queryKey: ["assignments", queryParams],
        queryFn: async () => {
            const allowedSortKeys = ["createdAt", "assignedAt", "status"]
            const fetchParams = {
                ...queryParams,
                sortBy: queryParams.sortBy && allowedSortKeys.includes(queryParams.sortBy) ? queryParams.sortBy : undefined
            }

            const response = await AssignmentService.listAssignments(fetchParams)

            // Handle both unified PaginatedResponse or legacy array fallback
            // @ts-ignore
            if (response.data && Array.isArray(response.data)) {
                const rawData = response.data
                return {
                    items: rawData as any[],
                    pagination: { total: rawData.length, page: 1, limit: rawData.length, totalPages: 1 }
                }
            }

            return {
                items: (response.data?.items || []) as any[],
                pagination: response.data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 }
            }
        }
    })

    const createAssignmentMutation = useMutation({
        mutationFn: async (overrideData?: { auditorUserId: string, companyOrgId: string, notes?: string }) => {
            return await AssignmentService.createAssignment({
                auditorUserId: overrideData?.auditorUserId || newAssignment.auditorUserId,
                companyOrgId: overrideData?.companyOrgId || newAssignment.companyOrgId,
                // Assigning notes if backend supports it, otherwise it ignores it
                notes: overrideData?.notes
            } as any)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assignments"] })
            setIsCreateOpen(false)
            setNewAssignment({ companyOrgId: "", auditorUserId: "", status: "active" })
            toast.success("Assignment created")
        },
        onError: (error: any) => {
            toast.error("Failed to create assignment: " + (error.response?.data?.message || error.message))
        }
    })

    const updateAssignmentMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: { status?: "ACTIVE" | "INACTIVE" } }) => {
            // API expects lowercase 'active'/'inactive' on write, even though it returns uppercase
            const payload = { status: data.status!.toLowerCase() as "active" | "inactive" }
            return await AssignmentService.updateAssignment(id, payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assignments"] })
            toast.success("Assignment updated")
        },
        onError: (error: any) => {
            toast.error("Failed to update assignment: " + (error.response?.data?.message || error.message))
        }
    })

    const deleteAssignmentMutation = useMutation({
        mutationFn: async (id: string) => {
            return await AssignmentService.deleteAssignment(id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assignments"] })
            toast.success("Assignment deleted")
        },
        onError: (error: any) => {
            toast.error("Failed to delete assignment: " + (error.response?.data?.message || error.message))
        }
    })

    const handleDeleteAssignment = (id: string) => {
        deleteAssignmentMutation.mutate(id)
    }

    const handleSort = (key: string) => {
        setSort(key)
    }

    return {
        // Table Data & Pagination
        assignments: data?.items || [],
        pagination: data?.pagination,
        isLoading: isLoadingAssignments || isLoadingCompanies,
        isError,

        // Lookup Data for Dialogs/UI
        auditors,
        companies,
        getCompanyName,
        getAuditorName,

        // URL Pagination Handlers
        search,
        setSearch,
        setPage,
        sortConfig: sortBy ? { key: sortBy, direction: order || 'asc' } : null,
        requestSort: handleSort,

        // Interactions
        isCreateOpen,
        setIsCreateOpen,
        newAssignment,
        setNewAssignment,

        handleCreateAssignment: (overrideData?: { auditorUserId: string, companyOrgId: string, notes?: string }) => createAssignmentMutation.mutate(overrideData),
        isCreating: createAssignmentMutation.isPending,

        handleUpdateAssignment: (id: string, status: "ACTIVE" | "INACTIVE") =>
            updateAssignmentMutation.mutate({ id, data: { status } }),

        handleDeleteAssignment,
        isDeleting: deleteAssignmentMutation.isPending
    }
}
