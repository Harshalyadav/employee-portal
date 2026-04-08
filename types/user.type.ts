import { z } from "zod";
import { IRole } from "./role.type";
import { REQUIRED_EMPLOYEE_DOCUMENT_TYPES, UserDocumentTypeEnum, VerificationStatusEnum } from "./user-document.type";
import { DocumentTypeEnum } from "./company.type";
import { AxiosResponse } from "axios";

export enum UserStatusEnum {
    PENDING = 'pending',
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    TERMINATED = 'terminated',
}


export enum DocumentStatusEnum {
    ACTIVE = 'active',
    EXPIRED = 'expired',
}

export enum VisaTypeEnum {
    EMPLOYMENT = 'employment',
    VISIT = 'visit',
    DEPENDENT = 'dependent',
}

// User Enums
export enum GenderEnum {
    MALE = 'Male',
    FEMALE = 'Female',
    OTHER = 'Other',
}

export enum MaritalStatusEnum {
    SINGLE = 'Single',
    MARRIED = 'Married',
    DIVORCED = 'Divorced',
    WIDOWED = 'Widowed',
}

export enum CurrencyEnum {
    AED = 'AED',
    USD = 'USD',
    EUR = 'EUR',
    GBP = 'GBP',
    INR = 'INR',
    SAR = 'SAR',
    QAR = 'QAR',
    OMR = 'OMR',
    KWD = 'KWD',
    BHD = 'BHD',
}

export enum PaymentModeEnum {
    ACCOUNT = 'ACCOUNT',
    CASH = 'CASH',
    CHEQUE = 'CHEQUE',
}

// Address Interface
export interface IAddress {
    addressLine?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
}

export interface IBankAccount {
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    bankHolderName?: string;
}

// Parent/Guardian Details Interface
export interface IParentGuardianDetails {
    fatherName?: string;
    fatherOccupation?: string;
    fatherMobile?: string;
    fatherMobileCountryCode?: string;
    motherName?: string;
    motherOccupation?: string;
    motherMobile?: string;
    motherMobileCountryCode?: string;
    otherName?: string;
    otherRelation?: string;
    otherOccupation?: string;
    otherMobile?: string;
    otherMobileCountryCode?: string;
}

// Document Interfaces
export interface IVisaDetails {
    visaType: VisaTypeEnum;
    sponsorCompany?: string;
}

export interface IUserDocumentInput {
    docType: UserDocumentTypeEnum;
    documentNumber: string;
    issueCountry?: string;
    issueDate?: string; // ISO date
    expiryDate: string; // ISO date
    status?: DocumentStatusEnum;
    verificationStatus?: VerificationStatusEnum;
    visaDetails?: IVisaDetails;
    frontImg?: string;
    backImg?: string;
}

// Company Interface
export interface ICompany {
    id: string
    _id: string;
    legal_name?: string;
    registration_no?: string;
    country?: string;
}

export interface IUserBranch {
    id: string;
    branchName?: string;
    branchCode?: string;
    branchAddress?: IAddress;
    officeLocation?: {
        latitude?: number;
        longitude?: number;
    };
    status?: string;
    companyId?: string;
}

export interface IUserCompanyProfile {
    id: string;
    legalName?: string;
    trn?: string;
    companyRegistrationNo?: string;
    companyAddress?: string;
    country?: string;
    state?: string;
    city?: string;
    status?: string;
}

export interface IUserPermissionBranch {
    id: string;
    name: string;
}

export interface IUserPermissions {
    designation: {
        id: string;
        name: string;
    };
    branches?: IUserPermissionBranch[];
}

export interface IDocumentSummary {
    total?: number;
    valid?: number;
    expiring?: number;
    expired?: number;
    lastUpdated?: string;
}

