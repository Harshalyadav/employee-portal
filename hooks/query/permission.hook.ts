"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getAllPermissions,
    getPermissionById,
    createPermission,
    updatePermission,
    deletePermission,
} from "@/service/permission.service";
import { CreatePermissionDto, CreatePermissionError, CreatePermissionResponse, Permission, PermissionFilters, PermissionOne, PermissionOneError, PermissionsResponse, PermissionsResponseError } from "@/types";
import { API_ROUTE } from "@/routes";


export const useInfinitePermissions = (filters?: PermissionFilters) => {
    return useInfiniteQuery<PermissionsResponse, PermissionsResponseError>({
        queryKey: [API_ROUTE.PERMISSION.ALL.ID, filters],
        queryFn: ({ pageParam = 1 }) =>
            getAllPermissions({
                ...filters,
                page: pageParam as number,
                limit: filters?.limit ?? 10,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const currentPage = lastPage?.meta?.page ?? 1;
            const totalPages = lastPage?.meta?.totalPages ?? 1;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useGetPermissionDetail = (id?: string) => {
    return useQuery<PermissionOne, PermissionOneError>({
        queryKey: [API_ROUTE.PERMISSION.VIEW.ID, "detail", id],
        queryFn: async () => {
            if (!id) throw new Error("Permission ID is required");
            const permission = await getPermissionById(id);
            if (!permission) throw new Error("Permission not found");
            return permission;
        },
        enabled: !!id && id !== "new",
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreatePermission = () => {
    const queryClient = useQueryClient();

    return useMutation<CreatePermissionResponse, CreatePermissionError, CreatePermissionDto>({
        mutationFn: (permissionData: CreatePermissionDto) =>
            createPermission(permissionData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [API_ROUTE.PERMISSION.CREATE.ID] });
        },
    });
};

export const useEditPermission = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: Partial<Permission>;
        }) => updatePermission(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [API_ROUTE.PERMISSION.ALL.ID] });
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.PERMISSION.VIEW.ID, "detail", variables.id],
            });
        },
        onError: (error: any) => {
            console.error("Error updating permission:", error);
        },
    });
};

export const useDeletePermission = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deletePermission(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [API_ROUTE.PERMISSION.DELETE.ID] });
        },
        onError: (error: any) => {
            console.error("Error deleting permission:", error);
        },
    });
};
