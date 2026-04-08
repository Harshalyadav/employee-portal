import { User, UsersResponse, UserFilters, IUser, ICreateUserRequest, IUpdateUserRequest, IPaginatedUsersResponse, PersonalInfoSchema, ContactInfoSchema, EmploymentInfoSchema, DocumentUploadSchema, ReviewSchema, FormStepResponseData } from "@/types";
import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";

const mockDelay = (ms: number = 500) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const normalizeEmailValue = (email?: string) => {
    const trimmed = String(email || "").trim();
    return trimmed ? trimmed.toLowerCase() : trimmed;
};

const withNormalizedEmail = <T extends { email?: string }>(payload: T): T => {
    if (!Object.prototype.hasOwnProperty.call(payload, "email")) {
        return payload;
    }

    return {
        ...payload,
        email: normalizeEmailValue(payload.email),
    };
};

/**
 * Get all users with filtering, sorting, and pagination (New API)
 */
export async function getUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    roleId?: string,
    nationality?: string,
    docType?: string,
    companyId?: string,
    branchId?: string,
    branchIds?: string[],
    isActive?: boolean
): Promise<IPaginatedUsersResponse> {
    const params: Record<string, unknown> = {
        page,
        limit,
        search,
        roleId,
        nationality,
        docType,
        companyId,
        isActive,
    };
    if (branchIds?.length) {
        params.branchIds = branchIds.join(",");
    } else if (branchId) {
        params.branchId = branchId;
    }
    const response = await axiosInstance.get<IPaginatedUsersResponse>(
        API_ROUTE.USER.ALL.PATH,
        { params }
    );
    return response.data;
}

/**
 * Get users by company ID (New API)
 */
export async function getUsersByCompany(
    companyId: string,
    page: number = 1,
    limit: number = 10
): Promise<IPaginatedUsersResponse> {
    const response = await axiosInstance.get<IPaginatedUsersResponse>(
        API_ROUTE.USER.BY_COMPANY.PATH(companyId),
        {
            params: { page, limit },
        }
    );
    return response.data;
}

/**
 * Get users by branch ID (New API)
 */
export async function getUsersByBranch(
    branchId: string,
    page: number = 1,
    limit: number = 10
): Promise<IPaginatedUsersResponse> {
    const response = await axiosInstance.get<IPaginatedUsersResponse>(
        API_ROUTE.USER.BY_BRANCH.PATH(branchId),
        {
            params: { page, limit },
        }
    );
    return response.data;
}

/**
 * Get user by ID (New API)
 */
export async function getUser(id: string): Promise<IUser> {
    const response = await axiosInstance.get<{ data: IUser }>(
        API_ROUTE.USER.VIEW.PATH(id)
    );
    return response.data.data;
}

/**
 * Create a new user (New API)
 */
export async function createNewUser(data: ICreateUserRequest): Promise<IUser> {
    const response = await axiosInstance.post<{ data: IUser }>(
        API_ROUTE.USER.CREATE.PATH,
        withNormalizedEmail(data)
    );
    return response.data.data;
}

/**
 * Bulk import users
 */
export async function bulkImportUsers(data: any[]): Promise<any> {
    const response = await axiosInstance.post(
        API_ROUTE.USER.BULK_IMPORT.PATH,
        { users: data }
    );
    return response.data;
}

/**
 * Update user (New API)
 */
export async function updateExistingUser(
    id: string,
    data: IUpdateUserRequest
): Promise<IUser> {
    const response = await axiosInstance.patch<{ data: IUser }>(
        API_ROUTE.USER.UPDATE.PATH(id),
        withNormalizedEmail(data)
    );
    return response.data.data;
}

/**
 * Delete user (New API)
 */
export async function deleteExistingUser(id: string): Promise<void> {
    await axiosInstance.delete(API_ROUTE.USER.DELETE.PATH(id));
}

