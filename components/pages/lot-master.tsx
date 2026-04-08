"use client";

import { useRouter } from "next/navigation";
import { LotMasterTable } from "@/components/datatable/lot-master/LotMasterTable";
import { APP_ROUTE } from "@/routes";
import { usePermission } from "@/hooks";
import { ModuleNameEnum } from "@/types/role.type";
import { ErrorAlert } from "@/components/ErrorAlert";

const LotMasterPage = () => {
  const router = useRouter();
  const { canRead, canCreate } = usePermission();

  if (!canRead(ModuleNameEnum.LOT)) {
    return (
      <div className="min-h-screen bg-[#f0f6ff] p-6">
        <ErrorAlert
          isOpen={true}
          title="Access Denied"
          message="You do not have permission to view LOT Masters."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <LotMasterTable />
    </div>
  );
};

export default LotMasterPage;
