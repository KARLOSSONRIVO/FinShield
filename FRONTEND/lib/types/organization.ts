import { components } from "../api-types";

export type Organization = components["schemas"]["Organization"] & {
    _id?: string;
    invoiceTemplate?: {
        s3Key: string;
        fileName: string;
        uploadedAt: string;
    } | null;
    createdAt?: string;
    updatedAt?: string;
};
