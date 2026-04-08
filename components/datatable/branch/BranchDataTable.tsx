"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trash2, Search, Loader2, Edit } from "lucide-react";
import {
  useDeleteBranch,
  useInfiniteBranches,
} from "@/hooks/query/useBranch";
import { usePermission } from "@/hooks";
import { getAdminHeadAccessRole, isHeadAccessRole } from "@/lib/admin-head-access";
import { useAppStore } from "@/stores";
import { IBranch, BranchStatusEnum } from "@/types/branch.type";
import { ModuleNameEnum, PermissionAction } from "@/types";
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
import { format } from "date-fns";

interface BranchDataTableProps {
  limit?: number;
}

export function BranchDataTable({ limit = 50 }: BranchDataTableProps) {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const { user } = useAppStore();
  const accessRole = getAdminHeadAccessRole(user);
  const isHeadRole = isHeadAccessRole(accessRole);

  const canCreateBranch =
    hasPermission(ModuleNameEnum.BRANCH, PermissionAction.CREATE) && !isHeadRole;
  const canUpdateBranch =
    hasPermission(ModuleNameEnum.BRANCH, PermissionAction.UPDATE) && !isHeadRole;
  const canDeleteBranch =
    hasPermission(ModuleNameEnum.BRANCH, PermissionAction.DELETE) && !isHeadRole;

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "closed">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const {
    data: branchPages,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteBranches(limit);

  const deleteBranchMutation = useDeleteBranch();

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDeleteClick = (branchId: string) => {
    setSelectedBranchId(branchId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedBranchId) {
      await deleteBranchMutation.mutateAsync(selectedBranchId);
      setDeleteDialogOpen(false);
      setSelectedBranchId(null);
    }
  };

  const formatAddress = (address: IBranch["branchAddress"]) => {
    if (!address) return "—";
    if (typeof address === "string") return address;
    return [address.city, address.state, address.country].filter(Boolean).join(", ") || "—";
  };

  // Flatten all pages, deduplicate
  const allBranches = useMemo(() => {
    const raw = (branchPages?.pages || []).flatMap((p: any) => p?.data ?? []);
    const map = new Map<string, IBranch>();
    for (const b of raw) {
      const key = b?._id || b?.id;
      if (key && !map.has(key)) map.set(key, b);
    }
    return Array.from(map.values());
  }, [branchPages]);

  // Search filter
  const searched = useMemo(() => {
    if (!search.trim()) return allBranches;
    const q = search.toLowerCase();
    return allBranches.filter(
      (b) =>
        b.branchName?.toLowerCase().includes(q) ||
        b.branchCode?.toLowerCase().includes(q) ||
        formatAddress(b.branchAddress).toLowerCase().includes(q)
    );
  }, [allBranches, search]);

  // Tab filter
  const activeCount = useMemo(() => allBranches.filter((b) => b.status === BranchStatusEnum.ACTIVE).length, [allBranches]);
  const closedCount = useMemo(() => allBranches.filter((b) => b.status !== BranchStatusEnum.ACTIVE).length, [allBranches]);

  const filteredBranches = useMemo(() => {
    if (activeTab === "all") return searched;
    return searched.filter((b) =>
      activeTab === "active"
        ? b.status === BranchStatusEnum.ACTIVE
        : b.status !== BranchStatusEnum.ACTIVE
    );
  }, [searched, activeTab]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredBranches.length / rowsPerPage));
  const paginated = filteredBranches.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const startEntry = filteredBranches.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = Math.min(currentPage * rowsPerPage, filteredBranches.length);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) pages.push(i);
    return pages;
  }, [totalPages]);

  return (
    <>
      <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
        {/* ── Header Row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827]">Branches</h1>
            <p className="text-[13px] text-gray-400 mt-1">Manage and view all branches</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Picker Removed */}

            {canCreateBranch && (
              <button
                onClick={() => router.push("/branches/new")}
                className="w-auto p-2 font-bold h-[38px] flex justify-center items-center rounded-[10px] bg-[#007aff] hover:bg-blue-600 text-white shadow-sm shadow-blue-500/30 transition-colors"
                title="Create Branch"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
                Create Branch
              </button>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="flex gap-10 px-6 py-5 border-b border-gray-100">
          <div>
            <p className="text-[40px] leading-tight font-bold text-[#4285f4] tracking-tight">
              {isLoading ? "—" : String(allBranches.length).padStart(2, "0")}
            </p>
            <p className="text-[13px] font-bold text-gray-900 tracking-wide mt-1">Branches</p>
          </div>
          <div>
            <p className="text-[40px] leading-tight font-bold text-[#34a853] tracking-tight">
              {isLoading ? "—" : String(activeCount).padStart(2, "0")}
            </p>
            <p className="text-[13px] font-bold text-gray-900 tracking-wide mt-1">Active</p>
          </div>
          <div>
            <p className="text-[40px] leading-tight font-bold text-[#ea4335] tracking-tight">
              {isLoading ? "—" : String(closedCount).padStart(2, "0")}
            </p>
            <p className="text-[13px] font-bold text-gray-900 tracking-wide mt-1">Closed</p>
          </div>
        </div>

        {/* ── Filter bar ── */}
        {/* Filter bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          {/* Active / Closed tabs */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button
              onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === "all"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              All
            </button>
            <button
              onClick={() => { setActiveTab("active"); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === "active"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              Active
            </button>
            <button
              onClick={() => { setActiveTab("closed"); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === "closed"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
            >
              Closed
            </button>
          </div>

          {/* Search */}
          <div className="relative w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search"
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  BRANCH NAME
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  BRANCH CODE
                </th>
                {/* <th className="px-3 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  ADDRESS
                </th> */}
                {/* <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  STATUS
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  CREATED
                </th> */}
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
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No branches found
                  </td>
                </tr>
              ) : (
                paginated.map((branch) => {
                  const isActive = branch.status === BranchStatusEnum.ACTIVE;
                  return (
                    <tr key={branch._id} className="hover:bg-gray-50 transition-colors">
                      {/* BRANCH NAME */}
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-800">{branch.branchName}</p>
                      </td>

                      {/* BRANCH CODE */}
                      <td className="px-3 py-3">
                        <span className="font-semibold text-gray-700 text-xs">
                          {branch.branchCode}
                        </span>
                      </td>

                      {/* ADDRESS */}
                      {/* <td className="px-3 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                        {formatAddress(branch.branchAddress)}
                      </td> */}

                      {/* STATUS */}
                      {/* <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-500"
                            }`}
                        >
                          {branch.status}
                        </span>
                      </td> */}

                      {/* CREATED */}
                      {/* <td className="px-3 py-3 text-center text-gray-600 text-xs">
                        {branch.createdAt
                          ? format(new Date(branch.createdAt), "dd MMM, yyyy")
                          : "—"}
                      </td> */}

                      {/* ACTIONS */}
                      <td className="px-3 py-3 pr-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canUpdateBranch && (
                            <button
                              onClick={() => router.push(`/branches/${branch._id}`)}
                              className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDeleteBranch && (
                            <button
                              onClick={() => handleDeleteClick(branch._id)}
                              disabled={deleteBranchMutation.isPending}
                              className="w-7 h-7 rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {startEntry} to {endEntry} of {filteredBranches.length} entries
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
              This action cannot be undone. This will permanently delete the
              branch and remove all associated data.
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
}
