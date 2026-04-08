"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getAllModels,
    getModelById,
    createModel,
    updateModel,
    deleteModel,
} from "@/service/model.service";
import { CreateModelDto, EditModelDto, ModelFilters } from "@/types/model.type";
import { API_ROUTE } from "@/routes";


const MODELS_QUERY_KEY = API_ROUTE.MODEL?.ALL?.PATH || "models";

export const useInfiniteModels = (filters?: ModelFilters & { limit?: number }) => {
    return useInfiniteQuery({
        queryKey: [MODELS_QUERY_KEY, filters],
        queryFn: async ({ pageParam = 1 }) => {
            return await getAllModels({ ...filters, page: pageParam as number, limit: filters?.limit || 10 });
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

export const useModel = (id: string) => {
    return useQuery({
        queryKey: [API_ROUTE.MODEL?.VIEW?.PATH?.(id)],
        queryFn: () => getModelById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateModel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateModelDto) => createModel(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [MODELS_QUERY_KEY] });
        },
    });
};

export const useUpdateModel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: EditModelDto }) => updateModel(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: [MODELS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [API_ROUTE.MODEL?.VIEW?.PATH?.(variables.id) || MODELS_QUERY_KEY, variables.id] });
        },
    });
};

export const useDeleteModel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteModel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [MODELS_QUERY_KEY] });
        },
    });
};
