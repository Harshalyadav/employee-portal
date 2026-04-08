"use client";

import { useRouter } from "next/navigation";
import PayrollDataTable from "@/components/datatable/payroll/PayrollDataTable";
import { usePermission } from "@/hooks";
import { ModuleNameEnum, PermissionAction } from "@/types";
import { APP_ROUTE } from "@/routes";

export function PayrollPage() {
  const router = useRouter();
  const { hasPermission } = usePermission();

  const canCreatePayroll = hasPermission(ModuleNameEnum.PAYROLL, PermissionAction.CREATE);
  const canReadPayroll = hasPermission(ModuleNameEnum.PAYROLL, PermissionAction.READ);

  if (!canReadPayroll) {
    return (
      <div className="min-h-screen bg-[#f0f6ff] p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-sm text-red-700 mt-1">
            You don't have permission to view payroll.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <PayrollDataTable />
    </div>
  );
}

export default PayrollPage;
