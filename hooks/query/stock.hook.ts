"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    getAllStocks,
    getStockById,
    createStock,
    updateStock,
    deleteStock,
} from "@/service/stock.service";
import { Stock, StockFilters } from "@/types/stock.type";

const STOCKS_QUERY_KEY = "stocks";

export const useInfiniteStocks = (filters?: StockFilters) => {
    return useInfiniteQuery({
        queryKey: [STOCKS_QUERY_KEY, filters],
        queryFn: ({ pageParam = 1 }) =>
            getAllStocks({
                ...filters,
                page: pageParam as number,
                limit: filters?.limit ?? 10,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const currentPage = lastPage?.meta?.page ?? 1;
            const totalPages = lastPage?.meta?.totalPages ?? 1;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useGetStockDetail = (id?: string) => {
    return useQuery({
        queryKey: [STOCKS_QUERY_KEY, "detail", id],
        queryFn: async () => {
            if (!id) throw new Error("Stock ID is required");
            const stock = await getStockById(id);
            if (!stock) throw new Error("Stock not found");
            return stock;
        },
        enabled: !!id && id !== "new",
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateStock = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (stockData: Partial<Stock>) => createStock(stockData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [STOCKS_QUERY_KEY] });
        },
        onError: (error: any) => {
            console.error("Error creating stock:", error);
        },
    });
};

export const useEditStock = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<Stock> }) =>
            updateStock(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [STOCKS_QUERY_KEY] });
            queryClient.invalidateQueries({
                queryKey: [STOCKS_QUERY_KEY, "detail", variables.id],
            });
        },
        onError: (error: any) => {
            console.error("Error updating stock:", error);
        },
    });
};

export const useDeleteStock = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteStock(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [STOCKS_QUERY_KEY] });
        },
        onError: (error: any) => {
            console.error("Error deleting stock:", error);
        },
    });
};
