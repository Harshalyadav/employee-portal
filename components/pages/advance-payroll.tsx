"use client";

import { useRouter } from "next/navigation";
import { AdvancePayrollDataTable } from "@/components/datatable";
import { APP_ROUTE } from "@/routes";
import { usePermission } from "@/hooks";
import { ModuleNameEnum, PermissionAction } from "@/types";

export function AdvancePayrollPage() {
  const router = useRouter();
  const { hasPermission } = usePermission();

  const canCreateAdvance = hasPermission(ModuleNameEnum.ADVANCE, PermissionAction.CREATE);
  const canReadAdvance = hasPermission(ModuleNameEnum.ADVANCE, PermissionAction.READ);

  if (!canReadAdvance) {
    return (
      <div className="min-h-screen bg-[#f0f6ff] p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-sm text-red-700 mt-1">
            You don't have permission to view loans.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <AdvancePayrollDataTable />
    </div>
  );
}

export default AdvancePayrollPage;
