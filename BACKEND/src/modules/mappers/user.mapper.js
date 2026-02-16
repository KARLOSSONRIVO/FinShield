

export function toUserPublic(userDoc) {
  return {
    id: String(userDoc._id),
    orgId: userDoc.orgId ? String(userDoc.orgId) : null, // SUPER_ADMIN may not have orgId
    role: userDoc.role,
    email: userDoc.email,
    username: userDoc.username,
    status: userDoc.status,
    mustChangePassword: userDoc.mustChangePassword,
    createdByUserId: userDoc.createdByUserId ? String(userDoc.createdByUserId) : null,
    disabledByUserId: userDoc.disabledByUserId ? String(userDoc.disabledByUserId) : null,
    disabledAt: userDoc.disabledAt,
    mfaEnabled: !!userDoc.mfaEnabled,
    disableReason: userDoc.disableReason,
    lastLoginAt: userDoc.lastLoginAt,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  }
}   