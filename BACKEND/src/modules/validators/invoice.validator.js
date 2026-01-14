import { z } from "zod";
import AppError from "../../common/errors/AppErrors.js";

// Allowed file MIME types for invoices
export const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
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
        { message: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}` }
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
