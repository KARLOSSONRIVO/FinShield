import Organization from "../models/organization.model.js";

export async function createOrganization(data){
    return Organization.create(data);
}

export async function findById(id){
    return Organization.findById(id).exec()
}

export async function findOne(filter){
    return Organization.findOne(filter).exec()
}

export async function findMany(filter){
    return Organization.find(filter).sort({createdAt: -1}).exec()
}