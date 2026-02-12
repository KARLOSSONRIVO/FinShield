import { z } from "zod";
import { getPasswordErrorMessage } from "../../common/utils/passwordValidator.js";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
  }),
})

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string()
      .refine((pwd) => {
        const errorMessage = getPasswordErrorMessage(pwd);
        return errorMessage === null;
      }, (pwd) => {
        const errorMessage = getPasswordErrorMessage(pwd);
        return { message: errorMessage || "Invalid password" };
      }),
  }),
})

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
})

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
    logoutAll: z.boolean().optional(),
  }),
})
