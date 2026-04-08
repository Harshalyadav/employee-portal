import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import {
    LotMaster,
    LotMasterFilters,
    LotMastersResponse,
    CreateLotMasterDto,
    UpdateLotMasterDto,
} from "@/types/lot-master.type";

export async function getAllLotMasters(
    filters?: LotMasterFilters
): Promise<LotMastersResponse> {
    const response = await axiosInstance.get<LotMastersResponse>(
        API_ROUTE.LOT_MASTER.ALL.PATH,
        {
            params: {
                search: filters?.search,
                status: filters?.status,
                sortBy: filters?.sortBy,
                sortOrder: filters?.sortOrder,
                page: filters?.page ?? 1,
                limit: filters?.limit ?? 10,
            },
        }
    );
    return response.data;
}

export async function getActiveLotMasters(): Promise<LotMastersResponse> {
    const response = await axiosInstance.get<LotMastersResponse>(
        API_ROUTE.LOT_MASTER.ACTIVE.PATH
    );
    return response.data;
}

export async function getLotMasterById(id: string): Promise<LotMaster> {
    const response = await axiosInstance.get<{ data: LotMaster }>(
        API_ROUTE.LOT_MASTER.VIEW.PATH(id)
    );
    return response.data.data;
}

export async function createLotMaster(
    data: CreateLotMasterDto
): Promise<LotMaster> {
    const response = await axiosInstance.post<{ data: LotMaster }>(
        API_ROUTE.LOT_MASTER.CREATE.PATH,
        data
    );
    return response.data.data;
}

export async function updateLotMaster(
    id: string,
    data: UpdateLotMasterDto
): Promise<LotMaster> {
    const response = await axiosInstance.patch<{ data: LotMaster }>(
        API_ROUTE.LOT_MASTER.UPDATE.PATH(id),
        data
    );
    return response.data.data;
}

export async function deleteLotMaster(id: string): Promise<void> {
    await axiosInstance.delete(API_ROUTE.LOT_MASTER.DELETE.PATH(id));
}
