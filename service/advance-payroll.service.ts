import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import {
    IPaginatedAdvancesResponse,
    IAdvancePayroll,
    CreateAdvanceSchema,
    UpdateAdvanceStatusSchema,
} from "@/types";

export interface AdvanceFilters {
    search?: string;
    paymentMode?: string;
    currency?: string;
    branchId?: string;
    branchIds?: string[];
}

const AdvancePayrollService = {
    async getAllAdvances(
        page: number = 1,
        limit: number = 10,
        filters?: AdvanceFilters,
    ): Promise<IPaginatedAdvancesResponse> {
        const params: Record<string, string | number> = { page, limit };
        if (filters?.search?.trim()) params.search = filters.search.trim();
        if (filters?.paymentMode?.trim()) params.paymentMode = filters.paymentMode.trim();
        if (filters?.currency?.trim()) params.currency = filters.currency.trim();
        if (filters?.branchId?.trim()) params.branchId = filters.branchId.trim();
        if (filters?.branchIds?.length) params.branchIds = filters.branchIds.join(",");
        const res = await axiosInstance.get<IPaginatedAdvancesResponse>(API_ROUTE.ADVANCE_PAYROLL.ALL.PATH, {
            params,
        });
        return res.data;
    },

    async getAdvancesByUserId(userId: string, page: number = 1, limit: number = 10): Promise<IPaginatedAdvancesResponse> {
        const res = await axiosInstance.get<IPaginatedAdvancesResponse>(API_ROUTE.ADVANCE_PAYROLL.BY_USER.PATH(userId), {
            params: { page, limit },
        });
        return res.data;
    },

    async getAdvanceById(id: string): Promise<IAdvancePayroll> {
        const res = await axiosInstance.get<{ data: IAdvancePayroll }>(API_ROUTE.ADVANCE_PAYROLL.VIEW.PATH(id));
        return (res.data as any)?.data ?? (res.data as any);
    },

    async createAdvance(data: CreateAdvanceSchema): Promise<IAdvancePayroll> {
        const res = await axiosInstance.post<{ data: IAdvancePayroll }>(API_ROUTE.ADVANCE_PAYROLL.CREATE.PATH, data);
        return (res.data as any)?.data ?? (res.data as any);
    },

    async updateAdvanceStatus(id: string, data: UpdateAdvanceStatusSchema): Promise<IAdvancePayroll> {
        const res = await axiosInstance.patch<{ data: IAdvancePayroll }>(API_ROUTE.ADVANCE_PAYROLL.UPDATE_STATUS.PATH(id), data);
        return (res.data as any)?.data ?? (res.data as any);
    },

    async updateAdvance(
        id: string,
        data: {
            amount?: number;
            currency?: string;
            remark?: string;
            note?: string;
            advanceDate?: string;
            paymentMode?: string;
            bankAccountId?: string;
        },
    ): Promise<IAdvancePayroll> {
        const res = await axiosInstance.patch<{ data: IAdvancePayroll }>(API_ROUTE.ADVANCE_PAYROLL.UPDATE.PATH(id), data);
        return (res.data as any)?.data ?? (res.data as any);
    },

    async deleteAdvance(id: string): Promise<void> {
        await axiosInstance.delete(API_ROUTE.ADVANCE_PAYROLL.DELETE.PATH(id));
    },
};

export default AdvancePayrollService;
