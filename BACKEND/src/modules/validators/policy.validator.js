import { z } from "zod";
import { validate } from "../../common/middlewares/validate.middleware.js";

// ─── Create ───────────────────────────────────────────────────────────────────
export const validateCreatePolicy = validate(
    z.object({
        body: z.object({
            title:   z.string().trim().min(3).max(200),
            content: z.string().trim().min(10).max(20000),
            version: z.string().trim().max(20).optional(),
        }),
    })
);

// ─── Update ───────────────────────────────────────────────────────────────────
export const validateUpdatePolicy = validate(
    z.object({
        params: z.object({
            id: z.string().trim().min(1, "Policy id is required"),
        }),
        body: z.object({
            title:    z.string().trim().min(3).max(200).optional(),
            content:  z.string().trim().min(10).max(20000).optional(),

            version:  z.string().trim().max(20).optional(),
        }),
    })
);

// ─── ID param ─────────────────────────────────────────────────────────────────
export const validatePolicyIdParam = validate(
    z.object({
        params: z.object({
            id: z.string().trim().min(1, "Policy id is required"),
        }),
    })
);


