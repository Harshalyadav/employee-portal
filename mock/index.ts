
import { franchisesData } from "./franchises.mock";
import { stocksData } from "./stocks.mock";
import { recipesData } from "./recipes.mock";
import { recipeCategoriesData } from "./recipe-categories.mock";
import { menusData } from "./menus.mock";
import usersData from "../data/users.json";

export { MOCK_BUILDER } from "./_BUILDER_";
export { MOCK_PROPERTY } from "./_PROPERTY_";
export { MOCK_PROJECT } from "./_PROJECT_";
export { MOCK_AGENT } from "./_AGENT_";
export { MOCK_BOUNTY } from "./_BOUNTY_";
export { MOCK_INQUIRY } from "./_INQUIRY_";
export const MOCK_FRANCHISES = franchisesData;
export const MOCK_STOCKS = stocksData;
export const MOCK_RECIPES = recipesData;
export const MOCK_RECIPE_CATEGORIES = recipeCategoriesData;
export const MOCK_MENUS = menusData;
export const MOCK_USERS = usersData;
export { MOCK_WAREHOUSE } from "./warehouse";
export * from "./raw-material.mock";