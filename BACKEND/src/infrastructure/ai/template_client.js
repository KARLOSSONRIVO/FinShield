import axios from "axios";
import FormData from "form-data";
import { AI_SERVICE_URL } from "../../config/env.js";

/**
 * Send template file to AI_SERVICE for CSV conversion
 * 
 * @param {Object} file - Multer file object
 * @returns {Promise<{csv: string, rowCount: number}>}
 */
export async function convertTemplateToCSV(file) {
    const form = new FormData();
    form.append("file", file.buffer, file.originalname);

    const res = await axios.post(
        `${AI_SERVICE_URL}/template/convert`,
        form,
        {
            headers: form.getHeaders(),
            timeout: 60_000, // 60 seconds for large files
        }
    );

    return res.data;
}

/**
 * Trigger embedding generation for organization template
 * 
 * @param {string} orgId - Organization ID
 * @param {string} csvData - CSV data to embed
 * @returns {Promise<{embeddingId: string, vectorCount: number}>}
 */
export async function generateEmbedding(orgId, csvData) {
    const res = await axios.post(
        `${AI_SERVICE_URL}/template/embed`,
        {
            orgId,
            csvData,
        },
        {
            headers: {
                "Content-Type": "application/json",
            },
            timeout: 120_000, // 2 minutes for embedding generation
        }
    );

    return res.data;
}
