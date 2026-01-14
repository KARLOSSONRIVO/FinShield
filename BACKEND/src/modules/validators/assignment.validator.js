import { z } from "zod";

export const ASSIGNMENT_STATUS = ["active", "inactive"];

export const createAssignmentSchema = z.object({
    body: z.object({
        companyOrgId: z.string().min(1, "companyOrgId is required"),
        auditorUserId: z.string().min(1, "auditorUserId is required"),
        status: z.enum(ASSIGNMENT_STATUS).default("active").optional(),
        notes: z.string().optional().nullable()
    })
})

export const updateAssignmentSchema = z.object({
    body: z.object({
        status: z.enum(ASSIGNMENT_STATUS).optional(),
        notes: z.string().optional().nullable()
    })
})
