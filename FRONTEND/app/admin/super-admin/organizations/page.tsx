"use client"

import { Input } from '@/components/ui/forms/input'
import { Building2, Search, Plus, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrganizationTable } from "@/components/organizations/OrganizationTable"
import { useOrganizations } from "@/hooks/organizations/use-organizations"
import { CreateOrganizationDialog } from "@/components/organizations/CreateOrganizationDialog"
import { Pagination } from '@/components/ui/data-display/pagination-custom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/data-display/dropdown-menu'

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
    newOrgEmployeeCount,
    setNewOrgEmployeeCount,
    newOrgStatus,
    setNewOrgStatus,
    handleCreateOrg,
    currentPage,
    totalPages,
    setCurrentPage,
    sortConfig,
    requestSort,
    handleEditOrg,
    handleDeleteOrg,
    error, 
    isLoading 
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
        newOrgEmployeeCount={newOrgEmployeeCount}
        setNewOrgEmployeeCount={setNewOrgEmployeeCount}
        newOrgStatus={newOrgStatus}
        setNewOrgStatus={setNewOrgStatus}
        onCreateOrg={handleCreateOrg}
      />

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Organizations..."
            className="pl-9 bg-background border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            suppressHydrationWarning
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 border-2 text-base px-6 h-10 border-black/10" suppressHydrationWarning>
              <Filter className="h-4 w-4" />
              Filter & Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Sort By Name</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => requestSort('name')}>
              <span className={sortConfig?.key === 'name' && sortConfig.direction === 'asc' ? "font-bold text-primary" : ""}>Name (A-Z)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { if (sortConfig?.key !== 'name' || sortConfig?.direction === 'asc') requestSort('name') }}>
              {}
              <span className={sortConfig?.key === 'name' && sortConfig.direction === 'desc' ? "font-bold text-primary" : ""}>Name (Z-A)</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Sort By Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { if (sortConfig?.key !== 'status' || sortConfig?.direction === 'desc') requestSort('status') }}>
              <span className={sortConfig?.key === 'status' && sortConfig.direction === 'asc' ? "font-bold text-primary" : ""}>Active First</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { if (sortConfig?.key !== 'status' || sortConfig?.direction === 'asc') requestSort('status') }}>
              <span className={sortConfig?.key === 'status' && sortConfig.direction === 'desc' ? "font-bold text-primary" : ""}>Inactive First</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <OrganizationTableSkeleton />
      ) : (
        <OrganizationTable
          organizations={organizations}
          sortConfig={sortConfig}
          onSort={requestSort}
          onEdit={handleEditOrg}
          onDelete={handleDeleteOrg}
        />
      )}

      <div className="mt-4 flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
