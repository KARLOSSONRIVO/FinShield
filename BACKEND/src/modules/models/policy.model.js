import mongoose from "mongoose";

const PolicySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        content: {
            type: String,
            required: true,
            maxlength: 20000,
        },
        version: {
            type: String,
            default: "1.0",
            trim: true,
            maxlength: 20,
        },
        createdByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        updatedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

const Policy = mongoose.models.Policy || mongoose.model("Policy", PolicySchema);

export default Policy;
