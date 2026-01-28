"use client"

import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuditLogTable } from "@/features/super-admin/audit-logs/components/AuditLogTable"
import { useAuditLogs, EntityFilter } from "@/features/super-admin/audit-logs/hooks/useAuditLogs"
import { Pagination } from "@/components/ui/pagination-custom"
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
  } = useAuditLogs()

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
        <h2 className="text-2xl font-normal tracking-tight">System History</h2>
      </div>

      <div>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Loggings..."
              className="pl-9 bg-background border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-2 border-black/10 text-base px-6">
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
