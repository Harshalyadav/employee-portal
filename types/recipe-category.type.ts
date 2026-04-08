import { z } from "zod";

export interface LinkedRecipeItem {
    recipeId: string;
    recipeName: string;
    recipeType: string;
    price?: number;
    status: string;
}

export const RECIPE_CATEGORY_STATUSES = ["active", "inactive"] as const;
export type CategoryStatus = typeof RECIPE_CATEGORY_STATUSES[number];

export interface RecipeCategory {
    id: string;
    name: string;
    slug: string;
    description: string;
    status: CategoryStatus | string;
    imageUrl?: string;
    videoUrl?: string;
    createdAt: string;
    updatedAt: string;
    linkedRecipes?: LinkedRecipeItem[];
}

export interface RecipeCategoryFilters {
    search?: string;
    status?: CategoryStatus | string;
    page?: number;
    limit?: number;
    sortBy?: keyof RecipeCategory;
    sortOrder?: "asc" | "desc";
}

export interface RecipeCategoryMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface RecipeCategoriesResponse {
    success: boolean;
    message: string;
    items: RecipeCategory[];
    meta: RecipeCategoryMeta;
}

export const createRecipeCategorySchema = z.object({
    name: z.string().min(2, "Name is required"),
    slug: z.string().min(2, "Slug is required"),
    description: z.string().min(5, "Description is required"),
    status: z.union([z.enum(RECIPE_CATEGORY_STATUSES), z.string()]).default("active"),
    imageUrl: z.string().url("Invalid image URL").optional(),
    videoUrl: z.string().url("Invalid video URL").optional(),
});
export type CreateRecipeCategorySchema = z.infer<typeof createRecipeCategorySchema>;

export const editRecipeCategorySchema = createRecipeCategorySchema.extend({
    id: z.string(),
});
export type EditRecipeCategorySchema = z.infer<typeof editRecipeCategorySchema>;
