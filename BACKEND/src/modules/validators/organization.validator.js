import { z } from "zod";

export const ORG_TYPES = ["organization", "company"]
export const ORG_STATUS = ["active", "inactive"]

export const createOrgSchema = z.object({
    body: z.object({
        type: z.enum(ORG_TYPES),
        name: z.string().min(2,"Organization name must be at least 2 characters long"),
        status: z.enum(ORG_STATUS).default("active").optional(),
    })

})

export const updateOrgSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Organization ID is required"),
    }),
    body: z.object({
        name:   z.string().min(2, "Name must be at least 2 characters").optional(),
        type:   z.enum(ORG_TYPES).optional(),
        status: z.enum(ORG_STATUS).optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: "At least one field (name, type, status) must be provided",
    }),
})  