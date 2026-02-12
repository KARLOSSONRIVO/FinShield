import { fileTypeFromBuffer } from 'file-type';
import { AppError } from '../errors/AppErrors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const validateFileType = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const fileType = await fileTypeFromBuffer(req.file.buffer);

    // Allowed types: PDF and DOCX
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (!fileType || !allowedTypes.includes(fileType.mime)) {
        throw new AppError('Invalid file type. Only PDF and DOCX are allowed.', 400, 'INVALID_FILE_TYPE');
    }

    // Attach the verified MIME type to the request for later use
    req.file.verifiedMimeType = fileType.mime;

    next();
});
