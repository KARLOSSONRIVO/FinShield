import AppError from "../../../common/errors/AppErrors.js";
import { uploadTemplate, isS3Configured } from "../../../infrastructure/storage/s3.service.js";
import { processTemplate } from "../../../infrastructure/ai/template_client.js";
import * as OrganizationRepositories from "../../repositories/organization.repositories.js";
import { cacheDel } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";

/**
 * Process invoice template upload - uploads to S3 and extracts text using PaddleOCR
 * @private
 */
export async function processInvoiceTemplate(orgId, file) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
        throw new AppError(
            "Invalid template file type. Only PDF and DOCX are allowed.",
            400,
            "INVALID_TEMPLATE_TYPE"
        );
    }

    // Check if S3 is configured
    if (!isS3Configured()) {
        throw new AppError(
            "S3 storage is not configured. Please configure AWS credentials.",
            500,
            "S3_NOT_CONFIGURED"
        );
    }

    // Upload to S3
    const s3Upload = await uploadTemplate({
        buffer: file.buffer,
        fileName: file.originalname,
        orgId: String(orgId),
    });

    // Extract text and layout using PaddleOCR via AI_SERVICE
    let extractedText = null;
    let layoutSignature = null;
    let totalElements = 0;
    let source = null;

    try {
        const extractionResult = await processTemplate(file.buffer, file.originalname);
        extractedText = extractionResult.text;
        layoutSignature = extractionResult.layoutSignature;
        totalElements = extractionResult.totalElements;
        source = extractionResult.source;
    } catch (err) {
        console.error("Template OCR extraction failed:", err.message);
        // Continue without extracted text - template is still uploaded to S3
    }

    // Update organization with template metadata and layout signature
    await OrganizationRepositories.updateOrganizationTemplate(orgId, {
        s3Key: s3Upload.s3Key,
        fileName: file.originalname,
        uploadedAt: new Date(),
        extractedText: extractedText,
        layoutSignature: layoutSignature,
        totalElements: totalElements,
        source: source,
    });

    // Invalidate cached org detail
    await cacheDel(`${CachePrefix.ORG}${orgId}`);
}
