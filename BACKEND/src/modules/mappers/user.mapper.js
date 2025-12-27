export function toUserPublic(userDoc){
    return{
        id: String(userDoc._id),
        orgId: String(userDoc.orgId),
        portal: userDoc.portal,
        role: userDoc.role,
        email: userDoc.email,
        username: userDoc.username,
        status: userDoc.status,
        mustChangePassword: userDoc.mustChangePassword,
        createdByUserId: userDoc.createdByUserId ? String(userDoc.createdByUserId) : null,
        disabledByUserId: userDoc.disabledByUserId ? String(userDoc.disabledByUserId) : null,
        disabledAt: userDoc.disabledAt,
        disableReason: userDoc.disableReason,
        lastLoginAt: userDoc.lastLoginAt,
        createdAt: userDoc.createdAt,
        updatedAt: userDoc.updatedAt,
      }
}   