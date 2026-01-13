import { z } from "zod";
import AppError from "../../common/errors/AppErrors.js";

// Base schema for user creation (all roles allowed)
export const createUserSchema = z.object({
  body: z.object({
    orgId: z.string().min(1, "orgId is required").nullable().optional(),
    // portal is derived from role, no longer needed in request
    // Note: orgId validation is handled in service (auto-filled for COMPANY_MANAGER creating users)
    role: z.enum(["SUPER_ADMIN", "AUDITOR", "REGULATOR", "COMPANY_MANAGER", "COMPANY_USER"]),
    email: z.email("Invalid email"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    mustChangePassword: z.boolean().optional(),
  }),
  // Removed orgId refinement - service handles orgId logic based on actor role
});

// Role-aware validation middleware for createUser
export function validateCreateUser(req, _res, next) {
  // First validate the base schema
  const baseResult = createUserSchema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!baseResult.success) {
    const msg = baseResult.error.issues?.[0]?.message || "Validation error";
    return next(new AppError(msg, 400, "VALIDATION_ERROR"));
  }

  // Apply parsed data
  if (baseResult.data.body) req.body = baseResult.data.body;
  if (baseResult.data.params) req.params = baseResult.data.params;
  if (baseResult.data.query) req.query = baseResult.data.query;

  // Additional role-based validation
  if (req.auth) {
    const actorRole = req.auth.role;
    const requestedRole = req.body.role;

    // COMPANY_MANAGER can only create COMPANY_USER
    if (actorRole === "COMPANY_MANAGER" && requestedRole !== "COMPANY_USER") {
      return next(new AppError(
        "Company managers can only create COMPANY_USER accounts",
        403,
        "FORBIDDEN_ROLE"
      ));
    }

    // SUPER_ADMIN can create any role (no additional restrictions)
  }

  next();
}

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
