import mongoose from "mongoose";

const TokenBlacklistSchema = new mongoose.Schema({
    token: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true, 
        index: true 
    },
    expiresAt: { 
        type: Date, 
        required: true 
    },
    reason: { 
        type: String, 
        enum: ["logout", "password_change", "security", "admin_revoke"],
        default: "logout"
    },
    revokedAt: { 
        type: Date, 
        default: Date.now 
    },
    revokedByIp: { 
        type: String, 
        default: null 
    },
  },
  { timestamps: true }
);

// Auto-delete blacklisted tokens after they expire (no need to keep them)
TokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TokenBlacklist = mongoose.models.TokenBlacklist || mongoose.model("TokenBlacklist", TokenBlacklistSchema);

export default TokenBlacklist;
