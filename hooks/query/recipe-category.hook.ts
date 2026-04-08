"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getAllRecipeCategories,
    getRecipeCategoryById,
    createRecipeCategory,
    updateRecipeCategory,
    deleteRecipeCategory,
} from "@/service/recipe-category.service";
import { RecipeCategory, RecipeCategoryFilters } from "@/types/recipe-category.type";
import { API_ROUTE } from "@/routes";

export const useInfiniteRecipeCategories = (filters?: RecipeCategoryFilters) => {
    return useInfiniteQuery({
        queryKey: [API_ROUTE.RECIPE_CATEGORY.ALL.ID, filters],
        queryFn: ({ pageParam = 1 }) =>
            getAllRecipeCategories({
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
        // staleTime: 5 * 60 * 1000,
    });
};

export const useGetRecipeCategoryDetail = (id?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.RECIPE_CATEGORY.VIEW.ID, id],
        queryFn: async () => {
            if (!id) throw new Error("Category ID is required");
            const category = await getRecipeCategoryById(id);
            if (!category) throw new Error("Category not found");
            return category;
        },
        enabled: !!id && id !== "new",
        // staleTime: 5 * 60 * 1000,
    });
};

export const useCreateRecipeCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (categoryData: Partial<RecipeCategory>) => createRecipeCategory(categoryData),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: [API_ROUTE.RECIPE_CATEGORY.ALL.ID], exact: false });
        },
        onError: (error: any) => {
            console.error("Error creating recipe category:", error);
        },
    });
};

export const useEditRecipeCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<RecipeCategory> }) =>
            updateRecipeCategory(id, payload),
        onSuccess: (_, variables) => {
            queryClient.refetchQueries({ queryKey: [API_ROUTE.RECIPE_CATEGORY.ALL.ID], exact: false });
            queryClient.refetchQueries({
                queryKey: [API_ROUTE.RECIPE_CATEGORY.ALL.ID, "detail", variables.id],
            });
        },
        onError: (error: any) => {
            console.error("Error updating recipe category:", error);
        },
    });
};

export const useDeleteRecipeCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteRecipeCategory(id),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: [API_ROUTE.RECIPE_CATEGORY.ALL.ID], exact: false });
        },
        onError: (error: any) => {
            console.error("Error deleting recipe category:", error);
        },
    });
};
