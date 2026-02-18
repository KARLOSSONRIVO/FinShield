

export interface paths {
    "/assignment/createAssignment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        
                        auditorOrgId: string;
                        
                        companyOrgId: string;
                    };
                };
            };
            responses: {
                
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["Assignment"];
                        };
                    };
                };
                
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assignment/listAssignments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["Assignment"][];
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assignment/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["Assignment"];
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assignment/updateAssignment/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        
                        status?: "ACTIVE" | "INACTIVE";
                    };
                };
            };
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["Assignment"];
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assignment/deleteAssignment/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        
                        email: string;
                        
                        password: string;
                    };
                };
            };
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: {
                                accessToken?: string;
                                refreshToken?: string;
                                user?: components["schemas"]["User"];
                            };
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        
                        refreshToken: string;
                    };
                };
            };
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: {
                                accessToken?: string;
                                refreshToken?: string;
                            };
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        refreshToken: string;
                    };
                };
            };
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["User"];
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/change-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        
                        currentPassword: string;
                        
                        newPassword: string;
                    };
                };
            };
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            
                            message?: string;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/invoice/upload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "multipart/form-data": {
                        
                        file: string;
                    };
                };
            };
            responses: {
                
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["Invoice"];
                        };
                    };
                };
                
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                413: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organization/createOrganization": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        
                        name: string;
                        
                        type: "COMPANY" | "AUDITOR" | "REGULATOR";
                    };
                };
            };
            responses: {
                
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["Organization"];
                        };
                    };
                };
                
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organization/listOrganizations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["Organization"][];
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organization/getOrganization/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["Organization"];
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["Session"][];
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/session/count": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: {
                                
                                count?: number;
                            };
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/session/all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            
                            message?: string;
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/session/{sessionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    
                    sessionId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            
                            message?: string;
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/user/listUsers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["User"][];
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/user/createUser": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        
                        email: string;
                        
                        password: string;
                        
                        firstName: string;
                        
                        lastName: string;
                        
                        role: "SUPER_ADMIN" | "AUDITOR" | "REGULATOR" | "COMPANY_MANAGER" | "COMPANY_USER";
                        
                        organizationId?: string;
                    };
                };
            };
            responses: {
                
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["User"];
                        };
                    };
                };
                
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/user/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["User"];
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/user/updateUser/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        
                        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
                    };
                };
            };
            responses: {
                
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            
                            success?: boolean;
                            data?: components["schemas"]["User"];
                        };
                    };
                };
                
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Error: {
            
            success?: boolean;
            
            message?: string;
        };
        User: {
            
            id?: string;
            
            email?: string;
            
            username?: string;
            
            firstName?: string;
            
            lastName?: string;
            
            role?: "SUPER_ADMIN" | "AUDITOR" | "REGULATOR" | "COMPANY_MANAGER" | "COMPANY_USER";
            
            organizationId?: string;
            
            status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
            
            mustChangePassword?: boolean;
            mfaEnabled?: boolean;
        };
        Organization: {
            
            id?: string;
            
            name?: string;
            
            type?: "COMPANY" | "AUDITOR" | "REGULATOR";
            
            status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
        };
        Assignment: {
            
            id?: string;
            
            auditorOrgId?: string;
            
            companyOrgId?: string;
            
            status?: "ACTIVE" | "INACTIVE";
        };
        Invoice: {
            
            id?: string;
            
            originalFilename?: string;
            
            fileHash?: string;
            
            ipfsCid?: string;
            
            txHash?: string;
            
            anchoredAt?: string;
            
            organizationId?: string;
            
            uploadedBy?: string;
        };
        Session: {
            
            id?: string;
            
            userId?: string;
            
            userAgent?: string;
            
            createdAt?: string;
            
            expiresAt?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
