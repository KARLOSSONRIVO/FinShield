"use client"

import { Button } from "@/components/ui/button"
import { Wallet, Filter, Link2 } from "lucide-react"

import { BlockchainTable } from "@/components/blockchain/BlockchainTable"
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
    requestSort // eslint-disable-line @typescript-eslint/no-unused-vars
  } = useBlockchain()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Blockchain Ledger</h2>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Search */}
        <SearchInput
          value={search || ""}
          onChange={setSearch}
          placeholder="Search Transaction Hash or Invoice ID..."
        />

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 shrink-0 bg-white hover:bg-gray-50 text-foreground font-medium px-6 border-2 border-black/10 text-base">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Verified Only</DropdownMenuItem>
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
