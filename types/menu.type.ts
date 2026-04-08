import { z } from "zod";

/* ====================================================
 * ENUMS & CONSTANT TYPES
 * ====================================================*/

// How the menu item is prepared / served
export const MENU_TYPES = ["ready_to_serve", "made_to_order"] as const;
export type MenuType = typeof MENU_TYPES[number];

// Defines where this menu is applicable
export const MENU_FOR = ["model", "franchise"] as const;
export type MenuFor = typeof MENU_FOR[number];

// Menu status lifecycle
export const MENU_STATUSES = ["active", "inactive"] as const;
export type MenuStatus = typeof MENU_STATUSES[number];

// Modifier source type
export const MODIFIER_SOURCE_TYPES = ["rawMaterial", "recipe"] as const;
export type ModifierSourceType = typeof MODIFIER_SOURCE_TYPES[number];


/* ====================================================
 * MAIN MENU ENTITY
 * ====================================================*/

export interface Menu {
    _id?: string;  // MongoDB ID
    id?: string;   // Optional alias for ORM / API compatibility

    /* ---------------- BASIC DETAILS ---------------- */
    name: string;                 // Menu name (e.g. "Manchow Soup")
    description?: string;         // Optional description
    type: MenuType;               // ready_to_serve / made_to_order
    category: string;             // Soups, Desserts, Beverages

    /* ---------------- MENU VISIBILITY ----------------
     * Determines whether the menu is applicable
     * to franchise models or individual franchises
     */
    menuFor: MenuFor;

    // Used only if menuFor === "model"
    associatedModelIds?: string[] | null;

    // Used only if menuFor === "franchise"
    associatedFranchiseIds?: string[] | null;

    /* ---------------- STATUS FLAGS ---------------- */
    status: MenuStatus;           // active / inactive
    isDeleted: boolean;           // Soft delete flag

    /* ---------------- MENU COMPOSITION ---------------- */
    recipes: MenuRecipeItem[];    // Recipes used to prepare this menu
    modifiers?: MenuModifier[];   // Optional add-ons / customizations
    variants?: MenuVariant[];     // Size/portion variants

    /* ---------------- PRICING ---------------- */
    basePricing: BasePricing;     // Default menu pricing
    customPricing?: CustomPricing[]; // Pricing override per model / franchise

    /* ---------------- MEDIA ---------------- */
    mediaInfo?: MenuMedia;

    /* ---------------- AUDIT ---------------- */
    createdBy?: string;
    updatedBy?: string;
    createdAt: string;
    updatedAt: string;
}


/* ====================================================
 * MENU → RECIPE MAPPING
 * ====================================================*/

/*
 * Defines how a recipe is used in the menu.
 * Quantity here is FIXED for the menu.
 */
export interface MenuRecipeItem {
    recipeId: string;   // Reference to Recipe entity
    quantity: number;   // Quantity used
    unit: string;       // bowl, plate, gram
    cost?: number;      // Internal cost contribution
}


/* ====================================================
 * MODIFIERS (ADD-ONS)
 * ====================================================*/

/*
 * Modifier group (e.g. "Extra Add-ons")
 */
export interface MenuModifier {
    name: string;                   // Group name
    required: boolean;              // Must user select at least one?
    type: ModifierSourceType;        // rawMaterial or recipe

    // Exactly ONE of the following is used (applies to all options in this group)
    rawMaterialId?: string;         // If this modifier group is based on raw material
    recipeId?: string;              // If this modifier group is based on recipe

    options: ModifierOption[];       // Individual modifier choices
}

/*
 * Individual modifier option
 * IMPORTANT:
 * - Pricing is for ONE UNIT ONLY
 * - Quantity can be selected during ORDER
 */
export interface ModifierOption {
    label: string;                  // "Extra Cup Soup"
    quantity: number;               // Base quantity for this option (e.g., 1 cup, 2 pieces)
    unit: string;                   // cup, bowl, gram

    /* -------- UNIT PRICING --------
     * Price for ONE UNIT ONLY
     */
    unitPricing: ModifierUnitPricing;
}


/* ====================================================
 * VARIANTS (SIZE/PORTIONS)
 * ====================================================*/

