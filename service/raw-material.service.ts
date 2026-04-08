import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import { RawMaterial, RawMaterialsResponse, RawMaterialFilters } from "@/types/raw-material.type";

export const getAllRawMaterials = async (filters?: RawMaterialFilters): Promise<RawMaterialsResponse> => {
    const response = await axiosInstance.get<RawMaterialsResponse>(API_ROUTE.RAW_MATERIAL.ALL.PATH, {
        params: {
            search: filters?.search,
            category: filters?.category,
            status: filters?.status,
            sortBy: filters?.sortBy,
            sortOrder: filters?.sortOrder,
            page: filters?.page ?? 1,
            limit: filters?.limit ?? 10,
        },
    });
    return response.data;
};

export const getRawMaterialById = async (id: string): Promise<RawMaterial | null> => {
    const response = await axiosInstance.get<RawMaterial>(API_ROUTE.RAW_MATERIAL.VIEW.PATH(id));
    return response.data;
};

export const createRawMaterial = async (rawMaterialData: Partial<RawMaterial>): Promise<RawMaterial> => {
    const response = await axiosInstance.post<RawMaterial>(API_ROUTE.RAW_MATERIAL.CREATE.PATH, rawMaterialData);
    return response.data;
};

export const updateRawMaterial = async (
    id: string,
    payload: Partial<RawMaterial>
): Promise<RawMaterial> => {
    const response = await axiosInstance.put<RawMaterial>(API_ROUTE.RAW_MATERIAL.UPDATE.PATH(id), payload);
    return response.data;
};

export const deleteRawMaterial = async (id: string): Promise<{ success: boolean }> => {
    const response = await axiosInstance.delete<{ success: boolean }>(API_ROUTE.RAW_MATERIAL.DELETE.PATH(id));
    return response.data;
};
