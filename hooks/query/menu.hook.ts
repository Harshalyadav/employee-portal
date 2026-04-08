"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getAllMenus,
    getMenuById,
    createMenu,
    updateMenu,
    deleteMenu,
} from "@/service/menu.service";
import { Menu, MenuFilters, CreateMenuSchema } from "@/types/menu.type";

const MENUS_QUERY_KEY = "menus";

export const useInfiniteMenus = (filters?: MenuFilters) => {
    return useInfiniteQuery({
        queryKey: [MENUS_QUERY_KEY, filters],
        queryFn: ({ pageParam = 1 }) =>
            getAllMenus({
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

export const useGetMenuDetail = (id?: string) => {
    return useQuery({
        queryKey: [MENUS_QUERY_KEY, "detail", id],
        queryFn: async () => {
            if (!id) throw new Error("Menu ID is required");
            const menu = await getMenuById(id);
            if (!menu) throw new Error("Menu not found");
            return menu;
        },
        enabled: !!id && id !== "new",
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateMenu = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (menuData: CreateMenuSchema) => createMenu(menuData as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [MENUS_QUERY_KEY] });
        },
        onError: (error: any) => {
            console.error("Error creating menu:", error);
        },
    });
};

export const useEditMenu = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<Menu> }) =>
            updateMenu(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [MENUS_QUERY_KEY] });
            queryClient.invalidateQueries({
                queryKey: [MENUS_QUERY_KEY, "detail", variables.id],
            });
        },
        onError: (error: any) => {
            console.error("Error updating menu:", error);
        },
    });
};

export const useDeleteMenu = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteMenu(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [MENUS_QUERY_KEY] });
        },
        onError: (error: any) => {
            console.error("Error deleting menu:", error);
        },
    });
};
