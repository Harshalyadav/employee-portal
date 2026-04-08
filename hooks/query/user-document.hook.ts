"use client";

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getUserDocuments,
    getUserDocument,
    createUserDocument,
    updateUserDocument,
    verifyUserDocument,
    rejectUserDocument,
    deleteUserDocument,
    getUserDocumentsByType,
    getPendingDocuments,
    getVerifiedDocuments,
    getRejectedDocuments,
    getUserExpiredDocuments,
    getExpiringSoonDocuments,
    getAllDocuments,
} from "@/service/user-document.service";
import { ICreateUserDocumentRequest, IUpdateUserDocumentRequest } from "@/types";
import { API_ROUTE } from "@/routes";

/**
 * Hook: Get all documents for a user
 */
export const useUserDocuments = (userId?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER_DOCUMENT.ALL.ID, userId],
        queryFn: () => {
            if (!userId) throw new Error("User ID is required");
            return getUserDocuments(userId);
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Get all documents across all users (Visa Manager)
 */
export const useAllDocuments = () => {
    return useQuery({
        queryKey: [API_ROUTE.USER_DOCUMENT.ALL_DOCUMENTS.ID],
        queryFn: () => getAllDocuments(),
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Get a specific document by ID
 */
export const useUserDocument = (id?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER_DOCUMENT.VIEW.ID, id],
        queryFn: () => {
            if (!id) throw new Error("Document ID is required");
            return getUserDocument(id);
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Get documents by type for a user
 */
export const useUserDocumentsByType = (userId?: string, documentType?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER_DOCUMENT.ALL.ID, "by-type", userId, documentType],
        queryFn: () => {
            if (!userId || !documentType) throw new Error("User ID and document type are required");
            return getUserDocumentsByType(userId, documentType);
        },
        enabled: !!userId && !!documentType,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Get pending documents for a user
 */
export const usePendingDocuments = (userId?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER_DOCUMENT.ALL.ID, "pending", userId],
        queryFn: () => {
            if (!userId) throw new Error("User ID is required");
            return getPendingDocuments(userId);
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Get verified documents for a user
 */
export const useVerifiedDocuments = (userId?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER_DOCUMENT.ALL.ID, "verified", userId],
        queryFn: () => {
            if (!userId) throw new Error("User ID is required");
            return getVerifiedDocuments(userId);
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Get rejected documents for a user
 */
export const useRejectedDocuments = (userId?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER_DOCUMENT.ALL.ID, "rejected", userId],
        queryFn: () => {
            if (!userId) throw new Error("User ID is required");
            return getRejectedDocuments(userId);
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Get expired documents for a user
 */
export const useExpiredDocuments = (userId?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER_DOCUMENT.ALL.ID, "expired", userId],
        queryFn: () => {
            if (!userId) throw new Error("User ID is required");
            return getUserExpiredDocuments(userId);
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Get expiring soon documents for a user
 */
export const useExpiringSoonDocuments = (userId?: string, daysThreshold: number = 30) => {
    return useQuery({
        queryKey: [API_ROUTE.USER_DOCUMENT.ALL.ID, "expiring-soon", userId, daysThreshold],
        queryFn: () => {
            if (!userId) throw new Error("User ID is required");
            return getExpiringSoonDocuments(userId, daysThreshold);
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Create a new user document
 */
export const useCreateUserDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ICreateUserDocumentRequest) => createUserDocument(data),
        onSuccess: (_, variables) => {
            // Invalidate all document queries for this user
            queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey[0] === API_ROUTE.USER_DOCUMENT.ALL.ID &&
                    query.queryKey[1] === variables.userId,
            });
        },
    });
};

/**
 * Hook: Update a user document
 */
export const useUpdateUserDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: IUpdateUserDocumentRequest }) =>
            updateUserDocument(id, data),
        onSuccess: (updatedDoc) => {
            // Invalidate specific document
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER_DOCUMENT.VIEW.ID, updatedDoc._id],
            });
            // Invalidate all documents for this user
            queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey[0] === API_ROUTE.USER_DOCUMENT.ALL.ID &&
                    query.queryKey[1] === updatedDoc.userId,
            });
        },
    });
};

/**
 * Hook: Verify a user document
 */
export const useVerifyUserDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, verifiedBy }: { id: string; verifiedBy: string }) =>
            verifyUserDocument(id, verifiedBy),
        onSuccess: (updatedDoc) => {
            // Invalidate specific document
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER_DOCUMENT.VIEW.ID, updatedDoc._id],
            });
            // Invalidate all documents for this user
            queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey[0] === API_ROUTE.USER_DOCUMENT.ALL.ID &&
                    query.queryKey[1] === updatedDoc.userId,
            });
        },
    });
};

/**
 * Hook: Reject a user document
 */
export const useRejectUserDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            rejectionReason,
            rejectedBy,
        }: {
            id: string;
            rejectionReason: string;
            rejectedBy: string;
        }) => rejectUserDocument(id, rejectionReason, rejectedBy),
        onSuccess: (updatedDoc) => {
            // Invalidate specific document
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER_DOCUMENT.VIEW.ID, updatedDoc._id],
            });
            // Invalidate all documents for this user
            queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey[0] === API_ROUTE.USER_DOCUMENT.ALL.ID &&
                    query.queryKey[1] === updatedDoc.userId,
            });
        },
    });
};

/**
 * Hook: Delete a user document
 */
export const useDeleteUserDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteUserDocument(id),
        onSuccess: (_, id) => {
            // Invalidate specific document
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER_DOCUMENT.VIEW.ID, id],
            });
            // Invalidate all user document lists
            queryClient.invalidateQueries({
                predicate: (query) => query.queryKey[0] === API_ROUTE.USER_DOCUMENT.ALL.ID,
            });
        },
    });
};
