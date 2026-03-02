import { z } from "zod";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { ALL_AUDIT_ACTIONS } from "../../common/utils/audit.constants.js";

const ROLES = ["SUPER_ADMIN", "AUDITOR", "REGULATOR", "COMPANY_MANAGER", "COMPANY_USER"];

export const validateAuditLogQuery = validate(
    z.object({
        query: z.object({
            page:       z.coerce.number().int().min(1).optional(),
            limit:      z.coerce.number().int().min(1).max(100).optional(),
            action:     z.enum(ALL_AUDIT_ACTIONS).optional(),
            actorRole:  z.enum(ROLES).optional(),
            search:     z.string().trim().max(200).optional(),
            from:       z.coerce.date().optional(),
            to:         z.coerce.date().optional(),
        }),
    })
);
