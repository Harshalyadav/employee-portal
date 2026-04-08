import { IUserBasic } from "./role.type";

export enum UserDocumentTypeEnum {
    PASSPORT = 'passport',
    // EMIRATES_ID = 'emirates_id',
    VISA = 'visa',
    // LABOR_CARD = 'labor_card',
    // ADDRESS_PROOF = 'address_proof',
    // BANK_PROOF = 'bank_proof',
    // CONTRACT = 'contract',
}

export enum VerificationStatusEnum {
    PENDING = 'pending',
    VERIFIED = 'verified',
    REJECTED = 'rejected',
}

export interface IUserDocument {
    _id: string;
    userId: string;
    documentType: UserDocumentTypeEnum;
    documentNumber?: string;
    documentUrl?: string;
    verificationStatus: VerificationStatusEnum;
    uploadedAt: Date | string;
    verifiedAt?: Date | string;
    verifiedBy?: IUserBasic;
    expiryDate?: Date | string;
    notes?: string;
    fileSize?: number;
    mimeType?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface ICreateUserDocumentRequest {
    userId: string;
    documentType: UserDocumentTypeEnum;
    documentNumber?: string;
    documentUrl?: string;
    expiryDate?: string; // ISO date string
    notes?: string;
    fileSize?: number;
    mimeType?: string;
}

export interface IUpdateUserDocumentRequest {
    documentNumber?: string;
    verificationStatus?: VerificationStatusEnum;
    expiryDate?: string;
    notes?: string;
}

export interface IVerifyDocumentRequest {
    notes?: string;
}

export interface IRejectDocumentRequest {
    notes: string;
}

// Document type labels
export const DocumentTypeLabels: Record<UserDocumentTypeEnum, string> = {
    [UserDocumentTypeEnum.PASSPORT]: 'Passport',
    // [UserDocumentTypeEnum.EMIRATES_ID]: 'Emirates ID',
    [UserDocumentTypeEnum.VISA]: 'Visa',
    // [UserDocumentTypeEnum.LABOR_CARD]: 'Labor Card',
    // [UserDocumentTypeEnum.ADDRESS_PROOF]: 'Address Proof',
    // [UserDocumentTypeEnum.BANK_PROOF]: 'Bank Proof',
    // [UserDocumentTypeEnum.CONTRACT]: 'Contract',
};

export const REQUIRED_EMPLOYEE_DOCUMENT_TYPES = [
    UserDocumentTypeEnum.PASSPORT,
    UserDocumentTypeEnum.VISA,
] as const;

// Verification status labels
export const VerificationStatusLabels: Record<VerificationStatusEnum, string> = {
    [VerificationStatusEnum.PENDING]: 'Pending Review',
    [VerificationStatusEnum.VERIFIED]: 'Verified',
    [VerificationStatusEnum.REJECTED]: 'Rejected',
};

// Helper functions
export class DocumentStatusHelper {
    static getStatusColor(status: VerificationStatusEnum): 'warning' | 'success' | 'destructive' | 'secondary' {
        switch (status) {
            case VerificationStatusEnum.PENDING:
                return 'warning';
            case VerificationStatusEnum.VERIFIED:
                return 'success';
            case VerificationStatusEnum.REJECTED:
                return 'destructive';
            default:
                return 'secondary';
        }
    }

    static getStatusIcon(status: VerificationStatusEnum): string {
        switch (status) {
            case VerificationStatusEnum.PENDING:
                return 'clock';
            case VerificationStatusEnum.VERIFIED:
                return 'check-circle';
            case VerificationStatusEnum.REJECTED:
                return 'x-circle';
            default:
                return 'question';
        }
    }

    static getStatusLabel(status: VerificationStatusEnum): string {
        return VerificationStatusLabels[status] || 'Unknown';
    }

    static isExpiringSoon(expiryDate: Date | string | undefined, daysThreshold: number = 30): boolean {
        if (!expiryDate) return false;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= daysThreshold && diffDays > 0;
    }

    static isExpired(expiryDate: Date | string | undefined): boolean {
        if (!expiryDate) return false;
        return new Date(expiryDate) < new Date();
    }

    static getDocumentTypeLabel(type: UserDocumentTypeEnum): string {
        return DocumentTypeLabels[type] || type;
    }
}