// User Interface
export interface User {
    _id: string;
    id?: string;
    name?: string;
    employeeId?: string; // Auto-generated for employee roles
    uniqueWorkerId?: string;
    fullName: string;
    dob: string; // ISO date
    bloodGroup?: string;
    nationality?: string;
    gender?: GenderEnum;
    maritalStatus?: MaritalStatusEnum;
    dateOfJoining?: string; // ISO date
    parentGuardianDetails?: IParentGuardianDetails;
    email: string;
    phone: string;
    phoneCountryCode?: string;
    emergencyContact?: string;
    emergencyContactCountryCode?: string;
    permanentAddress?: IAddress;
    currentAddress?: IAddress;
    roleId?: string | IRole;
    branchId?: string | null;
    branch?: IUserBranch | null;
    companyId: string | ICompany | IUserCompanyProfile | null;
    company: ICompany | IUserCompanyProfile | null;
    baseSalary?: number;
    currency?: CurrencyEnum;
    paymentMode?: PaymentModeEnum;
    bankAccount?: IBankAccount;
    status?: UserStatusEnum; // User status: pending, active, inactive, suspended, terminated
    isActive?: boolean;
    refreshToken?: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
    latestAdvancePayroll?: any; // Advance payroll details
    role?: IRole; // Populated role details
    referenceBy?: string;
    referencePhone?: string;
    permissions?: IUserPermissions;
    documentSummary?: IDocumentSummary;
}

export interface ICreateUserRequest {
    fullName: string;
    dob: string; // required for auto password generation
    email: string;
    phone: string;
    bloodGroup?: string;
    nationality?: string;
    gender?: GenderEnum;
    uniqueWorkerId?: string;
    parentGuardianDetails?: IParentGuardianDetails;
    maritalStatus?: MaritalStatusEnum;
    dateOfJoining?: string;
    emergencyContact?: string;
    permanentAddress?: IAddress;
    currentAddress?: IAddress;
    roleId?: string;
    branchId?: string;
    companyId?: string;
    baseSalary?: number;
    currency?: CurrencyEnum;
    paymentMode?: PaymentModeEnum;
    bankAccount?: IBankAccount;
    documents?: IUserDocumentInput[]; // Optional: provide documents during user creation

    referenceBy?: {
        name: string;
        countryCode: string;
        contactNumber: string;
    };
}

export interface IUpdateUserRequest {
    fullName?: string;
    dob?: string;
    email?: string;
    phone?: string;
    bloodGroup?: string;
    nationality?: string;
    gender?: GenderEnum;
    uniqueWorkerId?: string;
    parentGuardianDetails?: IParentGuardianDetails;
    maritalStatus?: MaritalStatusEnum;
    dateOfJoining?: string;
    emergencyContact?: string;
    permanentAddress?: IAddress;
    currentAddress?: IAddress;
    roleId?: string;
    branchId?: string;
    baseSalary?: number;
    currency?: CurrencyEnum;
    paymentMode?: PaymentModeEnum;
    bankAccount?: IBankAccount;
    isActive?: boolean;

    referenceBy?: {
        name: string;
        countryCode: string;
        contactNumber: string;
    };
}

export interface IPaginatedUsersResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        activeCount?: number;
        inactiveCount?: number;
    };
}

export interface UserFilters {
    search?: string;
    role?: string;
    roleId?: string;
    branchIds?: string[];
    nationality?: string;
    docType?: UserDocumentTypeEnum;
    page?: number;
    limit?: number;
    order?: "asc" | "desc";
    fromDate?: string;
    lastDate?: string;
}

export type UserResponse = User;
export type UsersResponse = IPaginatedUsersResponse;

const normalizedEmailSchema = z
    .string()
    .trim()
    .email("Invalid email")
    .transform((value) => value.toLowerCase());

const requiredExpiryDateSchema = z.string().min(1, "Expiry date is required");

const hasAllRequiredEmployeeDocuments = (docs: Array<{ docType?: UserDocumentTypeEnum }>) => {
    return REQUIRED_EMPLOYEE_DOCUMENT_TYPES.every((requiredType) =>
        docs.some((doc) => doc.docType === requiredType),
    );
};


