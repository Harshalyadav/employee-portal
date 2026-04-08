"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useInfiniteAdvances, useDeleteAdvance } from "@/hooks/query/useAdvancePayroll";
import { useInfiniteBranches } from "@/hooks/query/useBranch";
import { usePermission } from "@/hooks";
import { ModuleNameEnum, PermissionAction, CurrencyEnum, PaymentModeEnum } from "@/types";
import { IAdvancePayroll, AdvanceStatusEnum, DeductionStatusEnum } from "@/types/advance-payroll.type";
import { Eye, Loader2, Pencil, Plus, Search, Trash2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ErrorAlert } from "@/components/ErrorAlert";
import { APP_ROUTE } from "@/routes";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
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

const STATUS_STYLES: Record<string, string> = {
  [AdvanceStatusEnum.APPROVED]: "bg-green-100 text-green-700",
  [AdvanceStatusEnum.PENDING]: "bg-yellow-100 text-yellow-700",
  [AdvanceStatusEnum.REJECTED]: "bg-red-100 text-red-500",
  [AdvanceStatusEnum.REPAID]: "bg-blue-100 text-blue-700",
};

const DEDUCTION_LABELS: Record<string, string> = {
  [DeductionStatusEnum.PENDING]: "Pending",
  [DeductionStatusEnum.PARTIALLY_DEDUCTED]: "Partial",
  [DeductionStatusEnum.FULLY_DEDUCTED]: "Full",
  [DeductionStatusEnum.CANCELLED]: "Cancelled",
};

const DEDUCTION_STYLES: Record<string, string> = {
  [DeductionStatusEnum.PENDING]: "bg-yellow-100 text-yellow-700",
  [DeductionStatusEnum.PARTIALLY_DEDUCTED]: "bg-orange-100 text-orange-600",
  [DeductionStatusEnum.FULLY_DEDUCTED]: "bg-green-100 text-green-700",
  [DeductionStatusEnum.CANCELLED]: "bg-red-100 text-red-500",
};

const PAYMENT_MODE_OPTIONS = [
  { value: "", label: "All payment modes" },
  { value: PaymentModeEnum.CASH, label: "Cash" },
  { value: PaymentModeEnum.ACCOUNT, label: "Account" },
];

const CURRENCY_OPTIONS = [
  { value: "", label: "All currencies" },
  ...Object.entries(CurrencyEnum).map(([k, v]) => ({ value: v, label: v })),
];

