"use client";

import { useEffect, useMemo, useState } from "react";
import { useDeleteRole, useInfiniteRoles } from "@/hooks/query/role.hook";
import { RoleFilters, RoleTypeEnum, IRole } from "@/types/role.type";
import { usePermission } from "@/hooks";
import { ModuleNameEnum, PermissionAction } from "@/types/role.type";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Eye, Edit, Plus, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
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

interface RoleTableProps {
  roleTypeFilter?: RoleTypeEnum;
  onFilterChange?: (filter: RoleTypeEnum | "all") => void;
}

const RoleTable = ({ roleTypeFilter, onFilterChange }: RoleTableProps) => {
  const router = useRouter();
  const { hasPermission, canCreate } = usePermission();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const canUpdateRoles = hasPermission(ModuleNameEnum.ROLES, PermissionAction.UPDATE);
  const canDeleteRoles = hasPermission(ModuleNameEnum.ROLES, PermissionAction.DELETE);

  const filters: RoleFilters = useMemo(
    () => ({ search: search || undefined, limit: rowsPerPage }),
    [search, rowsPerPage]
  );

  const {
    data: rolesPages,
    isLoading,
    isError,
    fetchNextPage,
    isFetchingNextPage,
    error,
  } = useInfiniteRoles(filters);

  const { mutate: deleteRole } = useDeleteRole();

  useEffect(() => {
    fetchNextPage();
  }, [currentPage]);

  // Current page data
  const currentPageData = useMemo(() => {
    const allPages = rolesPages?.pages || [];
    return allPages.find((p) => p.pagination?.page === currentPage);
  }, [rolesPages, currentPage]);

  const roles = useMemo(() => currentPageData?.data || [], [currentPageData]);

  const meta = useMemo(() => {
    if (!currentPageData?.pagination) return { page: currentPage, limit: rowsPerPage, total: 0, totalPages: 0 };
    return {
      page: currentPageData.pagination.page,
      limit: rowsPerPage,
      total: currentPageData.pagination.total,
      totalPages: currentPageData.pagination.pages || (currentPageData.pagination as any).totalPages || 1,
    };
  }, [currentPageData, currentPage, rowsPerPage]);

  // Filter by role type client-side if needed
  const filteredRoles = useMemo(() => {
    if (!roleTypeFilter) return roles;
    return roles.filter((r: IRole) => r.roleType === roleTypeFilter);
  }, [roles, roleTypeFilter]);

  const handleDeleteClick = (roleId: string) => {
    setSelectedRoleId(roleId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedRoleId) {
      deleteRole(selectedRoleId);
      setDeleteDialogOpen(false);
      setSelectedRoleId(null);
    }
  };

  // Pagination
  const totalPages = meta.totalPages || 1;
  const startEntry = meta.total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = Math.min(currentPage * rowsPerPage, meta.total);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) pages.push(i);
    return pages;
  }, [totalPages]);

  return (
    <>
      {isError && (
        <ErrorAlert
          isOpen={true}
          title="Error Loading Roles"
          message={error?.message || "Failed to load roles."}
        />
      )}

      <div className="bg-white rounded-[1.5rem] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
        {/* ── Header Row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827]">Roles & Permissions</h1>
            <p className="text-[13px] text-gray-400 mt-1">Manage roles and their permission settings</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Role type filter tabs */}
            <div className="flex rounded-full overflow-hidden p-[3px] bg-white border border-gray-200/80 shadow-sm">
              {(["all", RoleTypeEnum.EMPLOYEE, RoleTypeEnum.NON_EMPLOYEE] as const).map((type) => {
                const isActive = (type === "all" && !roleTypeFilter) || type === roleTypeFilter;
                return (
                  <button
                    key={type}
                    onClick={() => onFilterChange?.(type)}
                    className={`px-5 py-1.5 text-[13px] font-bold rounded-full transition-colors ${isActive
                        ? "bg-[#007aff] text-white shadow-[0_2px_4px_rgba(0,122,255,0.3)]"
                        : "bg-transparent text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    {type === "all" ? "All Types" : type === RoleTypeEnum.EMPLOYEE ? "Employee" : "Non-Employee"}
                  </button>
                );
              })}
            </div>

            {canCreate(ModuleNameEnum.ROLES) && (
              <button
                onClick={() => router.push("/roles/new")}
                className="flex items-center gap-2 bg-[#007aff] hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold shadow-sm shadow-blue-500/30 transition-colors"
                title="Create Role"
              >
                <Plus className="w-4 h-4" />
                Create Role
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  ROLE NAME
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  DESCRIPTION
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  TYPE
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  PERMISSIONS
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  CREATED
                </th>
                <th className="px-3 py-3 pr-5 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading || isFetchingNextPage ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No roles found
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role: IRole) => (
                  <tr key={role._id} className="hover:bg-gray-50 transition-colors">
                    {/* ROLE NAME */}
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-800">{role.roleName}</p>
                    </td>

                    {/* DESCRIPTION */}
                    <td className="px-3 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                      {role.description || "—"}
                    </td>

                    {/* TYPE */}
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${role.roleType === RoleTypeEnum.EMPLOYEE
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                        }`}>
                        {role.roleType === RoleTypeEnum.EMPLOYEE ? "Employee" : "Non-Employee"}
                      </span>
                    </td>

                    {/* PERMISSIONS COUNT */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                        {role.permissionMatrix?.length ?? 0} modules
                      </span>
                    </td>

                    {/* CREATED */}
                    <td className="px-3 py-3 text-center text-gray-600 text-xs">
                      {role.createdAt ? format(new Date(role.createdAt), "dd MMM, yyyy") : "—"}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-3 py-3 pr-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* View */}
                        <button
                          onClick={() => {
                            if (typeof window !== "undefined")
                              window.location.href = `/roles/${role._id}`;
                          }}
                          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        {canUpdateRoles && (
                          <button
                            onClick={() => {
                              if (typeof window !== "undefined")
                                window.location.href = `/roles/${role._id}/edit`;
                            }}
                            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete */}
                        {canDeleteRoles && (
                          <button
                            onClick={() => handleDeleteClick(role._id)}
                            className="w-7 h-7 rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
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

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {startEntry} to {endEntry} of {meta.total} entries
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-xs"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-xs"
            >
              ‹
            </button>

            {pageNumbers.map((pg) => (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`w-8 h-8 flex items-center justify-center rounded border text-sm font-medium transition-colors ${currentPage === pg
                  ? "bg-blue-500 text-white border-blue-500"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {pg}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-xs"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-xs"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the role
              and remove all associated permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RoleTable;
