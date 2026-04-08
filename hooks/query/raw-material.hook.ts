"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getAllRawMaterials,
    getRawMaterialById,
    createRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
} from "@/service/raw-material.service";
import { RawMaterial, RawMaterialFilters } from "@/types/raw-material.type";
import { API_ROUTE } from "@/routes";

export const useInfiniteRawMaterials = (filters?: RawMaterialFilters) => {
    return useInfiniteQuery({
        queryKey: [API_ROUTE.RAW_MATERIAL.ALL.ID, filters],
        queryFn: ({ pageParam = 1 }) =>
            getAllRawMaterials({
                ...filters,
                page: pageParam as number,
                limit: filters?.limit ?? 10,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const currentPage = parseInt(lastPage?.pagination?.page as unknown as string ?? "1", 10);
            const totalPages = lastPage?.pagination?.totalPages ?? 1;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
        // staleTime: 5 * 60 * 1000,
    });
};

export const useGetRawMaterialDetail = (id?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.RAW_MATERIAL.ALL.ID, "detail", id],
        queryFn: async () => {
            if (!id) throw new Error("Raw Material ID is required");
            const rawMaterial = await getRawMaterialById(id);
            if (!rawMaterial) throw new Error("Raw Material not found");
            return rawMaterial;
        },
        enabled: !!id && id !== "new",
        // staleTime: 5 * 60 * 1000,
    });
};

export const useCreateRawMaterial = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (rawMaterialData: Partial<RawMaterial>) =>
            createRawMaterial(rawMaterialData),
        onSuccess: () => {
            queryClient.resetQueries({ queryKey: [API_ROUTE.RAW_MATERIAL.ALL.ID], exact: false });
            queryClient.refetchQueries({ queryKey: [API_ROUTE.RAW_MATERIAL.ALL.ID], exact: false, type: 'active' });
        },
        onError: (error: any) => {
            console.error("Error creating raw material:", error);
        },
    });
};

export const useEditRawMaterial = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<RawMaterial> }) =>
            updateRawMaterial(id, payload),
        onSuccess: (_, variables) => {
            queryClient.refetchQueries({ queryKey: [API_ROUTE.RAW_MATERIAL.ALL.ID], exact: false });
            queryClient.refetchQueries({
                queryKey: [API_ROUTE.RAW_MATERIAL.ALL.ID, "detail", variables.id],
            });
        },
        onError: (error: any) => {
            console.error("Error updating raw material:", error);
        },
    });
};

export const useDeleteRawMaterial = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteRawMaterial(id),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: [API_ROUTE.RAW_MATERIAL.ALL.ID], exact: false });
        },
        onError: (error: any) => {
            console.error("Error deleting raw material:", error);
        },
    });
};
