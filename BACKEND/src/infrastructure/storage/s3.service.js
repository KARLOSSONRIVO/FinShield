import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_NAME } from "../../config/env.js";
import AppError from "../../common/errors/AppErrors.js";

let s3Client = null;

/**
 * Initialize S3 client if credentials are available
 */
function getS3Client() {
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET_NAME) {
        throw new AppError(
            "AWS S3 credentials not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME in .env",
            500,
            "S3_NOT_CONFIGURED"
        );
    }

    if (!s3Client) {
        s3Client = new S3Client({
            region: AWS_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
        });
    }

    return s3Client;
}

/**
 * Upload a file buffer to S3
 * 
 * @param {Object} params
 * @param {Buffer} params.buffer - File buffer to upload
 * @param {string} params.fileName - Original filename
 * @param {string} params.orgId - Organization ID for folder structure
 * @returns {Promise<{s3Key: string, bucket: string}>}
 */
export async function uploadTemplate({ buffer, fileName, orgId }) {
    if (!buffer?.length) {
        throw new AppError("File buffer is empty", 400, "EMPTY_FILE");
    }

    try {
        const client = getS3Client();

        // Create S3 key with organization folder structure
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const s3Key = `templates/${orgId}/${timestamp}-${sanitizedFileName}`;

        const command = new PutObjectCommand({
            Bucket: AWS_S3_BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ContentType: getContentType(fileName),
            Metadata: {
                orgId: String(orgId),
                originalFileName: fileName,
                uploadedAt: new Date().toISOString(),
            },
        });

        await client.send(command);

        return {
            s3Key,
            bucket: AWS_S3_BUCKET_NAME,
        };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(
            `S3 upload failed: ${error.message}`,
            500,
            "S3_UPLOAD_FAILED"
        );
    }
}

/**
 * Generate a signed URL for accessing a template
 * 
 * @param {string} s3Key - S3 object key
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>}
 */
export async function getTemplateUrl(s3Key, expiresIn = 3600) {
    if (!s3Key) {
        throw new AppError("S3 key is required", 400, "MISSING_S3_KEY");
    }

    try {
        const client = getS3Client();

        const command = new GetObjectCommand({
            Bucket: AWS_S3_BUCKET_NAME,
            Key: s3Key,
        });

        const url = await getSignedUrl(client, command, { expiresIn });
        return url;
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(
            `Failed to generate signed URL: ${error.message}`,
            500,
            "S3_URL_GENERATION_FAILED"
        );
    }
}

/**
 * Delete a template from S3
 * 
 * @param {string} s3Key - S3 object key
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteTemplate(s3Key) {
    if (!s3Key) {
        throw new AppError("S3 key is required", 400, "MISSING_S3_KEY");
    }

    try {
        const client = getS3Client();

        const command = new DeleteObjectCommand({
            Bucket: AWS_S3_BUCKET_NAME,
            Key: s3Key,
        });

        await client.send(command);

        return { success: true };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(
            `S3 deletion failed: ${error.message}`,
            500,
            "S3_DELETE_FAILED"
        );
    }
}

/**
 * Get content type based on file extension
 * 
 * @param {string} fileName
 * @returns {string}
 */
function getContentType(fileName) {
    const ext = fileName.toLowerCase().split(".").pop();
    const contentTypes = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        doc: "application/msword",
    };
    return contentTypes[ext] || "application/octet-stream";
}

/**
 * Check if S3 is configured
 * 
 * @returns {boolean}
 */
export function isS3Configured() {
    return !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_S3_BUCKET_NAME);
}
