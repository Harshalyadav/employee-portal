import { clearSession, getSession, refreshSession, SessionTokens, setSession, validateSession } from "@/lib";
import { useAppStore } from "@/stores";
import axios from "axios";
import instance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import { getRole } from "@/service/role.service";


export const login = async (email: string, password: string) => {
    useAppStore.setState({ isLoading: true, error: null });

    try {
        const response = await instance.post(`/api/auth/login`, {
            email,
            password,
        });

        const payload = response.data?.data ?? response.data;
        const accessToken = payload?.access_token ?? payload?.accessToken;
        const refreshToken = payload?.refresh_token ?? payload?.refreshToken ?? "";
        let user = payload?.user;

        console.log("Login payload:", payload);
        if (!accessToken) {
            throw new Error("Access token not found in response");
        }

        // If role is not populated, fetch it separately
        if (user && typeof user.roleId === 'string' && !user.role) {
            try {
                console.log('Role not populated in login response, fetching role:', user.roleId);
                const roleData = await getRole(user.roleId);
                console.log('Fetched role data:', roleData);
                user = { ...user, role: roleData };
            } catch (roleError) {
                console.error('Failed to fetch role during login:', roleError);
                // Continue without role data - permissions will default to false
            }
        }

        setSession({
            accessToken,
            refreshToken,
            userId: user?.id || user?._id || "",
        });

        useAppStore.setState({
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            user,
            loginType: payload?.loginType ?? null,
            error: null,
        });

        // Update axios header with new token
        instance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        return true;
    } catch (error: any) {
        console.error("Login error:", error);

        // Show user-friendly message for invalid credentials (401 or 400 from login)
        const status = error?.response?.status;
        const serverMessage = error?.response?.data?.message || error?.message;
        const message =
            status === 401 || status === 400 || serverMessage?.toLowerCase?.().includes("invalid") || serverMessage?.toLowerCase?.().includes("credential")
                ? "Invalid email or password."
                : serverMessage || "Login failed. Please try again.";

        useAppStore.setState({
            isLoading: false,
            error: message,
        });
        return false;
    }
};

// ✅ Get Current User function
export const getCurrentUser = async (forceRefresh = false) => {
    const { user, accessToken } = useAppStore.getState();

    // If user is already available and no force refresh, skip
    if (user && !forceRefresh) return user;

    useAppStore.setState({ isLoading: true, error: null });

    try {
        // Ensure Authorization header is set with the current access token
        const headers: any = {};
        if (accessToken) {
            headers.Authorization = `Bearer ${accessToken}`;
        }

        const profilePath = API_ROUTE.USER.PROFILE.PATH;

        const response = await instance.get(profilePath, { headers });
        const payload = response.data?.data ?? response.data;
        let userData = payload?.user ?? payload?.data?.user ?? payload;
        const loginType = payload?.loginType ?? payload?.data?.loginType ?? null;

        // If role is not populated, fetch it separately
        if (userData && typeof userData.roleId === 'string' && !userData.role) {
            try {
                console.log('Role not populated in user data, fetching role:', userData.roleId);
                const roleData = await getRole(userData.roleId);
                console.log('Fetched role data:', roleData);
                userData = { ...userData, role: roleData };
            } catch (roleError) {
                console.error('Failed to fetch role:', roleError);
                // Continue without role data - permissions will default to false
            }
        }

        useAppStore.setState({
            isAuthenticated: true,
            user: userData,
            loginType,
            isLoading: false,
            error: null,
        });

        return userData;
    } catch (error: any) {
        console.error("getCurrentUser error:", error);

        // Clear session and redirect to login on any error
        clearSession();
        useAppStore.setState({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: error.response?.data?.message || "Failed to get user data. Please log in again.",
        });

        // Redirect to login page
        if (typeof window !== "undefined") {
            window.location.href = "/home";
        }

        return null;
    }
};

export const resetUser = () => {
    useAppStore.setState({
        user: null,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
    });
};


// ✅ Logout action (clears session cookies + state)
export const logout = async () => {
    try {
        // Call the logout endpoint to clear cookies and server-side session
        await axios.post("/api/auth/logout");
    } catch (error) {
        // Even if the API call fails, we should clear the client-side state
    } finally {
        // Always clear client-side session
        clearSession();
        useAppStore.setState({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
            loginType: null,
        });
    }
};

// ✅ Manually set loading (useful for UI triggers)
export const setLoading = (value: boolean) =>
    useAppStore.setState({ isLoading: value });

// ✅ Auto-restore session (optional helper)
export const restoreSession = () => {
    const session = getSession();
    if (session && validateSession(session.accessToken)) {
        useAppStore.setState({
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            isAuthenticated: true,
        });

        // Optionally fetch fresh user data when restoring session
        // getCurrentUser();
    } else {
        clearSession();
    }
};

// ✅ Refresh Session (uses refreshSession from session.util.ts)
export const refreshAuthSession = async () => {
    useAppStore.setState({ isLoading: true, error: null });

    try {
        const newTokens: SessionTokens | null = await refreshSession();

        if (!newTokens) {
            // ❌ Refresh failed → logout
            clearSession();
            useAppStore.setState({
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
                user: null,
                // error: true,
                errorMsg: "Session expired. Please log in again.",
            });
            return null;
        }

        // ✅ Update Zustand state with new tokens
        useAppStore.setState({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
        });

        console.info("✅ Session successfully refreshed");
        return newTokens;
    } catch (error: any) {

        clearSession();
        useAppStore.setState({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            user: null,
            // error: true,
            errorMsg: "Session refresh failed. Please log in again.",
        });
        return null;
    }
};