/**
 * Get all users as a flat array (no pagination, high limit) — used for Visa Manager merge.
 *
 * Actual API response shape:
 *   { success: true, statusCode: 200, message: "...", data: [...users], pagination: {...} }
 *
 * axiosInstance wraps this in response.data, so:
 *   response.data         = { success, statusCode, message, data: [...], pagination }
 *   response.data.data    = [...users]  ← this is what we want
 */
export async function getAllUsersFlat(branchId?: string): Promise<User[]> {
    const params: Record<string, any> = { page: 1, limit: 1000 };

    // Use the specific branch endpoint if a branch is selected
    const url = branchId
        ? API_ROUTE.USER.BY_BRANCH.PATH(branchId)
        : API_ROUTE.USER.ALL.PATH;

    const response = await axiosInstance.get(url, { params });

    // response.data is the full API response body
    const body: any = response.data;
    // The users array is in body.data (matches the documented API shape)
    const users = body?.data ?? body?.users ?? body?.items ?? [];
    return Array.isArray(users) ? users : [];
}

// ============ LEGACY API METHODS (Backward Compatibility) ============

/**
 * Get all users with filtering, sorting, and pagination
 */
export async function getAllUsers(
    filters?: UserFilters
): Promise<UsersResponse> {
    const response = await axiosInstance.get<UsersResponse>(
        API_ROUTE.USER.ALL.PATH,
        {
            params: {
                search: filters?.search,
                // sortBy: filters?.sortBy,
                // sortOrder: filters?.sortOrder,
                // order: filters?.order ?? filters?.sortOrder ?? "desc",
                page: filters?.page ?? 1,
                limit: filters?.limit ?? 10,
                role: filters?.role,
                nationality: filters?.nationality,
                docType: filters?.docType,
                // status: filters?.status,
                fromDate: filters?.fromDate,
                lastDate: filters?.lastDate,
            },
        }
    );

    const payload: any = response.data ?? response.data;
    const users = payload?.data ?? payload?.users ?? payload?.items ?? payload ?? [];
    const meta = payload?.meta ?? payload?.pagination ?? response.data?.pagination;

    return {
        success: response.data?.success ?? true,
        message: response.data?.message ?? "Users fetched successfully",
        data: Array.isArray(users) ? users : [],
        meta,
        // timestamp: response.data?.,
        statusCode: (response.data as any)?.statusCode,
        users: Array.isArray(users) ? users : undefined,
        pagination: meta,
    } as UsersResponse;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User> {
    const response = await axiosInstance.get<User>(
        API_ROUTE.USER.VIEW.PATH(id)
    );
    const payload: any = response.data as any;
    return (payload as any)?.data ?? payload;
}

/**
 * Create a new user
 */
export async function createUser(
    data: Partial<User>
): Promise<User> {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: User }>(
        API_ROUTE.USER.CREATE.PATH,
        withNormalizedEmail(data)
    );
    const payload: any = response.data as any;
    return payload?.data ?? payload;
}

/**
 * Update user
 */
