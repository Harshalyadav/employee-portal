"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { APP_ROUTE } from "@/routes";
import { useDeleteSponsorCompany, useSponsorCompanies } from "@/hooks";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { SponsorCompany } from "@/types/sponsor-company.type";
import { usePermission } from "@/hooks";
import { ModuleNameEnum, PermissionAction } from "@/types";
import { useAppStore } from "@/stores";
import { canAccessPathByRole, isPrivilegedAdminUser } from "@/lib/admin-head-access";

export function SponsorCompanyTable() {
  const router = useRouter();
  const { user } = useAppStore();
  const { hasPermission } = usePermission();
  const canAccessSponsorCompany = canAccessPathByRole(user, "/sponsor-company");
  const isHeadOrPrivileged = isPrivilegedAdminUser(user);
  // Sponsor-company remains invisible to HR Head / Account Head, so action buttons must
  // also short-circuit on the same path-level rule rather than only checking module flags.
  const canCreate = canAccessSponsorCompany && (isHeadOrPrivileged || hasPermission(ModuleNameEnum.VISA_MANAGER, PermissionAction.CREATE));
  const canUpdate = canAccessSponsorCompany && (isHeadOrPrivileged || hasPermission(ModuleNameEnum.VISA_MANAGER, PermissionAction.UPDATE));
  const canDelete = canAccessSponsorCompany && (isHeadOrPrivileged || hasPermission(ModuleNameEnum.VISA_MANAGER, PermissionAction.DELETE));

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const { data, isLoading, isFetching } = useSponsorCompanies(
    currentPage,
    rowsPerPage,
    search || undefined,
  );
  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteSponsorCompany();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const items = useMemo(() => data?.data || [], [data]);
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.pages || 1;
  const startEntry = total === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = Math.min(currentPage * rowsPerPage, total);

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteMutate(pendingDeleteId, {
      onSuccess: () => {
        toast.success("Sponsor company deleted successfully");
        setDeleteDialogOpen(false);
        setPendingDeleteId(null);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to delete sponsor company");
        setDeleteDialogOpen(false);
        setPendingDeleteId(null);
      },
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827]">Sponsor Company</h1>
          <p className="text-[13px] text-gray-400 mt-1">Manage sponsor company records.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => router.push(APP_ROUTE.SPONSOR_COMPANY.CREATE.PATH)}
            className="w-auto p-2 gap-2 font-bold h-[38px] flex justify-center items-center rounded-[10px] bg-[#007aff] hover:bg-blue-600 text-white shadow-sm shadow-blue-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Sponsor Company
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between px-6 py-4 border-b border-gray-100 gap-4">
        <div className="relative w-[280px] shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search sponsor companies..."
            className="w-full pl-10 pr-4 py-2.5 text-[13px] font-medium border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white shadow-sm placeholder-gray-400 text-gray-700"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pl-6 pr-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Company</th>
              <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Owner</th>
              <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Trade Licence No.</th>
              <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Expiry Date</th>
              <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">Documents</th>
              <th className="px-3 py-4 pr-6 text-center text-[11px] font-bold text-gray-600 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading || isFetching ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  No sponsor company found
                </td>
              </tr>
            ) : (
              items.map((row: SponsorCompany) => (
                <tr key={row._id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="pl-6 pr-3 py-4 text-[13px] font-bold text-gray-800">{row.nameOfCompany}</td>
                  <td className="px-3 py-4 text-[13px] text-gray-700">{row.nameOfOwner}</td>
                  <td className="px-3 py-4 text-[13px] text-gray-700">{row.tradeLicenceNo}</td>
                  <td className="px-3 py-4 text-[13px] text-gray-700">
                    {row.expiryDate ? format(new Date(row.expiryDate), "dd MMM, yyyy") : "—"}
                  </td>
                  <td className="px-3 py-4 text-[12px] text-blue-600">
                    <div className="flex flex-wrap gap-2">
                      {row.tradeLicenseUrl && (
                        <a href={row.tradeLicenseUrl} target="_blank" rel="noreferrer" className="underline">
                          Trade License
                        </a>
                      )}
                      {row.moaUrl && (
                        <a href={row.moaUrl} target="_blank" rel="noreferrer" className="underline">
                          MOA
                        </a>
                      )}
                      {row.labourCardUrl && (
                        <a href={row.labourCardUrl} target="_blank" rel="noreferrer" className="underline">
                          Labour Card
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 pr-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {canUpdate && (
                        <button
                          onClick={() => router.push(APP_ROUTE.SPONSOR_COMPANY.EDIT.PATH(row._id))}
                          className="w-7 h-7 rounded-[6px] bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <AlertDialog open={deleteDialogOpen && pendingDeleteId === row._id} onOpenChange={(open) => {
                          setDeleteDialogOpen(open);
                          if (!open) setPendingDeleteId(null);
                        }}>
                          <AlertDialogTrigger asChild>
                            <button
                              disabled={isDeleting}
                              onClick={() => handleDelete(row._id)}
                              className="w-7 h-7 rounded-[6px] bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete record</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this record? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-t border-gray-100 gap-4">
        <p className="text-[13px] font-medium text-gray-500">
          Showing {startEntry} to {endEntry} of {total} entries
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
          >
            ‹
          </button>
          <span className="text-xs text-gray-600">Page {currentPage} of {Math.max(1, totalPages)}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
