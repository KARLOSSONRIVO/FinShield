import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true, 
        index: true 
    },
    token: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    expiresAt: { 
        type: Date, 
        required: true 
    },
    createdByIp: { 
        type: String, 
        default: null 
    },
    userAgent: { 
        type: String, 
        default: null 
    },
    isRevoked: { 
        type: Boolean, 
        default: false, 
        index: true 
    },
    revokedAt: { 
        type: Date, 
        default: null 
    },
    revokedByIp: { 
        type: String, 
        default: null 
    },
    replacedByToken: { 
        type: String, 
        default: null 
    },
  },
  { timestamps: true }
);

// Auto-delete expired tokens after 7 days past expiration
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 604800 });

const RefreshToken = mongoose.models.RefreshToken || mongoose.model("RefreshToken", RefreshTokenSchema);

export default RefreshToken;
