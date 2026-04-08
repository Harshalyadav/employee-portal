/**
 * Stat card displayed on the dashboard
 */
export interface DashboardStat {
    title: string;
    value: number;
    icon: string;
    color: string;
    path: string;
}

/**
 * Dashboard data containing stats and metadata
 */
export interface DashboardData {
    stats: DashboardStat[];
    total: number;
    timestamp: string;
}

export interface DashboardStatusMetric {
    key: string;
    label: string;
    value: number;
}

export interface DashboardMetrics {
    pendingPayrollItems: number;
    paidPayrollItems: number;
    lockedPayrollItems: number;
    totalPayrollItems: number;
    employeeStatusBreakdown: DashboardStatusMetric[];
}

export interface DashboardMetricsData extends DashboardData {
    metrics: DashboardMetrics;
}

/**
 * Dashboard API response structure
 */
export interface DashboardResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: DashboardData;
}

export interface DashboardMetricsResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: DashboardMetricsData;
}
