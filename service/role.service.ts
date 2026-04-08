import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import {
    Role,
    RoleResponse,
    RoleFilters,
    CreateRoleResponse,
    RolesPaginatedResponse,
    IRole,
    ICreateRoleRequest,
    IUpdateRoleRequest,
    IPaginatedResponse,
    IPermissionMatrix,
    ModuleNameEnum,
    RoleTypeEnum,
    IRoleResponse
} from "@/types";

const mockDelay = (ms: number = 500) =>
    new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get all roles with filtering, sorting, and pagination
 */
export async function getRoles(
    filters?: RoleFilters
): Promise<RolesPaginatedResponse> {
    const response = await axiosInstance.get(
        API_ROUTE.ROLE.ALL.PATH,
        {
            params: {
                search: filters?.search,
                sortBy: filters?.sortBy,
                sortOrder: filters?.sortOrder,
                page: filters?.page ?? 1,
                limit: filters?.limit ?? 10,
                status: filters?.status,
                level: filters?.level,
            },
        }
    );
    return response.data;
}

/**
 * Get all roles (paginated) - new API format
 */
export async function getAllRoles(
    page: number = 1,
    limit: number = 10
): Promise<IPaginatedResponse<IRole>> {
    const response = await axiosInstance.get<IPaginatedResponse<IRole>>(
        API_ROUTE.ROLE.ALL.PATH,
        {
            params: { page, limit }
        }
    );
    return response.data;
}

/**
 * Get roles assignable in Permission tab (based on current user's designation)
 * Visa Head → Visa Manager; Account Head → Account Manager; HR Head → HR Manager (+ Employee); else all
 */
export async function getAssignableRoles(): Promise<IRole[]> {
    const response = await axiosInstance.get<{ data: IRole[] }>(
        API_ROUTE.ROLE.ASSIGNABLE.PATH
    );
    return response.data?.data ?? [];
}

/**
 * Get a single role by ID
 */
export async function getRoleById(id: string): Promise<Role> {
    const response = await axiosInstance.get<Role>(
        API_ROUTE.ROLE.VIEW.PATH(id)
    );
    return response.data;
}

/**
 * Get role by ID - new API format
 */
export async function getRole(id: string): Promise<IRole> {
    const response = await axiosInstance.get<IRoleResponse>(
        API_ROUTE.ROLE.VIEW.PATH(id)
    );
    return response.data?.data;
}

/**
 * Get role by name
 */
export async function getRoleByName(roleName: string): Promise<IRole> {
    const response = await axiosInstance.get<IRole>(
        API_ROUTE.ROLE.BY_NAME.PATH(roleName)
    );
    return response.data;
}

/**
 * Get roles by type with pagination
 */
export async function getRolesByType(
    roleType: RoleTypeEnum,
    page: number = 1,
    limit: number = 10
): Promise<IPaginatedResponse<IRole>> {
    const response = await axiosInstance.get<IPaginatedResponse<IRole>>(
        API_ROUTE.ROLE.BY_TYPE.PATH(roleType),
        {
            params: { page, limit }
        }
    );
    return response.data;
}

/**
 * Get permissions for a specific module in a role
 */
export async function getModulePermissions(
    roleId: string,
    moduleName: ModuleNameEnum
): Promise<IPermissionMatrix> {
    const response = await axiosInstance.get<IPermissionMatrix>(
        API_ROUTE.ROLE.MODULE_PERMISSIONS.PATH(roleId, moduleName)
    );
    return response.data;
}

/**
 * Create a new role
 */
export async function createRole(
    data: any
): Promise<CreateRoleResponse> {
    const response = await axiosInstance.post<CreateRoleResponse>(
        API_ROUTE.ROLE.CREATE.PATH,
        data
    );
    return response.data;
}

/**
 * Create a new role - new API format
 */
export async function createNewRole(
    data: ICreateRoleRequest
): Promise<IRole> {
    const response = await axiosInstance.post<IRole>(
        API_ROUTE.ROLE.CREATE.PATH,
        data
    );
    return response.data;
}

/**
 * Update an existing role
 */
export async function updateRole(
    id: string,
    data: Partial<Role>
): Promise<Role> {
    const response = await axiosInstance.patch<Role>(
        API_ROUTE.ROLE.UPDATE.PATH(id),
        data
    );
    return response.data;
}

/**
 * Update role - new API format
 */
export async function updateExistingRole(
    id: string,
    data: IUpdateRoleRequest
): Promise<IRole> {
    const response = await axiosInstance.put<IRole>(
        API_ROUTE.ROLE.UPDATE.PATH(id),
        data
    );
    return response.data;
}

/**
 * Update permissions for a specific module in a role
 */
export async function updateModulePermissions(
    roleId: string,
    moduleName: ModuleNameEnum,
    permissions: Partial<IPermissionMatrix>
): Promise<IPermissionMatrix> {
    const response = await axiosInstance.put<IPermissionMatrix>(
        API_ROUTE.ROLE.UPDATE_MODULE_PERMISSIONS.PATH(roleId, moduleName),
        permissions
    );
    return response.data;
}

/**
 * Delete a role
 */
export async function deleteRole(id: string): Promise<void> {
    await axiosInstance.delete(
        API_ROUTE.ROLE.DELETE.PATH(id)
    );
}
