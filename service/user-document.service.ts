import {
    IUserDocument,
    ICreateUserDocumentRequest,
    IUpdateUserDocumentRequest,
    VerificationStatusEnum,
} from "@/types";
import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";

/**
 * Get all documents for a specific user
 * @param userId - User ID
 * @param page - Page number (default 1)
 * @param limit - Items per page (default 500 for visa manager to get all/latest)
 */
export async function getUserDocuments(
  userId: string,
  page: number = 1,
  limit: number = 500
): Promise<IUserDocument[]> {
  const response = await axiosInstance.get<{ data: IUserDocument[] }>(
    API_ROUTE.USER_DOCUMENT.ALL.PATH(userId),
    { params: { page, limit } }
  );
  const body = response.data;
  if (body?.data && Array.isArray(body.data)) {
    return body.data;
  }
  if (Array.isArray(body)) {
    return body;
  }
  return [];
}

/**
 * Get all documents across all users (for Visa Manager)
 */
export async function getAllDocuments(): Promise<IUserDocument[]> {
    const response = await axiosInstance.get<{ data: IUserDocument[] }>(
        API_ROUTE.USER_DOCUMENT.ALL_DOCUMENTS.PATH
    );
    return response.data.data;
}

/**
 * Get a specific user document by ID
 */
export async function getUserDocument(id: string): Promise<IUserDocument> {
    const response = await axiosInstance.get<{ data: IUserDocument }>(
        API_ROUTE.USER_DOCUMENT.VIEW.PATH(id)
    );
    return response.data.data;
}

/**
 * Create a new user document
 */
export async function createUserDocument(
    data: ICreateUserDocumentRequest
): Promise<IUserDocument> {
    const response = await axiosInstance.post<{ data: IUserDocument }>(
        API_ROUTE.USER_DOCUMENT.CREATE.PATH,
        data
    );
    return response.data.data;
}

/**
 * Update an existing user document
 */
export async function updateUserDocument(
    id: string,
    data: IUpdateUserDocumentRequest
): Promise<IUserDocument> {
    const response = await axiosInstance.put<{ data: IUserDocument }>(
        API_ROUTE.USER_DOCUMENT.UPDATE.PATH(id),
        data
    );
    return response.data.data;
}

/**
 * Verify a user document (HR/Admin action)
 */
export async function verifyUserDocument(
    id: string,
    verifiedBy: string
): Promise<IUserDocument> {
    const response = await axiosInstance.patch<{ data: IUserDocument }>(
        API_ROUTE.USER_DOCUMENT.VERIFY.PATH(id),
        { verifiedBy }
    );
    return response.data.data;
}

/**
 * Reject a user document with rejection reason
 */
export async function rejectUserDocument(
    id: string,
    rejectionReason: string,
    rejectedBy: string
): Promise<IUserDocument> {
    const response = await axiosInstance.put<{ data: IUserDocument }>(
        API_ROUTE.USER_DOCUMENT.REJECT.PATH(id),
        { rejectionReason, rejectedBy }
    );
    return response.data.data;
}

/**
 * Delete a user document
 */
export async function deleteUserDocument(id: string): Promise<void> {
    await axiosInstance.delete(API_ROUTE.USER_DOCUMENT.DELETE.PATH(id));
}

/**
 * Helper function to get documents by type for a user
 */
export async function getUserDocumentsByType(
    userId: string,
    documentType: string
): Promise<IUserDocument[]> {
    const allDocuments = await getUserDocuments(userId);
    return allDocuments.filter(doc => doc.documentType === documentType);
}

/**
 * Helper function to get pending documents (needs verification)
 */
export async function getPendingDocuments(userId: string): Promise<IUserDocument[]> {
    const allDocuments = await getUserDocuments(userId);
    return allDocuments.filter(doc => doc.verificationStatus === VerificationStatusEnum.PENDING);
}

/**
 * Helper function to get verified documents
 */
export async function getVerifiedDocuments(userId: string): Promise<IUserDocument[]> {
    const allDocuments = await getUserDocuments(userId);
    return allDocuments.filter(doc => doc.verificationStatus === VerificationStatusEnum.VERIFIED);
}

/**
 * Helper function to get rejected documents
 */
export async function getRejectedDocuments(userId: string): Promise<IUserDocument[]> {
    const allDocuments = await getUserDocuments(userId);
    return allDocuments.filter(doc => doc.verificationStatus === VerificationStatusEnum.REJECTED);
}

/**
 * Helper function to check if document is expired
 */
export function isDocumentExpired(document: IUserDocument): boolean {
    if (!document.expiryDate) return false;
    return new Date(document.expiryDate) < new Date();
}

/**
 * Helper function to check if document is expiring soon (within 30 days)
 */
export function isDocumentExpiringSoon(document: IUserDocument, daysThreshold: number = 30): boolean {
    if (!document.expiryDate) return false;
    const expiryDate = new Date(document.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= daysThreshold;
}

/**
 * Helper function to get expired documents for a user
 */
export async function getUserExpiredDocuments(userId: string): Promise<IUserDocument[]> {
    const allDocuments = await getUserDocuments(userId);
    return allDocuments.filter(doc => isDocumentExpired(doc));
}

/**
 * Helper function to get expiring soon documents for a user
 */
export async function getExpiringSoonDocuments(
    userId: string,
    daysThreshold: number = 30
): Promise<IUserDocument[]> {
    const allDocuments = await getUserDocuments(userId);
    return allDocuments.filter(doc => isDocumentExpiringSoon(doc, daysThreshold));
}
