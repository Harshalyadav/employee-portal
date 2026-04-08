import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import { Franchise, FranchisesResponse, FranchiseFilters } from "@/types/franchise.type";

export async function getAllFranchises(
    filters?: FranchiseFilters
): Promise<FranchisesResponse> {
    const response = await axiosInstance.get<FranchisesResponse>(API_ROUTE.FRANCHISE.ALL.PATH, {
        params: {
            search: filters?.search,
            status: filters?.status,
            city: filters?.city,
            modelId: filters?.modelId,
            sortBy: filters?.sortBy,
            sortOrder: filters?.sortOrder,
            page: filters?.page ?? 1,
            limit: filters?.limit ?? 10,
        },
    });

    return response.data;
}

export async function getFranchiseById(id: string): Promise<Franchise> {
    const response = await axiosInstance.get<Franchise>(API_ROUTE.FRANCHISE.VIEW.PATH(id));
    return response.data;
}

export async function createFranchise(data: Partial<Franchise>): Promise<Franchise> {
    const response = await axiosInstance.post<Franchise>(API_ROUTE.FRANCHISE.CREATE.PATH, data);
    return response.data;
}

export async function updateFranchise(
    id: string,
    data: Partial<Franchise>
): Promise<Franchise> {
    const response = await axiosInstance.put<Franchise>(API_ROUTE.FRANCHISE.UPDATE.PATH(id), data);
    return response.data;
}

export async function deleteFranchise(id: string): Promise<void> {
    await axiosInstance.delete(API_ROUTE.FRANCHISE.DELETE.PATH(id));
}
