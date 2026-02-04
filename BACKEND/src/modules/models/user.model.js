import mongoose from "mongoose";


import { USER_ROLES, isPlatformRole, isCompanyRole } from "../../common/utils/role_helpers.js";

export { USER_ROLES }; // Re-export for potential legacy imports
export const USER_STATUS = ["active", "disabled"]

/**
 * Derives portal from role
 * @param {string} role - User role
 * @returns {string} - "admin" for platform roles, "user" for company roles
 */
export function getPortalFromRole(role) {
  return isPlatformRole(role) ? "admin" : "user"
}

const UserSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: function () {
      // orgId is required only for COMPANY_MANAGER and COMPANY_USER
      // SUPER_ADMIN, AUDITOR, and REGULATOR don't need orgId
      return isCompanyRole(this.role)
    },
    index: true
  },
  role: { type: String, enum: USER_ROLES, required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  username: { type: String, required: true, trim: true },
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
)

UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ username: 1 }, { unique: true })



const User = mongoose.models.User || mongoose.model("User", UserSchema)

export default User