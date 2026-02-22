import { z } from "zod";
import { validate } from "../../common/middlewares/validate.middleware.js";

/**
 * Reusable pagination query schema.
 * Call `paginationQuery(extraFields)` to extend with domain-specific fields.
 */
function basePaginationSchema(extraFields = {}) {
    return z.object({
        query: z.object({
            page:   z.coerce.number().int().min(1).default(1),
            limit:  z.coerce.number().int().min(1).max(100).default(20),
            search: z.string().trim().max(100).optional(),
            sortBy: z.string().trim().max(50).default("createdAt"),
            order:  z.enum(["asc", "desc"]).default("desc"),
            ...extraFields,
        }),
    });
}

// Organization list
export const validateOrgListQuery = validate(
    basePaginationSchema({
        sortBy: z.enum(["createdAt", "name", "type"]).default("createdAt"),
    })
);

// User list
export const validateUserListQuery = validate(
    basePaginationSchema({
        sortBy: z.enum(["createdAt", "username", "email", "role", "lastLoginAt"]).default("createdAt"),
        orgId:  z.string().trim().optional(),
    })
);

// Employee list
export const validateEmployeeListQuery = validate(
    basePaginationSchema({
        sortBy: z.enum(["createdAt", "username", "email"]).default("createdAt"),
    })
);

// Assignment list
export const validateAssignmentListQuery = validate(
    basePaginationSchema({
        sortBy: z.enum(["createdAt", "assignedAt", "status"]).default("createdAt"),
    })
);

// Blockchain ledger
export const validateLedgerQuery = validate(
    basePaginationSchema({
        sortBy: z.enum(["anchoredAt", "invoiceNumber", "createdAt"]).default("anchoredAt"),
    })
);
