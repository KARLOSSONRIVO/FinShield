// ─── Primitive Types ───────────────────────────────────────────────────────
export type OrganizationType = "PLATFORM" | "COMPANY" | "AUDITOR" | "REGULATOR"
export type OrganizationStatus = "ACTIVE" | "INACTIVE"

export type AssignmentStatus = "ACTIVE" | "INACTIVE"

export type AIVerdict = "clean" | "flagged"
export type InvoiceStatus = "pending" | "clean" | "flagged" | "anchored" | "accepted" | "rejected"
export type ReviewDecision = "approved" | "rejected"
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
