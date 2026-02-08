import "dotenv/config";

function must(name) {
    const value = process.env[name]
    if (!value) {
        throw new Error(`Environment variable ${name} is not set`)
    }
    return value
}
export const NODE_ENV = must("NODE_ENV")
export const PORT = must("PORT")
export const HOST = must("HOST")
export const MONGO_URI = must("MONGO_URI")
export const JWT_SECRET = must("JWT_SECRET")
export const JWT_EXPIRES_IN = must("JWT_EXPIRES_IN")
export const JWT_REFRESH_EXPIRES_IN = must("JWT_REFRESH_EXPIRES_IN")
export const CORS_ORIGIN = must("CORS_ORIGIN")
export const PINATA_JWT = must("PINATA_JWT")
export const PINATA_API_URL = must("PINATA_API_URL")
export const CHAIN_RPC_URL = must("CHAIN_RPC_URL")
export const ANCHOR_PRIVATE_KEY = must("ANCHOR_PRIVATE_KEY")
export const ANCHOR_CONTRACT_ADDRESS = must("ANCHOR_CONTRACT_ADDRESS")
export const ANCHOR_CONFIRMATION = Number(process.env.ANCHOR_CONFIRMATION || 1)
export const AI_SERVICE_URL = must("AI_SERVICE_URL")
export const IPFS_GATEWAY_BASE = must("IPFS_GATEWAY_BASE")

// AWS S3 Configuration (optional - for invoice templates)
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
export const AWS_REGION = process.env.AWS_REGION || "us-east-1"
export const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME

// Rate Limiting (optional)
export const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000)
export const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 300)
export const RATE_LIMIT_USER_MAX = Number(process.env.RATE_LIMIT_USER_MAX || 200)
export const RATE_LIMIT_AUTH_MAX = Number(process.env.RATE_LIMIT_AUTH_MAX || 20)
export const RATE_LIMIT_UPLOAD_MAX = Number(process.env.RATE_LIMIT_UPLOAD_MAX || 20)

