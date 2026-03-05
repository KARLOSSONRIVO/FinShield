/**
 * Enum of all auditable actions in the system.
 * Used as the `action` field on AuditLog documents.
 */
export const AuditActions = {
    // ─── Authentication ─────────────────────────────────────────────────────
    LOGIN_SUCCESS:         "LOGIN_SUCCESS",
    ACCOUNT_LOCKED:        "ACCOUNT_LOCKED",
    LOGOUT:                "LOGOUT",

    // ─── MFA ────────────────────────────────────────────────────────────────
    MFA_ENABLED:           "MFA_ENABLED",
    MFA_DISABLED:          "MFA_DISABLED",

    // ─── User Management ────────────────────────────────────────────────────
    USER_CREATED:          "USER_CREATED",
    USER_UPDATED:          "USER_UPDATED",
    USER_DISABLED:         "USER_DISABLED",
    USER_ENABLED:          "USER_ENABLED",
    PASSWORD_RESET_FORCED: "PASSWORD_RESET_FORCED",

    // ─── Organization ────────────────────────────────────────────────────────
    ORG_CREATED:           "ORG_CREATED",
    ORG_TEMPLATE_UPLOADED: "ORG_TEMPLATE_UPLOADED",

    // ─── Assignments ─────────────────────────────────────────────────────────
    ASSIGNMENT_CREATED:    "ASSIGNMENT_CREATED",
    ASSIGNMENT_UPDATED:    "ASSIGNMENT_UPDATED",
    ASSIGNMENT_DELETED:    "ASSIGNMENT_DELETED",

    // ─── Invoices ────────────────────────────────────────────────────────────
    INVOICE_UPLOADED:      "INVOICE_UPLOADED",
    INVOICE_FLAGGED:       "INVOICE_FLAGGED",

    // ─── Reviews ─────────────────────────────────────────────────────────────
    REVIEW_SUBMITTED:      "REVIEW_SUBMITTED",
    REVIEW_UPDATED:        "REVIEW_UPDATED",

    // ─── Archival ────────────────────────────────────────────────────────────
    ARCHIVE_EXECUTED:      "ARCHIVE_EXECUTED",
    ARCHIVE_ACCESSED:      "ARCHIVE_ACCESSED",

    // ─── Policies ────────────────────────────────────────────────────────────
    POLICY_CREATED:        "POLICY_CREATED",
    POLICY_UPDATED:        "POLICY_UPDATED",
    POLICY_DELETED:        "POLICY_DELETED",
};

export const ALL_AUDIT_ACTIONS = Object.values(AuditActions);
