"use client"

import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

import { AuditLogTable } from "@/components/audit-logs/AuditLogTable"
import { useSuperAdminAuditLogs, EntityFilter } from "@/hooks/audit-logs/use-super-admin-audit-logs"
import { Pagination } from "@/components/ui/pagination-custom"
import { SearchInput } from "@/components/common/SearchInput"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export default function AuditLogsPage() {
  const {
    search,
    setSearch,
    entityFilter,
    setEntityFilter,
    logs,
    currentPage,
    totalPages,
    setCurrentPage
  } = useSuperAdminAuditLogs()

  const FilterItem = ({ label, value }: { label: string, value: EntityFilter }) => (
    <DropdownMenuItem
      onClick={() => setEntityFilter(value)}
      className={cn("justify-between", entityFilter === value && "bg-accent font-medium")}
    >
      {label}
      {entityFilter === value && <div className="h-2 w-2 rounded-full bg-emerald-600" />}
    </DropdownMenuItem>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">System Audit Logs</h2>
      </div>

      <div>
        <div className="flex gap-4">
          <SearchInput
            value={search || ""}
            onChange={setSearch}
            placeholder="Search Logs (action, actor, entity ID)..."
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0 bg-white hover:bg-gray-50 text-foreground font-medium px-6 border-2 border-black/10 text-base">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Entity</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <FilterItem label="All Entities" value="all" />
              <FilterItem label="Invoices" value="invoice" />
              <FilterItem label="Users" value="user" />
              <FilterItem label="Assignments" value="assignment" />
              <FilterItem label="Organizations" value="organization" />
              <FilterItem label="Reviews" value="review" />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4">
        <AuditLogTable logs={logs} />
      </div>

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
