"use client";
import { useRouter } from "next/navigation";
import AdminUserTable from "@/components/datatable/admin-user/AdminUserTable";
import { usePermission } from "@/hooks";
import { canAccessAdminUsers, canAccessPathByRole } from "@/lib/admin-head-access";
import { useAppStore } from "@/stores";
import { ModuleNameEnum, PermissionAction } from "@/types";

const AdminUserPage = () => {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const { user } = useAppStore();

  const canCreateUser = hasPermission(ModuleNameEnum.USERS, PermissionAction.CREATE);
  const canReadUsers = hasPermission(ModuleNameEnum.USERS, PermissionAction.READ);

  if (!canReadUsers || !canAccessAdminUsers(user) || !canAccessPathByRole(user, "/admin-users")) {
    return (
      <div className="min-h-screen bg-[#f0f6ff] p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-sm text-red-700 mt-1">
            You don't have permission to view admin users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <AdminUserTable />
    </div>
  );
};

export default AdminUserPage;
