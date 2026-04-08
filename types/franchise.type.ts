import { z } from "zod";

export interface Franchise {
    id: string;
    name: string;
    franchiseCode: string;
    ownerName: string;
    email: string;
    phone: string;
    status: FranchiseStatus | string;
    modelId?: string;
    modelName?: string;
    establishmentDate?: string;
    createdAt: string;
    updatedAt: string;

    // Basic Information
    basicInfo?: FranchiseBasicInfo;

    // Franchise Overview
    franchiseOverview?: FranchiseOverview;

    // Location & Infrastructure
    locationInfrastructure?: LocationInfrastructure;

    // Menu Setup
    menuSetup?: MenuSetup;

    // Staff Information
    staffInformation?: StaffInformation;

    // Stocks Details
    stocksDetails?: StocksDetails;

    // Order History
    orderHistory?: OrderHistory[];

    // Legal & Policy Documents
    legalPolicyDocuments?: LegalPolicyDocuments;
}

export interface FranchiseBasicInfo {
    franchiseName: string;
    ownersName: string;
    emailId: string;
    phoneNumber: string;
    status: string;
}

export interface FranchiseOverview {
    franchiseModel: string;
    groupCodeNumber: string;
    kitchenSize: string;
    franchiseFee: number;
    totalInvestment: number;
    monthlyRoyaltyFee: number;
    paymentFrequency: string;
    estimatedBreakEven: number;
    currentRevenue: number;
    locationAnalysis: string;
    marketSurvey: string;
    competitorAnalysis: string;
    keyNearbyLandmarks: string;
    targetCustomerBase: string;
    avgMonthlyOrders: number;
}

export interface LocationInfrastructure {
    location: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    minimumArea: number;
    seatingCapacity?: number;
    frontage: number;
    ceilingHeight: number;
    equipmentPurchases: string;
    equipmentStatus: string;
    equipmentLease: string;
}

export interface MenuSetup {
    menuName: string;
    selectedCuisines: string[];
    menuItems: MenuItem[];
    customizations: string;
}

export interface MenuItem {
    name: string;
    category: string;
    price: number;
    availability: boolean;
}

export interface StaffInformation {
    ownerName: string;
    kitchenManager: string;
    shifts: StaffShift[];
    totalStaffCount: number;
}

export interface StaffShift {
    shiftName: string;
    startTime: string;
    endTime: string;
    staffCount: number;
}

export interface StocksDetails {
    addStockItems: StockItem[];
    stockLevelStocks: StockLevel[];
    lastRestockedOn: string;
}

export interface StockItem {
    itemName: string;
    category: string;
    quantity: number;
    unit: string;
    price: number;
}

export interface StockLevel {
    itemName: string;
    currentLevel: number;
    minLevel: number;
    maxLevel: number;
}

export interface OrderHistory {
    orderId: string;
    orderDate: string;
    customerName: string;
    items: string[];
    total: number;
    status: string;
}

export interface LegalPolicyDocuments {
    agreementDate: string;
    agreementValidity: number;
    renewalPolicy: string;
    franchiseAgreement: string;
    complianceCertificate: string;
    exitAgreement: string;
    licenseDocuments: string[];
}

export enum FranchiseStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PENDING = "pending",
    SUSPENDED = "suspended",
    TERMINATED = "terminated",
}

export interface FranchiseFilters {
    search?: string;
    status?: FranchiseStatus | string;
    modelId?: string;
    city?: string;
    state?: string;
    page?: number;
    limit?: number;
    sortBy?: keyof Franchise;
    sortOrder?: "asc" | "desc";
}

export interface FranchiseMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface FranchisesResponse {
    success: boolean;
    message: string;
    data: Franchise[];
    meta: FranchiseMeta;
}

