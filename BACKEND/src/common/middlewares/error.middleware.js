import AppError from "../errors/AppErrors.js";

export default function errorHandler(err, req, res, next) {
    const isApperror = err instanceof AppError

    const status = isApperror ? err.statusCode : (err.statusCode || err.status || 500)

    const payload = {
        ok : false,
        message: isApperror ? err.message : 'Internal Server Error',
        code: isApperror ? err.code : 'INTERNAL_SERVER_ERROR',
    }

    if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;

    res.status(status).json(payload)
}