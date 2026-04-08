import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import { Model, ModelsResponse, ModelFilters, EditModelDto, CreateModelDto } from "@/types/model.type";

/**
 * Get all models with filters and pagination (API)
 */
export const getAllModels = async (filters?: ModelFilters): Promise<ModelsResponse> => {
    const response = await axiosInstance.get<ModelsResponse>(
        API_ROUTE.MODEL.ALL.PATH,
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

/**
 * Get model by ID (API)
 */
export const getModelById = async (id: string): Promise<Model> => {
    const response = await axiosInstance.get<Model>(
        API_ROUTE.MODEL.VIEW.PATH(id)
    );
    return response.data;
};



/**
 * Get model by ID (API)
 */
export const getModelByFranchiseId = async (id: string): Promise<Model> => {
    const response = await axiosInstance.get<Model>(
        API_ROUTE.MODEL.BY_FRANCHISE.PATH(id)
    );
    return response.data;
};


/**
 * Create a new model (API)
 */
export const createModel = async (modelData: CreateModelDto): Promise<Model> => {
    const response = await axiosInstance.post<Model>(
        API_ROUTE.MODEL.CREATE.PATH,
        modelData
    );
    return response.data;
};

/**
 * Update model (API)
 */
export const updateModel = async (
    id: string,
    payload: EditModelDto
): Promise<Model> => {
    const response = await axiosInstance.patch<Model>(
        API_ROUTE.MODEL.UPDATE.PATH(id),
        payload
    );
    return response.data;
};

/**
 * Delete model (API)
 */
export const deleteModel = async (id: string): Promise<{ success: boolean }> => {
    const response = await axiosInstance.delete<{ success: boolean }>(
        API_ROUTE.MODEL.DELETE.PATH(id)
    );
    return response.data;
};
