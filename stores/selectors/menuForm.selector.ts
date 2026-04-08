import { AppState } from "@/types";


export const selectCreateMenuForm = (state: AppState) => state.createMenu;
export const selectEditMenuForm = (state: AppState) => state.editMenu;
