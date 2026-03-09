"use client"

import { Button } from "@/components/ui/button"
import { Wallet, Filter } from "lucide-react"
import { BlockchainTable } from "@/components/blockchain/BlockchainTable"
import { useBlockchain as useAuditorBlockchain } from "@/hooks/blockchain/use-blockchain"
import { DataPagination } from "@/components/common/DataPagination"
import { SearchInput } from "@/components/common/SearchInput"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AuditorBlockchainPage() {
  const {
    search,
    setSearch,
    invoices,
    pagination,
    setPage,
    sortConfig,
    requestSort
  } = useAuditorBlockchain()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Blockchain Ledger</h2>
      </div>

      <div className="flex gap-4">
        <SearchInput
          value={search || ""}
          onChange={setSearch}
          placeholder="Search by invoice no. or tx hash..."
        />

        {/* Filter & Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 shrink-0 bg-white hover:bg-gray-50 text-foreground font-medium px-6 border-2 border-black/10 text-base">
              <Filter className="h-4 w-4" />
              Filter & Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sort By</div>
            <DropdownMenuItem onClick={() => requestSort('invoiceNumber', 'desc')}>
              <span className={sortConfig?.key === 'invoiceNumber' && sortConfig?.direction === 'desc' ? "font-bold text-primary" : ""}>Invoice No. (New - Old)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => requestSort('invoiceNumber', 'asc')}>
              <span className={sortConfig?.key === 'invoiceNumber' && sortConfig?.direction === 'asc' ? "font-bold text-primary" : ""}>Invoice No. (Old - New)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <BlockchainTable
        invoices={invoices}
        sortBy={sortConfig?.key}
        order={sortConfig?.direction as "asc" | "desc" | undefined}
        onSort={(field) => requestSort(field)}
      />

      <div className="mt-4 flex justify-center">
        <DataPagination
          pagination={pagination}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