// Create User Schema
export const createUserSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    dob: z.string().min(1, "Date of birth is required"),
    email: normalizedEmailSchema,
    phoneCountryCode: z.string().optional(),
    phone: z.string().regex(/^\d+$/, "Phone must contain only numbers"),
    emergencyContactCountryCode: z.string().optional(),
    emergencyContact: z.string().optional(),
    bloodGroup: z.string().optional(),
    nationality: z.string().optional(),
    gender: z.nativeEnum(GenderEnum).optional(),
    uniqueWorkerId: z.string().optional(),
    maritalStatus: z.nativeEnum(MaritalStatusEnum).optional(),
    dateOfJoining: z.string().optional(),
    roleId: z.string().optional(),
    companyId: z.string().optional(),
    branchId: z.string().optional(),
    baseSalary: z.number().optional(),
    currency: z.nativeEnum(CurrencyEnum).optional(),
    paymentMode: z.nativeEnum(PaymentModeEnum).default(PaymentModeEnum.CASH).optional(),
    bankAccount: z.object({
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format").optional(),
    }).optional().refine(
        (data) => {
            if (!data) return true;
            const hasAccountNumber = data.accountNumber && data.accountNumber.trim().length > 0;
            const hasIfsc = data.ifsc && data.ifsc.trim().length > 0;
            // If one is provided, the other must also be provided
            if (hasAccountNumber && !hasIfsc) return false;
            if (hasIfsc && !hasAccountNumber) return false;
            // Validate account number if provided (must be numeric)
            if (hasAccountNumber && !/^\d{9,18}$/.test(data?.accountNumber || "")) return false;
            return true;
        },
        { message: "If account number or IFSC is provided, both must be provided and valid (account: 9-18 digits, IFSC: valid format)" }
    ),
    permanentAddress: z.object({
        addressLine: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
    }).optional(),
    currentAddress: z.object({
        addressLine: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
    }).optional(),
    parentGuardianDetails: z.object({
        fatherName: z.string().optional(),
        fatherOccupation: z.string().optional(),
        fatherMobile: z.string().optional(),
        fatherMobileCountryCode: z.string().optional(),
        motherName: z.string().optional(),
        motherOccupation: z.string().optional(),
        motherMobile: z.string().optional(),
        motherMobileCountryCode: z.string().optional(),
        otherName: z.string().optional(),
        otherRelation: z.string().optional(),
        otherOccupation: z.string().optional(),
        otherMobile: z.string().optional(),
        otherMobileCountryCode: z.string().optional(),
    }).optional().refine(
        (data) => {
            if (!data) return true;
            // At least one guardian must have a name
            const hasFather = data.fatherName && data.fatherName.trim().length > 0;
            const hasMother = data.motherName && data.motherName.trim().length > 0;
            const hasOther = data.otherName && data.otherName.trim().length > 0;
            return hasFather || hasMother || hasOther;
        },
        { message: "At least one guardian (father, mother, or other) must be provided" }
    ),
   referenceBy: z.object({
    name: z.string().optional().or(z.literal("")),
    
    countryCode: z.string()
        .startsWith("+", "Country code must start with +")
        .optional()
        .or(z.literal("")),

    contactNumber: z.string()
        .optional()
        .or(z.literal(""))
}).optional()
.refine(
    (data) => {
        // allow empty object
        if (!data) return true;

        // if user entered contact number, country code should exist
        if (data.contactNumber && !data.countryCode) {
            return false;
        }

        return true;
    },
    {
        message: "Country code required when contact number is entered",
        path: ["countryCode"]
    }
),
    documents: z.array(z.object({
        docType: z.nativeEnum(UserDocumentTypeEnum, {
            errorMap: () => ({ message: "Please select a valid document type" })
        }),
        documentNumber: z.string().min(1, "Document number is required"),
        issueCountry: z.string().optional(),
        issueDate: z.string().optional(),
        expiryDate: requiredExpiryDateSchema,
        status: z.nativeEnum(DocumentStatusEnum).optional(),
        verificationStatus: z.nativeEnum(VerificationStatusEnum).optional(),
        visaDetails: z.object({
            visaType: z.nativeEnum(VisaTypeEnum, {
                errorMap: () => ({ message: "Please select a valid document type" })
            }),
            sponsorCompany: z.string().optional(),
        }).optional(),
        frontImg: z.string().url("Must be a valid URL").optional().or(z.literal("")),
        backImg: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    })).min(1, "At least one document is required").refine(
        (docs) => hasAllRequiredEmployeeDocuments(docs),
        { message: "Passport and Visa documents are required" }
    ).refine(
        (docs) => {
            // At least one document must have front or back image
            return docs.some(doc => doc.frontImg || doc.backImg);
        },
        { message: "At least one document must have a front or back image" }
    ),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;

