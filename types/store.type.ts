import { AuthSliceState } from "./auth.type";
import { FranchiseFormState } from "./franchise.type";
import { MenuFormStateZ } from "./menu.type";
import { ModelFormStateZ } from "./model.type";
import { RecipeFormStateZ } from "./recipe.type";
import { UserFormSliceState } from "@/stores/slices/userForm.slice";



// Combine types
export interface AppState extends AuthSliceState, ModelFormStateZ, MenuFormStateZ, RecipeFormStateZ, FranchiseFormState, UserFormSliceState { }