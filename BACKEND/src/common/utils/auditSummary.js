import { AuditActions } from "./audit.constants.js";

/**
 * Build a human-readable summary sentence for an audit log entry.
 *
 * @param {string} action - One of AuditActions
 * @param {Object} metadata - Action-specific context data
 * @returns {string}
 */
export function buildAuditSummary(action, metadata = {}) {
    const m = metadata;

    switch (action) {
        // Auth
        case AuditActions.LOGIN_SUCCESS:
            return `${m.email || "User"} logged in successfully`;
        case AuditActions.ACCOUNT_LOCKED:
            return `Account locked for "${m.email || "user"}" after too many failed login attempts`;
        case AuditActions.LOGOUT:
            return `${m.email || "User"} logged out${m.logoutAll ? " (all sessions)" : ""}`;

        // MFA
        case AuditActions.MFA_ENABLED:
            return `MFA enabled for ${m.email || "user"}`;
        case AuditActions.MFA_DISABLED:
            return `MFA disabled for ${m.email || "user"}`;

        // Users
        case AuditActions.USER_CREATED:
            return `User "${m.targetUsername || m.targetEmail || ""}" (${m.targetRole || ""}) was created by ${m.actorEmail || "admin"}`;
        case AuditActions.USER_UPDATED:
            return `User "${m.targetEmail || ""}" status changed to "${m.newStatus || ""}" by ${m.actorEmail || "admin"}`;
        case AuditActions.USER_DISABLED:
            return `User "${m.targetEmail || ""}" was disabled by ${m.actorEmail || "admin"}`;
        case AuditActions.USER_ENABLED:
            return `User "${m.targetEmail || ""}" was re-enabled by ${m.actorEmail || "admin"}`;
        case AuditActions.PASSWORD_RESET_FORCED:
            return `Password reset forced for "${m.targetEmail || ""}"`;

        // Organizations
        case AuditActions.ORG_CREATED:
            return `Organization "${m.orgName || ""}" (${m.orgType || ""}) was created`;
        case AuditActions.ORG_TEMPLATE_UPLOADED:
            return `Invoice template uploaded for organization "${m.orgName || m.orgId || ""}"`;

        // Assignments
        case AuditActions.ASSIGNMENT_CREATED:
            return `Auditor "${m.auditorEmail || m.auditorUserId || ""}" assigned to company "${m.companyName || m.companyOrgId || ""}"`;
        case AuditActions.ASSIGNMENT_UPDATED:
            return `Assignment ${m.assignmentId || ""} updated — status: "${m.newStatus || ""}"`;
        case AuditActions.ASSIGNMENT_DELETED:
            return `Assignment ${m.assignmentId || ""} deactivated (auditor: "${m.auditorEmail || m.auditorUserId || ""}")`;

        // Invoices
        case AuditActions.INVOICE_UPLOADED:
            return `Invoice uploaded by "${m.uploaderEmail || m.uploaderUserId || ""}" for org "${m.orgId || ""}"`;
        case AuditActions.INVOICE_FLAGGED:
            return `Invoice ${m.invoiceId || ""} flagged with ${m.anomalyCount ?? 0} anomalies`;

        // Reviews
        case AuditActions.REVIEW_SUBMITTED:
            return `Auditor "${m.auditorEmail || ""}" submitted review decision "${m.decision || ""}" for invoice ${m.invoiceId || ""}`;
        case AuditActions.REVIEW_UPDATED:
            return `Auditor "${m.auditorEmail || ""}" updated review decision to "${m.decision || ""}" for invoice ${m.invoiceId || ""}`;

        // Archive
        case AuditActions.ARCHIVE_EXECUTED:
            return `Archived ${m.count ?? 0} audit logs for date ${m.date || ""} → ${m.archiveKey || ""}`;
        case AuditActions.ARCHIVE_ACCESSED:
            return `Archive file accessed by "${m.actorEmail || ""}" — key: ${m.archiveKey || ""}`;

        default:
            return `Action performed: ${action}`;
    }
}
