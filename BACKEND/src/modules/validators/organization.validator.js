import { z } from "zod";

export const ORG_TYPES = ["platform", "company"];
export const ORG_STATUS = ["active", "inactive"];

export const createOrgSchema = z.object({
    body: z.object({
        type: z.enum(ORG_TYPES),
        name: z.string().min(2,"Organization name must be at least 2 characters long"),
        status: z.enum(ORG_STATUS).default("active").optional(),
    })

})  