export interface Offer {
    id: string;
    name: string;
    type: "Percentage" | "Flat" | "Combo" | "Coupon";
    description: string;
    discountValue: number;
    applicableScope: "Model" | "Franchise" | "Menu" | "Category";
    selectedModels?: string[];
    selectedFranchises?: string[];
    selectedMenuItems?: string[];
    selectedCategories?: string[];
    minimumOrderValue?: number;
    maxDiscountLimit?: number;
    autoApply: boolean;
    couponCode?: string;
    startDate: string;
    endDate: string;
    daysActive: string[];
    bannerImage?: string;
    displayText?: string;
    displayOrder?: number;
    visibility: "Featured" | "Hidden";
    status: "Active" | "Inactive";
    createdAt: string;
    updatedAt?: string;
    linkedMenuItems?: LinkedMenuItem[];
    linkedFranchises?: LinkedFranchise[];
    performanceMetrics?: PerformanceMetrics;
}

export interface LinkedMenuItem {
    menuItemName: string;
    model: string;
    franchise: string;
    basePrice: number;
    offerPrice: number;
    status: "Active" | "Inactive";
}

export interface LinkedFranchise {
    franchiseName: string;
    model: string;
    offerApplied: number;
    offerSales: number;
    status: "Active" | "Inactive";
}

export interface PerformanceMetrics {
    totalSales: number;
    avgDiscountGiven: number;
    totalOrders: number;
    topPerformingFranchise: string;
    offerROI: number;
}

export interface OfferFilters {
    status?: "Active" | "Inactive";
    type?: "Percentage" | "Flat" | "Combo" | "Coupon";
    search?: string;
}

export interface OfferFormData {
    name: string;
    type: "Percentage" | "Flat" | "Combo" | "Coupon";
    description: string;
    discountValue: number;
    applicableScope: "Model" | "Franchise" | "Menu" | "Category";
    selectedModels?: string[];
    selectedFranchises?: string[];
    selectedMenuItems?: string[];
    selectedCategories?: string[];
    minimumOrderValue?: number;
    maxDiscountLimit?: number;
    autoApply: boolean;
    couponCode?: string;
    startDate: string;
    endDate: string;
    daysActive: string[];
    bannerImage?: string;
    displayText?: string;
    displayOrder?: number;
    visibility: "Featured" | "Hidden";
    status: "Active" | "Inactive";
}

export interface OfferResponse {
    offers: Offer[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
}
