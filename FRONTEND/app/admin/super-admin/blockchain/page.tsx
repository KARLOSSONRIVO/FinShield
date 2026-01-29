"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Wallet, Filter, Link2 } from "lucide-react"

import { BlockchainTable } from "@/features/blockchain/components/BlockchainTable"
import { useBlockchain } from "@/features/super-admin/blockchain/hooks/useBlockchain"
import { Pagination } from "@/components/ui/pagination-custom"
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
    currentPage,
    totalPages,
    setCurrentPage,
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

      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Transaction Hash or Invoice ID..."
            className="pl-9 bg-background border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 border-2 border-black/10 text-base px-6">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Verified Only</DropdownMenuItem>
            <DropdownMenuItem>Date: Newest First</DropdownMenuItem>
            <DropdownMenuItem>Date: Oldest First</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <BlockchainTable invoices={invoices} />

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
