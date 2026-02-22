// Types based on the ERD
export type OrganizationType = "platform" | "company" | "auditor" | "regulator"
export type OrganizationStatus = "active" | "inactive"

export type UserPortal = "admin" | "user"
export type UserRole = "SUPER_ADMIN" | "AUDITOR" | "REGULATOR" | "COMPANY_MANAGER" | "COMPANY_USER"
export type UserStatus = "active" | "disabled"

export type AssignmentStatus = "active" | "inactive"

export type AIVerdict = "clean" | "flagged"
export type InvoiceStatus = "pending" | "verified" | "flagged" | "fraudulent"

export type ReviewDecision = "verified" | "fraudulent" | "needs_clarification"

export type EntityType = "organization" | "user" | "assignment" | "invoice" | "review"

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

export interface Organization {
  _id: string
  type: OrganizationType
  name: string
  status: OrganizationStatus
  employees: number
  createdAt: Date
  updatedAt: Date
}

export interface User {
  _id: string
  orgId: string
  portal: UserPortal
  role: UserRole
  email: string
  username: string
  status: UserStatus
  mustChangePassword: boolean
  mfaEnabled?: boolean
  mfaSecret?: any
  createdByUserId?: string
  disabledByUserId?: string
  disabledAt?: Date
  disableReason?: string
  lastLoginAt?: Date
  organizationName?: string
  createdAt: Date
  updatedAt: Date
}

export interface CompanyAssignment {
  _id: string
  companyOrgId: string
  auditorUserId: string
  status: AssignmentStatus
  assignedByUserId: string
  assignedAt: Date
  notes?: string
  taskName: string
  dueDate: Date
}

/**
 * LedgerInvoice — mirrors the exact shape returned by GET /blockchain/ledger.
 * This is the canonical invoice type used throughout the frontend.
 */
export interface LedgerInvoice {
  _id: string          // mapped from ledger `id`
  invoiceNo: string    // mapped from ledger `invoiceNumber`
  companyName: string  // mapped from ledger `company`
  txHash: string       // mapped from ledger `transactionHash`
  anchoredAt: string   // ISO date string
  status: string       // e.g. "anchored"
}

/** Alias kept for backward compatibility with existing imports */
export type Invoice = LedgerInvoice

export interface Review {
  _id: string
  invoiceId: string
  companyOrgId: string
  reviewedByUserId: string
  decision: ReviewDecision
  notes?: string
  createdAt: Date
  // Joined fields
  reviewerName?: string
}

export interface AuditLog {
  _id: string
  actorUserId: string
  actorOrgId: string
  action: string
  entity_type: EntityType
  entity_id: string
  createdAt: Date
  // Joined fields
  actorName?: string
  actorEmail?: string
}
