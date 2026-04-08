"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUsers,
    getUsersByCompany,
    getUsersByBranch,
    getUser,
    createNewUser,
    updateExistingUser,
    deleteExistingUser,
    createPersonalInfo,
    getPersonalInfo,
    updatePersonalInfo,
    getContactInfo,
    updateContactInfo,
    getEmploymentInfo,
    updateEmploymentInfo,
    getDocumentInfo,
    updateDocumentUpload,
    getCompleteUserInfo,
    updateReviewSubmit,
    updatePermissions,
    getAllUsersFlat,
    bulkImportUsers
} from "@/service/user.service";
import { User, UserFilters, IUser, ICreateUserRequest, IUpdateUserRequest, PersonalInfoSchema, ContactInfoSchema, EmploymentInfoSchema, DocumentUploadSchema, ReviewSchema } from "@/types";
import { API_ROUTE } from "@/routes";
import { toast } from "sonner";

// ============ NEW API HOOKS ============

/**
 * Hook: Get all users as a flat array (for Visa Manager join)
 * Optionally filter by branchId — sends branchId as query param to the API.
 */
export const useAllUsersFlat = (branchId?: string) => {
    return useQuery<User[]>({
        queryKey: [API_ROUTE.USER.ALL.ID, "flat", "all", branchId ?? "all"],
        queryFn: () => getAllUsersFlat(branchId),
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Get paginated users with new API
 */
export const useUsers = (
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
) => {
    return useQuery({
        queryKey: [API_ROUTE.USER.ALL.ID, "paginated", page, limit, search, roleId, nationality, docType, companyId, branchId, branchIds, isActive],
        queryFn: () => getUsers(page, limit, search, roleId, nationality, docType, companyId, branchId, branchIds, isActive),
        staleTime: 0,
        refetchOnMount: "always",
    });
};

/**
 * Hook: Get users by company
 */
export const useUsersByCompany = (
    companyId: string,
    page: number = 1,
    limit: number = 10
) => {
    return useQuery({
        queryKey: [API_ROUTE.USER.BY_COMPANY.ID, companyId, page, limit],
        queryFn: () => getUsersByCompany(companyId, page, limit),
        enabled: !!companyId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Get users by branch
 */
export const useUsersByBranch = (
    branchId: string,
    page: number = 1,
    limit: number = 10
) => {
    return useQuery({
        queryKey: [API_ROUTE.USER.BY_BRANCH.ID, branchId, page, limit],
        queryFn: () => getUsersByBranch(branchId, page, limit),
        enabled: !!branchId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Get user by ID (new API)
 */
export const useUserById = (id?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER.VIEW.ID, id],
        queryFn: () => {
            if (!id) throw new Error("User ID is required");
            return getUser(id);
        },
        enabled: !!id && id !== "new",
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Create new user with new API
 */
export const useCreateNewUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ICreateUserRequest) => createNewUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey[0] === API_ROUTE.USER.ALL.ID ||
                    query.queryKey[0] === API_ROUTE.USER.BY_COMPANY.ID ||
                    query.queryKey[0] === API_ROUTE.USER.BY_BRANCH.ID,
            });
        },
    });
};

/**
 * Hook: Update user with new API
 */
export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: IUpdateUserRequest }) =>
            updateExistingUser(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey[0] === API_ROUTE.USER.ALL.ID ||
                    query.queryKey[0] === API_ROUTE.USER.BY_COMPANY.ID ||
                    query.queryKey[0] === API_ROUTE.USER.BY_BRANCH.ID,
            });
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.VIEW.ID, variables.id],
            });
        },
    });
};

/**
 * Hook: Delete user with new API
 */
export const useDeleteNewUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteExistingUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey[0] === API_ROUTE.USER.ALL.ID ||
                    query.queryKey[0] === API_ROUTE.USER.BY_COMPANY.ID ||
                    query.queryKey[0] === API_ROUTE.USER.BY_BRANCH.ID,
            });
        },
    });
};

/**
 * Hook: Bulk import users
 */
export const useBulkImportUsers = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any[]) => bulkImportUsers(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey[0] === API_ROUTE.USER.ALL.ID ||
                    query.queryKey[0] === API_ROUTE.USER.BY_COMPANY.ID ||
                    query.queryKey[0] === API_ROUTE.USER.BY_BRANCH.ID,
            });
        },
    });
};

// ============ LEGACY API HOOKS (Backward Compatibility) ============

/**
 * Hook: Get paginated users (Infinite Scrolling)
 */
