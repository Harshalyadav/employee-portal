import { useMutation, useQuery } from "@tanstack/react-query";
import PayrollService from "@/service/payroll.service";
import { CreateBulkPayrollSchema, IPayroll } from "@/types/payroll.type";

/**
 * Hook for bulk payroll creation mutations
 * @returns Mutation handlers and state for bulk payroll operations
 */
export function useBulkPayrollMutations() {
    const createBulkPayrollMutation = useMutation({
        mutationFn: async (data: CreateBulkPayrollSchema) => {
            return PayrollService.createBulkPayrollWithItems(data);
        },
    });

    const createPayrollMasterMutation = useMutation({
        mutationFn: async (data: any) => {
            return PayrollService.createPayrollMaster(data);
        },
    });

    return {
        createBulkPayroll: createBulkPayrollMutation.mutate,
        createBulkPayrollAsync: createBulkPayrollMutation.mutateAsync,
        createPayrollMaster: createPayrollMasterMutation.mutate,
        createPayrollMasterAsync: createPayrollMasterMutation.mutateAsync,
        isPending:
            createBulkPayrollMutation.isPending || createPayrollMasterMutation.isPending,
        isError:
            createBulkPayrollMutation.isError || createPayrollMasterMutation.isError,
        error: createBulkPayrollMutation.error || createPayrollMasterMutation.error,
    };
}

/**
 * Hook for fetching payroll data by month and year
 * @param month - Payroll month (1-12)
 * @param year - Payroll year
 * @returns Payroll data and loading state
 */
export function usePayrollByMonth(month?: number, year?: number) {
    return useQuery({
        queryKey: ["payroll", month, year],
        queryFn: async () => {
            if (!month || !year) return null;
            // This would require a service method to fetch by month/year
            // For now, return empty array
            return [];
        },
        enabled: Boolean(month && year),
    });
}
