import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import PayrollService from "@/service/payroll.service";
import {
  IPayroll,
  IPayrollLot,
  IPayrollDetailResponse,
  CreatePayrollSchema,
  BulkCreatePayrollSchema,
  UpdatePayrollStatusSchema,
  CreatePayrollLotSchema,
  AutoGenerateLotsSchema,
  AddPayrollToLotSchema,
  IPayrollItemsByBranchResponse,
} from "@/types/payroll.type";

/**
 * Query key factory for Payroll operations
 */
const payrollKeys = {
  all: ["payroll"] as const,
  lists: () => [...payrollKeys.all, "list"] as const,
  list: (filters: any) => [...payrollKeys.lists(), { ...filters }] as const,
  details: () => [...payrollKeys.all, "detail"] as const,
  detail: (id: string) => [...payrollKeys.details(), id] as const,
  byUser: (userId: string) => [...payrollKeys.all, "byUser", userId] as const,
  itemsByBranch: (month: number, year: number, branchId: string) =>
    [...payrollKeys.all, "itemsByBranch", { month, year, branchId }] as const,
  lots: () => [...payrollKeys.all, "lots"] as const,
  lotLists: () => [...payrollKeys.lots(), "list"] as const,
  lotList: (filters: any) => [...payrollKeys.lotLists(), { ...filters }] as const,
  lotDetails: () => [...payrollKeys.lots(), "detail"] as const,
  lotDetail: (id: string) => [...payrollKeys.lotDetails(), id] as const,
};

/**
 * Fetch all payrolls (infinite scroll)
 */
export function useInfinitePayrolls(limit: number = 10) {
  return useInfiniteQuery({
    queryKey: payrollKeys.lists(),
    queryFn: ({ pageParam = 1 }) =>
      PayrollService.getAllPayrolls(pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil(
        (lastPage as any)?.total / limit
      );
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    refetchOnMount: "always",
  });
}

/**
 * Fetch payrolls for a specific user (infinite scroll)
 */
export function useInfinitePayrollsByUser(userId: string, limit: number = 10) {
  return useInfiniteQuery({
    queryKey: payrollKeys.byUser(userId),
    queryFn: ({ pageParam = 1 }) =>
      PayrollService.getPayrollsByUserId(userId, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil(
        (lastPage as any)?.total / limit
      );
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: !!userId,
  });
}

/**
 * Fetch a single payroll by ID
 */
export function usePayroll(id: string | null) {
  return useQuery({
    queryKey: payrollKeys.detail(id || ""),
    queryFn: () => PayrollService.getPayrollById(id!),
    enabled: !!id,
  });
}

/**
 * Fetch payroll items by month, year, and branch (infinite scroll)
 */
export function useInfinitePayrollItemsByBranch(
  month: number,
  year: number,
  branchId: string,
  limit: number = 10
) {
  return useInfiniteQuery({
    queryKey: payrollKeys.itemsByBranch(month, year, branchId),
    queryFn: ({ pageParam = 1 }) =>
      PayrollService.getPayrollItemsByBranch(month, year, branchId, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = lastPage.pagination.pages;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: !!branchId && month >= 1 && month <= 12 && year >= 1900,
  });
}

/**
 * Fetch payroll items by month, year, and branch (single page)
 */
export function usePayrollItemsByBranch(
  month: number,
  year: number,
  branchId: string,
  page: number = 1,
  limit: number = 10
) {
  return useQuery({
    queryKey: [...payrollKeys.itemsByBranch(month, year, branchId), { page, limit }],
    queryFn: () =>
      PayrollService.getPayrollItemsByBranch(month, year, branchId, page, limit),
    enabled: !!branchId && month >= 1 && month <= 12 && year >= 1900,
  });
}

/**
 * Fetch all payroll LOTs (infinite scroll)
 */
export function useInfinitePayrollLots(limit: number = 10) {
  return useInfiniteQuery({
    queryKey: payrollKeys.lotLists(),
    queryFn: ({ pageParam = 1 }) =>
      PayrollService.getAllLots(pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil(
        (lastPage as any)?.total / limit
      );
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
}

/**
 * Fetch a specific LOT with its payrolls
 */
export function usePayrollLot(lotId: string | null) {
  return useQuery({
    queryKey: payrollKeys.lotDetail(lotId || ""),
    queryFn: () => PayrollService.getLotById(lotId!),
    enabled: !!lotId,
  });
}

/**
 * Mutation: Create a single payroll
 */
export function useCreatePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePayrollSchema) =>
      PayrollService.createPayroll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.lotLists() });
      toast.success("Payroll created successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to create payroll";
      toast.error(message);
    },
  });
}

/**
 * Mutation: Bulk create payrolls
 */
export function useBulkCreatePayrolls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkCreatePayrollSchema) =>
      PayrollService.bulkCreatePayrolls(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.lotLists() });
      toast.success("Payrolls created successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to create payrolls";
      toast.error(message);
    },
  });
}

/**
 * Mutation: Update payroll status
 */
export function useUpdatePayrollStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePayrollStatusSchema;
    }) => PayrollService.updatePayrollStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() });
      toast.success("Payroll status updated successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to update payroll status";
      toast.error(message);
    },
  });
}

/**
 * Mutation: Delete payroll
 */
export function useDeletePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => PayrollService.deletePayroll(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.lotLists() });
      toast.success("Payroll deleted successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to delete payroll";
      toast.error(message);
    },
  });
}

/**
 * Mutation: Create a new LOT
 */
export function useCreatePayrollLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePayrollLotSchema) =>
      PayrollService.createLot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.lotLists() });
      toast.success("LOT created successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to create LOT";
      toast.error(message);
    },
  });
}

/**
 * Mutation: Auto-generate LOTs
 */
export function useAutoGenerateLots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AutoGenerateLotsSchema) =>
      PayrollService.autoGenerateLots(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.lotLists() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() });
      toast.success(`${data.totalLots} LOTs generated successfully`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to auto-generate LOTs";
      toast.error(message);
    },
  });
}

/**
 * Mutation: Add payroll to existing LOT
 */
export function useAddPayrollToLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddPayrollToLotSchema) =>
      PayrollService.addPayrollToLot(data),
    onSuccess: (_, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.lotDetail(lotId) });
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() });
      toast.success("Payroll added to LOT successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to add payroll to LOT";
      toast.error(message);
    },
  });
}

/**
 * Mutation: Disburse a LOT
 */
export function useDisburseLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lotId: string) => PayrollService.disburseLot(lotId),
    onSuccess: (_, lotId) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.lotDetail(lotId) });
      queryClient.invalidateQueries({ queryKey: payrollKeys.lotLists() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.lists() });
      toast.success("LOT disbursed successfully");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to disburse LOT";
      toast.error(message);
    },
  });
}
