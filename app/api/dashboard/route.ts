import { NextResponse, NextRequest } from "next/server";
import { DashboardResponse } from "@/types/dashboard.type";

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics including employee count, payrolls, branches, and advance payments
 */
export async function GET(request: NextRequest) {
    try {
        // TODO: Replace with actual backend API call or database queries
        // For now, returning mock data matching the expected structure

        const mockData: DashboardResponse = {
            success: true,
            statusCode: 200,
            message: "Request successful",
            data: {
                stats: [
                    {
                        title: "Total Employees",
                        value: 30,
                        icon: "Users",
                        color: "bg-blue-500",
                        path: "/users",
                    },
                    {
                        title: "Total Payrolls",
                        value: 1,
                        icon: "DollarSign",
                        color: "bg-green-500",
                        path: "/payroll",
                    },
                    {
                        title: "Total Branches",
                        value: 4,
                        icon: "Building2",
                        color: "bg-purple-500",
                        path: "/branch",
                    },
                    {
                        title: "Advance Payments",
                        value: 4,
                        icon: "TrendingUp",
                        color: "bg-orange-500",
                        path: "/advance-payment",
                    },
                ],
                total: 4,
                timestamp: new Date().toISOString(),
            },
        };

        return NextResponse.json(mockData, { status: 200 });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json(
            {
                success: false,
                statusCode: 500,
                message: "Failed to fetch dashboard stats",
                data: null,
            },
            { status: 500 }
        );
    }
}
