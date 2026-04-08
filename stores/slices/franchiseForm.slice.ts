import { FranchiseFormState } from "@/types";
import { StateCreator } from "zustand";



export const createFranchiseFormSlice: StateCreator<FranchiseFormState> = (set) => ({
    createFranchise: {},
    editFranchise: {},
    setCreateFranchiseForm: (data) => set((state) => ({ createFranchise: { ...state.createFranchise, ...data } })),
    resetCreateFranchiseForm: () => set({ createFranchise: {} }),
    setEditFranchiseForm: (data) => set((state) => ({ editFranchise: { ...state.editFranchise, ...data } })),
    resetEditFranchiseForm: () => set({ editFranchise: {} }),
});
