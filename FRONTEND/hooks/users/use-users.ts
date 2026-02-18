"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserService } from "@/services/user.service"
import { OrganizationService } from "@/services/organization.service"
import { mockOrganizations, mockUsers } from "@/lib/mock-data"
import { User as FrontendUser, Organization } from '@/types'
import { toast } from "sonner"

export type SortConfig = {
    key: keyof FrontendUser
    direction: "asc" | "desc"
} | null

export function useUsers() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [disableUserId, setDisableUserId] = useState<string | null>(null)
    const [reason, setReason] = useState("")

    
    const { data: realOrganizations = [] } = useQuery<Organization[]>({
        queryKey: ["organizations"],
        queryFn: async () => {
            
            await new Promise(resolve => setTimeout(resolve, 500))
            return mockOrganizations.map(o => ({
                ...o,
                
                
                
                
                
                
            })) as Organization[]
        }
    })

    
    type NewUserState = {
        email: string
        username: string
        role: string
        orgId: string
    }

    const [newUser, setNewUser] = useState<NewUserState>({
        email: "",
        username: "",
        role: "",
        orgId: ""
    })

    
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)
    const [userTypeFilter, setUserTypeFilter] = useState<"all" | "platform" | "company">("platform")

    
    const { data: apiUsers = [], isLoading, isError } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            
            await new Promise(resolve => setTimeout(resolve, 800))
            return mockUsers as unknown as FrontendUser[]
        }
    })

    const [createError, setCreateError] = useState<string | null>(null)

    
    const createUserMutation = useMutation({
        mutationFn: async () => {
            setCreateError(null) 
            
            if (["COMPANY_MANAGER", "COMPANY_USER"].includes(newUser.role) && !newUser.orgId) {
                throw new Error("Company is required for this role");
            }

            
            const payload = {
                email: newUser.email,
                password: "Password123!", 
                username: newUser.username,
                role: newUser.role as any,
                
                orgId: (newUser.orgId || "").trim() || undefined
            }
            return await UserService.createUser(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
            toast.success("User created successfully!")
            setIsCreateOpen(false)
            setNewUser({ email: "", username: "", role: "", orgId: "" })
            setCreateError(null)
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || error.message || "Failed to create user"
            setCreateError(msg)
            toast.error(msg)
        }
    })

    
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, reason }: { id: string; status: "ACTIVE" | "SUSPENDED"; reason?: string }) => {
            
            const apiStatus = status === "SUSPENDED" ? "disabled" : "active"
            
            const apiReason = status === "SUSPENDED" ? reason : undefined
            return await UserService.updateUserStatus(id, apiStatus as any, apiReason)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
            toast.success("User status updated")
        },
        onError: (error: any) => {
            toast.error("Failed to update user status: " + (error.response?.data?.message || error.message))
        }
    })

    
    const requestSort = (key: keyof FrontendUser) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const filteredAndSortedUsers = useMemo(() => {
        let processed = [...apiUsers]

        
        
        
        if (userTypeFilter === "platform") {
            
            processed = processed.filter(u => ["SUPER_ADMIN", "AUDITOR", "REGULATOR", "COMPANY_MANAGER"].includes(u.role))
        } else if (userTypeFilter === "company") {
            processed = processed.filter(u => ["COMPANY_USER"].includes(u.role))
        }

        
        if (search) {
            const lowerSearch = search.toLowerCase()
            processed = processed.filter(u =>
                u.email.toLowerCase().includes(lowerSearch) ||
                u.username.toLowerCase().includes(lowerSearch)
            )
        }

        
        if (sortConfig) {
            processed.sort((a, b) => {
                
                const aValue = a[sortConfig.key]
                
                const bValue = b[sortConfig.key]
                
                if (aValue === bValue) return 0
                if (aValue === undefined || aValue === null) return 1
                if (bValue === undefined || bValue === null) return -1

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
                return 0
            })
        }

        
        
        processed = processed.map(u => {
            const org = realOrganizations.find(o => o._id === u.orgId)
            let orgName = "FinShield"

            if (org) {
                orgName = org.name
            } else if (u.orgId === "org-platform") {
                orgName = "FinShield Platform"
            } else if (u.orgId && u.orgId !== "org-unknown") {
                
                
                
                
                
                
                orgName = "FinShield"
            }

            return {
                ...u,
                organizationName: orgName
            }
        })

        return processed
    }, [apiUsers, search, sortConfig, userTypeFilter])

    
    const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentUsers = filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage)


    const handleCreateUser = () => {
        createUserMutation.mutate()
    }

    const handleUpdateStatus = (id: string, status: "ACTIVE" | "SUSPENDED", reason?: string) => {
        updateStatusMutation.mutate({ id, status, reason })
    }

    return {
        search,
        setSearch,
        isCreateOpen,
        setIsCreateOpen,

        newUser,
        setNewUser,
        userTypeFilter,
        setUserTypeFilter,

        users: currentUsers,
        organizations: realOrganizations, 
        handleCreateUser,
        handleUpdateStatus,
        isCreating: createUserMutation.isPending,
        isUpdatingStatus: updateStatusMutation.isPending,
        isLoading,
        isError,
        createError,
        setCreateError,

        currentPage,
        totalPages,
        setCurrentPage,
        sortConfig,
        requestSort
    }
}