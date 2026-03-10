import { z } from "zod";
import { validate } from "../../common/middlewares/validate.middleware.js";
import AppError from "../../common/errors/AppErrors.js";

// Validate :id param is a valid MongoDB ObjectId
export const validateInvoiceIdParam = validate(
    z.object({
        params: z.object({
            id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid invoice ID"),
        }),
    })
);

// Allowed file MIME types for invoices (PDF and DOCX only)
export const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

// Maximum file size: 10MB (matches multer limit)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Zod schema for file validation
const fileSchema = z.object({
    fieldname: z.string().min(1, { message: "File fieldname is required" }),
    originalname: z.string().min(1, { message: "File originalname is required" }),
    encoding: z.string().optional(),
    mimetype: z.string().refine(
        (mime) => !mime || ALLOWED_MIME_TYPES.includes(mime),
        { message: "File type not allowed. Allowed types: PDF and DOCX only" }
    ).optional(),
    size: z.number()
        .min(1, { message: "File cannot be empty" })
        .max(MAX_FILE_SIZE, { message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` }),
    buffer: z.instanceof(Buffer, { message: "File buffer must be a Buffer" })
        .refine((buf) => buf.length > 0, { message: "File buffer cannot be empty" }),
});

/**
 * Validates the invoice file upload request using Zod
 * Checks that the file exists, has valid size, and validates MIME type
 */
export function validateInvoiceUpload(req, _res, next) {
    // Check if file exists
    if (!req.file) {
        return next(new AppError("File is required", 400, "MISSING_FILE"));
    }

    // Validate file using Zod schema
    const result = fileSchema.safeParse(req.file);

    if (!result.success) {
        const firstError = result.error.issues[0];
        const message = firstError?.message || "File validation failed";
        return next(new AppError(message, 400, "VALIDATION_ERROR"));
    }

    // All validations passed - file is valid
    next();
}

// ── PATCH /:id/review ────────────────────────────────────────
export const validateReviewBody = validate(
    z.object({
        body: z.object({
            reviewDecision: z.enum(["approved", "rejected"], {
                required_error: "reviewDecision is required",
                invalid_type_error: "reviewDecision must be 'approved' or 'rejected'",
            }),
            reviewNotes: z
                .string({ required_error: "reviewNotes is required" })
                .min(1, "reviewNotes cannot be empty")
                .max(1000, "reviewNotes cannot exceed 1000 characters")
                .trim(),
        }),
    })
);
