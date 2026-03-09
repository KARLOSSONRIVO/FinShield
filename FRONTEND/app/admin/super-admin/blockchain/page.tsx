"use client"

import { Button } from "@/components/ui/button"
import { Wallet, Filter, Link2 } from "lucide-react"

import { BlockchainTable } from "@/components/blockchain/BlockchainTable"
import { BlockchainTableSkeleton } from "@/components/skeletons/blockchain-table-skeleton"
import { useBlockchain } from "@/hooks/blockchain/use-blockchain"
import { DataPagination } from "@/components/common/DataPagination"
import { SearchInput } from "@/components/common/SearchInput"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function BlockchainPage() {
  const {
    search,
    setSearch,
    invoices,
    pagination,
    setPage,
    sortConfig, // eslint-disable-line @typescript-eslint/no-unused-vars
    requestSort, // eslint-disable-line @typescript-eslint/no-unused-vars
    isLoading
  } = useBlockchain()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Blockchain Ledger</h2>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Search */}
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
            <DropdownMenuItem onClick={() => requestSort('invoiceNumber', 'asc')}>
              <span className={sortConfig?.key === 'invoiceNumber' && sortConfig?.direction === 'asc' ? "font-bold text-primary" : ""}>Invoice No. (Ascending)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => requestSort('invoiceNumber', 'desc')}>
              <span className={sortConfig?.key === 'invoiceNumber' && sortConfig?.direction === 'desc' ? "font-bold text-primary" : ""}>Invoice No. (Descending)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <BlockchainTableSkeleton />
      ) : (
        <BlockchainTable
          invoices={invoices}
          sortBy={sortConfig?.key}
          order={sortConfig?.direction as "asc" | "desc" | undefined}
          onSort={(field) => requestSort(field)}
        />
      )}

      <div className="mt-4 flex justify-center">
        <DataPagination
          pagination={pagination}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
