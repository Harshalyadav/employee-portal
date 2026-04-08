"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserBranchSwitchLogs } from "@/hooks/query/branch-switch.hook";
import { useUserById } from "@/hooks/query/user.hook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { ArrowLeft, RefreshCw, ArrowRight } from "lucide-react";
import { APP_ROUTE } from "@/routes";
import { format } from "date-fns";
import { BranchSwitchLogEntry, User } from "@/types";

export default function UserBranchSwitchLogsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Fetch user data
  const { data: userData, isLoading: isLoadingUser } = useUserById(userId);

  // Fetch branch switch logs
  const {
    data: logsData,
    isLoading: isLoadingLogs,
    refetch,
  } = useUserBranchSwitchLogs(userId, { page, limit });

  if (isLoadingUser || isLoadingLogs) {
    return <LoadingState />;
  }

  const user = userData as any | undefined;
  const logs = logsData?.data || [];
  const pagination = logsData?.pagination;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(APP_ROUTE.USERS.LIST)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Branch Switch Logs</h1>
            <p className="text-sm text-muted-foreground">
              {user?.personalInfo?.fullName} -{" "}
              {user?.employmentInfo?.employeeId}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Switch Logs */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Switch History</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No branch switch logs found
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log: BranchSwitchLogEntry) => (
                <div
                  key={log._id}
                  className="p-4 border rounded-lg transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">
                          {log.fromBranchId.branchName}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {log.fromBranchId.branchCode}
                        </span>
                      </div>

                      <ArrowRight className="h-5 w-5 text-muted-foreground" />

                      <div className="flex flex-col items-center">
                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                          {log.toBranchId.branchName}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {log.toBranchId.branchCode}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(log.switchedAt), "PPp")}
                      </p>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {log.switchType}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Switched by:
                      </span>
                      <span className="ml-2 font-medium">
                        {log.switchedBy.fullName}
                      </span>
                    </div>

                    {/* <div>
                      <span className="text-muted-foreground">IP Address:</span>
                      <span className="ml-2 font-mono text-xs">
                        {log.ipAddress}
                      </span>
                    </div> */}

                    {log.reason && (
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">Reason:</span>
                        <p className="mt-1 text-sm italic">{log.reason}</p>
                      </div>
                    )}

                    {/* <div className="md:col-span-2 text-xs text-muted-foreground">
                      <span>Session: {log.sessionId}</span>
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
                total records)
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
