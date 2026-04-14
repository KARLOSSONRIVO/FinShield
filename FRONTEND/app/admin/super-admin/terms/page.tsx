'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import { TermsCard } from '@/components/terms/TermsCard'
import { CreateTermsDialog } from '@/components/terms/CreateTermsDialog'
import { useTerms } from '@/hooks/terms/use-terms'
import { Skeleton } from '@/components/ui/skeleton'

export default function TermsPage() {
    const {
        terms,
        isLoading,
        isError,
        error,
        createTerms,
        updateTerms,
        deleteTerms,
        isCreating,
        isUpdating,
        isDeleting
    } = useTerms()

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [expandedTermsId, setExpandedTermsId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [localSearch, setLocalSearch] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== search) {
                setSearch(localSearch)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [localSearch, search])

    // Filter terms by search (client‑side for simplicity)
    const filteredTerms = terms.filter(term =>
        term.title.toLowerCase().includes(search.toLowerCase())
    )

    const handleCreateTerms = (data: { title: string; content: string; version?: string }) => {
        createTerms(data)
        setIsCreateDialogOpen(false)
    }

    const handleExpandToggle = (termsId: string) => {
        setExpandedTermsId(prevId => prevId === termsId ? null : termsId)
    }

    if (isError) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Terms Management</h1>
                </div>
                {isError && (
                    <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
                        Error loading terms: {error?.message || 'Unknown error'}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Terms Management</h1>
                    <p className="text-muted-foreground">
                        Create and manage global terms and conditions
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    disabled={isCreating}
                >
                    <Plus className="h-4 w-4" />
                    Create New Terms
                </Button>
            </div>

            {/* Search */}
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search terms by title..."
                    className="pl-9 bg-white border-2 border-black/10"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                />
            </div>

            {/* Terms List */}
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
            ) : filteredTerms.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <h3 className="text-lg font-medium mb-2">No terms found</h3>
                    <p className="text-muted-foreground mb-4">
                        {search ? 'No terms match your search' : 'Get started by creating your first terms'}
                    </p>
                    {!search && (
                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Terms
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTerms.map((term) => (
                        <TermsCard
                            key={term.id}
                            terms={term}
                            onUpdate={updateTerms}
                            onDelete={deleteTerms}
                            isUpdating={isUpdating}
                            isDeleting={isDeleting}
                            isExpanded={expandedTermsId === term.id}
                            onExpandToggle={() => handleExpandToggle(term.id)}
                        />
                    ))}
                </div>
            )}

            <CreateTermsDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onCreateTerms={handleCreateTerms}
                isCreating={isCreating}
            />
        </div>
    )
}