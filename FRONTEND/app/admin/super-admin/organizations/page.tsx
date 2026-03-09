"use client"

import { Building2, Plus, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrganizationTable } from "@/components/organizations/OrganizationTable"
import { useOrganizations } from "@/hooks/organizations/use-organizations"
import { CreateOrganizationDialog } from "@/components/organizations/CreateOrganizationDialog"
import { SearchInput } from "@/components/common/SearchInput"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { OrganizationTableSkeleton } from "@/components/skeletons/organization-table-skeleton"

export default function OrganizationsPage() {
  const {
    search,
    setSearch,
    organizations,
    isCreateOpen,
    setIsCreateOpen,
    newOrgName,
    setNewOrgName,
    newOrgType,
    setNewOrgType,
    newOrgStatus,
    setNewOrgStatus,
    handleCreateOrg,
    pagination,
    setPage,
    sortConfig,
    requestSort,
    handleEditOrg,
    handleDeleteOrg,
    error, // Extract error
    isLoading // Destructure isLoading
  } = useOrganizations()

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Organization Management</h2>
        <Button
          onClick={() => setIsCreateOpen(true)}
          suppressHydrationWarning
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
        >
          <Plus className="h-4 w-4" />
          Create Organization
        </Button>
      </div>

      <CreateOrganizationDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        newOrgName={newOrgName}
        setNewOrgName={setNewOrgName}
        newOrgType={newOrgType}
        setNewOrgType={setNewOrgType}
        newOrgStatus={newOrgStatus}
        setNewOrgStatus={setNewOrgStatus}
        onCreateOrg={handleCreateOrg}
      />

      <div className="flex gap-4">
        <SearchInput
          value={search || ""}
          onChange={setSearch}
          placeholder="Search by organization name..."
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 border-2 text-base px-6 h-10 border-black/10" suppressHydrationWarning>
              <Filter className="h-4 w-4" />
              Filter & Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => requestSort('createdAt', 'desc')}>
              <span className={sortConfig?.key === 'createdAt' && sortConfig?.direction === 'desc' ? "font-bold text-primary" : ""}>Date Created (New - Old)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => requestSort('createdAt', 'asc')}>
              <span className={sortConfig?.key === 'createdAt' && sortConfig?.direction === 'asc' ? "font-bold text-primary" : ""}>Date Created (Old - New)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <OrganizationTableSkeleton />
      ) : (
        <OrganizationTable
          organizations={organizations}
          onEdit={handleEditOrg}
          pagination={pagination}
          onPageChange={setPage}
          sortBy={sortConfig?.key}
          order={sortConfig?.direction as "asc" | "desc" | undefined}
          onSort={(field) => requestSort(field)}
        />
      )}
    </div>
  )
}
