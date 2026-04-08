import { z } from "zod";


export interface Model {
    id: string;
    name: string;
    tagline?: string;
    description?: string;
    status: string;
    minimumArea?: number;
    seatingCapacity?: number;
    frontage?: number;
    interiorTheme?: string;
    equipmentProvided?: string[];
    staffRequired?: number;
    roleIds?: string[];
    setupDurationDays?: number;
    operatingHours?: string;
    trainingProvided?: boolean;
    agreementValidityYears?: number;
    renewalPolicy?: string;
    exitPolicy?: string;
    licensesRequired?: string[];
    legalDocs?: LegalDoc[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}


export interface CreateModelDto extends Omit<Model, "id" | "createdBy" | "createdAt" | "updatedAt"> { }

export interface EditModelDto extends Omit<Model, "id" | "createdBy" | "createdAt" | "updatedAt"> { }


export interface BasicInformation {
    modelName: string;
    tagline?: string;
    status?: string;
    createdOn?: string;
    createdBy?: string;
    description?: string;
}

export interface InvestmentFinancialDetails {
    purchaseFee?: number;
    totalInvestment?: number;
    investmentBreakdown?: string;
    royaltyFee?: number;
    estimatedMonthlyRevenue?: number;
    breakEvenMonths?: number;
}

export interface InfrastructureRequirements {
    minimumAreaRequired?: number;
    areaUnit?: string;
    frontageRequired?: number;
    ceilingHeight?: number;
    parkingSpaces?: number;
    utilities?: string;
    equipment?: string[]; // added
}

export interface OperationsStaffing {
    requiredStaffCount?: number;
    roleIds?: string[]; // added
    setupDuration?: number;
    operatingHours?: string;
    workingDays?: boolean;
    supportAvailable?: boolean;
}

export interface LegalPolicyDetails {
    agreementValidity?: number;
    renewalPolicy?: string;
    exitPolicy?: string;
    licenseRequirements?: string;
    documentUpload?: string;
    licenses?: string[]; // added
}

export enum ModelStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    DRAFT = "draft",
    ARCHIVED = "archived",
}

export interface ModelFilters {
    search?: string;
    status?: ModelStatus | string;
    page?: number;
    limit?: number;
    sortBy?: keyof Model;
    sortOrder?: "asc" | "desc";
}

export interface ModelMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ModelsResponse {
    success: boolean;
    message: string;
    items: Model[];
    meta: ModelMeta;
}

const legalDocSchema = z.object({
    id: z.string(),                     // unique doc id
    name: z.string(),                   // document name (Agreement, NDA, etc.)
    description: z.string().optional(), // optional info
    fileUrl: z.string().optional(),     // downloadable file URL
    version: z.string().optional(),     // v1.0, v2.1, etc.
    validityYears: z.number().optional(),// if applicable
    mandatory: z.boolean().default(true),
});


export type LegalDoc = z.infer<typeof legalDocSchema>;


// Create Model schema (flat)
export const createModelSchema = z.object({
    name: z.string().min(2, "Model name is required"),
    tagline: z.string().optional(),
    description: z.string().optional(),
    status: z.nativeEnum(ModelStatus),
    minimumArea: z.number().optional(),
    seatingCapacity: z.number().optional(),
    frontage: z.number().optional(),
    interiorTheme: z.string().optional(),
    equipmentProvided: z.array(z.string()).optional(),
    staffRequired: z.number().optional(),
    roleIds: z.array(z.string()),
    setupDurationDays: z.number().optional(),
    operatingHours: z.string().optional(),
    trainingProvided: z.boolean().optional(),
    agreementValidityYears: z.number().optional(),
    renewalPolicy: z.string().optional(),
    exitPolicy: z.string().optional(),
    licensesRequired: z.array(z.string()),
    legalDocs: z.array(legalDocSchema).optional(),
});
export type CreateModelSchema = z.infer<typeof createModelSchema>;




export const stepFields: Record<string, (keyof CreateModelSchema | string)[]> = {
    basic: [
        "name",
        "tagline",
        "description",
        "status",
    ],
    infra: [
        "minimumArea",
        "seatingCapacity",
        "frontage",
        "interiorTheme",
        "equipmentProvided",
    ],
    ops: [
        "staffRequired",
        "roleIds",
        "setupDurationDays",
        "operatingHours",
        "trainingProvided",
    ],
    legal: [
        "agreementValidityYears",
        "renewalPolicy",
        "exitPolicy",
        "licensesRequired",
        "legalDocs",
    ],
};



// Edit Model schema
export const editModelSchema = createModelSchema.extend({
    id: z.string(),
});
export type EditModelSchema = z.infer<typeof editModelSchema>;
export interface defaultEditModelSchema extends EditModelSchema {
    roles: {
        id: string;
        name: string;
    }[];
};




export interface ModelFormStateZ {
    create: Record<string, any>;
    edit: Record<string, any>;
    setCreateModelForm: (data: Record<string, any>) => void;
    resetCreateModelForm: () => void;
    setEditModelForm: (data: Record<string, any>) => void;
    resetEditModelForm: () => void;
}