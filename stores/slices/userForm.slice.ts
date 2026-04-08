import { UserFormStepEnum } from "@/types";
import { StateCreator } from "zustand";

export interface UserFormSliceState {
    // User Form State
    formUserId: string | null;
    currentFormStep: UserFormStepEnum;
    isHydrated: boolean;

    // Actions
    setFormUserId: (userId: string) => void;
    setCurrentFormStep: (step: UserFormStepEnum) => void;
    resetUserForm: () => void;
    loadUserFormFromStorage: () => void;
    saveUserFormToStorage: () => void;
    setIsHydrated: (hydrated: boolean) => void;
}

export const createUserFormSlice: StateCreator<UserFormSliceState> = (
    set,
    get,
) => ({
    formUserId: null,
    currentFormStep: UserFormStepEnum.PERSONAL_INFO,
    isHydrated: false,

    setFormUserId: (userId: string) => {
        set({ formUserId: userId });
        // Persist to localStorage immediately
        if (typeof window !== "undefined") {
            localStorage.setItem("form_userId", userId);
            console.log("Saved formUserId to localStorage:", userId);
        }
    },

    setCurrentFormStep: (step: UserFormStepEnum) => {
        set({ currentFormStep: step });
        // Persist to localStorage immediately
        if (typeof window !== "undefined") {
            localStorage.setItem("form_currentStep", step);
            console.log("Saved currentFormStep to localStorage:", step);
        }
    },

    resetUserForm: () => {
        set({
            formUserId: null,
            currentFormStep: UserFormStepEnum.PERSONAL_INFO,
        });
        // Clear localStorage
        if (typeof window !== "undefined") {
            localStorage.removeItem("form_userId");
            localStorage.removeItem("form_currentStep");
            console.log("Reset user form and cleared localStorage");
        }
    },

    loadUserFormFromStorage: () => {
        if (typeof window !== "undefined") {
            const savedUserId = localStorage.getItem("form_userId");
            const savedStep = localStorage.getItem("form_currentStep");

            console.log("Loading from localStorage - userId:", savedUserId, "step:", savedStep);

            const newState: Partial<UserFormSliceState> = {};

            if (savedUserId) {
                newState.formUserId = savedUserId;
            }

            if (savedStep && Object.values(UserFormStepEnum).includes(savedStep as UserFormStepEnum)) {
                newState.currentFormStep = savedStep as UserFormStepEnum;
            }

            newState.isHydrated = true;

            set(newState);
            console.log("Loaded user form from localStorage:", newState);
        }
    },

    saveUserFormToStorage: () => {
        if (typeof window !== "undefined") {
            const state = get();
            if (state.formUserId) {
                localStorage.setItem("form_userId", state.formUserId);
            }
            localStorage.setItem("form_currentStep", state.currentFormStep);
            console.log("Saved user form to localStorage");
        }
    },

    setIsHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
    },
});
