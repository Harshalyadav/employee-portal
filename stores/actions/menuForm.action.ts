import { useAppStore } from "../main.store";

// Save create Menu form
export const saveCreateMenuForm = (data: Record<string, any>) => {
    useAppStore.getState().setCreateMenuForm(data);
};

// Clear create Menu form
export const clearCreateMenuForm = () => {
    useAppStore.getState().resetCreateMenuForm();
};

// Save edit Menu form
export const saveEditMenuForm = (data: Record<string, any>) => {
    useAppStore.getState().setEditMenuForm(data);
};

// Clear edit Menu form
export const clearEditMenuForm = () => {
    useAppStore.getState().resetEditMenuForm();
};
