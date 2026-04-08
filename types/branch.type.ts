import { z } from "zod";

/**
 * Branch status enumeration
 */
export enum BranchStatusEnum {
  ACTIVE = "Active",
  CLOSED = "Closed",
}

/**
 * Office location coordinates schema
 */
const coordinateSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "number" && Number.isNaN(value)) {
      return undefined;
    }
    return value;
  },
  z.union([z.number().min(-90).max(90), z.undefined()]),
);

export const officeLocationSchema = z
  .object({
    latitude: coordinateSchema.optional(),
    longitude: coordinateSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const hasLatitude = value.latitude !== undefined;
    const hasLongitude = value.longitude !== undefined;

    if (hasLatitude && !hasLongitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Longitude is required when latitude is provided",
        path: ["longitude"],
      });
    }

    if (!hasLatitude && hasLongitude) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Latitude is required when longitude is provided",
        path: ["latitude"],
      });
    }
  });

/**
 * Office location coordinates interface
 */
export interface IOfficeLocation {
  latitude: number;
  longitude: number;
}

/**
 * Branch address interface (same structure as user current address)
 */
export interface IBranchAddress {
  addressLine?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

/**
 * Branch entity interface
 */
export interface IBranch {
  _id: string;
  companyId: string | { _id: string; legalName: string };
  branchName: string;
  branchCode: string; // Auto-generated: BR-001, BR-002, etc.
  branchAddress?: IBranchAddress;
  officeLocation?: IOfficeLocation;
  addressProof?: string; // URL to address proof document
  status: BranchStatusEnum;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Branch address schema
 */
export const branchAddressSchema = z.object({
  addressLine: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
});

/**
 * Create branch schema
 */
export const createBranchSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  branchName: z.string().min(1, "Branch name is required"),
  branchAddress: branchAddressSchema.optional(),
  officeLocation: officeLocationSchema.optional(),
  addressProof: z.string().optional(),
  status: z.nativeEnum(BranchStatusEnum).optional(),
});

/**
 * Update branch schema
 */
export const updateBranchSchema = z.object({
  branchName: z.string().min(1, "Branch name is required").optional(),
  branchAddress: branchAddressSchema.optional(),
  officeLocation: officeLocationSchema.optional(),
  addressProof: z.string().optional(),
  status: z.nativeEnum(BranchStatusEnum).optional(),
});

/**
 * Create branch DTO
 */
export type CreateBranchSchema = z.infer<typeof createBranchSchema>;

/**
 * Update branch DTO
 */
export type UpdateBranchSchema = z.infer<typeof updateBranchSchema>;

/**
 * Pagination metadata
 */
export interface IPagination {
  total: number;
  page: number;
  pages: number;
}

/**
 * API Response wrapper
 */
export interface IApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  pagination?: IPagination;
}

/**
 * Branch list response
 */
export interface IBranchListResponse {
  data: IBranch[];
  pagination: IPagination;
}
