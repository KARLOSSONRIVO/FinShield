import mongoose from "mongoose";

export const ASSIGNMENT_STATUS = ["active", "inactive"];

const AssignmentSchema = new mongoose.Schema({
    companyOrgId: {type: mongoose.Schema.Types.ObjectId,ref: "Organization",required: true,index: true},
    auditorUserId: {type: mongoose.Schema.Types.ObjectId,ref: "User",required: true,index: true}, // Auditors can be assigned to multiple companies
    // Assignment status
    status: {type: String,enum: ASSIGNMENT_STATUS,default: "active",index: true},   
    assignedByUserId: {type: mongoose.Schema.Types.ObjectId,ref: "User",required: true,index: true},
    assignedAt: {type: Date,default: Date.now},
    notes: {type: String,trim: true,default: null},
}, { timestamps: true });

// Composite index for faster queries
AssignmentSchema.index({ companyOrgId: 1, status: 1 });
AssignmentSchema.index({ auditorUserId: 1, status: 1 });
// Unique constraint: One auditor can only be assigned once to the same company (active assignments)
AssignmentSchema.index({ companyOrgId: 1, auditorUserId: 1 }, { unique: true });

const Assignment = mongoose.models.Assignment || mongoose.model("Assignment", AssignmentSchema);

export default Assignment;
