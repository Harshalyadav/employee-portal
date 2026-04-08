import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { warehouseService } from "@/service/warehouse.service";
import { WarehouseFilters } from "@/types/warehouse.type";

export const useInfiniteWarehouses = (filters?: WarehouseFilters & { limit?: number }) => {
    return useInfiniteQuery({
        queryKey: ["warehouses", filters],
        queryFn: async ({ pageParam = 1 }) => {
            return await warehouseService.getWarehouses(pageParam, filters?.limit || 10, filters);
        },
        getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.page + 1 : undefined,
        initialPageParam: 1,
    });
};

export const useWarehouse = (id: string) => {
    return useQuery({
        queryKey: ["warehouse", id],
        queryFn: () => warehouseService.getWarehouseById(id),
        enabled: !!id,
    });
};

export const useCreateWarehouse = () => {
    return useMutation({
        mutationFn: (data: any) => warehouseService.createWarehouse(data),
        onSuccess: () => {
            // Invalidate cache if needed
        },
    });
};

export const useUpdateWarehouse = () => {
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            warehouseService.updateWarehouse(id, data),
        onSuccess: () => {
            // Invalidate cache if needed
        },
    });
};

export const useDeleteWarehouse = () => {
    return useMutation({
        mutationFn: (id: string) => warehouseService.deleteWarehouse(id),
        onSuccess: () => {
            // Invalidate cache if needed
        },
    });
};
