import { z } from "zod";
import { ApiError, ApiResponse } from "./common.type";

export interface PermissionCreator {
    name: string;
    id: string;
}

export interface Permission {
    id: string;
    module: string;
    description?: string;
    createdBy: string | PermissionCreator;
    updatedBy: string | PermissionCreator;
    createdAt: string;
    updatedAt: string;
}

interface CreatePermissionDto extends Omit<Permission, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"> {
}

interface CreatePermissionError extends ApiError {

}

interface CreatePermissionResponse extends ApiResponse<Permission> {

}
export interface PermissionFilters {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: keyof Permission;
    sortOrder?: "asc" | "desc";
}

export interface PermissionMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PermissionsResponse {
    success: boolean;
    message: string;
    items: Permission[];
    permissions: Permission[];
    pagination: PermissionMeta;
    meta: PermissionMeta;
}

export interface PermissionsResponseError {
    success: boolean;
    message: string;
    items: Permission[];
    permissions: Permission[];
    pagination: PermissionMeta;
    meta: PermissionMeta;
}


export interface PermissionOne extends Permission {
}

export interface PermissionOneError extends ApiError {
}

// Create Permission schema
export const createPermissionSchema = z.object({
    module: z.string().min(2, "Permission Module Name is required"),
    description: z.string().optional(),
});
export type CreatePermissionSchema = z.infer<typeof createPermissionSchema>;

// Edit Permission schema
export const editPermissionSchema = createPermissionSchema.extend({
    id: z.string(),
});
export type EditPermissionSchema = z.infer<typeof editPermissionSchema>;

export type { CreatePermissionDto, CreatePermissionError, CreatePermissionResponse }