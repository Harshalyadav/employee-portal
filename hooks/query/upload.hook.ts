'use client';

import {
    uploadMultipleFiles,
    uploadSingleImage,
    uploadSinglePdf,
    uploadSingleVideo,
    uploadSingleFile,
    listFiles,
    getFileUrl,
    getFileMetadata,
    deleteFile,
} from '@/service/upload.service';
import {
    UploadedFile,
    UploadFileDto,
    UploadMultipleFilesDto,
} from '@/types/upload.type';
import {
    useMutation,
    useQuery,
} from '@tanstack/react-query';

// =========================================
// Upload Mutations
// =========================================

/**
 * Hook: Upload single file with optional folder
 * Supports images, videos, documents, etc.
 */
export const useUploadSingleFile = () => {
    return useMutation<UploadedFile, Error, UploadFileDto>({
        mutationFn: uploadSingleFile,
    });
};

/**
 * Hook: Upload single image file
 */
export const useUploadSingleImage = () => {
    return useMutation<UploadedFile, Error, UploadFileDto>({
        mutationFn: uploadSingleImage,
    });
};

/**
 * Hook: Upload multiple files
 */
export const useUploadMultipleFiles = () => {
    return useMutation<UploadedFile[], Error, UploadMultipleFilesDto>({
        mutationFn: uploadMultipleFiles,
    });
};

/**
 * Hook: Upload video file
 */
export const useUploadSingleVideo = () => {
    return useMutation<UploadedFile, Error, UploadFileDto>({
        mutationFn: uploadSingleVideo,
    });
};

/**
 * Hook: Upload PDF/document file
 */
export const useUploadSinglePdf = () => {
    return useMutation<UploadedFile, Error, UploadFileDto>({
        mutationFn: uploadSinglePdf,
    });
};

// =========================================
// File Management Queries & Mutations
// =========================================

/**
 * Hook: List files in a folder/prefix
 */
export const useListFiles = (prefix?: string, enabled: boolean = false) => {
    return useQuery({
        queryKey: ['files', 'list', prefix],
        queryFn: () => listFiles(prefix),
        enabled,
    });
};

/**
 * Hook: Get presigned URL for file (when URL expires)
 */
export const useGetFileUrl = () => {
    return useMutation<string, Error, string>({
        mutationFn: getFileUrl,
    });
};

/**
 * Hook: Get file metadata (size, etag, lastModified)
 */
export const useGetFileMetadata = () => {
    return useMutation({
        mutationFn: getFileMetadata,
    });
};

/**
 * Hook: Delete file from storage
 */
export const useDeleteFile = () => {
    return useMutation<void, Error, string>({
        mutationFn: deleteFile,
    });
};
