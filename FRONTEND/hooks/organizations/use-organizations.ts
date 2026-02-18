"use client"

import { useState, useMemo, useEffect } from "react"
import { OrganizationService, Organization } from "@/services/organization.service"
import { toast } from "sonner"

export type SortConfig = {
    key: keyof Organization
    direction: "asc" | "desc"
} | null

export function useOrganizations() {
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newOrgName, setNewOrgName] = useState("")
    const [newOrgType, setNewOrgType] = useState("")
    const [newOrgEmployeeCount, setNewOrgEmployeeCount] = useState("")
    const [newOrgStatus, setNewOrgStatus] = useState("active")

    
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null) 

    
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)

    
    
    const fetchData = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await OrganizationService.listOrganizations()

            
            
            if (response?.success || response?.ok) {
                const rawData: any[] = response.data || []

                const mappedOrgs = rawData.map(o => ({
                    
                    id: String(o.id || o._id),
                    name: o.name,
                    
                    type: (o.type || "").toUpperCase() as "COMPANY" | "AUDITOR" | "REGULATOR",
                    status: (o.status || "ACTIVE").toUpperCase() as "ACTIVE" | "INACTIVE" | "SUSPENDED",
                    createdAt: o.createdAt,
                    updatedAt: o.updatedAt,
                }))

                setOrganizations(mappedOrgs)
            } else {
                console.warn("API returned success: false", response)
                setError("API responded but success was false (or missing). Check console.")
            }
        } catch (error: any) {
            console.error("Failed to fetch organizations:", error)
            setError(error.message || "Failed to connect to API")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    
    const requestSort = (key: keyof Organization) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    
    const filteredAndSortedOrgs = useMemo(() => {
        let processed = [...organizations]

        
        if (search) {
            processed = processed.filter(c =>
                (c.name || "").toLowerCase().includes(search.toLowerCase())
            )
        }

        
        if (sortConfig) {
            processed.sort((a, b) => {
                
                const aValue = a[sortConfig.key] || ""
                
                const bValue = b[sortConfig.key] || ""

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
                return 0
            })
        }

        return processed
    }, [organizations, search, sortConfig])

    
    const totalPages = Math.ceil(filteredAndSortedOrgs.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentOrgs = filteredAndSortedOrgs.slice(startIndex, startIndex + itemsPerPage)

    const handleCreateOrg = async () => {
        try {
            await OrganizationService.createOrganization({
                name: newOrgName,
                type: "company" 
                
            })
            await fetchData()
            setIsCreateOpen(false)
            setNewOrgName("")
            setNewOrgType("")
            setNewOrgEmployeeCount("")
            setNewOrgStatus("active")
            toast.success("Organization created")
        } catch (error: any) {
            console.error("Failed to create org:", error)
            toast.error("Failed to create organization: " + (error.message || "Unknown error"))
        }
    }

    const handleEditOrg = (org: Organization) => {
        console.log("Updating organization:", org);
        toast.info("Update Organization functionality is not yet fully implemented in Backend.");
    }

    const handleDeleteOrg = (id: string) => {
        
        toast.info("Delete Organization functionality is not yet fully implemented in Backend.");
    }

    return {
        search,
        setSearch,
        isCreateOpen,
        setIsCreateOpen,
        newOrgName,
        setNewOrgName,
        newOrgType,
        setNewOrgType,
        newOrgEmployeeCount,
        setNewOrgEmployeeCount,
        newOrgStatus,
        setNewOrgStatus,
        handleCreateOrg,
        handleEditOrg,
        handleDeleteOrg,

        organizations: currentOrgs,
        currentPage,
        totalPages,
        setCurrentPage,
        itemsPerPage,
        totalItems: filteredAndSortedOrgs.length,

        sortConfig,
        requestSort,
        isLoading,
        error
    }
}