// Edit User Schema
export const editUserSchema = z.object({
    fullName: z.string().min(2, "Full name is required").optional(),
    dob: z.string().optional(),
    email: normalizedEmailSchema.optional(),
    phoneCountryCode: z.string().optional(),
    phone: z.string().regex(/^\d+$/, "Phone must contain only numbers").optional(),
    emergencyContactCountryCode: z.string().optional(),
    emergencyContact: z.string().optional(),
    bloodGroup: z.string().optional(),
    nationality: z.string().optional(),
    gender: z.nativeEnum(GenderEnum).optional(),
    uniqueWorkerId: z.string().optional(),
    maritalStatus: z.nativeEnum(MaritalStatusEnum).optional(),
    dateOfJoining: z.string().optional(),
    roleId: z.string().optional(),
    branchId: z.string().optional(),
    baseSalary: z.number().optional(),
    currency: z.nativeEnum(CurrencyEnum).optional(),
    paymentMode: z.nativeEnum(PaymentModeEnum).optional(),
    bankAccount: z.object({
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format").optional(),
    }).optional().refine(
        (data) => {
            if (!data) return true;
            const hasAccountNumber = data.accountNumber && data.accountNumber.trim().length > 0;
            const hasIfsc = data.ifsc && data.ifsc.trim().length > 0;
            // If one is provided, the other must also be provided
            if (hasAccountNumber && !hasIfsc) return false;
            if (hasIfsc && !hasAccountNumber) return false;
            // Validate account number if provided (must be numeric)
            if (hasAccountNumber && !/^\d{9,18}$/.test(data?.accountNumber || "")) return false;
            return true;
        },
        { message: "If account number or IFSC is provided, both must be provided and valid (account: 9-18 digits, IFSC: valid format)" }
    ),
    isActive: z.boolean().optional(),
    permanentAddress: z.object({
        addressLine: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
    }).optional(),
    currentAddress: z.object({
        addressLine: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
    }).optional(),
    parentGuardianDetails: z.object({
        fatherName: z.string().optional(),
        fatherOccupation: z.string().optional(),
        fatherMobile: z.string().optional(),
        fatherMobileCountryCode: z.string().optional(),
        motherName: z.string().optional(),
        motherOccupation: z.string().optional(),
        motherMobile: z.string().optional(),
        motherMobileCountryCode: z.string().optional(),
        otherName: z.string().optional(),
        otherRelation: z.string().optional(),
        otherOccupation: z.string().optional(),
        otherMobile: z.string().optional(),
        otherMobileCountryCode: z.string().optional(),
    }).optional(),
   referenceBy: z.object({
    name: z.string().optional().or(z.literal("")),
    
    countryCode: z.string()
        .startsWith("+", "Country code must start with +")
        .optional()
        .or(z.literal("")),

    contactNumber: z.string()
        .optional()
        .or(z.literal(""))
}).optional()
.refine(
    (data) => {
        // allow empty object
        if (!data) return true;

        // if user entered contact number, country code should exist
        if (data.contactNumber && !data.countryCode) {
            return false;
        }

        return true;
    },
    {
        message: "Country code required when contact number is entered",
        path: ["countryCode"]
    }
)
});

export type EditUserSchema = z.infer<typeof editUserSchema>;


// ============================================
// Multi-Step Form Schemas
// ============================================

