"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getAllRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
} from "@/service/recipe.service";
import { Recipe, RecipeCreateDto, RecipeFilters } from "@/types";
import { API_ROUTE } from "@/routes";

export const useInfiniteRecipes = (filters?: RecipeFilters) => {
    return useInfiniteQuery({
        queryKey: [API_ROUTE.RECIPE.ALL.ID, filters],
        queryFn: ({ pageParam = 1 }) =>
            getAllRecipes({
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

export const useGetRecipeDetail = (id?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.RECIPE.ALL.ID, "detail", id],
        queryFn: async () => {
            if (!id) throw new Error("Recipe ID is required");
            const recipe = await getRecipeById(id);
            if (!recipe) throw new Error("Recipe not found");
            return recipe;
        },
        enabled: !!id && id !== "new",
        // staleTime: 5 * 60 * 1000,
    });
};

export const useCreateRecipe = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (recipeData: RecipeCreateDto) => createRecipe(recipeData),
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: [API_ROUTE.RECIPE.ALL.ID], exact: false });
        },
        onError: (error: any) => {
            console.error("Error creating recipe:", error);
        },
    });
};

export const useEditRecipe = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<Recipe> }) =>
            updateRecipe(id, payload),
        onSuccess: (_, variables) => {
            queryClient.refetchQueries({ queryKey: [API_ROUTE.RECIPE.ALL.ID], exact: false });
            queryClient.refetchQueries({
                queryKey: [API_ROUTE.RECIPE.ALL.ID, "detail", variables.id],
            });
        },
        onError: (error: any) => {
            console.error("Error updating recipe:", error);
        },
    });
};

export const useDeleteRecipe = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteRecipe(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate(query) {
                    return query.queryKey[0] === API_ROUTE.RECIPE.ALL.ID;
                }
            });
        },
        onError: (error: any) => {
            console.error("Error deleting recipe:", error);
        },
    });
};
