import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import { ScalingDriver, RecipeMeta } from "@/types/recipe.type";

export interface ScalingDriverFilters {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface ScalingDriversResponse {
    success: boolean;
    message: string;
    items: ScalingDriver[];
    meta: RecipeMeta;
}

export const getAllScalingDrivers = async (
    filters?: ScalingDriverFilters
): Promise<ScalingDriversResponse> => {
    const response = await axiosInstance.get<ScalingDriversResponse>(
        API_ROUTE.RECIPE_SCALING_DRIVER.ALL.PATH,
        {
            params: {
                search: filters?.search,
                status: filters?.status,
                page: filters?.page ?? 1,
                limit: filters?.limit ?? 10,
                sortBy: filters?.sortBy,
                sortOrder: filters?.sortOrder,
            },
        }
    );
    return response.data;
};

export const getScalingDriverById = async (id: string): Promise<ScalingDriver> => {
    const response = await axiosInstance.get<ScalingDriver>(
        API_ROUTE.RECIPE_SCALING_DRIVER.VIEW.PATH(id)
    );
    return response.data;
};

export const createScalingDriver = async (
    payload: Partial<ScalingDriver>
): Promise<ScalingDriver> => {
    const response = await axiosInstance.post<ScalingDriver>(
        API_ROUTE.RECIPE_SCALING_DRIVER.CREATE.PATH,
        payload
    );
    return response.data;
};

export const updateScalingDriver = async (
    id: string,
    payload: Partial<ScalingDriver>
): Promise<ScalingDriver> => {
    const response = await axiosInstance.put<ScalingDriver>(
        API_ROUTE.RECIPE_SCALING_DRIVER.UPDATE.PATH(id),
        payload
    );
    return response.data;
};

export const deleteScalingDriver = async (
    id: string
): Promise<{ success: boolean }> => {
    const response = await axiosInstance.delete<{ success: boolean }>(
        API_ROUTE.RECIPE_SCALING_DRIVER.DELETE.PATH(id)
    );
    return response.data;
};
