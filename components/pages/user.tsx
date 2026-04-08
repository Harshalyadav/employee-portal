"use client";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import UserTable from "@/components/datatable/user/UserTable";
import { usePermission } from "@/hooks";
import { useRoles } from "@/hooks/query/role.hook";
import { getAdminHeadAccessRole } from "@/lib/admin-head-access";
import { useAppStore } from "@/stores";
import { ModuleNameEnum, PermissionAction } from "@/types";

const UserPage = () => {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const { user } = useAppStore();
  const accessRole = getAdminHeadAccessRole(user);

  const canCreateUser = hasPermission(ModuleNameEnum.USERS, PermissionAction.CREATE);
  const canReadUsers = hasPermission(ModuleNameEnum.USERS, PermissionAction.READ);

  // Fetch all roles to find EMPLOYEE role ID
  const { data: rolesResponse } = useRoles(1, 100);

  // Find EMPLOYEE role ID from available roles
  const employeeRoleId = useMemo(() => {
    const roles = rolesResponse?.data || [];
    const employeeRole = roles.find(
      (role: any) => {
        const normalizedRoleName = String(role?.roleName || "")
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_");
        return normalizedRoleName === "employee" || normalizedRoleName === "employees";
      }
    );
    return employeeRole?._id || employeeRole?.id || "";
  }, [rolesResponse]);

  const assignedBranchIds = useMemo(() => {
    const branches = Array.isArray((user as any)?.permissions?.branches)
      ? (user as any).permissions.branches
      : [];

    const ids = branches
      .map((branch: any) => String(branch?.id || branch?._id || "").trim())
      .filter(Boolean);

    if (ids.length > 0) {
      return ids;
    }

    const fallbackBranchId = String((user as any)?.branch?.id || (user as any)?.branchId || "").trim();
    return fallbackBranchId ? [fallbackBranchId] : [];
  }, [user]);

  const scopedBranchIds = useMemo(() => {
    if (accessRole === "HR_HEAD" || accessRole === "HR_MANAGER") {
      return assignedBranchIds;
    }

    return undefined;
  }, [accessRole, assignedBranchIds]);

  if (!canReadUsers) {
    return (
      <div className="min-h-screen bg-[#f0f6ff] p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-sm text-red-700 mt-1">
            You don't have permission to view employees.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <UserTable initialFilters={{ roleId: employeeRoleId, branchIds: scopedBranchIds }} />
    </div>
  );
};

export default UserPage;
