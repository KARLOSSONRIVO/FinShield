// ─── Primitive Types ───────────────────────────────────────────────────────
export type OrganizationType = "platform" | "company" | "auditor" | "regulator"
export type OrganizationStatus = "active" | "inactive"

export type UserPortal = "admin" | "user"
export type UserRole = "SUPER_ADMIN" | "AUDITOR" | "REGULATOR" | "COMPANY_MANAGER" | "COMPANY_USER"
export type UserStatus = "active" | "disabled"

export type AssignmentStatus = "ACTIVE" | "INACTIVE"

export type AIVerdict = "clean" | "flagged"
export type InvoiceStatus = "pending" | "verified" | "flagged" | "fraudulent" | "anchored"
export type ReviewDecision = "pending" | "approved" | "verified" | "fraudulent" | "needs_clarification"
export type EntityType = "organization" | "user" | "assignment" | "invoice" | "review"

// ─── Pagination ─────────────────────────────────────────────────────────────
export interface PaginationDetails {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  ok: boolean;
  data: {
    items: T[];
    pagination: PaginationDetails;
  }
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  [key: string]: any;
}

// ─── Organization ────────────────────────────────────────────────────────────
// API returns `id`, not `_id`. We accept both for backwards compatibility.
export interface Organization {
  id: string
  _id?: string   // alias kept for backward compatibility
  type: OrganizationType
  name: string
  status: OrganizationStatus
  invoiceTemplate?: {
    s3Key: string
    fileName: string
    uploadedAt: string
  } | null
  createdAt: string
  updatedAt: string
}

// ─── User ────────────────────────────────────────────────────────────────────
// API returns `id`, not `_id`. We accept both for backwards compatibility.
export interface User {
  id?: string
  _id: string   // mapped from `id` via data layer or apiClient interceptor
  orgId: string
  portal?: UserPortal
  role: UserRole
  email: string
  username: string
  status: UserStatus
  mustChangePassword: boolean
  mfaEnabled?: boolean
  lastLoginAt?: string
  organizationName?: string
  disabledByUserId?: string
  disabledAt?: string
  disableReason?: string
  createdAt: string
  updatedAt: string
}

// ─── Assignment ──────────────────────────────────────────────────────────────
export interface CompanyAssignment {
  id: string
  _id?: string  // alias kept for backward compatibility
  auditorOrgId: string
  companyOrgId: string
  status: AssignmentStatus
  auditorUserId?: string
  assignedByUserId?: string
  assignedAt?: string
  createdAt?: string
  updatedAt?: string
  // Populated fields
  company?: Partial<Organization>
  auditor?: Partial<User>
  assignedBy?: Partial<User>
}

// ─── Invoice Types ───────────────────────────────────────────────────────────

/**
 * Shape returned by GET /invoice/list
 * Used in all invoice table views (super-admin, auditor, regulator, manager)
 */
export interface ListInvoice {
  id: string
  _id?: string   // alias
  invoiceNumber: string
  date?: string  // invoiceDate
  amount?: number // totalAmount
  aiVerdict?: {
    verdict: AIVerdict
    riskScore: number
  }
  status: InvoiceStatus
  blockchain?: string // txHash
  companyName?: string // company name — field name as returned by the API
}

/**
 * Shape returned by GET /invoice/my-invoices (COMPANY_USER only)
 */
export interface MyInvoice {
  id: string
  _id?: string
  invoiceNumber: string
  date?: string
  amount?: number
  fileName?: string
  status: InvoiceStatus
  anchorStatus?: string
  uploadedAt?: string
}

/**
 * Shape returned by GET /invoice/:id (full detail)
 */
export interface InvoiceDetail {
  id: string
  _id?: string
  invoiceNumber: string
  company?: string
  invoiceDate?: string
  totalAmount?: number
  status: InvoiceStatus
  imageUrl?: string        // signed URL to view the scanned invoice
  originalFileName?: string
  aiAnalysis?: {
    verdict: AIVerdict
    riskScore: number
    summary?: string
  }
  blockchain?: {
    txHash: string
    anchoredAt: string
    ipfsCid?: string
    fileUrl?: string  // Pinata IPFS gateway URL for viewing the invoice file
  }
  review?: {
    reviewer: string
    decision: ReviewDecision
    notes?: string
    reviewedAt: string
  }
}

/**
 * Shape returned by GET /blockchain/ledger
 */
export interface LedgerInvoice {
  id: string
  _id?: string
  invoiceNumber: string
  company: string
  transactionHash: string
  anchoredAt: string
  status: string
}

/**
 * Alias: ListInvoice is the canonical "Invoice" type throughout the app.
 * The InvoiceTable component expects this shape.
 */
export type Invoice = ListInvoice

// ─── Review ──────────────────────────────────────────────────────────────────
export interface Review {
  _id: string
  invoiceId: string
  companyOrgId: string
  reviewedByUserId: string
  decision: ReviewDecision
  notes?: string
  createdAt: string
  reviewerName?: string
}

// ─── Audit Log ───────────────────────────────────────────────────────────────
export interface AuditLog {
  _id: string
  actorUserId: string
  actorOrgId: string
  action: string
  entity_type: EntityType
  entity_id: string
  createdAt: string
  actorName?: string
  actorEmail?: string
}
