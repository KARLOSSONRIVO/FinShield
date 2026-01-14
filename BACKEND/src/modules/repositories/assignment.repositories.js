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
