import { z } from "zod";

// ---------------------------
// Enums & Status Types
// ---------------------------
export type CompanyStatus = "Active" | "Suspended" | "Expired";

export enum DocumentTypeEnum {
    TRADING_LICENSE = "Trading License",
    REGISTRATION_CERTIFICATE = "Registration Certificate",
    TAX_CERTIFICATE = "Tax Certificate",
    LABOR_CARD = "Labor Card",
    INSURANCE = "Insurance",
    OTHER = "Other",
}

export type DocumentStatus = "Valid" | "Expired" | "Pending Review" | "Rejected";

// ---------------------------
// Core Entities
// ---------------------------
export interface Company {
    _id: string;
    legalName: string;
    trn?: string;
    companyRegistrationNo?: string;
    tradeLicense?: boolean;
    companyAddress?: string;
    country?: string;
    state?: string;
    city?: string;
    companyQuota?: number;
    status: CompanyStatus;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CompanyDocument {
    _id: string;
    companyId: string;
    documentType: DocumentTypeEnum;
    documentSeq: number;
    documentName: string;
    documentUrl: string;
    fileSize?: number;
    mimeType?: string;
    expiryDate?: string;
    status: DocumentStatus;
    notes?: string;
    uploadedBy: string;
    uploadedAt: string;
    verifiedAt?: string;
    verifiedBy?: string;
}

// ---------------------------
// DTOs
// ---------------------------
export interface CompanyDocumentInputDto {
    documentType: DocumentTypeEnum;
    documentName: string;
    documentUrl: string;
    fileSize?: number;
    mimeType?: string;
    expiryDate?: string;
    notes?: string;
}

export interface CreateCompanyDto {
    legalName: string;
    trn?: string;
    companyRegistrationNo?: string;
    documents?: CompanyDocumentInputDto[];
    companyAddress?: string;
    country?: string;
    state?: string;
    city?: string;
    companyQuota?: number;
    status?: CompanyStatus;
}

export interface UpdateCompanyDto {
    legalName?: string;
    trn?: string;
    companyRegistrationNo?: string;
    documents?: CompanyDocumentInputDto[];
    companyAddress?: string;
    country?: string;
    state?: string;
    city?: string;
    companyQuota?: number;
    status?: CompanyStatus;
}

export interface CreateCompanyDocumentDto {
    companyId: string;
    documentType: DocumentTypeEnum;
    documentName: string;
    documentUrl: string;
    fileSize?: number;
    mimeType?: string;
    expiryDate?: string;
    status?: DocumentStatus;
    notes?: string;
}

export interface UpdateCompanyDocumentDto {
    documentName?: string;
    documentUrl?: string;
    fileSize?: number;
    mimeType?: string;
    expiryDate?: string;
    status?: DocumentStatus;
    notes?: string;
}

// ---------------------------
// Filters & Pagination
// ---------------------------
export interface CompanyFilters {
    page?: number;
    limit?: number;
    status?: CompanyStatus;
}

export interface CompanyDocumentFilters {
    page?: number;
    limit?: number;
    status?: DocumentStatus;
    companyId?: string;
    documentType?: DocumentTypeEnum;
    daysBeforeExpiry?: number;
}

export interface CompanyPagination {
    total: number;
    page: number;
    pages: number;
}

// ---------------------------
// Responses
// ---------------------------
export interface CompaniesResponse {
    success?: boolean;
    message: string;
    data: Company[];
    pagination?: CompanyPagination;
    meta?: CompanyPagination;
    statusCode?: number;
}

export interface CompanyResponse {
    success?: boolean;
    message: string;
    data: Company;
    statusCode?: number;
}

export interface CompanyDocumentsResponse {
    success?: boolean;
    message: string;
    data: CompanyDocument[];
    pagination?: CompanyPagination;
    meta?: CompanyPagination;
    statusCode?: number;
    latestSeq?: number;
}

export interface CompanyDocumentResponse {
    success?: boolean;
    message: string;
    data: CompanyDocument;
    statusCode?: number;
}

// ---------------------------
// Optional validation (for future forms)
// ---------------------------
export const createCompanySchema = z.object({
    legalName: z.string().min(2, "Legal name is required"),
    trn: z.string().optional(),
    companyRegistrationNo: z.string().optional(),
    companyAddress: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    companyQuota: z.number().optional(),
    status: z.enum(["Active", "Suspended", "Expired"]).optional(),
    documents: z.array(z.object({
        documentType: z.nativeEnum(DocumentTypeEnum),
        documentName: z.string(),
        documentUrl: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        expiryDate: z.string().optional(),
        notes: z.string().optional(),
    })).optional(),
});

export type CreateCompanySchema = z.infer<typeof createCompanySchema>;