// Step 1: Personal Info Schema
export const personalInfoSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    dob: z.string().min(1, "Date of birth is required"),
    bloodGroup: z.string().optional(),
    nationality: z.string().optional(),
    gender: z.nativeEnum(GenderEnum).optional(),
    maritalStatus: z.nativeEnum(MaritalStatusEnum).optional(),
    parentGuardianDetails: z.object({
        fatherName: z.string().optional(),
        fatherOccupation: z.string().optional(),
        fatherMobile: z.string().optional(),
        fatherMobileCountryCode: z.string().optional(),
        motherName: z.string().optional(),
        motherOccupation: z.string().optional(),
        motherMobile: z.string().optional(),
        motherMobileCountryCode: z.string().optional(),
        otherName: z.string().optional(),
        otherRelation: z.string().optional(),
        otherOccupation: z.string().optional(),
        otherMobile: z.string().optional(),
        otherMobileCountryCode: z.string().optional(),
    }).optional(),
referenceBy: z.object({
    name: z.string().optional().or(z.literal("")),
    
    countryCode: z.string()
        .startsWith("+", "Country code must start with +")
        .optional()
        .or(z.literal("")),

    contactNumber: z.string()
        .optional()
        .or(z.literal(""))
}).optional()
.refine(
    (data) => {
        // allow empty object
        if (!data) return true;

        // if user entered contact number, country code should exist
        if (data.contactNumber && !data.countryCode) {
            return false;
        }

        return true;
    },
    {
        message: "Country code required when contact number is entered",
        path: ["countryCode"]
    }
)
});

export type PersonalInfoSchema = z.infer<typeof personalInfoSchema>;

// Personal Info Schema for Admin Users (Reference By is optional)
export const personalInfoSchemaAdminOptional = z.object({
    fullName: z.string().min(2, "Full name is required"),
    dob: z.string().min(1, "Date of birth is required"),
    bloodGroup: z.string().optional(),
    nationality: z.string().optional(),
    gender: z.nativeEnum(GenderEnum).optional(),
    maritalStatus: z.nativeEnum(MaritalStatusEnum).optional(),
    parentGuardianDetails: z.object({
        fatherName: z.string().optional(),
        fatherOccupation: z.string().optional(),
        fatherMobile: z.string().optional(),
        fatherMobileCountryCode: z.string().optional(),
        motherName: z.string().optional(),
        motherOccupation: z.string().optional(),
        motherMobile: z.string().optional(),
        motherMobileCountryCode: z.string().optional(),
        otherName: z.string().optional(),
        otherRelation: z.string().optional(),
        otherOccupation: z.string().optional(),
        otherMobile: z.string().optional(),
        otherMobileCountryCode: z.string().optional(),
    }).optional(),
    referenceBy: z.object({
        name: z.string().optional(),
        countryCode: z.string().optional(),
        contactNumber: z.string().optional(),
    }).optional(),
});

export type PersonalInfoSchemaAdminOptional = z.infer<typeof personalInfoSchemaAdminOptional>;

export interface FormStepResponseData {
    currentStep: number,
    currentStepKey: UserFormStepEnum,
    currentStepData: any,
    nextStep: any,
    nextStepKey: UserFormStepEnum,
    message: string,
    documents?: any[],
    // Contact Info fields
    email?: string,
    phone?: string,
    emergencyContact?: {
        name?: string,
        phone?: string,
        relation?: string,
    },
    permanentAddress?: {
        addressLine?: string,
        city?: string,
        state?: string,
        country?: string,
        pincode?: string,
    },
    currentAddress?: {
        addressLine?: string,
        city?: string,
        state?: string,
        country?: string,
        pincode?: string,
    },
}

export interface FormStepResponse extends AxiosResponse<FormStepResponseData> {

}

