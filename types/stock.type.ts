import { z } from "zod";

export interface Stock {
    id: string;
    itemName: string;
    category: StockCategory | string;
    currentStock: number;
    unit: string;
    location: string;
    status: StockStatus | string;
    unitPrice: number;
    totalValue: number;
    reorderThreshold: number;
    supplier?: string;
    lastRestocked?: string;
    expiryDate?: string;
    createdAt: string;
    updatedAt: string;

    // Additional details
    basicInfo?: StockBasicInfo;
    locationDetails?: StockLocationDetails;
    linkedRecipes?: LinkedRecipe[];
    purchaseHistory?: PurchaseHistory[];
    transferHistory?: TransferHistory[];
}

export interface StockBasicInfo {
    itemName: string;
    category: string;
    unitOfMeasure: string;
    packSize?: string;
    reorderThreshold: number;
    status: string;
}

export interface StockLocationDetails {
    storedAt: string;
    warehouse?: string;
    franchise?: string;
    managedBy: string;
}

export interface LinkedRecipe {
    recipeName: string;
    usagePerItem: number;
    unit: string;
    lastUsed?: string;
    status: string;
}

export interface PurchaseHistory {
    batchId: string;
    date: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    source: string;
    action: string;
}

export interface TransferHistory {
    fromLocation: string;
    toLocation: string;
    quantity: number;
    unit: string;
    date: string;
    status: string;
}

export enum StockCategory {
    INGREDIENT = "Ingredient",
    BEVERAGE_BASE = "Beverage Base",
    MIX = "Mix",
    SPICES = "Spices",
    PACKAGING = "Packaging",
    DAIRY = "Dairy",
    VEGETABLES = "Vegetables",
    MEAT = "Meat",
    FROZEN = "Frozen",
    DRY_GOODS = "Dry Goods",
}

export enum StockStatus {
    ACTIVE = "active",
    LOW_STOCK = "low_stock",
    OUT_OF_STOCK = "out_of_stock",
    EXPIRED = "expired",
    DISCONTINUED = "discontinued",
}

export interface StockFilters {
    search?: string;
    category?: StockCategory | string;
    status?: StockStatus | string;
    location?: string;
    page?: number;
    limit?: number;
    sortBy?: keyof Stock;
    sortOrder?: "asc" | "desc";
}

export interface StockMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface StocksResponse {
    success: boolean;
    message: string;
    stocks: Stock[];
    meta: StockMeta;
}

// Create Stock schema
export const createStockSchema = z.object({
    itemName: z.string().min(2, "Item name is required"),
    category: z.nativeEnum(StockCategory, { errorMap: () => ({ message: "Category is required" }) }).or(z.string()),
    currentStock: z.number().min(0, "Stock cannot be negative"),
    unit: z.string().min(1, "Unit is required"),
    location: z.string().min(2, "Location is required"),
    status: z.nativeEnum(StockStatus).optional().or(z.string()),
    unitPrice: z.number().min(0, "Price cannot be negative"),
    reorderThreshold: z.number().min(0, "Threshold cannot be negative"),
    supplier: z.string().optional(),
    expiryDate: z.string().optional(),

    basicInfo: z.object({
        itemName: z.string().min(2, "Item name is required"),
        category: z.string().optional(),
        unitOfMeasure: z.string().optional(),
        packSize: z.string().optional(),
        reorderThreshold: z.number().optional(),
        status: z.string().optional(),
    }).optional(),

    locationDetails: z.object({
        storedAt: z.string().optional(),
        warehouse: z.string().optional(),
        franchise: z.string().optional(),
        managedBy: z.string().optional(),
    }).optional(),
});
export type CreateStockSchema = z.infer<typeof createStockSchema>;

// Edit Stock schema
export const editStockSchema = createStockSchema.extend({
    id: z.string(),
});
export type EditStockSchema = z.infer<typeof editStockSchema>;
