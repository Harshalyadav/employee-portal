import { ApiResponse, PaginatedResponse } from "./common.type";

export interface IInquiry {
    id?: string;
    subject: string;
    message?: string;
    agentId?: string; // who raised the inquiry
    propertyId?: string; // related property (optional)
    projectId?: string; // related project (optional)
    propertyTitle?: string; // denormalized property title for listing
    projectName?: string; // denormalized project name for listing
    priority?: "low" | "medium" | "high";
    status?: "open" | "pending" | "closed";
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateInquiryDto {
    subject: string;
    message?: string;
    agentId?: string;
    propertyId?: string;
    projectId?: string;
    propertyTitle?: string;
    projectName?: string;
    priority?: "low" | "medium" | "high";
    status?: "open" | "pending" | "closed";
}

export interface UpdateInquiryDto {
    id: string;
    subject?: string;
    message?: string;
    agentId?: string;
    propertyId?: string;
    projectId?: string;
    propertyTitle?: string;
    projectName?: string;
    priority?: "low" | "medium" | "high";
    status?: "open" | "pending" | "closed";
}

export interface ListInquiriesQueryDto {
    page?: number;
    limit?: number;
    search?: string; // search subject/message
    agentId?: string;
    propertyId?: string;
    projectId?: string;
    propertyTitle?: string;
    projectName?: string;
    status?: "open" | "pending" | "closed";
    priority?: "low" | "medium" | "high";
    sortBy?: keyof IInquiry | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
}

export type InquiryResponse = ApiResponse<IInquiry>;
export type InquiriesListResponse = PaginatedResponse<IInquiry>;

export interface DeleteInquiryResponse {
    success: boolean;
    message?: string;
}