// Step 2: Contact Info Schema
export const contactInfoSchema = z.object({
    email: normalizedEmailSchema,
    phoneCountryCode: z.string().min(1, "Country code is required").startsWith("+", "Country code must start with +"),
    phone: z.string().min(1, "Phone is required").regex(/^\d+$/, "Phone must contain only numbers"),
    emergencyContactCountryCode: z.string().optional(),
    emergencyContact: z.string().regex(/^\d+$/, "Emergency contact must contain only numbers").optional(),
    permanentAddress: z.object({
        addressLine: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
    }).optional(),
    currentAddress: z.object({
        addressLine: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
    }).optional(),
}).refine(
    (data) => {
        // If emergency contact is provided, country code must also be provided
        if (data.emergencyContact && data.emergencyContact.trim()) {
            return data.emergencyContactCountryCode && data.emergencyContactCountryCode.startsWith("+");
        }
        return true;
    },
    {
        message: "Country code is required for emergency contact",
        path: ["emergencyContactCountryCode"],
    }
);

export type ContactInfoSchema = z.infer<typeof contactInfoSchema>;

// Edit form: Contact Info with permanent address required
export const editContactInfoSchema = z.object({
    email: normalizedEmailSchema,
    phoneCountryCode: z.string().min(1, "Country code is required").startsWith("+", "Country code must start with +"),
    phone: z.string().min(1, "Phone is required").regex(/^\d+$/, "Phone must contain only numbers"),
    emergencyContactCountryCode: z.string().optional(),
    emergencyContact: z.string().regex(/^\d+$/, "Emergency contact must contain only numbers").optional().or(z.literal("")),
    permanentAddress: z.object({
        addressLine: z.string().min(1, "Address line is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        country: z.string().min(1, "Country is required"),
        pincode: z.string().min(1, "Pincode is required"),
    }),
    currentAddress: z.object({
        addressLine: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
    }).optional(),
}).refine(
    (data) => {
        if (data.emergencyContact && data.emergencyContact.trim()) {
            return data.emergencyContactCountryCode && data.emergencyContactCountryCode.startsWith("+");
        }
        return true;
    },
    { message: "Country code is required for emergency contact", path: ["emergencyContactCountryCode"] }
);

export type EditContactInfoSchema = z.infer<typeof editContactInfoSchema>;

// Step 3: Employment Info Schema
export const employmentInfoSchema = z.object({
    branchId: z.string().optional(),
    baseSalary: z.number().optional(),
    currency: z.nativeEnum(CurrencyEnum).optional(),
    dateOfJoining: z.string().optional(),
    paymentMode: z.nativeEnum(PaymentModeEnum).default(PaymentModeEnum.CASH).optional(),
    bankAccount: z.object({
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        ifsc: z.string().optional(),
        bankHolderName: z.string().optional(),
    }).optional(),
}).refine(
    (data) => {
        // Only validate bank details if payment mode is ACCOUNT
        if (data.paymentMode !== PaymentModeEnum.ACCOUNT) {
            return true; // Skip validation for CASH payments
        }

        // If payment mode is ACCOUNT, validate bank details
        if (!data.bankAccount) {
            return false;
        }

        const { bankName, accountNumber, ifsc, bankHolderName } = data.bankAccount;

        // All four fields are required for ACCOUNT payment mode
        if (!bankName || bankName.trim().length === 0) {
            return false;
        }

        if (!bankHolderName || bankHolderName.trim().length === 0) {
            return false;
        }

        if (!accountNumber || accountNumber.trim().length === 0) {
            return false;
        }

        if (!ifsc || ifsc.trim().length === 0) {
            return false;
        }

        // Validate account number format (9-18 digits)
        if (!/^\d{9,18}$/.test(accountNumber)) {
            return false;
        }

        // Validate IFSC format
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
            return false;
        }

        return true;
    },
    {
        message: "When payment mode is ACCOUNT, all bank details are required (Bank Name, Account Holder Name, Account Number: 9-18 digits, IFSC: valid format)",
        path: ["bankAccount"],
    }
);

export type EmploymentInfoSchema = z.infer<typeof employmentInfoSchema>;