export async function updateUser(
    id: string,
    payload: Partial<User>
): Promise<User> {
    const response = await axiosInstance.patch<User>(
        API_ROUTE.USER.UPDATE.PATH(id),
        withNormalizedEmail(payload)
    );
    const data: any = response.data as any;
    return data?.data ?? data;
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<void> {
    await axiosInstance.delete(
        API_ROUTE.USER.DELETE.PATH(id)
    );
}

// ============ MULTI-STEP USER CREATION API ============

/**
 * Step 1: Create personal info
 */
export async function createPersonalInfo(data: PersonalInfoSchema): Promise<FormStepResponseData> {
    const response = await axiosInstance.post<{ data: FormStepResponseData }>(
        API_ROUTE.USER.STEP1_PERSONAL.CREATE.PATH,
        data
    );
    return response.data.data;
}

/**
 * Step 1: Get personal info by user ID
 */
export async function getPersonalInfo(id: string): Promise<PersonalInfoSchema> {
    const response = await axiosInstance.get<{ data: PersonalInfoSchema }>(
        API_ROUTE.USER.STEP1_PERSONAL.GET.PATH(id)
    );
    return response.data.data;
}

/**
 * Step 1: Update personal info
 */
export async function updatePersonalInfo(id: string, data: PersonalInfoSchema): Promise<PersonalInfoSchema> {
    const response = await axiosInstance.patch<{ data: PersonalInfoSchema }>(
        API_ROUTE.USER.STEP1_PERSONAL.UPDATE.PATH(id),
        data
    );
    return response.data.data;
}

/**
 * Step 2: Get contact info by user ID
 */
export async function getContactInfo(id: string): Promise<FormStepResponseData> {
    const response = await axiosInstance.get<{ data: FormStepResponseData }>(
        API_ROUTE.USER.STEP2_CONTACT.GET.PATH(id)
    );
    return response.data.data;
}

/**
 * Step 2: Update contact info
 */
export async function updateContactInfo(data: ContactInfoSchema & { userId: string }): Promise<FormStepResponseData> {
    const response = await axiosInstance.patch<{ data: FormStepResponseData }>(
        API_ROUTE.USER.STEP2_CONTACT.UPDATE.PATH,
        withNormalizedEmail(data)
    );
    return response.data.data;
}

/**
 * Step 3: Get employment info by user ID
 */
export async function getEmploymentInfo(id: string): Promise<EmploymentInfoSchema> {
    const response = await axiosInstance.get<{ data: EmploymentInfoSchema }>(
        API_ROUTE.USER.STEP3_EMPLOYMENT.GET.PATH(id)
    );
    return response.data.data;
}

/**
 * Step 3: Update employment info
 */
export async function updateEmploymentInfo(data: EmploymentInfoSchema & { userId: string }): Promise<FormStepResponseData> {
    const response = await axiosInstance.patch<{ data: FormStepResponseData }>(
        API_ROUTE.USER.STEP3_EMPLOYMENT.UPDATE.PATH,
        data
    );
    return response.data.data;
}

/**
 * Step 4: Get document info by user ID
 */
export async function getDocumentInfo(id: string): Promise<FormStepResponseData> {
    const response = await axiosInstance.get<{ data: FormStepResponseData }>(
        API_ROUTE.USER.STEP4_DOCUMENT.GET.PATH(id)
    );
    return response.data.data;
}

/**
 * Step 4: Update document upload
 * Returns the full response body so callers can read currentStepData.documents from either .data or root.
 */
export async function updateDocumentUpload(data: DocumentUploadSchema & { userId: string }): Promise<any> {
    const response = await axiosInstance.patch(
        API_ROUTE.USER.STEP4_DOCUMENT.UPDATE.PATH,
        data
    );
    const body = response.data;
    if (body && typeof body === 'object' && body.data !== undefined) {
        return body.data;
    }
    return body;
}

/**
 * Step 5: Get complete user info for review
 */
export async function getCompleteUserInfo(id: string): Promise<any> {
    const response = await axiosInstance.get<{ data: any }>(
        API_ROUTE.USER.STEP5_REVIEW.GET.PATH(id)
    );
    return response.data.data;
}

/**
 * Step 5: Update review submit
 */
export async function updateReviewSubmit(data: ReviewSchema): Promise<any> {
    const response = await axiosInstance.patch<{ data: any }>(
        API_ROUTE.USER.STEP5_REVIEW.UPDATE.PATH,
        data
    );
    return response.data.data;
}

/**
 * Update user permissions (designation + branches)
 */
export async function updatePermissions(userId: string, permissions: { designation?: string; branches?: { id: string; name: string }[] }): Promise<any> {
    const response = await axiosInstance.patch<{ data: any }>(
        API_ROUTE.USER.PERMISSIONS.UPDATE.PATH,
        { userId, permissions }
    );
    return response.data?.data ?? response.data;
}
