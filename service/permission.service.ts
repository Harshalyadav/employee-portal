import { CreatePermissionDto, CreatePermissionResponse, CreatePermissionSchema, Permission, PermissionFilters, PermissionsResponse } from "@/types";
import { PERMISSIONS_DATA } from "@/mock/permissions-data";
import axios from "axios";
import { API_ROUTE } from "@/routes";
import axiosInstance from "@/lib/axios";

// In-memory storage that simulates a database
let MOCK_PERMISSIONS: any[] = [...PERMISSIONS_DATA];

const mockDelay = (ms: number = 500) =>
    new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get all permissions with filtering, sorting, and pagination
 */
export async function getAllPermissions(
    filters?: PermissionFilters
): Promise<PermissionsResponse> {
    const response = await axiosInstance.get<PermissionsResponse>(
        API_ROUTE.PERMISSION.ALL.PATH,
        {
            params: {
                search: filters?.search,
                sortBy: filters?.sortBy,
                sortOrder: filters?.sortOrder,
                page: filters?.page ?? 1,
                limit: filters?.limit ?? 10,
            },
        }
    );
    return response.data;
}

/**
 * Get a single permission by ID
 */
export async function getPermissionById(id: string): Promise<Permission> {
    const response = await axiosInstance.get<Permission>(
        API_ROUTE.PERMISSION.VIEW.PATH(id)
    );
    return response.data;
}

/**
 * Create a new permission
 */
export async function createPermission(
    data: CreatePermissionDto
): Promise<CreatePermissionResponse> {
    const response = await axiosInstance.post<CreatePermissionResponse>(
        API_ROUTE.PERMISSION.CREATE.PATH,
        data
    );
    return response.data;
}

/**
 * Update an existing permission
 */
export async function updatePermission(
    id: string,
    data: Partial<Permission>
): Promise<Permission> {
    const response = await axiosInstance.patch<Permission>(
        API_ROUTE.PERMISSION.UPDATE.PATH(id),
        data
    );
    return response.data;
}

/**
 * Delete a permission
 */
export async function deletePermission(id: string): Promise<void> {
    await mockDelay();

    const index = MOCK_PERMISSIONS.findIndex((p) => p.id === id);

    if (index === -1) {
        throw new Error("Permission not found");
    }

    MOCK_PERMISSIONS.splice(index, 1);
}
