"use client";

import { ErrorAlert } from "@/components/ErrorAlert";
import { useLotMasters, useLotMasterMutations } from "@/hooks/useLotMaster";
import { LotMasterFilters } from "@/types/lot-master.type";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Edit2, Trash2, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { APP_ROUTE } from "@/routes";
import { toast } from "sonner";
import { usePermission } from "@/hooks";
import { ModuleNameEnum } from "@/types/role.type";
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

export function LotMasterTable() {
  const router = useRouter();
  const { canUpdate, canDelete, canRead, canCreate } = usePermission();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedLotName, setSelectedLotName] = useState("");

  const filters: LotMasterFilters = useMemo(
    () => ({
      page: currentPage,
      limit: rowsPerPage,
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
    [currentPage, rowsPerPage]
  );

  const { lotMasters, total, totalPages, loading, error, refetch } = useLotMasters(filters);
  const { remove } = useLotMasterMutations();

  const meta = useMemo(
    () => ({
      page: currentPage,
      limit: rowsPerPage,
      total,
      totalPages: totalPages || 1,
    }),
    [currentPage, rowsPerPage, total, totalPages]
  );

  useEffect(() => {
    refetch();
  }, [currentPage]);

  const handleDeleteClick = (id: string, name: string) => {
    setSelectedLotId(id);
    setSelectedLotName(name);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedLotId) {
      remove(selectedLotId)
        .then(() => {
          toast.success("LOT Master deleted successfully");
          refetch();
        })
        .catch((error) => {
          toast.error(error?.response?.data?.message || "Failed to delete LOT Master");
        });
      setDeleteDialogOpen(false);
      setSelectedLotId(null);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/lot-master/${id}/edit`);
  };

  // Pagination logic
  const startEntry = meta.total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const MathTotal = meta.total || 0;
  const endEntry = Math.min(currentPage * rowsPerPage, MathTotal);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(meta.totalPages, 5); i++) pages.push(i);
    return pages;
  }, [meta.totalPages]);

  return (
    <>
      <ErrorAlert
        isOpen={!!error}
        title="Error Loading LOT Masters"
        message={error?.message || "Failed to load LOT Masters. Please try again."}
      />
      <div className="bg-white rounded-[1.5rem] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
        {/* ── Header Row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827]">LOT Cap Master</h1>
            <p className="text-[13px] text-gray-400 mt-1">Manage LOT (Limits of Transferable) Cap Masters for payroll disbursement limits</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canCreate(ModuleNameEnum.LOT) && (
              <button
                onClick={() => router.push(APP_ROUTE.LOT.CREATE.PATH)}
                className="flex items-center gap-2 bg-[#007aff] hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold shadow-sm shadow-blue-500/30 transition-colors"
                title="Create LOT Cap Master"
              >
                <Plus className="w-4 h-4" />
                Create LOT Cap Master
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
                  LOT CAP NAME
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  CAP AMOUNT
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  CREATED AT
                </th>
                <th className="px-3 py-3 pr-5 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                  </td>
                </tr>
              ) : lotMasters.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    No LOT Masters found
                  </td>
                </tr>
              ) : (
                lotMasters.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                    {/* LOT CAP NAME */}
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-800">{row.name}</p>
                    </td>

                    {/* CAP AMOUNT */}
                    <td className="px-3 py-3 text-right font-medium text-gray-800">
                      ₹{row.lotCapAmount?.toLocaleString() || "0"}
                    </td>

                    <td className="px-3 py-3 text-center text-gray-600 text-xs">
                      {row.createdAt ? format(new Date(row.createdAt), "dd MMM, yyyy") : "—"}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-3 py-3 pr-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canRead(ModuleNameEnum.LOT) && (
                          <button
                            onClick={() => {
                              // Add view action if available
                            }}
                            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canUpdate(ModuleNameEnum.LOT) && (
                          <button
                            onClick={() => handleEdit(row._id)}
                            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete(ModuleNameEnum.LOT) && (
                          <button
                            onClick={() => handleDeleteClick(row._id, row.name)}
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
            Showing {startEntry} to {endEntry} of {MathTotal} entries
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
              onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={currentPage >= meta.totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-xs"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(meta.totalPages)}
              disabled={currentPage >= meta.totalPages}
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
              Are you sure you want to delete "{selectedLotName}"? This action cannot be undone.
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

export default LotMasterTable;
