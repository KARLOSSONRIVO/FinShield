import mongoose from "mongoose";


export const USER_ROLES = ["SUPER_ADMIN", "AUDITOR", "REGULATOR", "COMPANY_MANAGER", "COMPANY_USER"];
export const USER_PORTALS = ["admin", "user"];
export const USER_STATUS = ["active", "disabled"];

const UserSchema = new mongoose.Schema({
    orgId :{ type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true,index: true},
    portal: { type: String, enum: USER_PORTALS, required: true, index: true },
    role: { type: String, enum: USER_ROLES, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    username: { type: String, required: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    status: { type: String, enum: USER_STATUS, default: "active", index: true },
    mustChangePassword: { type: Boolean, default: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    disabledByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    disabledAt: { type: Date, default: null },
    disableReason: { type: String, default: null, trim: true },
    lastLoginAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });



const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;