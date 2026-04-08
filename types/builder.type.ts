import { z } from "zod";
import { ApiResponse, PaginatedResponse, UserRole } from "./common.type";

// ---------------------------
// Validation Schemas (Zod)
// ---------------------------

export const createBuilderSchema = z.object({
    name: z
        .string({ required_error: 'Name is required' })
        .min(1, 'Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name is too long'),
    email: z
        .string({ required_error: 'Email is required' })
        .min(1, 'Email is required')
        .email('Enter a valid email'),
    phoneNumber: z
        .string({ required_error: 'Phone number is required' })
        .min(1, 'Phone number is required')
        .regex(/^\+?[1-9]\d{1,14}$/, 'Enter a valid phone number'),
    password: z
        .string({ required_error: 'Password is required' })
        .min(4, 'Password must be at least 4 characters')
        .max(128, 'Password is too long'),
    role: z
        .enum(['agent', 'builder', 'admin'] as const, {
            required_error: 'Role is required',
            invalid_type_error: 'Invalid role selected'
        }),
    fcmToken: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    company: z.string().optional(),
    logo: z.string().url().optional().or(z.literal('')),
});

export type CreateBuilderSchema = z.infer<typeof createBuilderSchema>;

// ---------------------------
// Interfaces
// ---------------------------

export interface IBuilderProfile {
    _id?: string;
    userId?: string;
    companyName?: string;
    totalProjects?: number;
    ongoingProjects?: number;
    completedProjects?: number;
    address?: {
        city?: string;
        state?: string;
    };
    contactPerson?: string;
    isVerified?: boolean;
    rating?: number;
    certifications?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface IBuilder {
    _id?: string;
    id?: string;
    userId?: string;
    email?: string;
    phoneNumber?: string;
    role?: UserRole;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    isActive?: boolean;
    fcmToken?: string | null;
    specializations?: string[];
    serviceAreas?: string[];
    lastLoginAt?: string;
    profile?: IBuilderProfile;
    createdAt?: string;
    updatedAt?: string;
    // Legacy fields for backwards compatibility
    name?: string;
    password?: string;
    city?: string;
    state?: string;
    company?: string;
    logo?: string;
    address?: string;
}

// CRUD DTOs
export interface CreateBuilderDto {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: UserRole;
    fcmToken?: string;
    city?: string;
    state?: string;
    company?: string;
    logo?: string;
}

export interface UpdateBuilderDto {
    id: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    role?: UserRole;
    fcmToken?: string;
    city?: string;
    state?: string;
    company?: string;
    logo?: string;
    address?: string;
}

export interface ListBuildersQueryDto {
    page?: number;
    limit?: number;
    search?: string; // fuzzy search across name, phone, email
    sortBy?: keyof IBuilder | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
}

// Builder-specific responses
export type BuilderResponse = ApiResponse<IBuilder>;
export type BuildersListResponse = PaginatedResponse<IBuilder>;

export interface DeleteBuilderResponse {
    success: boolean;
    message?: string;
}
