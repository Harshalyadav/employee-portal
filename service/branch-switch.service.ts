import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import {
    SwitchBranchRequestDto,
    SwitchBranchResponseDto,
    GetUserBranchSwitchLogsResponseDto,
    PaginationQueryDto,
    DateRangeQueryDto
} from "@/types";

/**
 * Switch a user to a different branch
 */
export async function switchUserBranch(
    userId: string,
    data: SwitchBranchRequestDto
): Promise<SwitchBranchResponseDto> {
    const response = await axiosInstance.patch<SwitchBranchResponseDto>(
        API_ROUTE.BRANCH_SWITCH.SWITCH_USER_BRANCH.PATH(userId),
        data
    );
    return response.data;
}

/**
 * Get branch switch logs for a specific user
 */
export async function getUserBranchSwitchLogs(
    userId: string,
    params?: PaginationQueryDto
): Promise<GetUserBranchSwitchLogsResponseDto> {
    const response = await axiosInstance.get<GetUserBranchSwitchLogsResponseDto>(
        API_ROUTE.BRANCH_SWITCH.GET_USER_LOGS.PATH(userId),
        { params }
    );
    return response.data;
}

/**
 * Get branch switch logs for a specific branch
 */
export async function getBranchSwitchLogs(
    branchId: string,
    params?: PaginationQueryDto
): Promise<GetUserBranchSwitchLogsResponseDto> {
    const response = await axiosInstance.get<GetUserBranchSwitchLogsResponseDto>(
        API_ROUTE.BRANCH_SWITCH.GET_BRANCH_LOGS.PATH(branchId),
        { params }
    );
    return response.data;
}

/**
 * Get branch switch logs for a company
 */
export async function getCompanyBranchSwitchLogs(
    companyId: string,
    params?: PaginationQueryDto
): Promise<GetUserBranchSwitchLogsResponseDto> {
    const response = await axiosInstance.get<GetUserBranchSwitchLogsResponseDto>(
        API_ROUTE.BRANCH_SWITCH.GET_COMPANY_LOGS.PATH(companyId),
        { params }
    );
    return response.data;
}

/**
 * Get branch switch logs for a date range
 */
export async function getDateRangeBranchSwitchLogs(
    params: DateRangeQueryDto
): Promise<GetUserBranchSwitchLogsResponseDto> {
    const response = await axiosInstance.get<GetUserBranchSwitchLogsResponseDto>(
        API_ROUTE.BRANCH_SWITCH.GET_DATE_RANGE_LOGS.PATH,
        { params }
    );
    return response.data;
}
