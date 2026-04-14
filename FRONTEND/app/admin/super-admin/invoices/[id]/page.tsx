"use client"

import { use } from "react"
import { InvoiceDetailView } from "@/components/invoices/InvoiceDetailView"

export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <InvoiceDetailView id={id} backUrl="/admin/super-admin/invoices" />
}
