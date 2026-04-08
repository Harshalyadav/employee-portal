"use client";

import { useParams, useRouter } from "next/navigation";
import { useBranch } from "@/hooks/query/useBranch";
import { EditBranchForm } from "@/components/form/EditBranchForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { usePermission } from "@/hooks";
import { getAdminHeadAccessRole } from "@/lib/admin-head-access";
import { useAppStore } from "@/stores";
import { ModuleNameEnum, PermissionAction } from "@/types";

const shellCardClass =
  "bg-white rounded-[1.5rem] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left";

const BranchDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermission();
  const { user } = useAppStore();
  const branchId = params?.id as string;
  const isHeadRole = !!getAdminHeadAccessRole(user);

  const canUpdateBranch = hasPermission(
    ModuleNameEnum.BRANCH,
    PermissionAction.UPDATE,
  );
  const canReadBranches = hasPermission(
    ModuleNameEnum.BRANCH,
    PermissionAction.READ,
  );

  if (!canReadBranches) {
    return (
      <div className="min-h-screen bg-transparent p-3 sm:p-5">
        <div className={shellCardClass}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
            <div>
              <h1 className="text-[22px] font-bold text-[#111827]">Branch Details</h1>
              <p className="text-[13px] text-gray-400 mt-1">View branch information</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/branches")} className="flex items-center gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="p-6 bg-gray-50/30">
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
              <p className="text-sm text-red-700 mb-4">
                You don't have permission to view branches.
              </p>
              <button
                type="button"
                onClick={() => router.push("/branches")}
                className="text-sm text-red-700 hover:text-red-900 underline"
              >
                Return to Branches
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!canUpdateBranch || isHeadRole) {
    return (
      <div className="min-h-screen bg-transparent p-3 sm:p-5">
        <div className={shellCardClass}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
            <div>
              <h1 className="text-[22px] font-bold text-[#111827]">Branch Details</h1>
              <p className="text-[13px] text-gray-400 mt-1">Read-only access</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/branches")} className="flex items-center gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="p-6 bg-gray-50/30">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
              <h3 className="text-lg font-semibold text-yellow-900">Read-Only</h3>
              <p className="text-sm text-yellow-700">
                You have read-only access to this branch.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data: branch, isLoading, error } = useBranch(branchId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent p-3 sm:p-5">
        <div className={shellCardClass}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
            <div>
              <h1 className="text-[22px] font-bold text-[#111827]">Branch Details</h1>
              <p className="text-[13px] text-gray-400 mt-1">Update branch information</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/branches")} className="flex items-center gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="p-6 bg-gray-50/30 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="min-h-screen bg-transparent p-3 sm:p-5">
        <div className={shellCardClass}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
            <div>
              <h1 className="text-[22px] font-bold text-[#111827]">Branch not found</h1>
              <p className="text-[13px] text-gray-400 mt-1">This branch could not be loaded</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/branches")} className="flex items-center gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Branches
            </Button>
          </div>
          <div className="p-6 bg-gray-50/30 flex items-center justify-center py-12">
            <p className="text-muted-foreground">Branch not found</p>
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
            <h1 className="text-[22px] font-bold text-[#111827]">Branch Details</h1>
            <p className="text-[13px] text-gray-400 mt-1">Update branch information</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/branches")} className="flex items-center gap-2 shadow-sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="p-6 bg-gray-50/30">
          <EditBranchForm branch={branch} onSuccess={() => router.push("/branches")} />
        </div>
      </div>
    </div>
  );
};

export default BranchDetailPage;
