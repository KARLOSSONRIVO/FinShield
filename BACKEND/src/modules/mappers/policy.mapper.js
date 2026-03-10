/**
 * Maps a Policy document to a safe public DTO.
 */
export function toPolicyItem(doc) {
    return {
        id:              doc._id,
        title:           doc.title,
        content:         doc.content,
        version:         doc.version,
        createdByUserId: doc.createdByUserId ?? null,
        updatedByUserId: doc.updatedByUserId ?? null,
        createdAt:       doc.createdAt,
        updatedAt:       doc.updatedAt,
    };
}
