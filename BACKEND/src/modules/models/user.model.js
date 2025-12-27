import mongoose from "mongoose";


export const USER_ROLES = ["SUPER_ADMIN", "AUDITOR", "REGULATOR", "COMPANY_MANAGER", "COMPANY_USER"];
export const USER_PORTALS = ["admin", "user"];

const UserSchema = new mongoose.Schema({
    orgId :{ type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true,index: true},
    portal :{ type: String, enum: USER_PORTALS, required: true,index: true},
    role :{ type: String, enum: USER_ROLES, required: true,index: true},
    email :{ type: String,lowercase: true, trim: true, required: true,index: true},
    username :{ type: String, required: true, trim: true,index: true},
    password : {type: String, required: true, select: false},
    createdByUserId :{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,index: true},
    status :{ type: String, enum: USER_STATUS, required: true,index: true},
    mustChangePassword :{ type: Boolean, default: false,index: true},
    createdAt :{ type: Date, default: Date.now,index: true},
    updatedAt :{ type: Date, default: Date.now,index: true},

});
