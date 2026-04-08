import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AdvancePayrollService, { AdvanceFilters } from "@/service/advance-payroll.service";
import { CreateAdvanceSchema, IPaginatedAdvancesResponse, IAdvancePayroll, UpdateAdvanceStatusSchema } from "@/types";

export interface UpdateAdvancePayload {
    amount?: number;
    currency?: string;
    remark?: string;
    note?: string;
    advanceDate?: string;
    paymentMode?: string;
    bankAccountId?: string;
}

const advanceKeys = {
    all: ["advance"] as const,
    lists: () => [...advanceKeys.all, "list"] as const,
    list: (filters: AdvanceFilters | undefined) => [...advanceKeys.lists(), filters ?? {}] as const,
    details: () => [...advanceKeys.all, "detail"] as const,
    detail: (id: string) => [...advanceKeys.details(), id] as const,
    byUser: (userId: string) => [...advanceKeys.all, "byUser", userId] as const,
};

export function useInfiniteAdvances(limit: number = 10, filters?: AdvanceFilters) {
    return useInfiniteQuery({
        queryKey: advanceKeys.list(filters),
        queryFn: ({ pageParam = 1 }) => AdvancePayrollService.getAllAdvances(pageParam, limit, filters),
        initialPageParam: 1,
        refetchOnWindowFocus: false,
        getNextPageParam: (lastPage) => {
            const p = lastPage as IPaginatedAdvancesResponse & { page?: number; pages?: number };
            const meta = p.pagination ?? { page: p.page ?? 1, pages: p.pages ?? 1 };
            const currentPage = meta?.page ?? 1;
            const totalPages = meta?.pages ?? 1;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
    });
}

export function useInfiniteAdvancesByUser(userId: string, limit: number = 10) {
    return useInfiniteQuery({
        queryKey: advanceKeys.byUser(userId),
        queryFn: ({ pageParam = 1 }) => AdvancePayrollService.getAdvancesByUserId(userId, pageParam, limit),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const meta = (lastPage as IPaginatedAdvancesResponse).pagination;
            const currentPage = meta?.page ?? 1;
            const totalPages = meta?.pages ?? 1;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
        enabled: !!userId,
    });
}

export function useAdvance(id?: string) {
    return useQuery({
        queryKey: advanceKeys.detail(id || ""),
        queryFn: () => AdvancePayrollService.getAdvanceById(id!),
        enabled: !!id,
    });
}

export function useCreateAdvance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateAdvanceSchema) => AdvancePayrollService.createAdvance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: advanceKeys.lists() });
            toast.success("Advance created successfully");
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message ?? error?.message ?? "Failed to create advance";
            toast.error(message);
        },
    });
}

export function useUpdateAdvanceStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAdvanceStatusSchema }) =>
            AdvancePayrollService.updateAdvanceStatus(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: advanceKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: advanceKeys.lists() });
            toast.success("Advance status updated successfully");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Failed to update advance status";
            toast.error(message);
        },
    });
}

export function useUpdateAdvance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAdvancePayload }) =>
            AdvancePayrollService.updateAdvance(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: advanceKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: advanceKeys.lists() });
            toast.success("Advance updated successfully");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Failed to update advance";
            toast.error(message);
        },
    });
}

export function useDeleteAdvance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => AdvancePayrollService.deleteAdvance(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: advanceKeys.lists() });
            toast.success("Advance deleted successfully");
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message ?? error?.message ?? "Failed to delete advance";
            toast.error(message);
        },
    });
}
