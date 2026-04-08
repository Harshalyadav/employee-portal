import axiosClient from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import {
    UploadSingleFileResponse,
    UploadMultipleFilesResponse,
    UploadFileDto,
    UploadMultipleFilesDto,
    ListFilesResponse,
    GetFileUrlResponse,
    GetFileMetadataResponse,
    DeleteFileResponse,
    UploadedFile,
} from '@/types/upload.type';

/**
 * Upload a single file with optional folder parameter
 * POST /api/upload/single
 */
export const uploadSingleFile = async (
    data: UploadFileDto
): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', data.file);

    const res = await axiosClient.post<UploadSingleFileResponse>(
        API_ROUTE.S3.UPLOAD_SINGLE_IMG.PATH,
        formData,
        {
            params: data.folder ? { folder: data.folder } : undefined,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return res.data.data;
};

/**
 * Upload a single image file
 * POST /api/upload/single?folder=images
 */
export const uploadSingleImage = async (
    data: UploadFileDto
): Promise<UploadedFile> => {
    return uploadSingleFile({
        ...data,
        folder: data.folder || 'images',
    });
};

/**
 * Upload a single video file
 * POST /api/upload/single?folder=videos
 */
export const uploadSingleVideo = async (
    data: UploadFileDto
): Promise<UploadedFile> => {
    return uploadSingleFile({
        ...data,
        folder: data.folder || 'videos',
    });
};

/**
 * Upload a single PDF/document file
 * POST /api/upload/single?folder=documents
 */
export const uploadSinglePdf = async (
    data: UploadFileDto
): Promise<UploadedFile> => {
    return uploadSingleFile({
        ...data,
        folder: data.folder || 'documents',
    });
};

/**
 * Upload multiple files with optional folder parameter
 * POST /api/upload/multiple
 */
export const uploadMultipleFiles = async (
    data: UploadMultipleFilesDto
): Promise<UploadedFile[]> => {
    const formData = new FormData();

    // Append all files
    data.files.forEach((file) => {
        formData.append('files', file);
    });

    const res = await axiosClient.post<UploadMultipleFilesResponse>(
        API_ROUTE.S3.UPLOAD_MULTIPLE.PATH,
        formData,
        {
            params: data.folder ? { folder: data.folder } : undefined,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return res.data.data;
};

/**
 * List all files with optional prefix filter
 * GET /api/upload/list?prefix=documents
 */
export const listFiles = async (prefix?: string): Promise<string[]> => {
    const res = await axiosClient.get<ListFilesResponse>(
        API_ROUTE.S3.LIST_FILES.PATH,
        {
            params: prefix ? { prefix } : undefined,
        }
    );
    return res.data.data;
};

/**
 * Get presigned URL for a file (when URL expires after 24 hours)
 * GET /api/upload/{filename}/url
 */
export const getFileUrl = async (filename: string): Promise<string> => {
    const res = await axiosClient.get<GetFileUrlResponse>(
        API_ROUTE.S3.GET_FILE_URL.PATH(filename)
    );
    return res.data.data.url;
};

/**
 * Get file metadata (size, etag, lastModified)
 * GET /api/upload/{filename}/metadata
 */
export const getFileMetadata = async (filename: string) => {
    const res = await axiosClient.get<GetFileMetadataResponse>(
        API_ROUTE.S3.GET_FILE_METADATA.PATH(filename)
    );
    return res.data.data;
};

/**
 * Delete a file from storage
 * DELETE /api/upload/{filename}
 */
export const deleteFile = async (filename: string): Promise<void> => {
    await axiosClient.delete<DeleteFileResponse>(
        API_ROUTE.S3.DELETE_FILE.PATH(filename)
    );
};


