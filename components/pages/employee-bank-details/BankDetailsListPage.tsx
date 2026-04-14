"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, FileText, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getCurrentMonthValue, getMonthLabelFromValue, maskBankAccountNumber } from "@/lib/employee-bank-details";
import { deleteUserBankDetail, listUserBankDetails } from "@/service/user-payment.service";
import { useAppStore } from "@/stores";

type BankDetailRecord = {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  branchAddress?: string;
  accountType?: string;
  paymentMode?: string;
  effectiveMonth: string;
  isActive: boolean;
  isDeleted: boolean;
  updatedAt?: string;
};

type BankDetailListResponse = {
  items: BankDetailRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const defaultResponse: BankDetailListResponse = {
  items: [],
  meta: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
};

const normalizeBankDetailListResponse = (response: unknown): BankDetailListResponse => {
  const responseRecord = (response && typeof response === "object" ? response : {}) as {
    items?: unknown;
    meta?: Partial<BankDetailListResponse["meta"]>;
    data?: {
      items?: unknown;
      meta?: Partial<BankDetailListResponse["meta"]>;
    };
  };

  const rawItems = responseRecord.items ?? responseRecord.data?.items;
  const rawMeta = responseRecord.meta ?? responseRecord.data?.meta;

  return {
    items: Array.isArray(rawItems) ? (rawItems as BankDetailRecord[]) : [],
    meta: {
      page: rawMeta?.page ?? defaultResponse.meta.page,
      limit: rawMeta?.limit ?? defaultResponse.meta.limit,
      total: rawMeta?.total ?? (Array.isArray(rawItems) ? rawItems.length : defaultResponse.meta.total),
      totalPages: rawMeta?.totalPages ?? defaultResponse.meta.totalPages,
    },
  };
};

export default function BankDetailsListPage() {
  const { user } = useAppStore();
  const employeeId = user?.id || user?._id || "";

  const [data, setData] = useState<BankDetailListResponse>(defaultResponse);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BankDetailRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBankDetails = async (nextPage: number, nextSearch: string) => {
    if (!employeeId) {
      setData(defaultResponse);
      return;
    }

    setIsLoading(true);
    try {
      const response = await listUserBankDetails(employeeId, {
        page: nextPage,
        limit: 10,
        search: nextSearch || undefined,
      });
      setData(normalizeBankDetailListResponse(response));
    } catch (error) {
      console.error("Failed to load bank details", error);
      toast.error("Failed to load bank details.");
      setData(defaultResponse);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchBankDetails(page, search);
  }, [employeeId, page, search]);

  const items = Array.isArray(data?.items) ? data.items : [];
  const meta = data?.meta || defaultResponse.meta;

  const currentMonth = getCurrentMonthValue();
  const currentMonthCount = useMemo(
    () => items.filter((record) => record.effectiveMonth?.startsWith(currentMonth)).length,
    [currentMonth, items],
  );

  const recentUpdates = useMemo(
    () => [...items].sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""))).slice(0, 6),
    [items],
  );

  const handleSearchSubmit = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleDelete = async () => {
    if (!employeeId || !deleteTarget) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUserBankDetail(employeeId, deleteTarget.id);
      toast.success("Bank details deleted successfully.");
      setDeleteTarget(null);
      await fetchBankDetails(page, search);
    } catch (error) {
      console.error("Failed to delete bank detail", error);
      toast.error("Failed to delete bank details.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="space-y-6 p-4 sm:p-6">
        <section className="rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-600">Employee Portal</p>
              <h1 className="text-3xl font-bold text-slate-900">Bank Details</h1>
              <p className="max-w-2xl text-sm text-slate-600">
                Search, review, edit, and delete month-wise bank details from the backend-backed record history.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Total Records</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{meta.total}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Current Month</p>
                <p className="mt-1 font-semibold text-slate-900">{getMonthLabelFromValue(currentMonth)}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Visible This Page</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{currentMonthCount}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-sky-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Bank Details List</h2>
                <p className="text-sm text-slate-500">Search by holder, bank, account number, IFSC, branch, or month.</p>
              </div>
            </div>
            <Button asChild>
              <Link href="/bank-details/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Bank Details
              </Link>
            </Button>
          </div>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                className="pl-9"
                placeholder="Search bank details"
              />
            </div>
            <Button type="button" variant="outline" onClick={handleSearchSubmit}>
              Search
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Account Holder Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Bank Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Account Number</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">IFSC Code</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Branch Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Account Type</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Payment Mode</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Effective Month</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">Loading bank details...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">No bank details found.</td>
                  </tr>
                ) : (
                  items.map((record) => (
                    <tr key={record.id} className="border-t border-gray-100 align-top">
                      <td className="px-4 py-3 font-medium text-slate-800">{record.accountHolderName}</td>
                      <td className="px-4 py-3 text-slate-600">{record.bankName}</td>
                      <td className="px-4 py-3 text-slate-600">{maskBankAccountNumber(record.accountNumber)}</td>
                      <td className="px-4 py-3 text-slate-600">{record.ifscCode}</td>
                      <td className="px-4 py-3 text-slate-600">{record.branchName || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{record.accountType || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{record.paymentMode ? record.paymentMode.replaceAll("_", " ") : "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{getMonthLabelFromValue(record.effectiveMonth.slice(0, 7))}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button asChild type="button" variant="outline" size="sm">
                            <Link href={`/bank-details/edit/${record.id}`}>
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Link>
                          </Button>
                          <AlertDialog open={deleteTarget?.id === record.id} onOpenChange={(open) => setDeleteTarget(open ? record : null)}>
                            <AlertDialogTrigger asChild>
                              <Button type="button" variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete bank details</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will soft delete the bank details for {getMonthLabelFromValue(record.effectiveMonth.slice(0, 7))}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction disabled={isDeleting} onClick={handleDelete}>
                                  {isDeleting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Previous
              </Button>
              <Button type="button" variant="outline" disabled={page >= meta.totalPages || isLoading} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <FileText className="h-5 w-5 text-sky-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Recent Updates</h2>
                <p className="text-sm text-slate-500">Latest saved or edited records on the current page.</p>
              </div>
            </div>
            <div className="space-y-3">
              {recentUpdates.length === 0 ? (
                <p className="text-sm text-slate-500">No bank details history yet.</p>
              ) : (
                recentUpdates.map((entry) => (
                  <div key={entry.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {entry.bankName} {maskBankAccountNumber(entry.accountNumber)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{getMonthLabelFromValue(entry.effectiveMonth.slice(0, 7))}</p>
                      </div>
                      <span className="text-xs text-slate-400">{entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : "-"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-sky-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Module Notes</h2>
                <p className="text-sm text-slate-500">This page is now backed by the API instead of browser local storage.</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <p>Search and pagination are handled server-side.</p>
              <p>Upsert uses the effective month, so saving the same month updates the existing record instead of duplicating it.</p>
              <p>Delete is implemented as soft delete to keep records audit-friendly while removing them from active views.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