// Step 4: Document Upload Schema
export const documentUploadSchema = z.object({
    documents: z.array(z.object({
        id: z.string().optional(),
        docType: z.nativeEnum(UserDocumentTypeEnum, {
            errorMap: () => ({ message: "Please select a valid document type" })
        }),
        documentNumber: z.string().min(1, "Document number is required"),
        issueCountry: z.string().optional(),
        issueDate: z.string().optional(),
        expiryDate: z.string().min(1, "Expiry date is required"),
        status: z.nativeEnum(DocumentStatusEnum).optional(),
        verificationStatus: z.nativeEnum(VerificationStatusEnum).optional(),
        visaDetails: z.object({
            visaType: z.nativeEnum(VisaTypeEnum),
            sponsorCompany: z.string().optional(),
        }).optional(),
        frontImg: z.string().url("Must be a valid URL").optional().or(z.literal("")),
        backImg: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    })).min(1, "At least one document is required").refine(
        (docs) => hasAllRequiredEmployeeDocuments(docs),
        { message: "Passport and Visa documents are required" }
    ),
    // Image upload is now optional - documents can be submitted without front/back images
});

export type DocumentUploadSchema = z.infer<typeof documentUploadSchema>;

// Permissions (designation + branches) for non-employee roles
export const permissionBranchSchema = z.object({
    id: z.string(),
    name: z.string(),
});
export type PermissionBranchSchema = z.infer<typeof permissionBranchSchema>;

export const permissionsSchema = z.object({
    designation: z.string().optional(), // role ID for designation
    branches: z.array(permissionBranchSchema).optional(),
}).optional();
export type PermissionsSchema = z.infer<typeof permissionsSchema>;

// Step 5: Review Schema
export const reviewSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    status: z.nativeEnum(UserStatusEnum).optional(),
    permissions: permissionsSchema.optional(),
});

export type ReviewSchema = z.infer<typeof reviewSchema>;


export interface PersonalInfoUser {
    fullName: string;
    dob: string; // ISO date string

    bloodGroup?: string;
    nationality?: string;
    gender?: 'Male' | 'Female' | 'Other';

    parentGuardianDetails?: ParentGuardianDetails;
    maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
}


export interface ContactInfoUser {
    userId: string;

    email: string;
    phone: string;
    emergencyContact?: string;

    permanentAddress?: AddressDetails;
    currentAddress?: AddressDetails;
}


export interface EmploymentInfoUser {
    userId: string;

    uniqueWorkerId?: string;
    dateOfJoining?: string; // ISO date string

    roleId?: string;
    branchId?: string;

    baseSalary?: number;
    currency?: CurrencyEnum;

    paymentMode?: PaymentModeEnum;
    bankAccount?: BankAccountInput;
}


export interface DocumentUploadUser {
    userId: string;
    documents?: UserDocumentInput[];
}



export interface ReviewUser {
    userId: string;
    status?: UserStatusEnum;
    permissions?: {
        designation?: string;
        branches?: { id: string; name: string }[];
    };
}

export interface AddressDetails {
    addressLine?: string;
    country?: string;
    state?: string;
    city?: string;
    pincode?: string;
}

export interface ParentGuardianDetails {
    fatherName?: string;
    fatherOccupation?: string;
    fatherMobile?: string;

    motherName?: string;
    motherOccupation?: string;
    motherMobile?: string;

    otherName?: string;
    otherRelation?: string;
    otherOccupation?: string;
    otherMobile?: string;
}


export enum UserFormStepEnum {
    PERSONAL_INFO = 'PERSONAL_INFO',
    CONTACT_INFO = 'CONTACT_INFO',
    EMPLOYMENT_INFO = 'EMPLOYMENT_INFO',
    PERMISSION = 'PERMISSION',
    DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
    REVIEW_SUBMIT = 'REVIEW_SUBMIT',
}



export interface BankAccountInput {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    bankHolderName: string;
}


export interface UserDocumentInput {
    docType: DocumentTypeEnum;
    documentNumber: string;

    issueCountry?: string;
    issueDate?: string;   // ISO date string
    expiryDate: string;  // ISO date string

    status?: DocumentStatusEnum;
    verificationStatus?: VerificationStatusEnum;

    visaDetails?: VisaDetailsInput;

    frontImg?: string;
    backImg?: string;
}


export interface VisaDetailsInput {
    visaType: VisaTypeEnum;
    sponsorCompany?: string;
}

