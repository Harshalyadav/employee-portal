import { z } from "zod";
import { ApiResponse, PaginatedResponse, UserRole } from "./common.type";

// ---------------------------
// Validation Schemas (Zod)
// ---------------------------

export const createAgentSchema = z.object({
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
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password is too long'),
    role: z
        .enum(['agent', 'builder', 'admin'] as const, {
            required_error: 'Role is required',
            invalid_type_error: 'Invalid role selected'
        })
        .default('agent'),
    fcmToken: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    agency: z.string().optional(),
    avatar: z.string().url().optional().or(z.literal('')),
    licenseNo: z.string().optional(),
});

export type CreateAgentSchema = z.infer<typeof createAgentSchema>;

// ---------------------------
// Interfaces
// ---------------------------

export interface IAgent {
    id?: string;
    name: string;
    avatar?: string; // URL for profile image
    phone?: string;
    email?: string;
    address?: string;
    agency?: string; // Broker company name
    licenseNo?: string;
    status?: string; // e.g., "active", "inactive"
    createdAt?: string;
    updatedAt?: string;
}

// CRUD DTOs
export interface CreateAgentDto {
    name: string;
    avatar?: string;
    phone?: string;
    email?: string;
    address?: string;
    agency?: string;
    licenseNo?: string;
    status?: string;
}

export interface UpdateAgentDto {
    id: string;
    name?: string;
    avatar?: string;
    phone?: string;
    email?: string;
    address?: string;
    agency?: string;
    licenseNo?: string;
    status?: string;
}

export interface ListAgentsQueryDto {
    page?: number;
    limit?: number;
    search?: string; // fuzzy search over name, phone, email, agency
    status?: string;
    sortBy?: keyof IAgent | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
}

// Responses
export type AgentResponse = ApiResponse<IAgent>;
export type AgentsListResponse = PaginatedResponse<IAgent>;

export interface DeleteAgentResponse {
    success: boolean;
    message?: string;
}
