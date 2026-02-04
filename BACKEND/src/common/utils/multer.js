import multer from "multer";

/**
 * Multer configuration for file uploads
 * Uses memory storage to keep files in buffer for processing
 */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

/**
 * Middleware for single file upload
 * @param {string} fieldName - Name of the form field
 */
export const uploadSingle = (fieldName) => upload.single(fieldName);

export default upload;
