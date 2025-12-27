import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    orgId: z.string().min(1, "orgId is required"),
    portal: z.enum(["admin", "user"]),
    role: z.enum(["SUPER_ADMIN", "AUDITOR", "REGULATOR", "COMPANY_MANAGER", "COMPANY_USER"]),
    email: z.string().email("Invalid email"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    mustChangePassword: z.boolean().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    status: z.enum(["active", "disabled"], {
      required_error: "Status is required",
      invalid_type_error: "Status must be 'active' or 'disabled'",
    }),
    reason: z.string().min(2, "Disable reason is required").optional(),
  }).refine(
    (data) => {
      if (data.status === "disabled") {
        return data.reason && data.reason.length >= 2;
      }
      return true;
    },
    {
      message: "Reason is required when disabling a user",
      path: ["reason"]
    }
  ),
});