/*
 * Menu variant (e.g., Small, Medium, Large)
 * Variants are different sizes/portions of the same menu item
 */
export interface MenuVariant {
    id?: string;                            // Unique identifier
    label: string;                          // Display label (e.g., "Large", "Extra Large")
    type: string;                           // Variant type (e.g., "size", "portion")
    recipeScalingDriverId?: string;         // Reference to scaling driver (UUID)
    driverValue?: number;                   // Scaling multiplier (e.g., 2 for double portion)
    unit: string;                           // Unit (e.g., "portion", "piece")
    pricing: {
        baseCost: number;                   // Cost override for this variant
        sellPrice?: number;                 // Sell price override
        finalPrice?: number;                // Final price override
    };
    isDefault: boolean;                     // Is this the default variant?
    isActive: boolean;                      // Is this variant available?
}


/* ====================================================
 * PRICING STRUCTURES
 * ====================================================*/

/*
 * Default pricing for menu
 */
export interface BasePricing {
    baseCost: number;               // Internal cost
    sellPrice: number;              // Base selling price
    taxInfo?: TaxInfo;              // Tax breakdown
    finalPrice: number;             // sellPrice + tax
    profitMargin?: number;          // Percentage
}

/*
 * Menu pricing override
 */
export interface CustomPricing {
    appliesTo: "model" | "franchise";
    modelId?: string;
    franchiseId?: string;
    pricing: Partial<BasePricing>;
}

/*
 * Modifier pricing for ONE unit
 */
export interface ModifierUnitPricing {
    unitCost: number;               // Cost of one unit
    unitSellPrice: number;          // Selling price of one unit
    taxInfo?: TaxInfo;
    unitFinalPrice: number;         // Final price of one unit
    profitMargin?: number;
}

/*
 * Modifier pricing override (per unit)
 */
export interface ModifierCustomPricing {
    appliesTo: "model" | "franchise";
    modelId?: string;
    franchiseId?: string;
    pricing: Partial<ModifierUnitPricing>;
}


/* ====================================================
 * TAX STRUCTURE
 * ====================================================*/

export interface TaxInfo {
    taxType?: string;        // GST, VAT
    taxPercentage?: number; // 5, 12, 18
    taxAmount?: number;
}


/* ====================================================
 * MEDIA
 * ====================================================*/

export interface MenuMedia {
    thumbnail?: string | null;
    images?: string[];
    videos?: string[];
}


/* ====================================================
 * API REQUEST/RESPONSE TYPES
 * ====================================================*/

export interface MenuFilters {
    search?: string;
    category?: string;
    type?: MenuType;
    status?: MenuStatus;
    menuFor?: MenuFor;
    modelId?: string;
    franchiseId?: string;
    page?: number;
    limit?: number;
    sortBy?: keyof Menu;
    sortOrder?: "asc" | "desc";
}

export interface MenuMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface MenusResponse {
    success: boolean;
    message: string;
    items: Menu[];
    meta: MenuMeta;
}


/* ====================================================
 * VALIDATION SCHEMAS (Zod)
 * ====================================================*/

// MenuRecipeItem schema
export const menuRecipeItemSchema = z.object({
    recipeId: z.string().min(1, "Recipe ID is required"),
    quantity: z.number().positive("Quantity must be positive"),
    unit: z.string().min(1, "Unit is required"),
    cost: z.number().optional(),
});

// ModifierOption schema
export const modifierOptionSchema = z.object({
    label: z.string().min(1, "Label is required"),
    quantity: z.number().positive("Quantity must be positive"),
    unit: z.string().min(1, "Unit is required"),
    unitPricing: z.object({
        unitCost: z.number().min(0),
        unitSellPrice: z.number().min(0),
        taxInfo: z.object({
            taxType: z.string().optional(),
            taxPercentage: z.number().optional(),
            taxAmount: z.number().optional(),
        }).optional(),
        unitFinalPrice: z.number().min(0),
        profitMargin: z.number().optional(),
    }),
});

