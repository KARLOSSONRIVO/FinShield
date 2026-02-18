import { useState, useMemo, useEffect } from "react"
import { AssignmentService } from "@/services/assignment.service"
import { OrganizationService, Organization } from "@/services/organization.service"
import { UserService } from "@/services/user.service"
import { components } from '@/types/api'

type User = components["schemas"]["User"]


export interface RealAssignment {
    id: string;
    companyOrgId: string;
    auditorUserId: string;
    status: "active" | "inactive";
    notes?: string;
    assignedAt?: string;
    assignedByUserId?: string;

    
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

export type SortConfig = {
    key: keyof RealAssignment | "companyName" | "auditorName"
    direction: "asc" | "desc"
} | null

export function useAssignments() {
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newAssignment, setNewAssignment] = useState({ companyOrgId: "", auditorUserId: "", status: "active" })

    
    const [assignments, setAssignments] = useState<RealAssignment[]>([])
    const [auditors, setAuditors] = useState<User[]>([])
    const [companies, setCompanies] = useState<Organization[]>([])
    const [isLoading, setIsLoading] = useState(true)

    
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)

    
    const getCompanyName = (orgId: string) => companies.find(c => c.id === orgId)?.name || "Unknown Company"
    const getAuditorName = (userId: string) => {
        const user = auditors.find(u => u.id === userId)
        return user ? `${user.firstName} ${user.lastName}` : "Unknown Auditor"
    }

    
    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [assignmentsRes, usersRes, orgsRes] = await Promise.all([
                AssignmentService.listAssignments(),
                UserService.listUsers(),
                OrganizationService.listOrganizations()
            ])

            if (assignmentsRes?.ok) {
                
                setAssignments(assignmentsRes.data || [])
            }
            if (usersRes?.ok) setAuditors((usersRes.data || []).filter(u => u.role === "AUDITOR"))
            if (orgsRes?.ok) setCompanies(orgsRes.data || [])

        } catch (error) {
            console.error("Failed to fetch assignment data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    
    const requestSort = (key: keyof RealAssignment | "companyName" | "auditorName") => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const filteredAndSortedAssignments = useMemo(() => {
        let processed = [...assignments]

        
        if (search) {
            const lowerSearch = search.toLowerCase()
            processed = processed.filter(a => {
                const companyName = a.company?.name || getCompanyName(a.companyOrgId)
                const auditorName = a.auditor?.username || getAuditorName(a.auditorUserId)

                return companyName.toLowerCase().includes(lowerSearch) ||
                    auditorName.toLowerCase().includes(lowerSearch) ||
                    (a.status || "").toLowerCase().includes(lowerSearch)
            })
        }

        
        if (sortConfig) {
            processed.sort((a, b) => {
                let aValue = ""
                let bValue = ""

                if (sortConfig.key === "companyName") {
                    aValue = a.company?.name || getCompanyName(a.companyOrgId)
                    bValue = b.company?.name || getCompanyName(b.companyOrgId)
                } else if (sortConfig.key === "auditorName") {
                    aValue = a.auditor?.username || getAuditorName(a.auditorUserId)
                    bValue = b.auditor?.username || getAuditorName(b.auditorUserId)
                } else {
                    
                    aValue = a[sortConfig.key] || "";
                    
                    bValue = b[sortConfig.key] || "";
                }

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
                return 0
            })
        }

        return processed
    }, [assignments, search, sortConfig, companies, auditors]) 

    
    const totalPages = Math.ceil(filteredAndSortedAssignments.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentAssignments = filteredAndSortedAssignments.slice(startIndex, startIndex + itemsPerPage)

    const handleCreateAssignment = async () => {
        try {
            await AssignmentService.createAssignment({
                auditorUserId: newAssignment.auditorUserId,
                companyOrgId: newAssignment.companyOrgId,
                status: newAssignment.status
            })
            await fetchData()
            setIsCreateOpen(false)
            setNewAssignment({ companyOrgId: "", auditorUserId: "", status: "active" })
        } catch (error) {
            console.error("Failed to create assignment:", error)
            alert("Failed to create assignment")
        }
    }

    const handleUpdateAssignment = async (id: string, data: { status?: "active" | "inactive", notes?: string }) => {
        try {
            
            
            
            
            await AssignmentService.updateAssignment(id, data)
            await fetchData()
        } catch (error) {
            console.error("Failed to update assignment:", error)
            alert("Failed to update assignment")
        }
    }

    const handleDeleteAssignment = async (id: string) => {
        if (!confirm("Are you sure you want to delete this assignment?")) return
        try {
            await AssignmentService.deleteAssignment(id)
            await fetchData()
        } catch (error) {
            console.error("Failed to delete assignment:", error)
            alert("Failed to delete assignment")
        }
    }

    return {
        search,
        setSearch,
        isCreateOpen,
        setIsCreateOpen,
        newAssignment,
        setNewAssignment,
        handleCreateAssignment,
        handleUpdateAssignment,
        handleDeleteAssignment,

        assignments: currentAssignments,
        currentPage,
        totalPages,
        setCurrentPage,
        sortConfig,
        requestSort,
        isLoading,

        auditors,
        companies,
        getCompanyName,
        getAuditorName
    }
}
