import { z } from "zod";
import { ApiResponse, PaginatedResponse } from "./common.type";

// ---------------------------
// Nested Types
// ---------------------------

export interface IUser {
    _id: string;
    email: string;
    phoneNumber: string;
    password?: string;
    role: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isActive: boolean;
    fcmToken?: string | null;
    specializations?: string[];
    serviceAreas?: string[];
    refreshToken?: string;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
}

export interface INearby {
    resource: string;
    distance?: string;
    _id?: string;
}

export interface ITag {
    text: string;
    variant: string;
    iconUrl?: string;
    _id?: string;
}

export interface IOffer {
    text?: string;
    variant?: string;
    description?: string;
    _id?: string;
}

// ---------------------------
// Enums & Option Lists
// ---------------------------

export const PROPERTY_TYPES = [
    "Residential",
    "Commercial",
    "Industrial",
    "Farm Land",
] as const;
export type PropertyType = typeof PROPERTY_TYPES[number];

export const PROPERTY_PURPOSES = [
    "Sale",
    "Rent",
    "Lease",
    "Purchase",
] as const;
export type PropertyPurpose = typeof PROPERTY_PURPOSES[number];

export const PROPERTY_STATUSES = [
    "Ready to move",
    "Under Construction",
] as const;
export type PropertyStatus = typeof PROPERTY_STATUSES[number];

export const BHK_CONFIGURATIONS = [
    "studio",
    "1bhk",
    "1.5bhk",
    "2bhk",
    "2.5bhk",
    "3bhk",
    "3.5bhk",
    "4bhk",
    "4.5bhk",
    "5bhk",
    "6bhk",
    "villa",
] as const;
export type BhkConfiguration = typeof BHK_CONFIGURATIONS[number];

export const FURNISHING_STATUSES = [
    "Fully Furnished",
    "Semi Furnished",
    "Unfurnished",
] as const;
export type FurnishingStatus = typeof FURNISHING_STATUSES[number];

// ---------------------------
// Validation Schemas (Zod)
// ---------------------------

const nearbySchema = z.object({
    resource: z.string().min(1, "Resource is required"),
    distance: z.string().optional(),
});

const tagSchema = z.object({
    text: z.string().min(1, "Tag text is required"),
    variant: z.string().min(1, "Variant is required"),
    iconUrl: z.string().url().optional(),
});

const offerSchema = z.object({
    text: z.string().optional(),
    variant: z.string().optional(),
    description: z.string().optional(),
});

