"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getAllFranchises,
    getFranchiseById,
    createFranchise,
    updateFranchise,
    deleteFranchise,
} from "@/service/franchise.service";
import { Franchise, FranchiseFilters } from "@/types/franchise.type";

const FRANCHISES_QUERY_KEY = "franchises";

export const useInfiniteFranchises = (filters?: FranchiseFilters) => {
    return useInfiniteQuery({
        queryKey: [FRANCHISES_QUERY_KEY, filters],
        queryFn: ({ pageParam = 1 }) =>
            getAllFranchises({
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

export const useGetFranchiseDetail = (id?: string) => {
    return useQuery({
        queryKey: [FRANCHISES_QUERY_KEY, "detail", id],
        queryFn: async () => {
            if (!id) throw new Error("Franchise ID is required");
            const franchise = await getFranchiseById(id);
            if (!franchise) throw new Error("Franchise not found");
            return franchise;
        },
        enabled: !!id && id !== "new",
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateFranchise = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (franchiseData: Partial<Franchise>) => createFranchise(franchiseData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FRANCHISES_QUERY_KEY] });
        },
        onError: (error: any) => {
            console.error("Error creating franchise:", error);
        },
    });
};

export const useEditFranchise = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<Franchise> }) =>
            updateFranchise(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [FRANCHISES_QUERY_KEY] });
            queryClient.invalidateQueries({
                queryKey: [FRANCHISES_QUERY_KEY, "detail", variables.id],
            });
        },
        onError: (error: any) => {
            console.error("Error updating franchise:", error);
        },
    });
};

export const useDeleteFranchise = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteFranchise(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FRANCHISES_QUERY_KEY] });
        },
        onError: (error: any) => {
            console.error("Error deleting franchise:", error);
        },
    });
};
