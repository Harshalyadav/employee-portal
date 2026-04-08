"use client";

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    switchUserBranch,
    getUserBranchSwitchLogs,
    getBranchSwitchLogs,
    getCompanyBranchSwitchLogs,
    getDateRangeBranchSwitchLogs,
} from "@/service/branch-switch.service";
import {
    SwitchBranchRequestDto,
    PaginationQueryDto,
    DateRangeQueryDto
} from "@/types";
import { API_ROUTE } from "@/routes";
import { toast } from "sonner";

/**
 * Hook: Switch user branch
 */
export const useSwitchUserBranch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: SwitchBranchRequestDto }) =>
            switchUserBranch(userId, data),
        onSuccess: (response, variables) => {
            toast.success(response.message || "Branch switched successfully");

            // Invalidate user data
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.VIEW.ID, variables.userId],
            });

            // Invalidate branch switch logs for this user
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.BRANCH_SWITCH.GET_USER_LOGS.ID, variables.userId],
            });

            // Invalidate all users list
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.ALL.ID],
            });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to switch branch");
        },
    });
};

/**
 * Hook: Get user branch switch logs with pagination
 */
export const useUserBranchSwitchLogs = (
    userId: string,
    params?: PaginationQueryDto
) => {
    return useQuery({
        queryKey: [API_ROUTE.BRANCH_SWITCH.GET_USER_LOGS.ID, userId, params],
        queryFn: () => getUserBranchSwitchLogs(userId, params),
        enabled: !!userId,
    });
};

/**
 * Hook: Get branch switch logs with pagination
 */
export const useBranchSwitchLogs = (
    branchId: string,
    params?: PaginationQueryDto
) => {
    return useQuery({
        queryKey: [API_ROUTE.BRANCH_SWITCH.GET_BRANCH_LOGS.ID, branchId, params],
        queryFn: () => getBranchSwitchLogs(branchId, params),
        enabled: !!branchId,
    });
};

/**
 * Hook: Get company branch switch logs with pagination
 */
export const useCompanyBranchSwitchLogs = (
    companyId: string,
    params?: PaginationQueryDto
) => {
    return useQuery({
        queryKey: [API_ROUTE.BRANCH_SWITCH.GET_COMPANY_LOGS.ID, companyId, params],
        queryFn: () => getCompanyBranchSwitchLogs(companyId, params),
        enabled: !!companyId,
    });
};

/**
 * Hook: Get date range branch switch logs with pagination
 */
export const useDateRangeBranchSwitchLogs = (
    params: DateRangeQueryDto
) => {
    return useQuery({
        queryKey: [API_ROUTE.BRANCH_SWITCH.GET_DATE_RANGE_LOGS.ID, params],
        queryFn: () => getDateRangeBranchSwitchLogs(params),
        enabled: !!(params.startDate && params.endDate),
    });
};
