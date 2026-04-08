export interface SwitchBranchRequestDto {
    fromBranchId: string;
    toBranchId: string;
    reason?: string;
}

export interface SwitchBranchUserData {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
    branchId: string;
    companyId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface SwitchBranchResponseDto {
    message: string;
    data: SwitchBranchUserData;
}

export interface BranchInfo {
    _id: string;
    branchName: string;
    branchCode: string;
}

export interface UserInfo {
    _id: string;
    fullName: string;
    email: string;
    employeeId: string;
}

export interface BranchSwitchLogEntry {
    _id: string;
    userId: UserInfo;
    companyId: string;
    fromBranchId: BranchInfo;
    toBranchId: BranchInfo;
    switchedAt: string;
    switchedBy: UserInfo;
    switchType: 'MANUAL' | 'AUTO' | 'ADMIN';
    ipAddress: string;
    userAgent: string;
    reason?: string;
    sessionId: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaginationQueryDto {
    page?: number;
    limit?: number;
}

export interface PaginationMeta {
    total: number;
    page: number;
    pages: number;
    limit?: number;
}

export interface GetUserBranchSwitchLogsResponseDto {
    message: string;
    data: BranchSwitchLogEntry[];
    pagination: PaginationMeta;
}

export interface DateRangeQueryDto extends PaginationQueryDto {
    startDate: string;
    endDate: string;
}
