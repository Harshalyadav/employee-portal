import { ModelFormStateZ } from "@/types/model.type";
import { StateCreator } from "zustand";



export const createModelFormSlice: StateCreator<ModelFormStateZ> = (set) => ({
    create: {},
    edit: {},
    setCreateModelForm: (data) => set((state) => ({ create: { ...state.create, ...data } })),
    resetCreateModelForm: () => set({ create: {} }),
    setEditModelForm: (data) => set((state) => ({ edit: { ...state.edit, ...data } })),
    resetEditModelForm: () => set({ edit: {} }),
});
