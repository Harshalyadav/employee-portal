import { useAppStore } from "../main.store";

// Save create franchise form
export const saveCreateFranchiseForm = (data: Record<string, any>) => {
    useAppStore.getState().setCreateFranchiseForm(data);
};

// Clear create franchise form
export const clearCreateFranchiseForm = () => {
    useAppStore.getState().resetCreateFranchiseForm();
};

// Save edit franchise form
export const saveEditFranchiseForm = (data: Record<string, any>) => {
    useAppStore.getState().setEditFranchiseForm(data);
};

// Clear edit franchise form
export const clearEditFranchiseForm = () => {
    useAppStore.getState().resetEditFranchiseForm();
};
