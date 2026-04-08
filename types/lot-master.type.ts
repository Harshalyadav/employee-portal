import { z } from 'zod';
import { ApiResponse } from './common.type';

// ---------------------------
// Validation Schemas (Zod)
// ---------------------------

export const createLotMasterSchema = z.object({
    name: z
        .string({ required_error: 'Name is required' })
        .min(1, 'Name is required')
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name must not exceed 100 characters'),
    lotCapAmount: z
        .number({ required_error: 'LOT Cap Amount is required' })
        .min(0, 'LOT Cap Amount must be greater than 0'),
    isActive: z.boolean().default(true),
});

export type CreateLotMasterSchema = z.infer<typeof createLotMasterSchema>;

// ---------------------------
// Data Models
// ---------------------------

export interface CreatedByUser {
    _id: string;
    fullName: string;
    email: string;
}

export interface LotMaster {
    _id: string;
    name: string;
    lotCapAmount: number;
    isActive: boolean;
    effectiveFrom?: string;
    effectiveTo?: string | null;
    createdBy?: CreatedByUser;
    createdAt: string;
    updatedAt: string;
}

// ---------------------------
// DTOs
// ---------------------------

export interface CreateLotMasterDto {
    name: string;
    lotCapAmount: number;
    isActive?: boolean;
    effectiveFrom?: string;
    effectiveTo?: string | null;
}

export interface UpdateLotMasterDto {
    name?: string;
    lotCapAmount?: number;
    isActive?: boolean;
    effectiveFrom?: string;
    effectiveTo?: string | null;
}

// ---------------------------
// Filters
// ---------------------------

export interface LotMasterFilters {
    search?: string;
    status?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'lotCapAmount' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

// ---------------------------
// API Responses
// ---------------------------

export interface LotMastersResponse extends ApiResponse<LotMaster[]> {
    data: LotMaster[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}