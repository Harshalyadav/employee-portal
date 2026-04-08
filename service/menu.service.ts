import axiosInstance from "@/lib/axios";
import { Menu, MenusResponse, MenuFilters } from "@/types/menu.type";
import { API_ROUTE } from "@/routes/api.route";

export const getAllMenus = async (
    filters?: MenuFilters
): Promise<MenusResponse> => {
    const response = await axiosInstance.get<MenusResponse>(
        API_ROUTE.MENU.ALL.PATH,
        {
            params: {
                search: filters?.search,
                category: filters?.category,
                type: filters?.type,
                status: filters?.status,
                menuFor: filters?.menuFor,
                modelId: filters?.modelId,
                franchiseId: filters?.franchiseId,
                page: filters?.page ?? 1,
                limit: filters?.limit ?? 10,
                sortBy: filters?.sortBy,
                sortOrder: filters?.sortOrder,
            },
        }
    );
    return response.data;
};

export const getMenuById = async (id: string): Promise<Menu> => {
    const response = await axiosInstance.get<Menu>(
        typeof API_ROUTE.MENU.VIEW.PATH === "function"
            ? API_ROUTE.MENU.VIEW.PATH(id)
            : API_ROUTE.MENU.VIEW.PATH
    );
    return response.data;
};

export const createMenu = async (menuData: Partial<Menu>): Promise<Menu> => {
    const response = await axiosInstance.post<Menu>(
        API_ROUTE.MENU.CREATE.PATH,
        menuData
    );
    return response.data;
};

export const updateMenu = async (
    id: string,
    payload: Partial<Menu>
): Promise<Menu> => {
    const response = await axiosInstance.patch<Menu>(
        typeof API_ROUTE.MENU.UPDATE.PATH === "function"
            ? API_ROUTE.MENU.UPDATE.PATH(id)
            : API_ROUTE.MENU.UPDATE.PATH,
        payload
    );
    return response.data;
};

export const deleteMenu = async (id: string): Promise<{ success: boolean }> => {
    const response = await axiosInstance.delete<{ success: boolean }>(
        typeof API_ROUTE.MENU.DELETE.PATH === "function"
            ? API_ROUTE.MENU.DELETE.PATH(id)
            : API_ROUTE.MENU.DELETE.PATH
    );
    return response.data;
};

export const getMenusByModel = async (modelId: string): Promise<Menu[]> => {
    const response = await axiosInstance.get<{ menus: Menu[] }>(
        typeof API_ROUTE.MENU.BY_MODEL.PATH === "function"
            ? API_ROUTE.MENU.BY_MODEL.PATH(modelId)
            : API_ROUTE.MENU.BY_MODEL.PATH
    );
    return response.data.menus || [];
};

export const getMenusByFranchise = async (franchiseId: string): Promise<Menu[]> => {
    const response = await axiosInstance.get<{ menus: Menu[] }>(
        typeof API_ROUTE.MENU.BY_FRANCHISE.PATH === "function"
            ? API_ROUTE.MENU.BY_FRANCHISE.PATH(franchiseId)
            : API_ROUTE.MENU.BY_FRANCHISE.PATH
    );
    return response.data.menus || [];
};
