import { MenuFormStateZ } from "@/types";
import { StateCreator } from "zustand";



export const createMenuFormSlice: StateCreator<MenuFormStateZ> = (set) => ({
    createMenu: {},
    editMenu: {},
    setCreateMenuForm: (data) => set((state) => ({ createMenu: { ...state.createMenu, ...data } })),
    resetCreateMenuForm: () => set({ createMenu: {} }),
    setEditMenuForm: (data) => set((state) => ({ editMenu: { ...state.editMenu, ...data } })),
    resetEditMenuForm: () => set({ editMenu: {} }),
});
