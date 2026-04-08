import { z } from 'zod';
import { IBuilder } from "./builder.type";
import { ApiResponse } from "./common.type";
import { User } from "./user.type";

// ---------------------------
// Validation Schemas (Zod)
// ---------------------------

export const loginSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .min(1, 'Email is required')
        .email('Enter a valid email'),
    password: z
        .string({ required_error: 'Password is required' })
        .min(4, 'Password must be at least 4 characters')
        .max(128, 'Password is too long'),
});

export type LoginSchema = z.infer<typeof loginSchema>;

// ---------------------------
// Payloads / DTOs
// ---------------------------

export interface LoginDto {
    email: string;
    password: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
}

export interface LoginSuccessPayload extends AuthTokens {
    message?: string;
    loginType?: string;
    user: User;
}

// ---------------------------
// Responses
// ---------------------------

export interface LoginResponse extends ApiResponse<LoginSuccessPayload> {
    statusCode?: number;
    timestamp?: string;
    error?: string | null;
}

// ---------------------------
// Store State
// ---------------------------


export interface AuthSliceState {
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    loginType?: string | null;
    error: string | null;
    errorMsg?: string | null;
    login: (access: string, refresh: string) => void;
    logout: () => void;
    resetUser: () => void;
    setUser?: (user: User | null) => void;
}