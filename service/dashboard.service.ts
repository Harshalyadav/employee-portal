import { DashboardMetricsResponse, DashboardResponse } from "@/types/dashboard.type";
import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";

/**
 * Get dashboard statistics and data
 */
export async function getDashboardStats(): Promise<DashboardResponse> {
    const response = await axiosInstance.get<DashboardResponse>(
        API_ROUTE.DASHBOARD.STATS.PATH
    );
    return response.data;
}

export async function getDashboardMetrics(): Promise<DashboardMetricsResponse> {
    const response = await axiosInstance.get<DashboardMetricsResponse>(
        API_ROUTE.DASHBOARD.METRICS.PATH
    );
    return response.data;
}