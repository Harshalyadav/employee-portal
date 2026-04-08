import { AppState } from "@/types";


export const selectCreateModelForm = (state: AppState) => state.create;
export const selectEditModelForm = (state: AppState) => state.edit;
