
export function toAssignmentPublic(assignmentDoc) {
    return {
        id: String(assignmentDoc._id),
        companyOrgId: assignmentDoc.companyOrgId ? (typeof assignmentDoc.companyOrgId === 'object' ? String(assignmentDoc.companyOrgId._id || assignmentDoc.companyOrgId) : String(assignmentDoc.companyOrgId)) : null,
        auditorUserId: assignmentDoc.auditorUserId ? (typeof assignmentDoc.auditorUserId === 'object' ? String(assignmentDoc.auditorUserId._id || assignmentDoc.auditorUserId) : String(assignmentDoc.auditorUserId)) : null,
        status: assignmentDoc.status,
        assignedByUserId: assignmentDoc.assignedByUserId ? (typeof assignmentDoc.assignedByUserId === 'object' ? String(assignmentDoc.assignedByUserId._id || assignmentDoc.assignedByUserId) : String(assignmentDoc.assignedByUserId)) : null,
        assignedAt: assignmentDoc.assignedAt,
        notes: assignmentDoc.notes,
        createdAt: assignmentDoc.createdAt,
        updatedAt: assignmentDoc.updatedAt,
        // Populated fields (if populated)
        company: assignmentDoc.companyOrgId && typeof assignmentDoc.companyOrgId === 'object' && assignmentDoc.companyOrgId.name ? {
            id: String(assignmentDoc.companyOrgId._id),
            name: assignmentDoc.companyOrgId.name,
            type: assignmentDoc.companyOrgId.type,
        } : null,
        auditor: assignmentDoc.auditorUserId && typeof assignmentDoc.auditorUserId === 'object' && assignmentDoc.auditorUserId.email ? {
            id: String(assignmentDoc.auditorUserId._id),
            email: assignmentDoc.auditorUserId.email,
            username: assignmentDoc.auditorUserId.username,
            role: assignmentDoc.auditorUserId.role,
        } : null,
        assignedBy: assignmentDoc.assignedByUserId && typeof assignmentDoc.assignedByUserId === 'object' && assignmentDoc.assignedByUserId.email ? {
            id: String(assignmentDoc.assignedByUserId._id),
            email: assignmentDoc.assignedByUserId.email,
            username: assignmentDoc.assignedByUserId.username,
        } : null,
    }
}
