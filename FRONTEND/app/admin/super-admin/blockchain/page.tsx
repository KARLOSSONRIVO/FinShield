"use client"

import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/forms/input'
import { Search, Wallet, Filter, Link2 } from "lucide-react"

import { BlockchainTable } from "@/components/blockchain/BlockchainTable"
import { useSuperAdminBlockchain } from "@/hooks/blockchain/use-super-admin-blockchain"
import { Pagination } from '@/components/ui/data-display/pagination-custom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/data-display/dropdown-menu'

export default function BlockchainPage() {
  const {
    search,
    setSearch,
    invoices,
    currentPage,
    totalPages,
    setCurrentPage,
    sortConfig, 
    requestSort 
  } = useSuperAdminBlockchain()

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
        {}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Transaction Hash or Invoice ID..."
            className="pl-9 bg-white border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 shrink-0 bg-white hover:bg-gray-50 text-foreground font-medium px-6 border-2 border-black/10 text-base">
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
