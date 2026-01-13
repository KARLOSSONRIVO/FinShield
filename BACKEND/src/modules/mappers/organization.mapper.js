
export function toOrganizationPublic(orgDoc) {
    return {
        id: String(orgDoc._id),
        name: orgDoc.name,
        type: orgDoc.type,
        status: orgDoc.status,
        createdAt: orgDoc.createdAt,
        updatedAt: orgDoc.updatedAt,
    };
}
