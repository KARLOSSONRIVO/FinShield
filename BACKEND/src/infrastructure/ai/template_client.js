/**
 * AI Service client for template processing.
 * Calls PaddleOCR endpoint to extract text and layout from invoice templates.
 */

import axios from "axios";
import FormData from "form-data";
import { AI_SERVICE_URL } from "../../config/env.js";

/**
 * Process a template file and extract text + layout using PaddleOCR.
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - Original filename
 * @returns {Promise<Object>} Extracted text, layout signature, and metadata
 */
export async function processTemplate(buffer, fileName) {
    const formData = new FormData();
    formData.append("file", buffer, {
        filename: fileName,
        contentType: getContentType(fileName),
    });

    const response = await axios.post(
        `${AI_SERVICE_URL}/template/process`,
        formData,
        {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 120_000, // 2 minutes for OCR processing
        }
    );

    if (!response.data.success) {
        throw new Error(response.data.error || "Template processing failed");
    }

    return {
        text: response.data.full_text || "",
        source: response.data.source,
        layoutSignature: response.data.layout_signature || {},
        totalElements: response.data.total_elements || 0,
        pages: response.data.pages || [],
    };
}

/**
 * Get MIME type from filename
 */
function getContentType(fileName) {
    const ext = fileName.toLowerCase().split(".").pop();
    switch (ext) {
        case "pdf":
            return "application/pdf";
        case "docx":
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        default:
            return "application/octet-stream";
    }
}