export const createPropertySchema = z.object({
    listingId: z.string().optional(),
    thumbnail: z.string().optional(),
    propertyTitle: z.string().min(1, "Property title is required"),
    propertyDescription: z.string().optional(),
    propertyOwner: z.string().optional(),
    ownerNumber: z.string().optional(),
    propertyExecutive: z.string().optional(),
    // Allow "" from select placeholders, transform to undefined
    propertyType: z.union([z.enum(PROPERTY_TYPES), z.literal("")]).optional(),
    propertyPurpose: z.union([z.enum(PROPERTY_PURPOSES), z.literal("")]).optional(),
    propertyStatus: z.union([z.enum(PROPERTY_STATUSES), z.literal("")]).optional(),
    propertyLabel: z.string().optional(),
    nearby: z.array(nearbySchema).optional(),
    propertyCategory: z.string().optional(),
    bhkConfiguration: z.union([z.enum(BHK_CONFIGURATIONS), z.literal("")]).optional(),
    furnishingStatus: z.union([z.enum(FURNISHING_STATUSES), z.literal("")]).optional(),
    propertyAge: z.number().optional(),
    propertyAgeMonth: z.number().optional(),
    totalArea: z.number().optional(),
    carpetArea: z.number().optional(),
    balconyCount: z.number().optional(),
    bathroomCount: z.number().optional(),
    bedCount: z.number().optional(),
    parkingCount: z.number().optional(),
    floorNumber: z.number().optional(),
    totalFloors: z.number().optional(),
    facingDirection: z.string().optional(),
    amenities: z.array(z.string()).optional(),
    facilities: z.array(z.string()).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    region: z.string().optional(),
    landmark: z.string().optional(),
    roadDistance: z.number().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    country: z.string().optional(),
    pinCode: z.string().optional(),
    price: z.number().optional(),
    pricePerUnit: z.number().optional(),
    maintenanceCharge: z.number().optional(),
    deposit: z.number().optional(),
    totalPrice: z.number().optional(),
    images: z.array(z.string()).optional(),
    videoLink: z.string().url().optional().or(z.literal("")),
    floorPlan: z.string().optional(),
    masterPlan: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.array(z.string()).optional(),
    washroomFor: z.string().optional(),
    plotType: z.string().optional(),
    pgAvailableFor: z.string().optional(),
    status: z.string().optional(),
    builderId: z.string().optional(),
    projectId: z.string().optional(),
    tags: z.array(tagSchema).optional(),
    offers: z.array(offerSchema).optional(),
    featured: z.boolean().optional(),
    customer: z.string().optional(),
    views: z.number().optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertySchema = z.infer<typeof createPropertySchema>;
export type UpdatePropertySchema = z.infer<typeof updatePropertySchema>;

// ---------------------------
// Interfaces
// ---------------------------

export interface IProperty {
    _id: string;
    listingId?: string;
    thumbnail?: string;
    propertyTitle: string;
    propertyDescription?: string;
    propertyOwner?: string;
    ownerNumber?: string;
    propertyExecutive?: string;
    propertyType?: PropertyType;
    propertyPurpose?: PropertyPurpose;
    propertyStatus?: PropertyStatus;
    propertyLabel?: string;
    nearby?: INearby[];
    propertyCategory?: string;
    bhkConfiguration?: BhkConfiguration;
    furnishingStatus?: FurnishingStatus;
    propertyAge?: number;
    propertyAgeMonth?: number;
    totalArea?: number;
    carpetArea?: number;
    balconyCount?: number;
    bathroomCount?: number;
    bedCount?: number;
    parkingCount?: number;
    floorNumber?: number;
    totalFloors?: number;
    facingDirection?: string;
    amenities?: string[];
    facilities?: string[];
    address?: string;
    city?: string;
    state?: string;
    region?: string;
    landmark?: string;
    roadDistance?: number;
    latitude?: number;
    longitude?: number;
    country?: string;
    pinCode?: string;
    price?: number;
    pricePerUnit?: number;
    maintenanceCharge?: number;
    deposit?: number;
    totalPrice?: number;
    images?: string[];
    videoLink?: string;
    floorPlan?: string;
    masterPlan?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    washroomFor?: string;
    plotType?: string;
    pgAvailableFor?: string;
    status?: string;
    builderId?: IUser | string | null;
    projectId?: string | null;
    ownerId?: string;
    customer?: string | null;
    tags?: ITag[];
    offers?: IOffer[];
    featured?: boolean;
    createdBy?: IUser | string;
    updatedBy?: IUser | string;
    approvalStatus?: string;
    views?: number;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

// CRUD DTOs
export interface CreatePropertyDto {
    listingId?: string;
    thumbnail?: string;
    propertyTitle: string;
    propertyDescription?: string;
    propertyOwner?: string;
    ownerNumber?: string;
    propertyExecutive?: string;
    propertyType?: PropertyType;
    propertyPurpose?: PropertyPurpose;
    propertyStatus?: PropertyStatus;
    propertyLabel?: string;
    nearby?: INearby[];
    propertyCategory?: string;
    bhkConfiguration?: BhkConfiguration;
    furnishingStatus?: FurnishingStatus;
    propertyAge?: number;
    propertyAgeMonth?: number;
    totalArea?: number;
    carpetArea?: number;
    balconyCount?: number;
    bathroomCount?: number;
    bedCount?: number;
    parkingCount?: number;
    floorNumber?: number;
    totalFloors?: number;
    facingDirection?: string;
    amenities?: string[];
    facilities?: string[];
    address?: string;
    city?: string;
    state?: string;
    region?: string;
    landmark?: string;
    roadDistance?: number;
    latitude?: number;
    longitude?: number;
    country?: string;
    pinCode?: string;
    price?: number;
    pricePerUnit?: number;
    maintenanceCharge?: number;
    deposit?: number;
    totalPrice?: number;
    images?: string[];
    videoLink?: string;
    floorPlan?: string;
    masterPlan?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    washroomFor?: string;
    plotType?: string;
    pgAvailableFor?: string;
    status?: string;
    builderId?: string;
    projectId?: string;
    tags?: ITag[];
    offers?: IOffer[];
    featured?: boolean;
    customer?: string;
    views?: number;
}

export interface UpdatePropertyDto {
    listingId?: string;
    thumbnail?: string;
    propertyTitle?: string;
    propertyDescription?: string;
    propertyOwner?: string;
    ownerNumber?: string;
    propertyExecutive?: string;
    propertyType?: PropertyType;
    propertyPurpose?: PropertyPurpose;
    propertyStatus?: PropertyStatus;
    propertyLabel?: string;
    nearby?: INearby[];
    propertyCategory?: string;
    bhkConfiguration?: BhkConfiguration;
    furnishingStatus?: FurnishingStatus;
    propertyAge?: number;
    propertyAgeMonth?: number;
    totalArea?: number;
    carpetArea?: number;
    balconyCount?: number;
    bathroomCount?: number;
    bedCount?: number;
    parkingCount?: number;
    floorNumber?: number;
    totalFloors?: number;
    facingDirection?: string;
    amenities?: string[];
    facilities?: string[];
    address?: string;
    city?: string;
    state?: string;
    region?: string;
    landmark?: string;
    roadDistance?: number;
    latitude?: number;
    longitude?: number;
    country?: string;
    pinCode?: string;
    price?: number;
    pricePerUnit?: number;
    maintenanceCharge?: number;
    deposit?: number;
    totalPrice?: number;
    images?: string[];
    videoLink?: string;
    floorPlan?: string;
    masterPlan?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    washroomFor?: string;
    plotType?: string;
    pgAvailableFor?: string;
    status?: string;
    builderId?: string;
    projectId?: string;
    tags?: ITag[];
    offers?: IOffer[];
    featured?: boolean;
    customer?: string;
    views?: number;
}

export interface ListPropertiesQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    propertyType?: PropertyType;
    minPrice?: number;
    maxPrice?: number;
    builderId?: string;
    projectId?: string;
    status?: string;
    sortBy?: keyof IProperty | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
}

// Property-specific responses
export interface PropertyApiResponse {
    status: number;
    message: string;
    count: number;
    data: IProperty;
}

export type PropertyResponse = ApiResponse<IProperty>;

export interface PropertyPaginatedData {
    properties: IProperty[];
    totalProperties: number;
    totalPages: number;
    pageSize: number;
    pageNumber: number;
}

export interface PropertiesApiResponse {
    status: number;
    message: string;
    count: number;
    data: PropertyPaginatedData;
}

export type PropertiesListResponse = PaginatedResponse<IProperty>;

export interface DeletePropertyResponse {
    success: boolean;
    message?: string;
}

