
export type OrganizationType = "platform" | "company"
export type OrganizationStatus = "active" | "inactive"

export type UserPortal = "admin" | "user"
export type UserRole = "SUPER_ADMIN" | "AUDITOR" | "REGULATOR" | "COMPANY_MANAGER" | "COMPANY_USER"
export type UserStatus = "active" | "disabled"

export type AssignmentStatus = "active" | "inactive"

export type AIVerdict = "clean" | "flagged"
export type InvoiceStatus = "pending" | "verified" | "flagged" | "fraudulent"

export type ReviewDecision = "verified" | "fraudulent" | "needs_clarification"

export type EntityType = "organization" | "user" | "assignment" | "invoice" | "review"

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

export interface Invoice {
  _id: string
  
  
  orgId?: string
  companyOrgId?: string

  
  uploadedByUserId: string

  invoiceNo: string | null
  invoiceDate: Date | null
  totals_total: number | null 

  
  aiVerdict?: AIVerdict
  ai_verdict?: AIVerdict

  
  aiRiskScore?: number
  ai_riskScore?: number

  
  fileHashSha256: string
  ipfsCid: string

  
  blockchain_txHash?: string 
  anchorTxHash?: string

  blockchain_anchoredAt?: Date 
  anchoredAt?: Date

  status: InvoiceStatus
  createdAt: Date
  updatedAt: Date
  
  companyName?: string
  uploadedByName?: string
}

export interface Review {
  _id: string
  invoiceId: string
  companyOrgId: string
  reviewedByUserId: string
  decision: ReviewDecision
  notes?: string
  createdAt: Date
  
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
  
  actorName?: string
  actorEmail?: string
}
