"use client";

import VisaManagerTable from "@/components/datatable/visa-manager/VisaManagerTable";
import { usePermission } from "@/hooks";
import { ModuleNameEnum, PermissionAction } from "@/types";

const VisaManagerPage = () => {
  const { hasPermission } = usePermission();

  const canReadVisaManager = hasPermission(
    ModuleNameEnum.VISA_MANAGER,
    PermissionAction.READ,
  );

  // If user doesn't have read permission, don't show the page
  if (!canReadVisaManager) {
    return (
      <div className="min-h-screen bg-[#f0f6ff] p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-sm text-red-700 mt-1">
            You don't have permission to view the Visa Manager..
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <VisaManagerTable />
    </div>
  );
};

export default VisaManagerPage;
