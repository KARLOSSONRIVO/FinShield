import Policy from "../models/policy.model.js";

/**
 * Get all policies (global — shared across all companies).
 * Optionally filters by title (case-insensitive regex).
 */
export async function findAll({ search } = {}) {
    const filter = {};
    if (search) {
        filter.title = { $regex: search, $options: "i" };
    }
    return Policy.find(filter).sort({ createdAt: -1 }).lean();
}

/**
 * Find a single policy by its MongoDB _id.
 */
export async function findById(id) {
    return Policy.findById(id).lean();
}

/**
 * Create a new policy document.
 */
export async function createOne(data) {
    const policy = new Policy(data);
    return policy.save();
}

/**
 * Update an existing policy by _id.
 * Returns the updated document (new: true).
 */
export async function updateById(id, updates) {
    return Policy.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
    ).lean();
}

/**
 * Hard-delete a policy by _id.
 */
export async function deleteById(id) {
    return Policy.findByIdAndDelete(id).lean();
}
