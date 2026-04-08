import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import { Recipe, RecipeFilters, RecipesResponse } from "@/types/recipe.type";

export async function getAllRecipes(
    filters?: RecipeFilters
): Promise<RecipesResponse> {
    const response = await axiosInstance.get<RecipesResponse>(API_ROUTE.RECIPE.ALL.PATH, {
        params: {
            search: filters?.search,
            status: filters?.status,
            categoryId: filters?.categoryId,
            difficulty: filters?.difficulty,
            sortBy: filters?.sortBy,
            sortOrder: filters?.sortOrder,
            page: filters?.page ?? 1,
            limit: filters?.limit ?? 10,
        },
    });
    return response.data;
}

export async function getRecipeById(id: string): Promise<Recipe> {
    const response = await axiosInstance.get<Recipe>(API_ROUTE.RECIPE.VIEW.PATH(id));
    return response.data;
}

export async function createRecipe(
    data: Partial<Recipe>
): Promise<Recipe> {
    const response = await axiosInstance.post<Recipe>(API_ROUTE.RECIPE.CREATE.PATH, data);
    return response.data;
}

export async function updateRecipe(
    id: string,
    data: Partial<Recipe>
): Promise<Recipe> {
    const response = await axiosInstance.patch<Recipe>(API_ROUTE.RECIPE.UPDATE.PATH(id), data);
    return response.data;
}

export async function deleteRecipe(id: string): Promise<void> {
    await axiosInstance.delete(API_ROUTE.RECIPE.DELETE.PATH(id));
}
