// User Roles - Common across all user types
export type UserRole = "agent" | "builder" | "admin";

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}



export interface PaginatedMeta {
    page: number;
    limit: number;
    total: number;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message?: string;
    data: T[];
    meta: PaginatedMeta;
}

export interface FieldError {
    field: string;
    message: string;
}

export interface ApiError {
    response?: {
        data?: AxiosErrorPayload;

    }
    statusCode?: number;
    message: string | string[];
    errors?: FieldError[] | string[];
}

export interface AxiosErrorPayload {
    success?: false;
    message?: string;
    errors?: FieldError[];
}


export interface createdBy {
    id: string;
    name: string;
}