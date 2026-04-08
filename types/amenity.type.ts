import { z } from "zod";
import { ApiResponse, PaginatedResponse } from "./common.type";

// ---------------------------
// Validation Schemas (Zod)
// ---------------------------

export const createAmenitySchema = z.object({
    name: z
        .string({ required_error: 'Name is required' })
        .min(1, 'Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name is too long'),
    description: z
        .string()
        .optional(),
    iconImage: z
        .string({ required_error: 'Icon image is required' })
        .url('Enter a valid image URL'),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
});

export const updateAmenitySchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name is too long')
        .optional(),
    description: z
        .string()
        .optional(),
    iconImage: z
        .string()
        .url('Enter a valid image URL')
        .optional(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
});

export type CreateAmenitySchema = z.infer<typeof createAmenitySchema>;
export type UpdateAmenitySchema = z.infer<typeof updateAmenitySchema>;

// ---------------------------
// Interfaces
// ---------------------------

export interface IAmenity {
    _id: string;
    name: string;
    description?: string;
    iconImage: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

// CRUD DTOs
export interface CreateAmenityDto {
    name: string;
    description?: string;
    iconImage: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface UpdateAmenityDto {
    name?: string;
    description?: string;
    iconImage?: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface ListAmenitiesQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: keyof IAmenity | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
}

// Amenity-specific responses
export type AmenityResponse = ApiResponse<IAmenity>;

export interface AmenitiesListResponse {
    status: number;
    message: string;
    count: number;
    data: {
        amenities: IAmenity[];
    };
}

export interface DeleteAmenityResponse {
    success: boolean;
    message?: string;
}
