// src/store/main.store.ts
import { create } from "zustand";
import { createAuthSlice, createMenuFormSlice, createModelFormSlice, createRecipeFormSlice, createFranchiseFormSlice, createUserFormSlice } from "./slices";
import { AppState } from "@/types";


export const useAppStore = create<AppState>()((...a) => ({
    ...createAuthSlice(...a),
    ...createModelFormSlice(...a),
    ...createMenuFormSlice(...a),
    ...createRecipeFormSlice(...a),
    ...createFranchiseFormSlice(...a),
    ...createUserFormSlice(...a),
}));
