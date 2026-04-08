"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import RoleTable from "@/components/datatable/role/RoleTable";
import { RoleTypeEnum } from "@/types";
import { usePermission } from "@/hooks";
import { ModuleNameEnum } from "@/types/role.type";
import { ErrorAlert } from "@/components/ErrorAlert";

const RolePage = () => {
  const router = useRouter();
  const { canRead, canCreate } = usePermission();
  const [roleTypeFilter, setRoleTypeFilter] = useState<RoleTypeEnum | "all">("all");

  if (!canRead(ModuleNameEnum.ROLES)) {
    return (
      <div className="min-h-screen bg-[#f0f6ff] p-6">
        <ErrorAlert
          isOpen={true}
          title="Access Denied"
          message="You do not have permission to view roles."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <RoleTable
        roleTypeFilter={roleTypeFilter === "all" ? undefined : roleTypeFilter}
        onFilterChange={setRoleTypeFilter}
      />
    </div>
  );
};

export default RolePage;
