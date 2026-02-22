import Assignment from "../models/assignment.model.js";

export async function create(data) {
    return Assignment.create(data)
}

export async function findById(id) {
    return Assignment.findById(id).populate("companyOrgId").populate("auditorUserId").populate("assignedByUserId").exec()
}

export async function findOne(filter) {
    return Assignment.findOne(filter).populate("companyOrgId").populate("auditorUserId").populate("assignedByUserId").exec()
}

export async function findMany(filter = {}) {
    return Assignment.find(filter).populate("companyOrgId").populate("auditorUserId").populate("assignedByUserId").sort({ createdAt: -1 }).exec()
}

export async function findManyPaginated({ filter = {}, page = 1, limit = 20, search, sortBy = "createdAt", order = "desc" }) {
    const query = { ...filter };
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: order === "asc" ? 1 : -1 };
    const [items, total] = await Promise.all([
        Assignment.find(query)
            .populate("companyOrgId")
            .populate("auditorUserId")
            .populate("assignedByUserId")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        Assignment.countDocuments(query),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateById(id, update) {
    return Assignment.findByIdAndUpdate(id, update, { new: true })
        .populate("companyOrgId")
        .populate("auditorUserId")
        .populate("assignedByUserId")
        .exec()
}

export async function findByAuditorId(auditorUserId, filter = {}) {
    return Assignment.find({ auditorUserId, ...filter }).populate("companyOrgId").populate("auditorUserId").populate("assignedByUserId").exec()
}

export async function findByCompanyId(companyOrgId) {
    return Assignment.find({ companyOrgId }).populate("companyOrgId").populate("auditorUserId").populate("assignedByUserId").exec()
}

/**
 * Check if a company has at least one active auditor assigned
 * @param {string} companyOrgId - The company organization ID
 * @returns {Promise<boolean>}
 */
export async function hasActiveAuditor(companyOrgId) {
    const count = await Assignment.countDocuments({ 
        companyOrgId, 
        status: "active" 
    })
    return count > 0
}
