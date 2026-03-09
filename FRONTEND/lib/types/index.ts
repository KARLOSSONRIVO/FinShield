export * from "./user"
export * from "./organization"
export * from "./invoice"
export * from "./primitives"

import { User } from "./user"
import { Organization } from "./organization"
import {
    AssignmentStatus,
    ReviewDecision,
    EntityType
} from "./primitives"

// ─── Aggregate Types ─────────────────────────────────────────────────────────

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
    notes?: string
    taskName?: string
    dueDate?: string
}

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

export enum AuditActions {
    LOGIN_SUCCESS = "LOGIN_SUCCESS",
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
    LOGOUT = "LOGOUT",
    MFA_ENABLED = "MFA_ENABLED",
    MFA_DISABLED = "MFA_DISABLED",
    USER_CREATED = "USER_CREATED",
    USER_UPDATED = "USER_UPDATED",
    USER_DISABLED = "USER_DISABLED",
    USER_ENABLED = "USER_ENABLED",
    PASSWORD_RESET_FORCED = "PASSWORD_RESET_FORCED",
    ORG_CREATED = "ORG_CREATED",
    ORG_TEMPLATE_UPLOADED = "ORG_TEMPLATE_UPLOADED",
    ASSIGNMENT_CREATED = "ASSIGNMENT_CREATED",
    ASSIGNMENT_UPDATED = "ASSIGNMENT_UPDATED",
    ASSIGNMENT_DELETED = "ASSIGNMENT_DELETED",
    INVOICE_UPLOADED = "INVOICE_UPLOADED",
    INVOICE_FLAGGED = "INVOICE_FLAGGED",
    REVIEW_SUBMITTED = "REVIEW_SUBMITTED",
    REVIEW_UPDATED = "REVIEW_UPDATED",
    ARCHIVE_EXECUTED = "ARCHIVE_EXECUTED",
    ARCHIVE_ACCESSED = "ARCHIVE_ACCESSED",
    POLICY_CREATED = "POLICY_CREATED",
    POLICY_UPDATED = "POLICY_UPDATED",
    POLICY_DELETED = "POLICY_DELETED",
    TERMS_CREATED = "TERMS_CREATED",
    TERMS_UPDATED = "TERMS_UPDATED",
    TERMS_DELETED = "TERMS_DELETED"
}

export interface AuditLog {
    id: string;
    _id?: string; // for backward compatibility
    actorId: string;
    actorRole: string;
    actor: {
        username: string;
        email: string;
    };
    action: AuditActions | string;
    targetType?: string;
    target?: {
        type: string;
        id?: string;
    };
    summary: string;
    metadata: Record<string, any>;
    ip: string;
    userAgent: string;
    isArchived: boolean;
    archivedAt: string | null;
    archiveKey: string | null;
    archiveFileHash: string | null;
    createdAt: string;
}

import { PaginationQuery } from "./primitives"

export interface AuditLogQuery extends PaginationQuery {
    action?: AuditActions | string;
    actorRole?: string;
    from?: string; // ISO date string
    to?: string;   // ISO date string
}
