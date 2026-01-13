export default class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.name = " AppError";
        this.statusCode = statusCode;
        this.code = code || statusCode; // Use provided code or fallback to statusCode
    }
}