"use client";

import { useMemo, useState } from "react";
import { useAdminHeads, useAdminManagers, useDeleteAdminHead, usePermission } from "@/hooks";
import { IAdminHead, ModuleNameEnum, PermissionAction, UserFilters } from "@/types";
import { useAppStore } from "@/stores";
import { isPrivilegedAdminUser } from "@/lib/admin-head-access";
interface UserTableProps {
  initialFilters?: UserFilters;
}
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const normalizeRoleName = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");


const AdminUserTable = ({ initialFilters }: UserTableProps = {}) => {
  const router = useRouter();
  const { user } = useAppStore();
  const { hasPermission } = usePermission();
  const currentRoleName = normalizeRoleName(
    (user as any)?.role?.roleName ??
      (((user as any)?.roleId && typeof (user as any).roleId === "object")
        ? (user as any).roleId?.roleName
        : ""),
  );
  const isPrivilegedAdmin = isPrivilegedAdminUser(user);
  const canCreateUser = hasPermission(ModuleNameEnum.USERS, PermissionAction.CREATE);
  const canUpdateUser = hasPermission(ModuleNameEnum.USERS, PermissionAction.UPDATE) && isPrivilegedAdmin;
  const canDeleteUser = hasPermission(ModuleNameEnum.USERS, PermissionAction.DELETE) && isPrivilegedAdmin;

  const [search, setSearch] = useState(initialFilters?.search || "");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const isHeadRole = currentRoleName === "hr_head" || currentRoleName === "visa_head" || currentRoleName === "account_head";
  const [activeTab, setActiveTab] = useState<"heads" | "managers">(isHeadRole ? "managers" : "heads");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const {
    data: headsResponse,
    isLoading: headsLoading,
    isFetching: headsFetching,
  } = useAdminHeads(currentPage, rowsPerPage, search || undefined, "active", "createdAt", "desc", activeTab === "heads");

  const {
    data: managersResponse,
    isLoading: managersLoading,
    isFetching: managersFetching,
  } = useAdminManagers(currentPage, rowsPerPage, search || undefined, "active", "createdAt", "desc", activeTab === "managers");

  const { mutate: deleteAdminHead, isPending: isDeleting } = useDeleteAdminHead();

  const usersResponse = activeTab === "heads" ? headsResponse : managersResponse;
  const isLoading = activeTab === "heads" ? headsLoading : managersLoading;
  const isFetching = activeTab === "heads" ? headsFetching : managersFetching;
  const adminUsers = useMemo(() => usersResponse?.data || [], [usersResponse]);

  const meta = useMemo(() => {
    const pageMeta = usersResponse?.pagination;
    if (!pageMeta)
      return { page: currentPage, limit: rowsPerPage, total: 0, totalPages: 0 };
    return {
      page: parseInt((pageMeta.page as unknown as string) || "0", 10),
      limit: rowsPerPage,
      total: pageMeta.total,
      totalPages: pageMeta.pages,
    };
  }, [usersResponse, currentPage, rowsPerPage]);

  const totalPages = meta.totalPages || 1;
  const startEntry = meta.total === 0 ? 0 : (currentPage - 1) * meta.limit + 1;
  const endEntry = Math.min(currentPage * meta.limit, meta.total);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    const adjustedStart = Math.max(1, end - maxVisible + 1);
    for (let i = adjustedStart; i <= end; i++) pages.push(i);
    return pages;
  }, [totalPages, currentPage]);

  const getUserId = (user: IAdminHead) => user._id || user.id || "";

  const getRoleName = (user: IAdminHead) => {
    if (typeof user.role === "string") {
      return user.role;
    }

    if (user.role && typeof user.role === "object") {
      const role = user.role as { roleName?: string; name?: string };
      return role.roleName || role.name || "ADMIN";
    }

    if (user.roleId && typeof user.roleId === "object") {
      const role = user.roleId as { roleName?: string; name?: string };
      return role.roleName || role.name || "ADMIN";
    }

    return "ADMIN";
  };

  const getCreatedByName = (user: IAdminHead) => {
    const creator = (user as any)?.createdBy;
    if (!creator) return "—";
    if (typeof creator === "string") return creator;
    return creator.fullName || creator.name || creator.email || "—";
  };

  const handleDeleteClick = (userId: string) => {
    setSelectedUserId(userId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedUserId) {
      return;
    }

    const selectedUser = adminUsers.find((user) => getUserId(user) === selectedUserId);
    const roleName = selectedUser ? getRoleName(selectedUser) : "";

    deleteAdminHead({ id: selectedUserId, roleName }, {
      onSuccess: () => {
        toast.success("Admin user deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedUserId(null);
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : "Failed to delete admin user";
        toast.error(message);
      },
    });
  };

  return (
    <>
    <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827]">Admin Users</h1>
          <p className="text-[13px] text-gray-400 mt-1">Manage admin users and their permissions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canCreateUser && (
            <button
              onClick={() => router.push("/admin-users/create")}
              className="w-auto p-2 gap-2 font-bold h-[38px] flex justify-center items-center rounded-[10px] bg-[#007aff] hover:bg-blue-600 text-white shadow-sm shadow-blue-500/30 transition-colors hover:cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Admin User
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-10 px-6 py-5 border-b border-gray-100">
        <div>
          <p className="text-[40px] leading-tight font-bold text-[#4285f4] tracking-tight">
            {isLoading ? "—" : String(meta.total).padStart(2, "0")}
          </p>
          <p className="text-[13px] font-bold text-gray-900 tracking-wide mt-1">
            {activeTab === "heads" ? "Heads" : "Managers"}
          </p>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between px-6 py-4 border-b border-gray-100 gap-4">
        <div className="flex flex-nowrap items-center gap-3 min-w-0 overflow-x-auto pb-1">
          {!isHeadRole && (
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("heads");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === "heads" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Heads
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("managers");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === "managers" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Managers
              </button>
            </div>
          )}
          <div className="relative w-[280px] shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search admin users..."
              className="w-full pl-10 pr-4 py-2.5 text-[13px] font-medium border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white shadow-sm placeholder-gray-400 text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pl-6 pr-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">NAME</th>
              <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">ROLE</th>
              {activeTab === "managers" && isPrivilegedAdmin && (
                <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">CREATED BY (HEAD)</th>
              )}
              <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">EMAIL</th>
              <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">PHONE</th>
              <th className="px-3 py-4 pr-6 text-center text-[11px] font-bold text-gray-600 uppercase tracking-wide">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading || isFetching ? (
              <tr>
                <td colSpan={activeTab === "managers" && isPrivilegedAdmin ? 6 : 5} className="text-center py-12">
                  <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></span>
                </td>
              </tr>
            ) : adminUsers.length === 0 ? (
              <tr>
                <td colSpan={activeTab === "managers" && isPrivilegedAdmin ? 6 : 5} className="text-center py-12 text-gray-400">
                  No admin users found
                </td>
              </tr>
            ) : (
                adminUsers.map((user: IAdminHead) => (
                <tr key={getUserId(user)} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="pl-6 pr-3 py-4 text-[13px] font-bold text-gray-800">
                    {user.name || user.fullName || "—"}
                  </td>
                  <td className="px-3 py-4">
                    <span className={`inline-flex items-center gap-1.5 border rounded-full text-[10px] font-bold px-3 py-1 tracking-wide border-blue-200 text-blue-600 bg-blue-50`}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block bg-blue-500" />
                      {getRoleName(user).toUpperCase()}
                    </span>
                  </td>
                  {activeTab === "managers" && isPrivilegedAdmin && (
                    <td className="px-3 py-4 text-[13px] font-medium text-gray-700">
                      {getCreatedByName(user)}
                    </td>
                  )}
                  <td className="px-3 py-4">
                    <p className="font-bold text-gray-800 text-[13px]">{user.email}</p>
                  </td>
                  <td className="px-3 py-4 text-gray-500 text-[13px] font-medium">
                    {user.phoneNumber || user.phone || "—"}
                  </td>
                  <td className="px-3 py-4 pr-6 text-center">
                    <div className="flex items-center justify-center gap-1.5 opacity-100 transition-opacity">
                      {canUpdateUser && !String(getRoleName(user) || "").toLowerCase().includes("manager") && (
                        <button
                          onClick={() => router.push(`/admin-users/edit/${getUserId(user)}`)}
                          className="w-7 h-7 rounded-[6px] bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDeleteUser && (
                        <button
                          onClick={() => handleDeleteClick(getUserId(user))}
                          className="w-7 h-7 rounded-[6px] bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-t border-gray-100 gap-4">
        <p className="text-[13px] font-medium text-gray-500">
          Showing {startEntry} to {endEntry} of {meta.total} entries
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
          >
            «
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
          >
            ‹
          </button>
          {pageNumbers.map((pg) => (
            <button
              key={pg}
              onClick={() => setCurrentPage(pg)}
              className={`w-8 h-8 flex items-center justify-center rounded-xl text-[13px] font-bold transition-colors ${
                currentPage === pg
                  ? "bg-[#007aff] text-white shadow-sm shadow-blue-500/30"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {pg}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
          >
            ›
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
          >
            »
          </button>
        </div>
      </div>
    </div>
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Admin User</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the selected admin user.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default AdminUserTable;
