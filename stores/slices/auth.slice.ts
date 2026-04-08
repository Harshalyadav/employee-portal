import { AuthSliceState } from "@/types";
import { StateCreator } from "zustand";

export const createAuthSlice: StateCreator<AuthSliceState> = (set) => ({
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    user: null,
    loginType: null,
    errorMsg: null,

    login: (access: string, refresh: string) =>
        set({
            accessToken: access,
            refreshToken: refresh,
            isAuthenticated: true,
        }),

    logout: () =>
        set({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
            loginType: null,
        }),

    resetUser: () =>
        set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: null,
            loginType: null,
        }),

    setUser: (user) => set({ user }),
});