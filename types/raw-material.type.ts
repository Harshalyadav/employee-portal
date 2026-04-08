import { z } from "zod";

export const RAW_MATERIAL_CATEGORIES = [
    "vegetables",
    "fruits",
    "grains",
    "dairy",
    "meat",
    "seafood",
    "spices",
    "oils",
    "beverages",
    "others",
] as const;
export type RawMaterialCategory = typeof RAW_MATERIAL_CATEGORIES[number];

export const RAW_MATERIAL_STATUSES = ["active", "inactive"] as const;
export type RawMaterialStatus = typeof RAW_MATERIAL_STATUSES[number];

export const RAW_MATERIAL_PORTION_UNITS = [
    "ml",
    "g",
    "kg",
    "pieces",
    "teaspoon",
    "tablespoon",
] as const;
export type PortionUnit = typeof RAW_MATERIAL_PORTION_UNITS[number];

export const RAW_MATERIAL_BASE_UNITS = ["g", "ml", "piece"] as const;
export type BaseUnit = typeof RAW_MATERIAL_BASE_UNITS[number];

export const RAW_MATERIAL_DIETARY_TAGS = [
    "vegan",
    "vegetarian",
    "gluten-free",
    "keto",
    "halal",
    "organic",
] as const;
export type DietaryTag = typeof RAW_MATERIAL_DIETARY_TAGS[number];

export const RAW_MATERIAL_ALLERGENS = ["nuts", "dairy", "soy", "gluten", "eggs"] as const;
export type Allergen = typeof RAW_MATERIAL_ALLERGENS[number];

export interface NutritionVitamins {
    vitaminA?: number | null;
    vitaminB?: number | null;
    vitaminC?: number | null;
    vitaminD?: number | null;
    vitaminE?: number | null;
    vitaminK?: number | null;
}

export interface NutritionMinerals {
    calcium?: number | null;
    iron?: number | null;
    magnesium?: number | null;
    potassium?: number | null;
    zinc?: number | null;
}

export interface NutritionInfo {
    calories?: number | null;
    protein?: number | null;
    carbohydrate?: number | null;
    fat?: number | null;
    fiber?: number | null;
    sugar?: number | null;
    sodium?: number | null;
    vitamins?: NutritionVitamins;
    minerals?: NutritionMinerals;
}

export interface ConversionFactor {
    fromUnit: string;
    toUnit: string;
    factor: number;
}

export type ConversionFactors = ConversionFactor[];

export interface RawMaterial {
    _id: string;
    id?: string; // optional alias for compatibility with existing components
    name: string;
    materialName?: string; // optional legacy field
    category: RawMaterialCategory | string;
    status: RawMaterialStatus | string;
    description?: string | null;
    imageUrl?: string | null;
    portionSize?: number | null;
    portionUnit?: PortionUnit | string;
    nutrition?: NutritionInfo;
    nutritionalInfo?: NutritionInfo; // legacy alias for compatibility
    baseUnit?: BaseUnit | string;
    conversionFactors?: ConversionFactor[];

    dietaryTags?: (DietaryTag | string)[];
    allergens?: (Allergen | string)[];
    isSeasonal?: boolean;
    isDeleted?: boolean;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface RawMaterialFilters {
    search?: string;
    category?: RawMaterialCategory | string;
    status?: RawMaterialStatus | string;
    page?: number;
    limit?: number;
    sortBy?: keyof RawMaterial;
    sortOrder?: "asc" | "desc";
}

export interface RawMaterialMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface RawMaterialsResponse {
    success: boolean;
    message: string;
    items: RawMaterial[];
    pagination: RawMaterialMeta;
}

const vitaminsSchema = z.object({
    vitaminA: z.number().nullable().optional(),
    vitaminB: z.number().nullable().optional(),
    vitaminC: z.number().nullable().optional(),
    vitaminD: z.number().nullable().optional(),
    vitaminE: z.number().nullable().optional(),
    vitaminK: z.number().nullable().optional(),
});

const mineralsSchema = z.object({
    calcium: z.number().nullable().optional(),
    iron: z.number().nullable().optional(),
    magnesium: z.number().nullable().optional(),
    potassium: z.number().nullable().optional(),
    zinc: z.number().nullable().optional(),
});

const nutritionSchema = z
    .object({
        calories: z.number().nullable().optional(),
        protein: z.number().nullable().optional(),
        carbohydrate: z.number().nullable().optional(),
        fat: z.number().nullable().optional(),
        fiber: z.number().nullable().optional(),
        sugar: z.number().nullable().optional(),
        sodium: z.number().nullable().optional(),
        vitamins: vitaminsSchema.optional(),
        minerals: mineralsSchema.optional(),
    })
    .optional();

const conversionFactorSchema = z.object({
    fromUnit: z.string().min(1, "From unit is required"),
    toUnit: z.string().min(1, "To unit is required"),
    factor: z.number().min(0, "Factor must be a positive number"),
});

const conversionFactorsSchema = z.array(conversionFactorSchema).optional();

// Create Raw Material schema
export const createRawMaterialSchema = z.object({
    name: z.string().min(1, "Name is required"),
    materialName: z.string().optional(),
    category: z.union([z.enum(RAW_MATERIAL_CATEGORIES), z.string()]),
    status: z.union([z.enum(RAW_MATERIAL_STATUSES), z.string()]).default("active"),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    portionSize: z.number().min(0).optional(),
    portionUnit: z.union([z.enum(RAW_MATERIAL_PORTION_UNITS), z.string()]).optional(),
    nutrition: nutritionSchema,
    baseUnit: z.union([z.enum(RAW_MATERIAL_BASE_UNITS), z.string()]).optional(),
    conversionFactors: conversionFactorsSchema,
    dietaryTags: z.array(z.union([z.enum(RAW_MATERIAL_DIETARY_TAGS), z.string()])).optional(),
    allergens: z.array(z.union([z.enum(RAW_MATERIAL_ALLERGENS), z.string()])).optional(),
    isSeasonal: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
export type CreateRawMaterialSchema = z.infer<typeof createRawMaterialSchema>;

// Edit Raw Material schema
export const editRawMaterialSchema = createRawMaterialSchema.partial().extend({
    _id: z.string(),
    id: z.string().optional(),
});
export type EditRawMaterialSchema = z.infer<typeof editRawMaterialSchema>;
