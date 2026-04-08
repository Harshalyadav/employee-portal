import { RecipeFormStateZ } from "@/types/recipe.type";
import { StateCreator } from "zustand";

export const createRecipeFormSlice: StateCreator<RecipeFormStateZ> = (set) => ({
    createRecipeForm: {},
    editRecipeForm: {},
    setCreateRecipeForm: (data) => set((state) => ({ createRecipeForm: { ...state.createRecipeForm, ...data } })),
    resetCreateRecipeForm: () => set({ createRecipeForm: {} }),
    setEditRecipeForm: (data) => set((state) => ({ editRecipeForm: { ...state.editRecipeForm, ...data } })),
    resetEditRecipeForm: () => set({ editRecipeForm: {} }),
});
