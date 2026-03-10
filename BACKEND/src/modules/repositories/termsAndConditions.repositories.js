import TermsAndConditions from "../models/termsAndConditions.model.js";

/**
 * Get all T&C documents.
 * Optionally filters by title (case-insensitive regex).
 */
export async function findAll({ search } = {}) {
    const filter = {};
    if (search) {
        filter.title = { $regex: search, $options: "i" };
    }
    return TermsAndConditions.find(filter).sort({ createdAt: -1 }).lean();
}

/**
 * Find a single T&C document by its MongoDB _id.
 */
export async function findById(id) {
    return TermsAndConditions.findById(id).lean();
}

/**
 * Create a new T&C document.
 */
export async function createOne(data) {
    const doc = new TermsAndConditions(data);
    return doc.save();
}

/**
 * Update an existing T&C document by _id.
 * Returns the updated document (new: true).
 */
export async function updateById(id, updates) {
    return TermsAndConditions.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
    ).lean();
}

/**
 * Hard-delete a T&C document by _id.
 */
export async function deleteById(id) {
    return TermsAndConditions.findByIdAndDelete(id).lean();
}
