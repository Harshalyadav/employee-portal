import { useAppStore } from "../main.store";

// Save create recipe form
export const saveCreateRecipeForm = (data: Record<string, any>) => {
    useAppStore.getState().setCreateRecipeForm(data);
};

// Clear create recipe form
export const clearCreateRecipeForm = () => {
    useAppStore.getState().resetCreateRecipeForm();
};

// Save edit recipe form
export const saveEditRecipeForm = (data: Record<string, any>) => {
    useAppStore.getState().setEditRecipeForm(data);
};

// Clear edit recipe form
export const clearEditRecipeForm = () => {
    useAppStore.getState().resetEditRecipeForm();
};
