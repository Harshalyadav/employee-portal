"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInfinitePayrolls } from "@/hooks/query/usePayroll";
import { useInfiniteBranches } from "@/hooks/query/useBranch";
import { usePermission } from "@/hooks";
import { ModuleNameEnum, PermissionAction } from "@/types";
import { IPayrollMaster } from "@/types/payroll.type";
import { Eye, Loader2, Plus, Edit2, Trash2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ErrorAlert } from "@/components/ErrorAlert";
import { APP_ROUTE } from "@/routes";
import PayrollService from "@/service/payroll.service";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function PayrollDataTable() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canReadPayroll = hasPermission(
    ModuleNameEnum.PAYROLL,
    PermissionAction.READ,
  );
  const canCreatePayroll = hasPermission(
    ModuleNameEnum.PAYROLL,
    PermissionAction.CREATE,
  );
  const canDeletePayroll = hasPermission(
    ModuleNameEnum.PAYROLL,
    PermissionAction.DELETE,
  );

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [payrollToDelete, setPayrollToDelete] = useState<IPayrollMaster | null>(null);
  const [filterBranchIds, setFilterBranchIds] = useState<string[]>([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [branchFilterOpen, setBranchFilterOpen] = useState(false);
  const branchTriggerRef = useRef<HTMLButtonElement>(null);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>("");
  const [filterMonthFrom, setFilterMonthFrom] = useState<number>(1);
  const [filterYearFrom, setFilterYearFrom] = useState<number>(
    new Date().getFullYear(),
  );
  const [filterMonthTo, setFilterMonthTo] = useState<number>(12);
  const [filterYearTo, setFilterYearTo] = useState<number>(
    new Date().getFullYear(),
  );

  const {
    data: payrollPages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfinitePayrolls(100);

  // Fetch branches for filter dropdown
  const { data: branchPages } = useInfiniteBranches(100);
  const availableBranches = useMemo(() => {
    const raw = (branchPages?.pages || []).flatMap(
      (p) => (p as any)?.data ?? [],
    );
    const map = new Map<string, any>();
    for (const b of raw) {
      if (b?._id && !map.has(b._id)) map.set(b._id, b);
    }
    return Array.from(map.values());
  }, [branchPages]);

  const filteredBranches = useMemo(() => {
    const query = branchSearch.trim().toLowerCase();
    if (!query) return availableBranches;
    return availableBranches.filter((branch: any) => {
      const branchName = String(branch?.branchName || "").toLowerCase();
      const branchCode = String(branch?.branchCode || "").toLowerCase();
      return branchName.includes(query) || branchCode.includes(query);
    });
  }, [availableBranches, branchSearch]);

  useEffect(() => {
    if (!branchFilterOpen || !branchTriggerRef.current) return;
    const rect = branchTriggerRef.current.getBoundingClientRect();
    setDropdownPosition({ top: rect.bottom + 4, left: rect.left });
  }, [branchFilterOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        branchTriggerRef.current?.contains(target) ||
        branchDropdownRef.current?.contains(target)
      ) {
        return;
      }
      setBranchFilterOpen(false);
    };

    if (branchFilterOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [branchFilterOpen]);

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Deduplicate payrolls across pages
  const allPayrolls = useMemo(() => {
    const raw = (payrollPages?.pages || []).flatMap(
      (p) => (p as any)?.data ?? [],
    );
    const map = new Map<string, IPayrollMaster>();
    for (const p of raw) {
      const key = p?._id;
      if (key && !map.has(key)) map.set(key, p);
    }
    return Array.from(map.values());
  }, [payrollPages]);

  // Apply filters client-side
  const payrolls = useMemo(() => {
    // Convert date range to comparable numbers (year * 12 + month)
    const dateFrom = filterYearFrom * 12 + filterMonthFrom;
    const dateTo = filterYearTo * 12 + filterMonthTo;

    return allPayrolls.filter((p) => {
      const branchId =
        typeof p.branchId === "object" ? p.branchId?._id : p.branchId;
      if (
        filterBranchIds.length > 0 &&
        !filterBranchIds.includes(String(branchId || ""))
      ) {
        return false;
      }

      // Filter by payment mode
      if (filterPaymentMode && filterPaymentMode.length > 0) {
        if (filterPaymentMode === "ALL") {
          // Show only mixed mode payrolls (paymentMode === null)
          if (p.paymentMode !== null) return false;
        } else {
          // Specific mode selected (CASH or ACCOUNT)
          if (p.paymentMode !== filterPaymentMode) return false;
        }
      }
      // If filterPaymentMode is empty, show all (no payment mode filtering)

      // Filter by date range (payroll period)
      const payrollDate = (p.payrollYear || 0) * 12 + (p.payrollMonth || 1);
      if (payrollDate < dateFrom || payrollDate > dateTo) return false;

      return true;
    });
  }, [
    allPayrolls,
    filterBranchIds,
    filterPaymentMode,
    filterMonthFrom,
    filterYearFrom,
    filterMonthTo,
    filterYearTo,
  ]);

  // Stats
  const totalPayrolls = payrolls.length;
  const totalEmployees = payrolls.reduce(
    (sum, p) => sum + (p.totalEmployee || 0),
    0,
  );
  const totalGross = payrolls.reduce(
    (sum, p) => sum + (p.totalGrossAmount || 0),
    0,
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(payrolls.length / rowsPerPage));
  const paginated = payrolls.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );
  const startEntry =
    payrolls.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = Math.min(currentPage * rowsPerPage, payrolls.length);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) pages.push(i);
    return pages;
  }, [totalPages]);

  if (error)
    return (
      <ErrorAlert
        isOpen
        message={(error as any)?.message || "Failed to load payrolls"}
      />
    );

  const handleDeleteConfirm = async () => {
    if (!payrollToDelete) return;
    try {
      await PayrollService.deletePayroll(payrollToDelete._id);
      toast.success("Payroll deleted");
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      setDeleteDialogOpen(false);
      setPayrollToDelete(null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete payroll";
      toast.error(msg);
    }
  };

  return (
    <>
    <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
      {/* ── Header Row (title + Create only) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827]">
            Payroll Management
          </h1>
          <p className="text-[13px] text-gray-400 mt-1">
            Manage employee payrolls, LOTs, and disbursements
          </p>
        </div>

        {canCreatePayroll && (
          <button
            onClick={() => router.push(APP_ROUTE.PAYROLL.BULK_CREATE.PATH)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#007aff] hover:bg-blue-600 text-white text-sm font-semibold shadow-sm shadow-blue-500/30 transition-colors shrink-0"
            title="Create Payroll"
          >
            <Plus className="w-5 h-5" />
            Create Payroll
          </button>
        )}
      </div>

      {/* ── Filters Row (below header, wraps without horizontal scroll) ── */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100">
          {/* Branch Filter */}
          <div className="relative shrink-0">
            <button
              ref={branchTriggerRef}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (branchTriggerRef.current) {
                  const rect = branchTriggerRef.current.getBoundingClientRect();
                  setDropdownPosition({ top: rect.bottom + 4, left: rect.left });
                }
                setBranchFilterOpen((open) => !open);
              }}
              className={cn(
                "h-[42px] w-56 sm:w-60 flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 text-[13px] font-medium shadow-sm transition-colors",
                "hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:ring-offset-0",
                branchFilterOpen && "ring-2 ring-blue-100 border-blue-400",
              )}
              title="Filter by branch"
            >
              <span className="truncate text-left">
                {filterBranchIds.length === 0
                  ? "All Branches"
                  : filterBranchIds.length === 1
                    ? availableBranches.find((branch: any) => branch._id === filterBranchIds[0])?.branchName ?? "1 branch"
                    : `${filterBranchIds.length} branches`}
              </span>
              <ChevronDown className={cn("w-4 h-4 shrink-0 text-gray-400 transition-transform", branchFilterOpen && "rotate-180")} />
            </button>
            {branchFilterOpen && typeof document !== "undefined" && createPortal(
              <div
                ref={branchDropdownRef}
                className="fixed z-50 w-72 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white py-2 shadow-lg"
                style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="px-3 pb-2">
                  <input
                    type="text"
                    value={branchSearch}
                    onChange={(event) => setBranchSearch(event.target.value)}
                    placeholder="Search branches..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterBranchIds([]);
                      setCurrentPage(1);
                      setBranchSearch("");
                      setBranchFilterOpen(false);
                    }}
                    className="w-full text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg py-2 px-2 -mx-1"
                  >
                    Clear selection (All Branches)
                  </button>
                </div>
                <div className="border-t border-gray-100 my-1" />
                {filteredBranches.map((branch: any) => (
                  <label
                    key={branch._id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-blue-50/50 rounded-lg mx-1",
                      filterBranchIds.includes(branch._id) && "bg-blue-50/80",
                    )}
                  >
                    <Checkbox
                      checked={filterBranchIds.includes(branch._id)}
                      onCheckedChange={(checked) => {
                        setFilterBranchIds((previous) =>
                          checked
                            ? [...previous, branch._id]
                            : previous.filter((id) => id !== branch._id),
                        );
                        setCurrentPage(1);
                      }}
                      className="border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <span className="font-medium text-gray-800">{branch.branchName}</span>
                    {branch.branchCode && (
                      <span className="text-gray-500 text-[12px]">· {branch.branchCode}</span>
                    )}
                  </label>
                ))}
                {filteredBranches.length === 0 && (
                  <p className="px-3 py-4 text-[13px] text-gray-500">No branches available</p>
                )}
              </div>,
              document.body,
            )}
          </div>

          {/* Payment Mode Filter */}
          <Select
            value={filterPaymentMode || "__all__"}
            onValueChange={(v) => {
              setFilterPaymentMode(v === "__all__" ? "" : v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className="w-[180px] sm:w-[200px] h-[42px] rounded-xl border-gray-200 bg-white shadow-sm text-[13px] font-medium focus:ring-2 focus:ring-blue-100 focus:ring-offset-0 data-placeholder:text-gray-500"
              title="Filter by payment mode"
            >
              <SelectValue placeholder="All Modes" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-200 shadow-lg" sideOffset={4}>
              <SelectItem value="__all__" className="rounded-lg py-2.5 focus:bg-blue-50 focus:text-blue-900 cursor-pointer">
                All Modes
              </SelectItem>
              <SelectItem value="CASH" className="rounded-lg py-2.5 pl-8 pr-3 focus:bg-blue-50 focus:text-blue-900 cursor-pointer">
                Cash
              </SelectItem>
              <SelectItem value="ACCOUNT" className="rounded-lg py-2.5 pl-8 pr-3 focus:bg-blue-50 focus:text-blue-900 cursor-pointer">
                Account
              </SelectItem>
              <SelectItem value="ALL" className="rounded-lg py-2.5 pl-8 pr-3 focus:bg-blue-50 focus:text-blue-900 cursor-pointer">
                All (Mixed Modes)
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">From:</span>
            <Select
              value={String(filterMonthFrom)}
              onValueChange={(v) => {
                setFilterMonthFrom(parseInt(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[88px] h-9 rounded-lg border-gray-200 text-xs font-medium focus:ring-2 focus:ring-blue-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-lg" sideOffset={4}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <SelectItem key={m} value={String(m)} className="rounded-lg py-2 focus:bg-blue-50 focus:text-blue-900 cursor-pointer">
                    {MONTH_NAMES[m - 1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="number"
              value={filterYearFrom}
              onChange={(e) => {
                setFilterYearFrom(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="h-9 w-16 px-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              min="2000"
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">To:</span>
            <Select
              value={String(filterMonthTo)}
              onValueChange={(v) => {
                setFilterMonthTo(parseInt(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[88px] h-9 rounded-lg border-gray-200 text-xs font-medium focus:ring-2 focus:ring-blue-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-lg" sideOffset={4}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <SelectItem key={m} value={String(m)} className="rounded-lg py-2 focus:bg-blue-50 focus:text-blue-900 cursor-pointer">
                    {MONTH_NAMES[m - 1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="number"
              value={filterYearTo}
              onChange={(e) => {
                setFilterYearTo(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="h-9 w-16 px-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              min="2000"
              max={new Date().getFullYear() + 1}
            />
          </div>
      </div>

      {/* ── Stats Row Removed ── */}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                PERIOD
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                BRANCH
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                MODE
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-blue-500 uppercase tracking-wide">
                TOTAL GROSS ($)
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-blue-500 uppercase tracking-wide">
                TOTAL NET ($)
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                EMPLOYEES
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
                <td colSpan={8} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  No payrolls found
                </td>
              </tr>
            ) : (
              paginated.map((payroll) => {
                const monthName =
                  MONTH_NAMES[(payroll.payrollMonth ?? 1) - 1] || "—";
                const year = payroll.payrollYear || "—";
                const branchName =
                  payroll.branchName ||
                  (typeof payroll.branchId === "object"
                    ? (payroll.branchId as any)?.branchName
                    : "") ||
                  "—";
                const paymentMode =
                  payroll.paymentMode === null
                    ? "All"
                    : payroll.paymentMode || "—";

                return (
                  <tr
                    key={payroll._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* PERIOD */}
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-800">
                        {monthName} {year}
                      </p>
                    </td>

                    {/* BRANCH */}
                    <td className="px-3 py-3 text-gray-700 text-sm">
                      {branchName}
                    </td>

                    {/* PAYMENT MODE */}
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          paymentMode === "CASH"
                            ? "bg-green-100 text-green-700"
                            : paymentMode === "ACCOUNT"
                              ? "bg-blue-100 text-blue-700"
                              : paymentMode === "All"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {paymentMode}
                      </span>
                    </td>

                    {/* TOTAL GROSS */}
                    <td className="px-3 py-3 text-right text-gray-700 font-medium">
                      {payroll.totalGrossAmount?.toLocaleString() || "—"}
                    </td>

                    {/* TOTAL NET */}
                    <td className="px-3 py-3 text-right text-gray-700 font-medium">
                      {payroll.totalNetAmount?.toLocaleString() || "—"}
                    </td>

                    {/* EMPLOYEES */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {payroll.totalEmployee ?? 0}
                      </span>
                    </td>

                    {/* CREATED */}
                    <td className="px-3 py-3 text-center text-gray-600 text-xs">
                      {payroll.createdAt
                        ? format(new Date(payroll.createdAt), "dd MMM, yyyy")
                        : "—"}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-3 py-3 pr-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canCreatePayroll &&
                          payroll.payrollStatus === "DRAFT" && (
                            <button
                              onClick={() => {
                                if (typeof window !== "undefined")
                                  window.location.href =
                                    APP_ROUTE.PAYROLL.EDIT.PATH(payroll._id);
                              }}
                              className="w-7 h-7 rounded-full border border-blue-200 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        {canReadPayroll && (
                          <button
                            onClick={() => {
                              if (typeof window !== "undefined")
                                window.location.href =
                                  APP_ROUTE.PAYROLL.VIEW.PATH(payroll._id);
                            }}
                            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeletePayroll && (
                            <button
                              onClick={() => {
                                setPayrollToDelete(payroll);
                                setDeleteDialogOpen(true);
                              }}
                              className="w-7 h-7 rounded-full border border-red-200 flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
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
          Showing {startEntry} to {endEntry} of {payrolls.length} entries
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
              className={`w-8 h-8 flex items-center justify-center rounded border text-sm font-medium transition-colors ${
                currentPage === pg
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

    <AlertDialog
      open={deleteDialogOpen}
      onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) setPayrollToDelete(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
          <AlertDialogDescription>
            {payrollToDelete && (
              <>
                This will permanently delete the payroll for{" "}
                {MONTH_NAMES[(payrollToDelete.payrollMonth ?? 1) - 1]} {payrollToDelete.payrollYear}{" "}
                (
                {payrollToDelete.branchName ||
                  (typeof payrollToDelete.branchId === "object"
                    ? (payrollToDelete.branchId as any)?.branchName
                    : "this branch")}
                ). This action cannot be undone.
              </>
            )}
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

export default PayrollDataTable;
