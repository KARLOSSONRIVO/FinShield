export const SocketEvents = {
    INVOICE_CREATED:        "invoice:created",
    INVOICE_ANCHOR_SUCCESS: "invoice:anchor:success",
    INVOICE_ANCHOR_FAILED:  "invoice:anchor:failed",
    INVOICE_PROCESSING:     "invoice:processing",
    INVOICE_AI_COMPLETE:    "invoice:ai:complete",
    INVOICE_FLAGGED:        "invoice:flagged",

    INVOICE_LIST_INVALIDATE: "invoice:list:invalidate",
    USER_LIST_INVALIDATE:    "user:list:invalidate",
    ORG_LIST_INVALIDATE:     "org:list:invalidate",

    INVOICE_REVIEWED:       "invoice:reviewed",

    AUDIT_CREATED:          "audit:created",

    ASSIGNMENT_CREATED:     "assignment:created",
    ASSIGNMENT_UPDATED:     "assignment:updated",
    ASSIGNMENT_DEACTIVATED: "assignment:deactivated",
};

export const AI_CHANNEL = "channel:invoice";
