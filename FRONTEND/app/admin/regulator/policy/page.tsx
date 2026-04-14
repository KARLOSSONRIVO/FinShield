"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { PolicyCard } from "@/components/policy/PolicyCard"
import { CreatePolicyDialog } from "@/components/policy/CreatePolicyDialog"
import { usePolicy } from "@/hooks/policy/use-policy"
import { Skeleton } from "@/components/ui/skeleton"

export default function PolicyPage() {
    const {
        policies,
        isLoading,
        isError,
        error,
        search,
        setSearch,
        createPolicy,
        updatePolicy,
        deletePolicy,
        isCreating,
        isUpdating,
        isDeleting
    } = usePolicy()

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null)
    const [localSearch, setLocalSearch] = useState(search || "")

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== (search || "")) {
                setSearch(localSearch)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [localSearch, search, setSearch])

    const handleCreatePolicy = (data: { title: string; content: string; version?: string }) => {
        createPolicy(data)
        setIsCreateDialogOpen(false)
    }

    const handleExpandToggle = (policyId: string) => {
        setExpandedPolicyId(prevId => prevId === policyId ? null : policyId)
    }

    if (isError) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Policy Management</h1>
                </div>
                <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
                    Error loading policies: {error}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Policy Management</h1>
                    <p className="text-muted-foreground">
                        Create and manage regulatory policies and guidelines
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    disabled={isCreating}
                >
                    <Plus className="h-4 w-4" />
                    Create New Policy
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search policies by title..."
                    className="pl-9 bg-white border-2 border-black/10"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                />
            </div>

            {/* 
            // FRONTEND ONLY PAGINATION (Commented out as requested)
            // const ITEMS_PER_PAGE = 10;
            // const [currentPage, setCurrentPage] = useState(1);
            // const totalPages = Math.ceil(policies.length / ITEMS_PER_PAGE);
            // const paginatedPolicies = policies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
            // Use `paginatedPolicies` instead of `policies` in the map below when un-commenting.
            */}

            {/* Policies List - Single Column */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="border rounded-xl p-6 space-y-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    ))}
                </div>
            ) : policies.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <h3 className="text-lg font-medium mb-2">No policies found</h3>
                    <p className="text-muted-foreground mb-4">
                        {search ? "No policies match your search" : "Get started by creating your first policy"}
                    </p>
                    {!search && (
                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Policy
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {policies.map((policy) => (
                        <PolicyCard
                            key={policy.id || policy._id}
                            policy={policy}
                            onUpdate={updatePolicy}
                            onDelete={deletePolicy}
                            isUpdating={isUpdating}
                            isDeleting={isDeleting}
                            isExpanded={expandedPolicyId === (policy.id || policy._id)}
                            onExpandToggle={() => handleExpandToggle(policy.id || policy._id || "")}
                        />
                    ))}
                </div>
            )}

            {/* Create Policy Dialog */}
            <CreatePolicyDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onCreatePolicy={handleCreatePolicy}
                isCreating={isCreating}
            />
        </div>
    )
}