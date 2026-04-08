import warehousesData from "@/data/warehouses.json";
import { Warehouse, WarehouseResponse, WarehouseFilters } from "@/types/warehouse.type";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

class WarehouseService {
    async getWarehouses(
        page: number = 1,
        limit: number = 10,
        filters?: WarehouseFilters
    ): Promise<WarehouseResponse> {
        try {
            // Load from JSON data
            let filtered = [...warehousesData.warehouses];

            if (filters?.status) {
                filtered = filtered.filter((w) => w.status === filters.status);
            }

            if (filters?.city) {
                filtered = filtered.filter((w) =>
                    w.city.toLowerCase().includes(filters.city!.toLowerCase())
                );
            }

            if (filters?.state) {
                filtered = filtered.filter((w) =>
                    w.state.toLowerCase().includes(filters.state!.toLowerCase())
                );
            }

            if (filters?.search) {
                filtered = filtered.filter(
                    (w) =>
                        w.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
                        w.code.toLowerCase().includes(filters.search!.toLowerCase())
                );
            }

            const start = (page - 1) * limit;
            const end = start + limit;
            const warehouses = filtered.slice(start, end).map((w) => ({
                ...w,
                status: w.status as "Active" | "Inactive",
            }));

            return {
                warehouses,
                total: filtered.length,
                page,
                limit,
                hasNextPage: end < filtered.length,
            };
        } catch (error) {
            console.error("Error fetching warehouses:", error);
            throw error;
        }
    }

    async getWarehouseById(id: string): Promise<Warehouse> {
        try {
            const warehouse = warehousesData.warehouses.find((w) => w.id === id);
            if (!warehouse) {
                throw new Error("Warehouse not found");
            }
            return { ...warehouse, status: warehouse.status as "Active" | "Inactive" };
        } catch (error) {
            console.error("Error fetching warehouse:", error);
            throw error;
        }
    }

    async createWarehouse(data: any): Promise<Warehouse> {
        try {
            // Mock implementation - in real app, would hit API
            const newWarehouse: Warehouse = {
                id: `WH${Date.now()}`,
                ...data,
                createdAt: new Date().toISOString().split("T")[0],
            };
            return newWarehouse;
        } catch (error) {
            console.error("Error creating warehouse:", error);
            throw error;
        }
    }

    async updateWarehouse(id: string, data: any): Promise<Warehouse> {
        try {
            // Mock implementation - in real app, would hit API
            const warehouse = warehousesData.warehouses.find((w) => w.id === id);
            if (!warehouse) {
                throw new Error("Warehouse not found");
            }
            return { ...warehouse, ...data, updatedAt: new Date().toISOString().split("T")[0] };
        } catch (error) {
            console.error("Error updating warehouse:", error);
            throw error;
        }
    }

    async deleteWarehouse(id: string): Promise<void> {
        try {
            // Mock implementation - in real app, would hit API
            const warehouse = warehousesData.warehouses.find((w) => w.id === id);
            if (!warehouse) {
                throw new Error("Warehouse not found");
            }
        } catch (error) {
            console.error("Error deleting warehouse:", error);
            throw error;
        }
    }
}

export const warehouseService = new WarehouseService();
