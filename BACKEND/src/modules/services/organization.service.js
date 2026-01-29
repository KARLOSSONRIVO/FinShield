import AppError from "../../common/errors/AppErrors.js";
import * as OrganizationRepositories from "../repositories/organization.repositories.js";
import { toOrganizationPublic } from "../mappers/organization.mapper.js";
import { uploadTemplate, deleteTemplate, isS3Configured } from "../../infrastructure/storage/s3.service.js";
import { convertTemplateToCSV, generateEmbedding } from "../../infrastructure/ai/template_client.js";

export async function createOrganization({ actor, payload, file }) {
    if (!actor || actor.role !== "SUPER_ADMIN") {
        throw new AppError("Unauthorized", 403, "UNAUTHORIZED");
    }

    if (payload.type === "platform") {
        const existingPlatform = await OrganizationRepositories.findOne({ type: "platform" });
        if (existingPlatform) {
            throw new AppError("Platform already exists", 409, "PLATFORM_ALREADY_EXISTS");
        }
    }

    // Create organization first
    const org = await OrganizationRepositories.createOrganization({
        type: payload.type,
        name: payload.name,
        status: payload.status ?? "active",
    });

    // Handle template upload if provided
    if (file) {
        await processInvoiceTemplate(org._id, file);
    }

    return toOrganizationPublic(org);
}

/**
 * Process invoice template upload
 * @private
 */
async function processInvoiceTemplate(orgId, file) {
    let s3Key = null;

    try {
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

        // Step 1: Upload to S3
        const s3Upload = await uploadTemplate({
            buffer: file.buffer,
            fileName: file.originalname,
            orgId: String(orgId),
        });
        s3Key = s3Upload.s3Key;

        // Step 2: Convert to CSV via AI_SERVICE
        let csvData = null;
        let embeddingId = null;

        try {
            const csvResult = await convertTemplateToCSV(file);
            csvData = csvResult.csv;

            // Step 3: Generate embeddings
            const embeddingResult = await generateEmbedding(String(orgId), csvData);
            embeddingId = embeddingResult.embeddingId;
        } catch (aiError) {
            console.warn(`AI processing failed for template: ${aiError.message}`);
            // Continue even if AI processing fails - template is still stored in S3
        }

        // Step 4: Update organization with template metadata
        await OrganizationRepositories.updateOrganizationTemplate(orgId, {
            s3Key,
            fileName: file.originalname,
            uploadedAt: new Date(),
            embeddingId,
        });

    } catch (error) {
        // Cleanup S3 if upload succeeded but later steps failed
        if (s3Key) {
            try {
                await deleteTemplate(s3Key);
            } catch (cleanupError) {
                console.error(`Failed to cleanup S3 template: ${cleanupError.message}`);
            }
        }
        throw error;
    }
}

export async function listOrganizations({ actor }) {
    if (!actor || actor.role !== "SUPER_ADMIN") {
        throw new AppError("Unauthorized", 403, "UNAUTHORIZED")
    }
    const orgs = await OrganizationRepositories.findMany({})
    return orgs.map(toOrganizationPublic);
}

export async function getOrganizationById({ actor, orgId }) {
    if (!actor) throw new AppError("Unauthorized", 403, "UNAUTHORIZED")

    // SUPER_ADMIN can access any organization, others can only access their own
    if (actor.role !== "SUPER_ADMIN") {
        if (!actor.orgId || String(actor.orgId) !== String(orgId)) {
            throw new AppError("Forbidden", 403, "FORBIDDEN")
        }
    }

    const org = await OrganizationRepositories.findById(orgId);
    if (!org) throw new AppError("Organization not found", 404, "ORGANIZATION_NOT_FOUND")
    return toOrganizationPublic(org);
}


