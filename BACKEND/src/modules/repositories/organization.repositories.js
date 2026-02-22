import Organization from "../models/organization.model.js";

export async function createOrganization(data) {
    return Organization.create(data);
}

export async function findById(id) {
    return Organization.findById(id).exec()
}

export async function findOne(filter) {
    return Organization.findOne(filter).exec()
}

export async function findMany(filter) {
    return Organization.find(filter).sort({ createdAt: -1 }).exec()
}

export async function findManyPaginated({ filter = {}, page = 1, limit = 20, search, sortBy = "createdAt", order = "desc" }) {
    const query = { ...filter };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
        ];
    }
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: order === "asc" ? 1 : -1 };
    const [items, total] = await Promise.all([
        Organization.find(query).sort(sort).skip(skip).limit(limit).lean(),
        Organization.countDocuments(query),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateOrganizationTemplate(orgId, templateData) {
    // templateData expects: { s3Key, fileName, uploadedAt }
    return Organization.findByIdAndUpdate(
        orgId,
        {
            $set: {
                invoiceTemplate: templateData,
                updatedAt: new Date()
            }
        },
        { new: true }
    ).exec();
}
