import { API_ROUTE } from "@/routes";
import {
    createRole,
    deleteRole,
    getRoleById,
    getRoles,
    updateRole,
    getAllRoles,
    getRole,
    getRoleByName,
    getRolesByType,
    getModulePermissions,
    createNewRole,
    updateExistingRole,
    updateModulePermissions,
    getAssignableRoles,
} from "@/service";
import {
    ApiError,
    CreateRoleDto,
    CreateRoleResponse,
    RoleFilters,
    RoleOneResponse,
    RolesPaginatedResponse,
    IRole,
    ICreateRoleRequest,
    IUpdateRoleRequest,
    IPaginatedResponse,
    ModuleNameEnum,
    RoleTypeEnum,
    IPermissionMatrix,
} from "@/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Legacy hooks (keeping for backward compatibility)
export const useInfiniteRoles = (filters?: RoleFilters & { limit?: number }) => {
    return useInfiniteQuery<RolesPaginatedResponse>({
        queryKey: [API_ROUTE.ROLE.ALL.PATH, filters],
        queryFn: async ({ pageParam = 1 }) => {
            return await getRoles({ ...filters, page: pageParam as number, limit: filters?.limit || 10 });
        },
        getNextPageParam: (lastPage) => {
            const page = lastPage?.pagination?.page ?? 1;
            const totalPages = lastPage?.pagination?.pages ?? 1;
            return page < totalPages ? page + 1 : undefined;
        },
        getPreviousPageParam: (firstPage) => {
            const page = firstPage?.pagination?.page ?? 1;
            return page > 1 ? page - 1 : undefined;
        },
        initialPageParam: 1,
    });
};

// New API: Hook to fetch all roles with pagination
export function useRoles(page: number = 1, limit: number = 10) {
    return useQuery<IPaginatedResponse<IRole>>({
        queryKey: ['roles', page, limit],
        queryFn: () => getAllRoles(page, limit),
    });
}

// Assignable roles for Permission tab (Visa Head → Visa Manager only; Account Head → Account Manager only; HR Head → HR Manager + Employee; else all)
export function useAssignableRoles() {
    return useQuery<IRole[]>({
        queryKey: [API_ROUTE.ROLE.ASSIGNABLE.PATH],
        queryFn: () => getAssignableRoles(),
    });
}

// Legacy hook - updated to return IRole
export const useRole = (id: string) => {
    return useQuery<IRole>({
        queryKey: [API_ROUTE.ROLE.VIEW.PATH(id)],
        queryFn: () => getRole(id),
        enabled: !!id,
    });
};

// New API: Hook to fetch a single role by ID
export function useRoleById(id: string) {
    return useQuery<IRole>({
        queryKey: ['role', id],
        queryFn: () => getRole(id),
        enabled: !!id,
    });
}

// New API: Hook to fetch a role by name
export function useRoleByName(roleName: string) {
    return useQuery<IRole>({
        queryKey: ['role', 'name', roleName],
        queryFn: () => getRoleByName(roleName),
        enabled: !!roleName,
    });
}

// New API: Hook to fetch roles by type
export function useRolesByType(
    roleType: RoleTypeEnum,
    page: number = 1,
    limit: number = 10
) {
    return useQuery<IPaginatedResponse<IRole>>({
        queryKey: ['roles', 'type', roleType, page, limit],
        queryFn: () => getRolesByType(roleType, page, limit),
        enabled: !!roleType,
    });
}

// New API: Hook to fetch module permissions for a role
export function useModulePermissions(roleId: string, moduleName: ModuleNameEnum) {
    return useQuery<IPermissionMatrix>({
        queryKey: ['role', roleId, 'permissions', moduleName],
        queryFn: () => getModulePermissions(roleId, moduleName),
        enabled: !!roleId && !!moduleName,
    });
}

// Legacy create hook - updated to use new API structure
export const useCreateRole = () => {
    const queryClient = useQueryClient();
    return useMutation<IRole, ApiError, ICreateRoleRequest>({
        mutationFn: (data: ICreateRoleRequest) => createNewRole(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [API_ROUTE.ROLE.ALL.PATH] });
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });
};

// New API: Hook to create a new role
export function useCreateNewRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ICreateRoleRequest) => createNewRole(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: [API_ROUTE.ROLE.ALL.PATH] });
        },
    });
}

// Legacy update hook - updated to use new API structure
export const useUpdateRole = () => {
    const queryClient = useQueryClient();
    return useMutation<IRole, ApiError, { id: string; data: IUpdateRoleRequest }>({
        mutationFn: ({ id, data }: { id: string; data: IUpdateRoleRequest }) =>
            updateExistingRole(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [API_ROUTE.ROLE.ALL.PATH] });
            queryClient.invalidateQueries({ queryKey: [API_ROUTE.ROLE.VIEW.PATH(data._id)] });
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: ['role', data._id] });
        },
    });
};

// New API: Hook to update an existing role
export function useUpdateExistingRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: IUpdateRoleRequest }) =>
            updateExistingRole(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['role', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: [API_ROUTE.ROLE.ALL.PATH] });
        },
    });
}

// New API: Hook to update module permissions
export function useUpdateModulePermissions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            roleId,
            moduleName,
            permissions,
        }: {
            roleId: string;
            moduleName: ModuleNameEnum;
            permissions: Partial<IPermissionMatrix>;
        }) => updateModulePermissions(roleId, moduleName, permissions),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['role', variables.roleId] });
            queryClient.invalidateQueries({
                queryKey: ['role', variables.roleId, 'permissions', variables.moduleName],
            });
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });
}

// Legacy delete hook (works with both old and new APIs)
export const useDeleteRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteRole(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [API_ROUTE.ROLE.ALL.PATH] });
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });
};
