import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import { RecipeCategory, RecipeCategoriesResponse, RecipeCategoryFilters } from "@/types/recipe-category.type";

export const getAllRecipeCategories = async (filters?: RecipeCategoryFilters): Promise<RecipeCategoriesResponse> => {
    const response = await axiosInstance.get<RecipeCategoriesResponse>(API_ROUTE.RECIPE_CATEGORY.ALL.PATH, {
        params: {
            search: filters?.search,
            status: filters?.status,
            sortBy: filters?.sortBy,
            sortOrder: filters?.sortOrder,
            page: filters?.page ?? 1,
            limit: filters?.limit ?? 10,
        },
    });
    return response.data;
};

export const getRecipeCategoryById = async (id: string): Promise<RecipeCategory | null> => {
    const response = await axiosInstance.get<RecipeCategory>(API_ROUTE.RECIPE_CATEGORY.VIEW.PATH(id));
    return response.data;
};

export const createRecipeCategory = async (categoryData: Partial<RecipeCategory>): Promise<RecipeCategory> => {
    const response = await axiosInstance.post<RecipeCategory>(API_ROUTE.RECIPE_CATEGORY.CREATE.PATH, categoryData);
    return response.data;
};

export const updateRecipeCategory = async (
    id: string,
    payload: Partial<RecipeCategory>
): Promise<RecipeCategory> => {
    const response = await axiosInstance.put<RecipeCategory>(API_ROUTE.RECIPE_CATEGORY.UPDATE.PATH(id), payload);
    return response.data;
};

export const deleteRecipeCategory = async (id: string): Promise<{ success: boolean }> => {
    const response = await axiosInstance.delete<{ success: boolean }>(API_ROUTE.RECIPE_CATEGORY.DELETE.PATH(id));
    return response.data;
};
