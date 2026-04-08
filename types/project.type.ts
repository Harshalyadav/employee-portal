import { ApiResponse, PaginatedResponse } from "./common.type";
import { z } from "zod";

// Option lists (extend as needed)
export const PROJECT_TYPES = ["Residential", "Commercial", "Industrial", "Mixed Use"] as const;
export const PROJECT_STATUSES = ["Ready to move", "Under Construction"] as const;
export const PROJECT_CATEGORIES = ["top-rated", "newly-added", "fast-selling"] as const;
export const PROJECT_AFFORDABILITY = ["luxury", "mid-range", "affordable"] as const;

export const projectNearbySchema = z.object({
    resource: z.string().min(1, "Required"),
    distance: z.string().optional().default("")
});

export const projectTagSchema = z.object({
    text: z.string().min(1, "Required"),
    variant: z.string().optional().default(""),
    iconUrl: z.string().url().optional().or(z.literal(""))
});

export const projectOfferSchema = z.object({
    text: z.string().min(1, "Required"),
    variant: z.string().optional().default(""),
    description: z.string().optional().default("")
});

export const createProjectSchema = z.object({
    listingId: z.string({
        required_error: "listingId should not be empty",
        invalid_type_error: "listingId must be a string"
    }).min(1, "listingId should not be empty"),
    projectName: z.string().min(1, "Project name is required"),
    description: z.string({
        required_error: "description should not be empty"
    }).min(1, "description should not be empty"),
    thumbnail: z.string({
        required_error: "thumbnail should not be empty"
    }).url("thumbnail must be a URL address").min(1, "thumbnail should not be empty"),
    builder: z.string().optional(),
    projectType: z.string().optional(),
    quickBuy: z.boolean().optional().default(false),
    projectCategory: z.string().optional(),
    projectAffordability: z.string().optional(),
    projectStatus: z.enum(["Ready to move", "Under Construction"], {
        errorMap: () => ({ message: "projectStatus must be one of the following values: Ready to move, Under Construction" })
    }).optional(),
    PropertyConfig: z.array(z.string()).optional().default([]),
    priceAverage: z.number().optional(),
    priceMin: z.number().optional(),
    minCarpetArea: z.number().optional(),
    maxCarpetArea: z.number().optional(),
    priceMax: z.number().optional(),
    since: z.number().optional(),
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
    amenities: z.array(z.string()).optional().default([]),
    facilities: z.array(z.string()).optional().default([]),
    inquiries: z.array(z.string()).optional().default([]),
    tags: z.array(projectTagSchema).optional().default([]),
    offers: z.array(projectOfferSchema).optional().default([]),
    status: z.string().optional(),
    images: z.array(z.string()).optional().default([]),
    seoTitle: z.string().optional(),
    readyToPossessDate: z.string().optional(),
    seoDescription: z.string().optional(),
    videoLink: z.string().optional(),
    floorPlan: z.string().optional(),
    masterPlan: z.string().optional(),
    seoKeywords: z.array(z.string()).optional().default([]),
    reraNo: z.string().optional(),
    featured: z.boolean().optional().default(false),
    exclusive: z.boolean().optional().default(false),
    view: z.number().optional(),
    active: z.boolean().optional().default(true),
    nearby: z.array(projectNearbySchema).optional().default([]),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;
export type UpdateProjectSchema = z.infer<typeof updateProjectSchema>;

// Interfaces and DTOs
export interface IProject extends CreateProjectSchema {
    _id?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type CreateProjectDto = CreateProjectSchema;
export type UpdateProjectDto = UpdateProjectSchema;

export interface ListProjectsQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    builder?: string;
    status?: string;
}

export type ProjectResponse = ApiResponse<IProject>;
export type ProjectsListResponse = PaginatedResponse<IProject>;

export interface DeleteProjectResponse {
    success: boolean;
    message?: string;
}