// MenuVariant schema
export const menuVariantSchema = z.object({
    id: z.string().optional(),
    label: z.string().min(1, "Variant label is required"),
    type: z.string().min(1, "Variant type is required"),
    recipeScalingDriverId: z.string().optional(),
    driverValue: z.number().min(0, "Driver value must be non-negative").optional(),
    unit: z.string().min(1, "Unit is required"),
    pricing: z.object({
        baseCost: z.number().min(0, "Base cost must be non-negative"),
        sellPrice: z.number().optional(),
        finalPrice: z.number().optional(),
    }),
    isDefault: z.boolean(),
    isActive: z.boolean(),
});

// MenuModifier schema
export const menuModifierSchema = z.object({
    name: z.string().min(1, "Modifier name is required"),
    required: z.boolean(),
    type: z.enum(MODIFIER_SOURCE_TYPES),
    rawMaterialId: z.string().optional(),
    recipeId: z.string().optional(),
    options: z.array(modifierOptionSchema).min(1, "At least one option is required for this modifier"),
}).superRefine((data, ctx) => {
    if (data.type === "rawMaterial") {
        if (!data.rawMaterialId || data.rawMaterialId.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please select a raw material",
                path: ["rawMaterialId"],
            });
        }
    }
    if (data.type === "recipe") {
        if (!data.recipeId || data.recipeId.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please select a recipe",
                path: ["recipeId"],
            });
        }
    }
});

// BasePricing schema
export const basePricingSchema = z.object({
    baseCost: z.number().min(0, "Base cost must be positive"),
    sellPrice: z.number().min(0, "Sell price must be positive"),
    taxInfo: z.object({
        taxType: z.string().optional(),
        taxPercentage: z.number().optional(),
        taxAmount: z.number().optional(),
    }).optional(),
    finalPrice: z.number().min(0),
    profitMargin: z.number().optional(),
});

// CustomPricing schema
export const customPricingSchema = z.object({
    appliesTo: z.enum(["model", "franchise"]),
    modelId: z.string().optional(),
    franchiseId: z.string().optional(),
    pricing: z.object({
        baseCost: z.number().optional(),
        sellPrice: z.number().optional(),
        taxInfo: z.object({
            taxType: z.string().optional(),
            taxPercentage: z.number().optional(),
            taxAmount: z.number().optional(),
        }).optional(),
        finalPrice: z.number().optional(),
        profitMargin: z.number().optional(),
    }),
});

// MenuMedia schema
export const menuMediaSchema = z.object({
    thumbnail: z.string().nullable().optional(),
    images: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
});

// Create Menu schema
export const createMenuSchema = z.object({
    name: z.string().min(2, "Menu name is required"),
    description: z.string().optional(),
    type: z.enum(MENU_TYPES, { required_error: "Menu type is required" }),
    category: z.string().min(1, "Category is required"),
    menuFor: z.enum(MENU_FOR, { required_error: "Menu for is required" }),
    associatedModelIds: z.array(z.string()).optional().nullable(),
    associatedFranchiseIds: z.array(z.string()).optional().nullable(),
    status: z.enum(MENU_STATUSES).default("active"),
    isDeleted: z.boolean().default(false),
    recipes: z.array(menuRecipeItemSchema).min(1, "At least one recipe is required"),
    modifiers: z.array(menuModifierSchema).optional(),
    variants: z.array(menuVariantSchema).min(1, "At least one variant is required"),
    basePricing: basePricingSchema,
    customPricing: z.array(customPricingSchema).optional(),
    mediaInfo: menuMediaSchema.optional(),
    createdBy: z.string().optional(),
});

export type CreateMenuSchema = z.infer<typeof createMenuSchema>;

// Edit Menu schema
export const editMenuSchema = createMenuSchema.extend({
    _id: z.string(),
    updatedBy: z.string().optional(),
});

export type EditMenuSchema = z.infer<typeof editMenuSchema>;


///* ====================================================
// * ZUSTAND STATE TYPE
// * ====================================================*/

// Model form state for create/edit
export interface MenuFormStateZ {
    createMenu: Partial<CreateMenuSchema>;
    editMenu: Partial<EditMenuSchema>;

    setCreateMenuForm: (data: Partial<CreateMenuSchema>) => void;
    resetCreateMenuForm: () => void;

    setEditMenuForm: (data: Partial<EditMenuSchema>) => void;
    resetEditMenuForm: () => void;
}