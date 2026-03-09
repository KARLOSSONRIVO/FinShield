import { components } from "../api-types";

type SchemaUser = components["schemas"]["User"];

/**
 * User interface extended with legacy fields and frontend-specific properties.
 * This is the primary User type used throughout the application.
 */
export interface User extends SchemaUser {
    /** Override role to be required */
    role: NonNullable<SchemaUser["role"]>;
    /** Override status to be required */
    status: NonNullable<SchemaUser["status"]>;
    /** Legacy ID field used in some components and API responses */
    _id: string;
    /** Organization ID field (often used as alias for organizationId) */
    orgId: string;
    /** Optional organization name for display */
    organizationName?: string;
    /** Last login timestamp */
    lastLoginAt?: string;
    /** Child users managed by this user (e.g. employees of a manager) */
    employees?: User[];
    /** User who disabled this account */
    disabledByUserId?: string;
    /** When the account was disabled */
    disabledAt?: string;
    /** Reason for disabling the account */
    disableReason?: string;
    /** Account creation timestamp */
    createdAt?: string;
    /** Last update timestamp */
    updatedAt?: string;
}

export type Role = User["role"];
export type UserStatus = User["status"];

/** @deprecated Use User instead */
export interface FrontendUser extends User { }
