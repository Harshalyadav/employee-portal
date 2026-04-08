
import { z } from "zod";
import { ApiError } from "./common.type";
import { Permission } from "./permission.type";

// Enums
export enum RoleTypeEnum {
    EMPLOYEE = 'emp',
    NON_EMPLOYEE = 'non-emp',
}

export enum ModuleNameEnum {
    USERS = 'users',
    COMPANY = 'company',
    BRANCH = 'branch',
    ROLES = 'roles',
    PERMISSIONS = 'permissions',
    DOCUMENTS = 'documents',
    // QUEUES = 'queues',
    UPLOAD = 'upload',
    REPORTS = 'reports',
    SETTINGS = 'settings',
    PAYROLL = 'payroll',
    ADVANCE = 'advance',
    LOT = 'lot',
    VISA_MANAGER = 'visa-manager',

}

export enum PermissionAction {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    APPROVE = 'approve',
    REJECT = 'reject',
    EXPORT = 'export',
}

// User Basic interface for createdBy/updatedBy
export interface IUserBasic {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

// Permission Matrix
export interface IPermissionMatrix {
    moduleName: ModuleNameEnum;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    approve: boolean;
    reject: boolean;
    export: boolean;
}

export interface IPermissionMatrixInput {
    moduleName: ModuleNameEnum;
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
    approve?: boolean;
    reject?: boolean;
    export?: boolean;
}

// Role interfaces
export interface IRole {
    _id: string;
    id: string
    roleName: string;
    description?: string;
    roleType: RoleTypeEnum;
    permissionMatrix: IPermissionMatrix[];
    createdBy: IUserBasic;
    updatedBy: IUserBasic;
    createdAt: Date;
    updatedAt: Date;
}


export interface IRoleResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: IRole;
}
export interface ICreateRoleRequest {
    roleName: string;
    description?: string;
    roleType: RoleTypeEnum;
    permissionMatrix: IPermissionMatrixInput[];
}

export interface IUpdateRoleRequest {
    roleName?: string;
    description?: string;
    roleType?: RoleTypeEnum;
    permissionMatrix?: IPermissionMatrixInput[];
}

export interface IPaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pages: number;
    totalPages?: number; // For backward compatibility
}

// Legacy types (keeping for backward compatibility)
export interface PermissionMatrix extends Omit<Permission, "createdBy" | "updatedBy" | "createdAt" | "updatedAt"> {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
}

export interface Role {
    id: string;
    name: string;
    level: "System" | "Franchise";
    description: string;
    status: "active" | "inactive";
    permissions: PermissionMatrix[];
    assignedUsers: number;
    createdAt: string;
    updatedAt?: string;
}

export interface RoleFilters {
    status?: "active" | "inactive";
    level?: "System" | "Franchise";
    search?: string;
    sortBy?: "name" | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
}

export interface RoleFormData {
    name: string;
    description: string;
    status: "active" | "inactive";
    permissions: Permission[];
}

export interface RoleResponse {
    items: Role[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
}


export interface RolesPaginatedResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: IRole[];
    pagination: {
        page: number;
        total: number;
        pages: number;
        totalPages?: number; // For backward compatibility
    };
    // Legacy fields for backward compatibility
    items?: Role[];
};

export interface RoleOneResponse extends IRole {
    // Extending new IRole interface
}

// Updated payload types to match new API structure
export interface CreateRolePayload {
    roleName: string;
    description?: string;
    roleType: RoleTypeEnum;
    permissionMatrix: IPermissionMatrixInput[];
}

export type CreateRoleDto = ICreateRoleRequest;

export interface CreateRoleResponse {
    _id: string;
    roleName: string;
    description?: string;
    roleType: RoleTypeEnum;
    permissionMatrix: IPermissionMatrix[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateRoleError extends ApiError {
}

// Zod schemas for role creation
export const permissionMatrixItemSchema = z.object({
    moduleName: z.nativeEnum(ModuleNameEnum, {
        errorMap: () => ({ message: "Invalid module name" }),
    }),
    create: z.boolean().optional().default(false),
    read: z.boolean().optional().default(false),
    update: z.boolean().optional().default(false),
    delete: z.boolean().optional().default(false),
    approve: z.boolean().optional().default(false),
    reject: z.boolean().optional().default(false),
    export: z.boolean().optional().default(false),
});

export const createRoleSchema = z.object({
    roleName: z.string().min(1, "Role name is required"),
    description: z.string().optional(),
    roleType: z.nativeEnum(RoleTypeEnum, {
        errorMap: () => ({ message: "Invalid role type" }),
    }),
    permissionMatrix: z.array(permissionMatrixItemSchema).min(1, "At least one module permission is required"),
});

// Legacy schema for backward compatibility
export const permissionItemSchema = z.object({
    id: z.string().min(1, "Permission ID is required"),
    module: z.string().min(1, "Module name is required"),
    create: z.boolean(),
    read: z.boolean(),
    update: z.boolean(),
    delete: z.boolean(),
    export: z.boolean(),
});

export type CreateRoleSchema = z.infer<typeof createRoleSchema>;
export type PermissionMatrixItemSchema = z.infer<typeof permissionMatrixItemSchema>;