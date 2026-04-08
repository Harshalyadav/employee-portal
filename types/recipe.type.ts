import { z } from "zod";

export const RECIPE_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type RecipeDifficulty = typeof RECIPE_DIFFICULTIES[number];

export const RECIPE_STATUSES = ["active", "inactive"] as const;
export type RecipeStatus = typeof RECIPE_STATUSES[number];

export interface RecipeIngredient {
    isScalable: boolean; // NEW
    materialId: string;
    quantity: number;
    unit: string;
}

export interface PreparationStepItem {
    step: number;
    instruction: string;
}

export interface Preparation {
    steps: PreparationStepItem[];
    tips?: string[];
    preparationVideoUrl?: string;
}

// Align types with raw material nutrition structure
export interface RecipeNutritionVitamins {
    vitaminA?: number | null;
    vitaminB?: number | null;
    vitaminC?: number | null;
    vitaminD?: number | null;
    vitaminE?: number | null;
    vitaminK?: number | null;
}

export interface RecipeNutritionMinerals {
    calcium?: number | null;
    iron?: number | null;
    magnesium?: number | null;
    potassium?: number | null;
    zinc?: number | null;
}

export interface Nutrition {
    calories?: number | null;
    protein?: number | null;
    carbohydrate?: number | null;
    fat?: number | null;
    fiber?: number | null;
    sugar?: number | null;
    sodium?: number | null;
    vitamins?: RecipeNutritionVitamins;
    minerals?: RecipeNutritionMinerals;
}

export interface Media {
    coverImage?: string | null;
    gallery?: string[];
    videoUrl?: string[];
}

export interface RawMaterialReference {
    id: string;
    name: string;
}

export interface ScalingDriver {
    id: string;
    type: string;
    name: string;
    baseQuantity: string;
    unit: string;
    isRequired: boolean;
    isActive: boolean;
    rawMaterial: RawMaterialReference;
}

export interface Recipe {
    // _id: string;
    id?: string;
    name: string;
    description: string;
    categoryId: string; // ref RecipeCategory
    cuisine?: string;
    difficulty: RecipeDifficulty | string;
    servings?: number;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    status: RecipeStatus | string;
    ingredients: RecipeIngredient[];
    preparation: Preparation;
    nutrition?: Nutrition;
    media?: Media;
    scalingDrivers?: ScalingDriver[];
    createdBy?: string;
    updatedBy?: string;
    createdAt: string;
    updatedAt: string;
}


export interface RecipeCreateDto extends Omit<Recipe, "_id" | "createdAt" | "updatedAt" | "updatedBy" | "createdBy"> { }

export interface RecipeFilters {
    search?: string;
    status?: RecipeStatus | string;
    categoryId?: string;
    difficulty?: RecipeDifficulty | string;
    page?: number;
    limit?: number;
    sortBy?: keyof Recipe;
    sortOrder?: "asc" | "desc";
}

export interface RecipeMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface RecipesResponse {
    success: boolean;
    message: string;
    items: Recipe[];
    meta: RecipeMeta;
}

const ingredientsSchema = z.array(z.object({
    isScalable: z.boolean().default(true),
    materialId: z.string().min(1, "Raw material is required"),
    quantity: z.number().min(0.01, "Quantity is required"),
    unit: z.string().min(1, "Unit is required"),
}));

const preparationSchema = z.object({
    steps: z.array(z.object({
        step: z.number().min(1),
        instruction: z.string().min(2),
    })).min(1, "At least one preparation step is required"),
    tips: z.array(z.string()).default([]),
    preparationVideoUrl: z.string().url().optional(),
});

// Align recipe nutrition schema structure with raw-material nutrition
const recipeVitaminsSchema = z.object({
    vitaminA: z.number().nullable().optional(),
    vitaminB: z.number().nullable().optional(),
    vitaminC: z.number().nullable().optional(),
    vitaminD: z.number().nullable().optional(),
    vitaminE: z.number().nullable().optional(),
    vitaminK: z.number().nullable().optional(),
});

const recipeMineralsSchema = z.object({
    calcium: z.number().nullable().optional(),
    iron: z.number().nullable().optional(),
    magnesium: z.number().nullable().optional(),
    potassium: z.number().nullable().optional(),
    zinc: z.number().nullable().optional(),
});

const nutritionSchema = z.object({
    calories: z.number().nullable().optional(),
    protein: z.number().nullable().optional(),
    carbohydrate: z.number().nullable().optional(),
    fat: z.number().nullable().optional(),
    fiber: z.number().nullable().optional(),
    sugar: z.number().nullable().optional(),
    sodium: z.number().nullable().optional(),
    vitamins: recipeVitaminsSchema.optional(),
    minerals: recipeMineralsSchema.optional(),
}).default({});

const mediaSchema = z.object({
    coverImage: z.string().trim().min(1, "Cover image is required").optional(),
    gallery: z.array(z.string().trim().min(1, "Image path is required")).optional(),
    videoUrl: z.array(z.string().trim().min(1, "Video path is required")).optional(),
}).default({ coverImage: "", gallery: [], videoUrl: [] });

const scalingDriverSchema = z.array(z.object({
    id: z.string().min(1, "Scaling driver ID is required"),
    type: z.string().min(1, "Type is required"),
    name: z.string().min(1, "Name is required"),
    baseQuantity: z.string().min(1, "Base quantity is required"),
    unit: z.string().min(1, "Unit is required"),
    isRequired: z.boolean().default(false),
    isActive: z.boolean().default(true),
    rawMaterial: z.object({
        id: z.string().min(1, "Material ID is required"),
        name: z.string().min(1, "Material name is required"),
    }),
})).optional();

export const createRecipeSchema = z.object({
    name: z.string().min(2, "Recipe name is required"),
    description: z.string().min(5, "Description is required"),
    categoryId: z.string().min(1, "Category is required"),
    cuisine: z.string().optional(),
    difficulty: z.union([z.enum(RECIPE_DIFFICULTIES), z.string()]),
    servings: z.number().min(1).optional(),
    prepTimeMinutes: z.number().min(0).optional(),
    cookTimeMinutes: z.number().min(0).optional(),
    status: z.union([z.enum(RECIPE_STATUSES), z.string()]).default("active"),
    ingredients: ingredientsSchema.min(1, "At least one ingredient is required"),
    preparation: preparationSchema,
    nutrition: nutritionSchema,
    media: mediaSchema,
    scalingDrivers: scalingDriverSchema,
});
export type CreateRecipeSchema = z.infer<typeof createRecipeSchema>;

export const stepFieldsRecipe: Record<string, (keyof CreateRecipeSchema | string)[]> = {
    basic: ["name", "description", "categoryId", "difficulty"],
    ingredients: ["ingredients"],
    preparation: ["preparation"],
    nutrition: [],
    media: ["media.coverImage", "media.gallery", "media.videoUrl"],
};

export const editRecipeSchema = createRecipeSchema.extend({
    _id: z.string(),
    id: z.string().optional(),
});
export type EditRecipeSchema = z.infer<typeof editRecipeSchema>;

// Recipe form state for create/edit
export interface RecipeFormStateZ {
    createRecipeForm: Partial<CreateRecipeSchema>;
    editRecipeForm: Partial<EditRecipeSchema>;

    setCreateRecipeForm: (data: Partial<CreateRecipeSchema>) => void;
    resetCreateRecipeForm: () => void;

    setEditRecipeForm: (data: Partial<EditRecipeSchema>) => void;
    resetEditRecipeForm: () => void;
}