export const useInfiniteUsers = (filters?: UserFilters) => {
    return useInfiniteQuery({
        queryKey: [API_ROUTE.USER.ALL.ID, filters],
        queryFn: ({ pageParam = 1 }) =>
            getAllUsers({
                ...filters,
                page: pageParam as number,
                limit: filters?.limit ?? 10,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const meta = lastPage?.pagination || lastPage?.pagination;
            const currentPage = meta?.page ?? 1;
            const totalPages = meta?.pages ?? 1;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
        // staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Get paginated users by branch (Infinite Scrolling)
 */
export const useInfiniteBranchUsers = (branchId: string, limit: number = 10) => {
    return useInfiniteQuery({
        queryKey: [API_ROUTE.USER.BY_BRANCH.ID, branchId, limit],
        queryFn: ({ pageParam = 1 }) =>
            getUsersByBranch(branchId, pageParam as number, limit),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const meta = lastPage?.pagination;
            const currentPage = meta?.page ?? 1;
            const totalPages = meta?.pages ?? 1;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
        enabled: !!branchId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Get user detail by ID
 */
export const useGetUserDetail = (id?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER.VIEW.ID, "detail", id],
        queryFn: async () => {
            if (!id) throw new Error("User ID is required");
            const user = await getUserById(id);
            if (!user) throw new Error("User not found");
            return user;
        },
        enabled: !!id && id !== "new",
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Create user
 */
export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData: Partial<User>) => createUser(userData),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate(query) {
                    return query.queryKey[0] === API_ROUTE.USER.ALL.ID;
                },
                exact: false
            });

        },
        onError: (error: any) => {
            console.error("Error creating user:", error);
        },

    });
};

/**
 * Hook: Edit user
 */
export const useEditUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<User> }) =>
            updateUser(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [API_ROUTE.USER.ALL.ID] });
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.VIEW.ID, "detail", variables.id],
            });
        },
        onError: (error: any) => {
            console.error("Error updating user:", error);
        },
    });
};

/**
 * Hook: Delete user
 */
export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [API_ROUTE.USER.ALL.ID] });
        },
        onError: (error: any) => {
            toast.error("Error deleting user: " + error.response?.data?.message || error.message);

        },
    });
};

// ============ MULTI-STEP USER CREATION HOOKS ============

/**
 * Hook: Create personal info (Step 1)
 */
export const useCreatePersonalInfo = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: PersonalInfoSchema) => createPersonalInfo(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.STEP1_PERSONAL.CREATE.ID],
            });
        },
    });
};

/**
 * Hook: Get personal info by user ID (Step 1)
 */
export const useGetPersonalInfo = (id?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER.STEP1_PERSONAL.GET.ID, id],
        queryFn: () => {
            if (!id) throw new Error("User ID is required");
            return getPersonalInfo(id);
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Update personal info (Step 1)
 */
export const useUpdatePersonalInfo = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: PersonalInfoSchema }) =>
            updatePersonalInfo(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.STEP1_PERSONAL.GET.ID, variables.id],
            });
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.STEP5_REVIEW.GET.ID, variables.id],
            });
        },
    });
};

/**
 * Hook: Get contact info by user ID (Step 2)
 */
export const useGetContactInfo = (id?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER.STEP2_CONTACT.GET.ID, id],
        queryFn: () => {
            if (!id) throw new Error("User ID is required");
            return getContactInfo(id);
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Update contact info (Step 2)
 */
export const useUpdateContactInfo = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ContactInfoSchema & { userId: string }) => updateContactInfo(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.STEP2_CONTACT.GET.ID, variables.userId],
            });
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.STEP5_REVIEW.GET.ID, variables.userId],
            });
        },
    });
};

/**
 * Hook: Get employment info by user ID (Step 3)
 */
export const useGetEmploymentInfo = (id?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER.STEP3_EMPLOYMENT.GET.ID, id],
        queryFn: () => {
            if (!id) throw new Error("User ID is required");
            return getEmploymentInfo(id);
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Update employment info (Step 3)
 */
export const useUpdateEmploymentInfo = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: EmploymentInfoSchema & { userId: string }) =>
            updateEmploymentInfo(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.STEP3_EMPLOYMENT.GET.ID, variables.userId],
            });
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.STEP5_REVIEW.GET.ID, variables.userId],
            });
        },
    });
};

/**
 * Hook: Get document info by user ID (Step 4)
 */
export const useGetDocumentInfo = (id?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER.STEP4_DOCUMENT.GET.ID, id],
        queryFn: () => {
            if (!id) throw new Error("User ID is required");
            return getDocumentInfo(id);
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Update document upload (Step 4)
 */
export const useUpdateDocumentUpload = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: DocumentUploadSchema & { userId: string }) =>
            updateDocumentUpload(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.STEP4_DOCUMENT.GET.ID, variables.userId],
            });
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.STEP5_REVIEW.GET.ID, variables.userId],
            });
        },
    });
};

/**
 * Hook: Get complete user info for review (Step 5)
 */
export const useGetCompleteUserInfo = (id?: string) => {
    return useQuery({
        queryKey: [API_ROUTE.USER.STEP5_REVIEW.GET.ID, id],
        queryFn: () => {
            if (!id) throw new Error("User ID is required");
            return getCompleteUserInfo(id);
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook: Update review submit (Step 5)
 */
export const useUpdateReviewSubmit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ReviewSchema) => updateReviewSubmit(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.STEP5_REVIEW.GET.ID, variables.userId],
            });
            queryClient.invalidateQueries({
                predicate: (query) => query.queryKey[0] === API_ROUTE.USER.ALL.ID,
            });
        },
    });
};

/**
 * Hook: Update user permissions (designation + branches)
 */
export const useUpdatePermissions = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, permissions }: { userId: string; permissions: { designation?: string; branches?: { id: string; name: string }[] } }) =>
            updatePermissions(userId, permissions),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [API_ROUTE.USER.STEP5_REVIEW.GET.ID, variables.userId],
            });
        },
    });
};
