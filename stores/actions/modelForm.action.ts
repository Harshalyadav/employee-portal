import { useAppStore } from "../main.store";

// Save create model form
export const saveCreateModelForm = (data: Record<string, any>) => {
    useAppStore.getState().setCreateModelForm(data);
};

// Clear create model form
export const clearCreateModelForm = () => {
    useAppStore.getState().resetCreateModelForm();
};

// Save edit model form
export const saveEditModelForm = (data: Record<string, any>) => {
    useAppStore.getState().setEditModelForm(data);
};

// Clear edit model form
export const clearEditModelForm = () => {
    useAppStore.getState().resetEditModelForm();
};
