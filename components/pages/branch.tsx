"use client";

import { useRouter } from "next/navigation";
import { BranchDataTable } from "@/components/datatable/branch/BranchDataTable";
import { usePermission } from "@/hooks";
import { ModuleNameEnum, PermissionAction } from "@/types";

const BranchPage = () => {
  const router = useRouter();
  const { hasPermission } = usePermission();

  const canCreateBranch = hasPermission(ModuleNameEnum.BRANCH, PermissionAction.CREATE);
  const canReadBranches = hasPermission(ModuleNameEnum.BRANCH, PermissionAction.READ);

  if (!canReadBranches) {
    return (
      <div className="min-h-screen bg-[#f0f6ff] p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-sm text-red-700 mt-1">
            You don't have permission to view branches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <BranchDataTable />
    </div>
  );
};

export default BranchPage;
