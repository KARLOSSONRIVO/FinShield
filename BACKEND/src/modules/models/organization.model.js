import mongoose from "mongoose";

export const ORG_TYPES = ["platform", "company"]
export const ORG_STATUS = ["active", "inactive"]

const OrganizationSchema = new mongoose.Schema({
    name: {type: String,required: true,trim: true,},
    type: {type: String,enum: ORG_TYPES,required: true,},
    status: {type: String,enum: ORG_STATUS,default: "active",},
    createdAt: {type: Date,default: Date.now,},
    updatedAt: {type: Date,default: Date.now,},
})

OrganizationSchema.index({ name: 1, type: 1 }, { unique: true });

const Organization = mongoose.model("Organization", OrganizationSchema)

export default Organization