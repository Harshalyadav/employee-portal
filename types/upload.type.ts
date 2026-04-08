import { ApiResponse } from "./common.type";

// ---------------------------
// Upload Response Types
// ---------------------------

/**
 * File upload response structure from API
 */
export interface UploadedFile {
    url: string; // Presigned URL to access the file (valid for 24 hours)
    filename: string; // Full path to file (e.g., "documents/1705763200000.pdf")
    size: number; // File size in bytes
    mimeType: string; // MIME type (e.g., "application/pdf")
}

/**
 * File metadata response structure
 */
export interface FileMetadata {
    name: string;
    etag: string;
    lastModified: Date;
    size: number;
}

// ---------------------------
// API Response Types
// ---------------------------

/**
 * Single file upload API response
 */
export interface UploadSingleFileResponse {
    message: 'File uploaded successfully';
    data: UploadedFile;
}

/**
 * Multiple files upload API response
 */
export interface UploadMultipleFilesResponse {
    message: 'Files uploaded successfully';
    data: UploadedFile[];
}

/**
 * List files API response
 */
export interface ListFilesResponse {
    message: 'Files retrieved successfully';
    data: string[]; // Array of file paths
}

/**
 * Get file URL API response (for when presigned URL expires)
 */
export interface GetFileUrlResponse {
    message: 'File URL retrieved successfully';
    data: {
        url: string;
    };
}

/**
 * Get file metadata API response
 */
export interface GetFileMetadataResponse {
    message: 'File metadata retrieved successfully';
    data: FileMetadata;
}

/**
 * Delete file API response
 */
export interface DeleteFileResponse {
    message: 'File deleted successfully';
}

// ---------------------------
// Request/Payload Types
// ---------------------------

/**
 * Single file upload request payload
 */
export interface UploadFileDto {
    file: File;
    folder?: string; // Optional folder path (e.g., "documents", "company-documents")
}

/**
 * Multiple files upload request payload
 */
export interface UploadMultipleFilesDto {
    files: File[];
    folder?: string; // Optional folder path
}

// ---------------------------
// Deprecated types (kept for backward compatibility)
// ---------------------------

export interface IUploadedFile {
    filename: string;
    path: string;
    size: number;
    createdAt: string;
    updatedAt: string;
    type: string;
}

export type SingleUploadResponse = UploadSingleFileResponse;
export type MultipleUploadResponse = UploadMultipleFilesResponse;