// Create Franchise schema
export const createFranchiseSchema = ({ minArea, seatingCapacity, staffRequired }: { minArea: number, seatingCapacity: number, staffRequired: number }) => z.object({
    name: z.string().min(2, "Franchise name is required"),
    franchiseCode: z.string().min(2, "Franchise code is required"),
    ownerName: z.string().min(2, "Owner name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(10, "Phone number is required"),
    status: z.nativeEnum(FranchiseStatus).optional(),
    modelId: z.string().optional(),
    establishmentDate: z.string().optional(),

    basicInfo: z.object({
        franchiseName: z.string().min(2, "Franchise name is required"),
        ownersName: z.string().min(2, "Owner name is required"),
        emailId: z.string().email("Invalid email"),
        phoneNumber: z.string().min(10, "Phone number is required"),
        status: z.string().optional(),
    }).optional(),

    franchiseOverview: z.object({
        franchiseModel: z.string().optional(),
        groupCodeNumber: z.string().optional(),
        kitchenSize: z.string().optional(),
        franchiseFee: z.number().optional(),
        totalInvestment: z.number().optional(),
        monthlyRoyaltyFee: z.number().optional(),
        paymentFrequency: z.string().optional(),
        estimatedBreakEven: z.number().optional(),
        currentRevenue: z.number().optional(),
        locationAnalysis: z.string().optional(),
        marketSurvey: z.string().optional(),
        competitorAnalysis: z.string().optional(),
        keyNearbyLandmarks: z.string().optional(),
        targetCustomerBase: z.string().optional(),
        avgMonthlyOrders: z.number().optional(),
    }).optional(),

    locationInfrastructure: z.object({
        location: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        minimumArea: z
            .number({
                required_error: "Total area is required",
                invalid_type_error: "Total area must be a number",
            })
            .min(minArea, `Total area must be at least ${minArea}`),

        frontage: z.number().optional(),
        ceilingHeight: z.number().optional(),
        equipmentPurchases: z.string().optional(),
        equipmentStatus: z.string().optional(),
        equipmentLease: z.string().optional(),
    }),

    menuSetup: z.object({
        menuName: z.string().optional(),
        selectedCuisines: z.array(z.string()).optional(),
        customizations: z.string().optional(),
    }).optional(),

    staffInformation: z.object({
        ownerName: z.string().optional(),
        kitchenManager: z.string().optional(),
        seatingCapacity: z.number({ invalid_type_error: "Seating capacity must be a number" }).min(seatingCapacity, `Seating capacity must be at least ${seatingCapacity}`),
        totalStaffCount: z.number({ invalid_type_error: "Total staff count must be a number" }).min(staffRequired, `Total staff count must be at least ${staffRequired}`),
    }).optional(),

    legalPolicyDocuments: z.object({
        agreementDate: z.string().optional(),
        agreementValidity: z.number().optional(),
        renewalPolicy: z.string().optional(),
        franchiseAgreement: z.string().optional(),
        complianceCertificate: z.string().optional(),
        exitAgreement: z.string().optional(),
    }).optional(),
});
export type CreateFranchiseSchema = z.infer<ReturnType<typeof createFranchiseSchema>>;

// Define step fields for multi-step validation
export const franchiseStepFields = {
    basic: ["name", "franchiseCode", "franchiseOverview.franchiseModel", "status"],
    location: ["locationInfrastructure.location", "locationInfrastructure.city", "locationInfrastructure.state", "locationInfrastructure.zipCode", "locationInfrastructure.minimumArea",],
    staff: ["staffInformation.kitchenManager", "staffInformation.totalStaffCount", "establishmentDate", "staffInformation.seatingCapacity"],
    menu: [], // No required fields for menu step
    legal: ["legalPolicyDocuments.agreementValidity", "legalPolicyDocuments.renewalPolicy"],
    review: [],
} as const;

// Edit Franchise schema
export const editFranchiseSchema = createFranchiseSchema({ minArea: 0, seatingCapacity: 0, staffRequired: 0 }).extend({
    id: z.string(),
});
export type EditFranchiseSchema = z.infer<typeof editFranchiseSchema>;

export interface FranchiseFormState {
    createFranchise: Record<string, any>;
    editFranchise: Record<string, any>;
    setCreateFranchiseForm: (data: Record<string, any>) => void;
    resetCreateFranchiseForm: () => void;
    setEditFranchiseForm: (data: Record<string, any>) => void;
    resetEditFranchiseForm: () => void;
}