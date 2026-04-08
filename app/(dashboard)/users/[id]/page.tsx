"use client";

import { EditUserFormMultiStep } from "@/components/form";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks";
import { ModuleNameEnum, PermissionAction } from "@/types";

import { ArrowLeft, History } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

const shellCardClass =
  "bg-white rounded-[1.5rem] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left";

const UserDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermission();
  const userId = params?.id as string;

  const canUpdateUser = hasPermission(
    ModuleNameEnum.USERS,
    PermissionAction.UPDATE,
  );
  const canReadUsers = hasPermission(
    ModuleNameEnum.USERS,
    PermissionAction.READ,
  );

  if (!canReadUsers) {
    return (
      <div className="min-h-screen bg-transparent p-3 sm:p-5">
        <div className={`${shellCardClass} p-6`}>
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-sm text-red-700 mt-1">
            You don't have permission to view users.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/users")}>
            Return to Users
          </Button>
        </div>
      </div>
    );
  }

  if (!canUpdateUser) {
    return (
      <div className="min-h-screen bg-transparent p-3 sm:p-5">
        <div className={shellCardClass}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
            <div>
              <h1 className="text-[22px] font-bold text-[#111827]">User Details</h1>
              <p className="text-[13px] text-gray-400 mt-1">Read-only access</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/users/${userId}/branch-switch-logs`)}
                className="flex items-center gap-2 shadow-sm"
              >
                <History className="h-4 w-4" />
                Branch Switch Logs
              </Button>
              <Button variant="outline" onClick={() => router.push("/users")} className="flex items-center gap-2 shadow-sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
          <div className="p-6 bg-gray-50/30">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
              <h3 className="text-lg font-semibold text-yellow-900">Read-Only</h3>
              <p className="text-sm text-yellow-700">
                You have read-only access to this user.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <div className={shellCardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827]">User Details</h1>
            <p className="text-[13px] text-gray-400 mt-1">View and update employee information</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/users/${userId}/branch-switch-logs`)}
              className="flex items-center gap-2 shadow-sm"
            >
              <History className="h-4 w-4" />
              Branch Switch Logs
            </Button>
            <Button variant="outline" onClick={() => router.push("/users")} className="flex items-center gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="p-6 bg-gray-50/30">
          <EditUserFormMultiStep userId={userId} embeddedInPageShell />
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
