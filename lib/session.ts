// src/utils/session.util.ts
import { setCookie, getCookie, deleteCookie } from "cookies-next";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_ID_KEY = "userId";

const COOKIE_OPTIONS = {
    path: "/",
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
};

export interface SessionTokens {
    accessToken: string;
    refreshToken: string;
    userId: string;
}

// ✅ Save both tokens
export const setSession = ({ accessToken, refreshToken, userId }: SessionTokens) => {
    setCookie(ACCESS_TOKEN_KEY, accessToken, COOKIE_OPTIONS);
    setCookie(REFRESH_TOKEN_KEY, refreshToken, COOKIE_OPTIONS);
    setCookie(USER_ID_KEY, userId, COOKIE_OPTIONS);
};

// ✅ Get both tokens
export const getSession = (): SessionTokens | null => {
    const accessToken = getCookie(ACCESS_TOKEN_KEY);
    const refreshToken = getCookie(REFRESH_TOKEN_KEY);
    const userId = getCookie(USER_ID_KEY)?.toString();

    if (!accessToken || !refreshToken) return null;
    return {
        accessToken: accessToken.toString(),
        refreshToken: refreshToken.toString(),
        userId: userId?.toString() || "",
    };
};

// ✅ Validate Access Token (example JWT expiry check)
export const validateSession = (accessToken?: string): boolean => {
    if (!accessToken) return false;

    try {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        return !isExpired;
    } catch {
        return false;
    }
};

// ✅ Refresh the session (API call)
export const refreshSession = async (): Promise<SessionTokens | null> => {
    const refreshToken = getCookie(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    try {
        // Example: API endpoint to refresh access token
        const res = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) return null;

        const data = await res.json();

        // Expecting: { accessToken, refreshToken }
        setSession({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken ?? refreshToken.toString(),
            userId: getCookie(USER_ID_KEY)?.toString() || "",
        });

        return {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken ?? refreshToken.toString(),
            userId: getCookie(USER_ID_KEY)?.toString() || "",
        };
    } catch (error) {
        console.error("Session refresh failed:", error);
        clearSession();
        return null;
    }
};

// ✅ Clear tokens
export const clearSession = () => {
    deleteCookie(ACCESS_TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
    deleteCookie(USER_ID_KEY);
};
