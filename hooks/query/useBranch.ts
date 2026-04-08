import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { branchService } from "@/service/branch.service";
import {
  IBranch,
  CreateBranchSchema,
  UpdateBranchSchema,
} from "@/types/branch.type";
import { toast } from "sonner";
import { API_ROUTE } from "@/routes";

type BranchQueryOptions = {
  includeAll?: boolean;
  enabled?: boolean;
};

/**
 * Hook to fetch all branches with pagination
 */
export const useBranches = (page: number = 1, limit: number = 10, options?: BranchQueryOptions) => {
  return useQuery({
    queryKey: [API_ROUTE.BRANCH.ALL.ID, { page, limit, includeAll: Boolean(options?.includeAll) }],
    queryFn: () => branchService.getAllBranches(page, limit, { includeAll: options?.includeAll }),
    enabled: options?.enabled ?? true,
  });
};

/**
 * Hook to fetch all branches with infinite scroll
 */
export const useInfiniteBranches = (limit: number = 10, options?: BranchQueryOptions) => {
  return useInfiniteQuery({
    queryKey: [API_ROUTE.BRANCH.ALL.ID, "infinite", { limit, includeAll: Boolean(options?.includeAll) }],
    queryFn: ({ pageParam = 1 }) =>
      branchService.getAllBranches(pageParam, limit, { includeAll: options?.includeAll }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: options?.enabled ?? true,
  });
};

/**
 * Hook to fetch a single branch by ID
 */
export const useBranch = (id: string | null) => {
  return useQuery({
    queryKey: [API_ROUTE.BRANCH.VIEW.ID, id],
    queryFn: () => branchService.getBranchById(id!),
    enabled: !!id,
  });
};

/**
 * Hook to fetch branches by company
 */
export const useBranchesByCompany = (
  companyId: string | null,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: [API_ROUTE.BRANCH.BY_COMPANY.ID, companyId, { page, limit }],
    queryFn: () => branchService.getBranchesByCompany(companyId!, page, limit),
    enabled: !!companyId,
  });
};

/**
 * Hook to fetch branches by company with infinite scroll
 */
export const useInfiniteBranchesByCompany = (companyId: string | null, limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: [API_ROUTE.BRANCH.BY_COMPANY.ID, companyId, "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      branchService.getBranchesByCompany(companyId!, pageParam, limit),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!companyId,
  });
};

/**
 * Hook to fetch branches by status
 */
export const useBranchesByStatus = (
  status: string,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: [API_ROUTE.BRANCH.BY_STATUS.ID, status, { page, limit }],
    queryFn: () => branchService.getBranchesByStatus(status, page, limit),
  });
};

/**
 * Hook to create a new branch
 */
export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBranchSchema) => branchService.createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTE.BRANCH.ALL.ID] });
      toast.success("Branch created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create branch");
    },
  });
};

/**
 * Hook to update a branch
 */
export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchSchema }) =>
      branchService.updateBranch(id, data),
    onSuccess: (updatedBranch) => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTE.BRANCH.ALL.ID] });
      queryClient.invalidateQueries({
        queryKey: [API_ROUTE.BRANCH.VIEW.ID, updatedBranch._id],
      });
      toast.success("Branch updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update branch");
    },
  });
};

/**
 * Hook to close a branch
 */
export const useCloseBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => branchService.closeBranch(id),
    onSuccess: (closedBranch) => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTE.BRANCH.ALL.ID] });
      queryClient.invalidateQueries({
        queryKey: [API_ROUTE.BRANCH.VIEW.ID, closedBranch._id],
      });
      toast.success("Branch closed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to close branch");
    },
  });
};

/**
 * Hook to activate a branch
 */
export const useActivateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => branchService.activateBranch(id),
    onSuccess: (activatedBranch) => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTE.BRANCH.ALL.ID] });
      queryClient.invalidateQueries({
        queryKey: [API_ROUTE.BRANCH.VIEW.ID, activatedBranch._id],
      });
      toast.success("Branch activated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to activate branch");
    },
  });
};

/**
 * Hook to toggle branch status
 */
export const useToggleBranchStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: string }) =>
      branchService.toggleBranchStatus(id, currentStatus),
    onSuccess: (updatedBranch) => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTE.BRANCH.ALL.ID] });
      queryClient.invalidateQueries({
        queryKey: [API_ROUTE.BRANCH.VIEW.ID, updatedBranch._id],
      });
      toast.success(`Branch ${updatedBranch.status === "Active" ? "activated" : "closed"} successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to toggle branch status");
    },
  });
};

/**
 * Hook to delete a branch
 */
export const useDeleteBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => branchService.deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTE.BRANCH.ALL.ID] });
      toast.success("Branch deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete branch");
    },
  });
};
