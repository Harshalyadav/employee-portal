import { ApiResponse, PaginatedResponse } from "./common.type";

// Bounty ties to either a property or a project, created by a builder
export interface IBounty {
    id?: string;
    title: string;
    description?: string;
    discountType?: "flat" | "percent"; // type of offer
    discountValue?: number; // e.g., 50000 for flat, 10 for 10%
    startDate?: string;
    endDate?: string;
    status?: "active" | "expired" | "upcoming";
    builderId?: string; // creator
    propertyId?: string; // target property (optional)
    projectId?: string; // target project (optional)
    terms?: string; // terms & conditions
    createdAt?: string;
    updatedAt?: string;
}

// CRUD DTOs
export interface CreateBountyDto {
    title: string;
    description?: string;
    discountType?: "flat" | "percent";
    discountValue?: number;
    startDate?: string;
    endDate?: string;
    status?: "active" | "expired" | "upcoming";
    builderId?: string;
    propertyId?: string;
    projectId?: string;
    terms?: string;
}

export interface UpdateBountyDto {
    id: string;
    title?: string;
    description?: string;
    discountType?: "flat" | "percent";
    discountValue?: number;
    startDate?: string;
    endDate?: string;
    status?: "active" | "expired" | "upcoming";
    builderId?: string;
    propertyId?: string;
    projectId?: string;
    terms?: string;
}

export interface ListBountiesQueryDto {
    page?: number;
    limit?: number;
    search?: string; // fuzzy search across title/description
    builderId?: string;
    propertyId?: string;
    projectId?: string;
    status?: "active" | "expired" | "upcoming";
    sortBy?: keyof IBounty | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
}

// Responses
export type BountyResponse = ApiResponse<IBounty>;
export type BountiesListResponse = PaginatedResponse<IBounty>;

export interface DeleteBountyResponse {
    success: boolean;
    message?: string;
}
