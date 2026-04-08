"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getAllScalingDrivers,
    getScalingDriverById,
    createScalingDriver,
    updateScalingDriver,
    deleteScalingDriver,
    type ScalingDriverFilters,
    type ScalingDriversResponse,
} from "@/service";
import { API_ROUTE } from "@/routes";
import { ScalingDriver } from "@/types/recipe.type";

const SCALING_DRIVERS_QUERY_KEY = API_ROUTE.RECIPE_SCALING_DRIVER.ALL.PATH;

export const useInfiniteScalingDrivers = (filters?: ScalingDriverFilters & { limit?: number }) => {
    return useInfiniteQuery<ScalingDriversResponse>({
        queryKey: [SCALING_DRIVERS_QUERY_KEY, filters],
        queryFn: async ({ pageParam = 1 }) => {
            return await getAllScalingDrivers({ ...filters, page: pageParam as number, limit: filters?.limit || 10 });
        },
        getNextPageParam: (lastPage) => {
            const page = lastPage?.meta?.page ?? 1;
            const totalPages = lastPage?.meta?.totalPages ?? 1;
            return page < totalPages ? page + 1 : undefined;
        },
        getPreviousPageParam: (firstPage) => {
            const page = firstPage?.meta?.page ?? 1;
            return page > 1 ? page - 1 : undefined;
        },
        initialPageParam: 1,
        staleTime: 5 * 60 * 1000,
    });
};

export const useScalingDriver = (id: string) => {
    return useQuery<ScalingDriver>({
        queryKey: [API_ROUTE.RECIPE_SCALING_DRIVER.VIEW.PATH(id)],
        queryFn: () => getScalingDriverById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateScalingDriver = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<ScalingDriver>) => createScalingDriver(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [SCALING_DRIVERS_QUERY_KEY] });
        },
    });
};

export const useUpdateScalingDriver = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ScalingDriver> }) => updateScalingDriver(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: [SCALING_DRIVERS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [API_ROUTE.RECIPE_SCALING_DRIVER.VIEW.PATH(variables.id), variables.id] });
        },
    });
};

export const useDeleteScalingDriver = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteScalingDriver(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [SCALING_DRIVERS_QUERY_KEY] });
        },
    });
};
