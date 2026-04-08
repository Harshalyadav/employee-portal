import { Stock, StocksResponse, StockFilters } from "@/types/stock.type";
import { MOCK_STOCKS } from "@/mock";

export const getAllStocks = async (filters?: StockFilters): Promise<StocksResponse> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let filtered = [...MOCK_STOCKS];

            if (filters?.search) {
                const search = filters.search.toLowerCase();
                filtered = filtered.filter(
                    (s) =>
                        s.itemName.toLowerCase().includes(search) ||
                        s.category.toLowerCase().includes(search) ||
                        s.location.toLowerCase().includes(search)
                );
            }

            if (filters?.category) {
                filtered = filtered.filter((s) => s.category === filters.category);
            }

            if (filters?.status) {
                filtered = filtered.filter((s) => s.status === filters.status);
            }

            if (filters?.location) {
                filtered = filtered.filter((s) =>
                    s.location.toLowerCase().includes(filters.location!.toLowerCase())
                );
            }

            if (filters?.sortBy) {
                const sortOrder = filters.sortOrder === "desc" ? -1 : 1;
                filtered.sort((a, b) => {
                    const aVal = a[filters.sortBy as keyof Stock];
                    const bVal = b[filters.sortBy as keyof Stock];
                    if (aVal! < bVal!) return -1 * sortOrder;
                    if (aVal! > bVal!) return 1 * sortOrder;
                    return 0;
                });
            }

            const page = filters?.page ?? 1;
            const limit = filters?.limit ?? 10;
            const total = filtered.length;
            const totalPages = Math.ceil(total / limit);
            const start = (page - 1) * limit;
            const stocks = filtered.slice(start, start + limit);

            resolve({
                success: true,
                message: "Stocks fetched successfully",
                stocks,
                meta: { page, limit, total, totalPages },
            });
        }, 500);
    });
};

export const getStockById = async (id: string): Promise<Stock | null> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const stock = MOCK_STOCKS.find((s) => s.id === id);
            resolve(stock || null);
        }, 300);
    });
};

export const createStock = async (stockData: Partial<Stock>): Promise<Stock> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newStock: Stock = {
                id: `stk_${Date.now()}`,
                itemName: stockData.itemName || "",
                category: stockData.category || "Ingredient",
                currentStock: stockData.currentStock || 0,
                unit: stockData.unit || "kg",
                location: stockData.location || "",
                status: stockData.status || "active",
                unitPrice: stockData.unitPrice || 0,
                totalValue: (stockData.currentStock || 0) * (stockData.unitPrice || 0),
                reorderThreshold: stockData.reorderThreshold || 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...stockData,
            };
            MOCK_STOCKS.push(newStock);
            resolve(newStock);
        }, 500);
    });
};

export const updateStock = async (
    id: string,
    payload: Partial<Stock>
): Promise<Stock> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = MOCK_STOCKS.findIndex((s) => s.id === id);
            if (index === -1) {
                reject(new Error("Stock not found"));
                return;
            }

            const totalValue = (payload.currentStock ?? MOCK_STOCKS[index].currentStock) *
                (payload.unitPrice ?? MOCK_STOCKS[index].unitPrice);

            MOCK_STOCKS[index] = {
                ...MOCK_STOCKS[index],
                ...payload,
                id,
                totalValue,
                updatedAt: new Date().toISOString(),
            };
            resolve(MOCK_STOCKS[index]);
        }, 500);
    });
};

export const deleteStock = async (id: string): Promise<{ success: boolean }> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = MOCK_STOCKS.findIndex((s) => s.id === id);
            if (index === -1) {
                reject(new Error("Stock not found"));
                return;
            }

            MOCK_STOCKS.splice(index, 1);
            resolve({ success: true });
        }, 500);
    });
};