export function AdvancePayrollDataTable() {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const canReadAdvance = hasPermission(ModuleNameEnum.ADVANCE, PermissionAction.READ);
  const canCreateAdvance = hasPermission(ModuleNameEnum.ADVANCE, PermissionAction.CREATE);
  const canUpdateAdvance = hasPermission(ModuleNameEnum.ADVANCE, PermissionAction.UPDATE);
  const canDeleteAdvance = hasPermission(ModuleNameEnum.ADVANCE, PermissionAction.DELETE);

  const [search, setSearch] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [currency, setCurrency] = useState("");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [branchFilterOpen, setBranchFilterOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const branchFilterRef = useRef<HTMLDivElement>(null);
  const branchTriggerRef = useRef<HTMLButtonElement>(null);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<string | null>(null);
  const rowsPerPage = 10;

  const { data: branchesPages } = useInfiniteBranches(100);
  const branches = useMemo(() => {
    const raw = (branchesPages?.pages || []).flatMap((p: any) => p?.data ?? []);
    const map = new Map<string, (typeof raw)[number]>();
    for (const b of raw) {
      const key = b?._id;
      if (key && !map.has(key)) map.set(key, b);
    }
    return Array.from(map.values());
  }, [branchesPages]);

  const filteredBranches = useMemo(() => {
    const query = branchSearch.trim().toLowerCase();
    if (!query) {
      return branches;
    }

    return branches.filter((branch: any) => {
      const branchName = String(branch?.branchName || branch?.name || "").toLowerCase();
      const branchCode = String(branch?.branchCode || "").toLowerCase();
      return branchName.includes(query) || branchCode.includes(query);
    });
  }, [branchSearch, branches]);

  useEffect(() => {
    if (!branchFilterOpen || !branchTriggerRef.current) return;
    const rect = branchTriggerRef.current.getBoundingClientRect();
    setDropdownPosition({ top: rect.bottom + 4, left: rect.left });
  }, [branchFilterOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        branchTriggerRef.current?.contains(target) ||
        branchDropdownRef.current?.contains(target)
      )
        return;
      setBranchFilterOpen(false);
    };
    if (branchFilterOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [branchFilterOpen]);

  const filters = useMemo(
    () => ({
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(paymentMode.trim() ? { paymentMode: paymentMode.trim() } : {}),
      ...(currency.trim() ? { currency: currency.trim() } : {}),
      ...(selectedBranchIds.length > 0 ? { branchIds: selectedBranchIds } : {}),
    }),
    [search, paymentMode, currency, selectedBranchIds],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, paymentMode, currency, selectedBranchIds]);

  const {
    data: advancePages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteAdvances(100, Object.keys(filters).length > 0 ? filters : undefined);

  const deleteAdvanceMutation = useDeleteAdvance();

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDeleteClick = (advanceId: string) => {
    setSelectedAdvanceId(advanceId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedAdvanceId) {
      await deleteAdvanceMutation.mutateAsync(selectedAdvanceId);
      setDeleteDialogOpen(false);
      setSelectedAdvanceId(null);
    }
  };

  // Deduplicate advances
  const advances = useMemo(() => {
    const raw = (advancePages?.pages || []).flatMap((p) => (p as any)?.data ?? []);
    const map = new Map<string, IAdvancePayroll>();
    for (const adv of raw) {
      const key = adv?._id;
      if (key && !map.has(key)) map.set(key, adv);
    }
    return Array.from(map.values());
  }, [advancePages]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(advances.length / rowsPerPage));
  const paginated = advances.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const startEntry = advances.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = Math.min(currentPage * rowsPerPage, advances.length);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) pages.push(i);
    return pages;
  }, [totalPages]);

  const getUserName = (adv: IAdvancePayroll) => {
    if (typeof adv.userId === "object" && adv.userId !== null) {
      return (adv.userId as any).fullName || (adv.userId as any).email || "—";
    }
    return "—";
  };

  if (error) return <ErrorAlert isOpen message={(error as any)?.message || "Failed to load loans"} />;

  return (
    <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
      {/* ── Header Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827]">Loan</h1>
          <p className="text-[13px] text-gray-400 mt-1">Manage employee loan requests and payouts</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canCreateAdvance && (
            <button
              onClick={() => router.push(APP_ROUTE.ADVANCE.CREATE.PATH)}
              className="flex items-center gap-2 bg-[#007aff] hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-[13px] font-bold shadow-sm shadow-blue-500/30 transition-colors"
              title="Create Loan"
            >
              <Plus className="w-4 h-4" />
              Create Loan
            </button>
          )}
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
        >
          {PAYMENT_MODE_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
        >
          {CURRENCY_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="relative shrink-0" ref={branchFilterRef}>
          <button
            ref={branchTriggerRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (branchTriggerRef.current) {
                const rect = branchTriggerRef.current.getBoundingClientRect();
                setDropdownPosition({ top: rect.bottom + 4, left: rect.left });
              }
              setBranchFilterOpen((o) => !o);
            }}
            className={cn(
              "w-[240px] h-[42px] flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white shadow-sm text-sm font-medium px-3 transition-colors",
              "hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:ring-offset-0",
              branchFilterOpen && "ring-2 ring-blue-100 border-blue-400"
            )}
            title="Filter by branch(es)"
          >
            <span className="truncate text-left">
              {selectedBranchIds.length === 0
                ? "All branches"
                : selectedBranchIds.length === 1
                  ? (branches.find((b: any) => b._id === selectedBranchIds[0]) as any)?.branchName ?? "1 branch"
                  : `${selectedBranchIds.length} branches`}
            </span>
            <ChevronDown className={cn("w-4 h-4 shrink-0 text-gray-400 transition-transform", branchFilterOpen && "rotate-180")} />
          </button>
          {branchFilterOpen &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                ref={branchDropdownRef}
                className="fixed z-[9999] w-[280px] max-h-[320px] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg py-2"
                style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1.5">
                  <input
                    type="text"
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    placeholder="Search branches..."
                    className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBranchIds([]);
                      setCurrentPage(1);
                      setBranchSearch("");
                      setBranchFilterOpen(false);
                    }}
                    className="w-full text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg py-2 px-2 -mx-1"
                  >
                    Clear selection (All branches)
                  </button>
                </div>
                <div className="border-t border-gray-100 my-1" />
                {filteredBranches.map((b: any) => (
                  <label
                    key={b._id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-blue-50/50 rounded-lg mx-1",
                      selectedBranchIds.includes(b._id) && "bg-blue-50/80"
                    )}
                  >
                    <Checkbox
                      checked={selectedBranchIds.includes(b._id)}
                      onCheckedChange={(checked) => {
                        setSelectedBranchIds((prev) =>
                          checked ? [...prev, b._id] : prev.filter((id) => id !== b._id)
                        );
                        setCurrentPage(1);
                      }}
                      className="border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <span className="font-medium text-gray-800">{b.branchName ?? b.name ?? b._id}</span>
                    {b.branchCode && <span className="text-gray-500 text-[12px]">· {b.branchCode}</span>}
                  </label>
                ))}
                {filteredBranches.length === 0 && (
                  <p className="px-3 py-4 text-[13px] text-gray-500">No branches available</p>
                )}
              </div>,
              document.body
            )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                EMPLOYEE
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-blue-500 uppercase tracking-wide">
                AMOUNT
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                MONTHS
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-blue-500 uppercase tracking-wide">
                / MONTH
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                CURRENCY
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                PAYMENT MODE
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                LOAN DATE
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                CREATED AT
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                UPDATED AT
              </th>
              <th className="px-3 py-3 pr-5 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading || isFetchingNextPage ? (
              <tr>
                <td colSpan={10} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-gray-400">
                  No loans found
                </td>
              </tr>
            ) : (
              paginated.map((adv) => {
                const statusKey = String(adv.status || "").toUpperCase();
                const statusStyle = STATUS_STYLES[statusKey] || "bg-gray-100 text-gray-600";
                const deductKey = String(adv.deductionStatus || "").toLowerCase();
                const deductStyle = DEDUCTION_STYLES[deductKey] || "bg-gray-100 text-gray-600";
                const deductLabel = DEDUCTION_LABELS[deductKey] || adv.deductionStatus || "—";

                return (
                  <tr key={adv._id} className="hover:bg-gray-50 transition-colors">
                    {/* EMPLOYEE */}
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-800">{getUserName(adv)}</p>
                    </td>

                    {/* AMOUNT */}
                    <td className="px-3 py-3 text-right font-semibold text-gray-800">
                      {adv.amount?.toLocaleString() || "—"}
                    </td>

                    <td className="px-3 py-3 text-center text-gray-700 text-sm font-medium">
                      {(adv as any).repaymentMonths ?? "—"}
                    </td>

                    <td className="px-3 py-3 text-right text-gray-700 text-sm font-medium">
                      {(adv as any).monthlyInstallment != null
                        ? Number((adv as any).monthlyInstallment).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })
                        : "—"}
                    </td>

                    {/* CURRENCY */}
                    <td className="px-3 py-3 text-center text-gray-600 text-xs font-medium">
                      {adv.currency || "—"}
                    </td>

                    {/* PAYMENT MODE */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {adv.paymentMode || "—"}
                      </span>
                    </td>

                    {/* LOAN DATE */}
                    <td className="px-3 py-3 text-center text-gray-600 text-xs">
                      {(adv as any).advanceDate ? format(new Date((adv as any).advanceDate), "dd MMM, yyyy") : "—"}
                    </td>

                    {/* CREATED AT */}
                    <td className="px-3 py-3 text-center text-gray-600 text-xs">
                      {adv.createdAt ? format(new Date(adv.createdAt), "dd MMM, yyyy") : "—"}
                    </td>

                    {/* UPDATED AT */}
                    <td className="px-3 py-3 text-center text-gray-600 text-xs">
                      {adv.updatedAt ? format(new Date(adv.updatedAt), "dd MMM, yyyy") : "—"}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-3 py-3 pr-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canReadAdvance && (
                          <button
                            onClick={() => router.push(`/advances/${adv._id}`)}
                            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canUpdateAdvance && (
                          <button
                            onClick={() => router.push(`/advances/${adv._id}/edit`)}
                            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeleteAdvance && (
                          <button
                            onClick={() => adv._id && handleDeleteClick(adv._id)}
                            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
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
          Showing {startEntry} to {endEntry} of {advances.length} entries
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete loan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this loan record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAdvanceMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AdvancePayrollDataTable;
