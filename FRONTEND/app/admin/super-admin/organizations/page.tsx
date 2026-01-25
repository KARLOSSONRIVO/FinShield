"use client"

import { Input } from "@/components/ui/input"
import { Building2, Search, Plus, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrganizationTable } from "@/features/super-admin/organizations/components/OrganizationTable"
import { useOrganizations } from "@/features/super-admin/organizations/hooks/useOrganizations"
import { CreateOrganizationDialog } from "@/features/super-admin/organizations/components/CreateOrganizationDialog"
import { Pagination } from "@/components/ui/pagination-custom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function OrganizationsPage() {
  const {
    search,
    setSearch,
    organizations,
    isCreateOpen,
    setIsCreateOpen,
    newOrgName,
    setNewOrgName,
    handleCreateOrg,
    currentPage,
    totalPages,
    setCurrentPage,
    sortConfig,
    requestSort,
    handleEditOrg,
    handleDeleteOrg
  } = useOrganizations()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Organization Management</h2>
        <Button
          onClick={() => setIsCreateOpen(true)}
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
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 border-2 border-black/10 text-base px-6">
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
              {/* Note: This logic for Desc matches: If not name, becomes Name Asc (Close enough). If Name Asc, becomes Name Desc. */}
              <span className={sortConfig?.key === 'name' && sortConfig.direction === 'desc' ? "font-bold text-primary" : ""}>Name (Z-A)</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Sort By Employees</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { if (sortConfig?.key !== 'employees' || sortConfig?.direction === 'desc') requestSort('employees') }}>
              <span className={sortConfig?.key === 'employees' && sortConfig.direction === 'asc' ? "font-bold text-primary" : ""}>Ascending (Low-High)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { if (sortConfig?.key !== 'employees' || sortConfig?.direction === 'asc') requestSort('employees') }}>
              <span className={sortConfig?.key === 'employees' && sortConfig.direction === 'desc' ? "font-bold text-primary" : ""}>Descending (High-Low)</span>
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

      <OrganizationTable
        organizations={organizations}
        sortConfig={sortConfig}
        onSort={requestSort}
        onEdit={handleEditOrg}
        onDelete={handleDeleteOrg}
      />

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
