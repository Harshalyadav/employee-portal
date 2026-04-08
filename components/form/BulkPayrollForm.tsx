"use client";

import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/datatable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInfiniteBranches } from "@/hooks/query/useBranch";
import { useInfinitePayrollItemsByBranch } from "@/hooks/query/usePayroll";
import { APP_ROUTE } from "@/routes";
import PayrollService from "@/service/payroll.service";
import { Column, IBankAccount, PaymentModeEnum } from "@/types";
import {
  type CreateBulkPayrollSchema,
  type IAdvancePayrollDetails,
  type IPayrollDetailResponse,
} from "@/types/payroll.type";
import { currencySymbol } from "@/lib/utils";
import { ArrowLeft, Lock, AlertCircle, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../ui";
import { Combobox } from "@/components/ui/combobox";

interface BulkPayrollItem {
  userId: string;
  employeeId?: string;
  fullName: string;
  email: string;
  grossSalary: number;
  baseSalary: number;
  netSalary: number;
  deductedAdvance: number;
  takenAdvance: number;
  currency: string;
  paymentMode: PaymentModeEnum | string;
  bankAccount?: IBankAccount | null;
  payrollStatus?: string;
  selected: boolean;
  advanceSalary: number;
  payrollId?: string; // For locked items, to identify existing payroll
  totalWorkingDays: number;
  advancePayrollDetails?: any; // Store the full advance details
  incentive: number; // Incentive added to net salary
}

const formatBankAccount = (account?: IBankAccount | string | null) => {
  if (!account) return "N/A";
  if (typeof account === "string") {
    return account.trim() || "N/A";
  }
  const parts = [account.bankName, account.accountNumber, account.ifsc].filter(
    Boolean,
  );
  return parts.length ? parts.join(" • ") : "N/A";
};

const formatAmountDisplay = (value?: number, symbol?: string) => {
  const amount = Number(value || 0);
  if (amount <= 0) return "-";
  return `${symbol ?? ""}${Math.round(amount)}`;
};

/** Per-period deduction from advance master (matches payroll auto-deduct logic). */
function getSuggestedDeductionFromDetails(
  d: IAdvancePayrollDetails | null | undefined,
): number {
  if (!d) return 0;
  const rem = Number(d.totalRemaining ?? 0);
  const monthly = Number(d.monthlyInstallmentTotal ?? 0);
  return monthly > 0 && rem > 0 ? Math.min(monthly, rem) : 0;
}

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month, 0).getDate();
};

const clampWorkingDays = (value: number, maxDays: number = 30) =>
  Math.min(maxDays, Math.max(1, value));
const preventNumberInputScroll = (
  event: React.WheelEvent<HTMLInputElement>,
) => {
  if (document.activeElement === event.currentTarget) {
    event.currentTarget.blur();
  }
};

const preventNumberInputArrowChange = (
  event: React.KeyboardEvent<HTMLInputElement>,
) => {
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
  }
};

export function BulkPayrollForm({ payrollId }: { payrollId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [payrollMonth, setPayrollMonth] = useState<string>("1");
  const [payrollYear, setPayrollYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("ALL");
  const [payrollItems, setPayrollItems] = useState<BulkPayrollItem[]>([]);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [showLockWarning, setShowLockWarning] = useState(false);
  const [pendingLockAction, setPendingLockAction] = useState<
    (() => void) | null
  >(null);
  const isEditMode = !!payrollId;
  const [isSavingDraftAll, setIsSavingDraftAll] = useState(false);
  const [isSavingDraftRowId, setIsSavingDraftRowId] = useState<string | null>(
    null,
  );

  // Fetch active LOT Masters for dropdown
  // const { activeLotMasters, loading: lotLoading } = useActiveLotMasters();

  // Fetch branches
  const { data: branchPages } = useInfiniteBranches(100);

  const availableBranches = useMemo(() => {
    const raw = (branchPages?.pages || []).flatMap((p) => p.data ?? []);
    const map = new Map<string, (typeof raw)[number]>();
    for (const b of raw) {
      const key = b?._id;
      if (key && !map.has(key)) {
        map.set(key, b);
      }
    }
    return Array.from(map.values());
  }, [branchPages]);

  // Fetch payroll items by selected branch, month, and year
  const {
    data: payrollItemsPages,
    isLoading: isLoadingPayrollItems,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchPayrollItems,
  } = useInfinitePayrollItemsByBranch(
    parseInt(payrollMonth),
    parseInt(payrollYear),
    selectedBranch,
    100,
  );

  // Auto-fetch next pages if available
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const applyPayrollDetail = useCallback((data: IPayrollDetailResponse) => {
    if (!data?.payroll) return;

    const payroll = data.payroll;
    setPayrollMonth(String(payroll.payrollMonth || 1));
    setPayrollYear(String(payroll.payrollYear || new Date().getFullYear()));
    setSelectedBranch(
      typeof payroll.branchId === "object"
        ? payroll.branchId._id
        : payroll.branchId || "",
    );
    setSelectedPaymentMode("ALL");

    const items = Array.isArray(data.items)
      ? data.items.map((item: any) => ({
          userId:
            typeof item.userId === "object" ? item.userId._id : item.userId,
          employeeId: (item.userId as any)?.employeeId || "",
          fullName: (item.userId as any)?.fullName || "",
          email: (item.userId as any)?.email || "",
          grossSalary: item.grossSalary || 0,
          baseSalary: item.baseSalary || 0,
          netSalary: item.netSalary || 0,
          deductedAdvance: item.deductedAdvance || 0,
          takenAdvance: (item.userId as any)?.latestAdvancePayroll?.amount || 0,
          currency: item.currency || "INR",
          paymentMode: item.paymentMode || PaymentModeEnum.CASH,
          bankAccount: item.bankAccountDetails || null,
          payrollStatus: item.status || "PENDING",
          selected: true,
          payrollId: payroll._id,
          totalWorkingDays:
            item.totalWorkingDays ||
            getDaysInMonth(
              parseInt(String(payroll.payrollMonth || 1)),
              parseInt(String(payroll.payrollYear || new Date().getFullYear())),
            ),
          advancePayrollDetails: item.advancePayrollDetails || null,
          advanceSalary: 0,
          incentive: item.incentive || 0,
        }))
      : [];

    setPayrollItems(items);
  }, []);

  // Load payroll data when in edit mode
  useEffect(() => {
    if (!isEditMode || !payrollId) return;

    const loadPayrollData = async () => {
      try {
        const response = await PayrollService.getPayrollById(payrollId);
        applyPayrollDetail(response);
      } catch (error: any) {
        toast.error("Failed to load payroll data");
        console.error("Error loading payroll:", error);
      }
    };

    loadPayrollData();
  }, [applyPayrollDetail, isEditMode, payrollId]);

  const employees = useMemo(() => {
    const items =
      payrollItemsPages?.pages?.flatMap((page) => page.data || []) || [];

    let filtered = items.map((item) => {
      const suggestedDeduction = getSuggestedDeductionFromDetails(
        item.advancePayrollDetails,
      );
      return {
      userId: item.userDetails._id,
      employeeId: item.userDetails.employeeId || "",
      fullName: item.userDetails.fullName,
      email: item.userDetails.email,
      grossSalary: item.grossSalary || item.baseSalary || 0,
      baseSalary: item.baseSalary || 0,
      netSalary: (() => {
        const g = item.grossSalary || item.baseSalary || 0;
        const inc = item.incentive || 0;
        if (item.payrollItemId) {
          return item.netSalary ?? g;
        }
        return parseFloat((g - suggestedDeduction + inc).toFixed(2));
      })(),
      deductedAdvance: suggestedDeduction,
      takenAdvance:
        item.advancePayrollDetails?.totalRemaining ||
        item.advancePayrollDetails?.advanceAmount ||
        item.advanceSalary ||
        0,
      currency: item.currency || "INR",
      paymentMode: item.paymentMode || PaymentModeEnum.CASH,
      bankAccount: item.bankDetail || null,
      payrollStatus: item.payrollStatus || "PENDING",
      selected: false,
      payrollId: item.payrollId || undefined,
      totalWorkingDays: getDaysInMonth(
        parseInt(payrollMonth),
        parseInt(payrollYear),
      ),
      advanceSalary:
        item.advancePayrollDetails?.totalRemaining ||
        item.advancePayrollDetails?.advanceAmount ||
        item.advanceSalary ||
        0,
      advancePayrollDetails: item.advancePayrollDetails || null,
      incentive: item.incentive || 0,
    };
    });

    // Filter by payment mode if not "ALL"
    if (selectedPaymentMode !== "ALL") {
      filtered = filtered.filter(
        (emp) => emp.paymentMode === selectedPaymentMode,
      );
    }

    return filtered;
  }, [payrollItemsPages, selectedPaymentMode, payrollMonth, payrollYear]);

  const calculateSalaryByWorkingDays = useCallback(
    (
      baseSalary: number,
      workingDays: number,
      deductedAdvance: number = 0,
      incentive: number = 0,
      daysInMonth?: number,
    ) => {
      const monthDays =
        daysInMonth ||
        getDaysInMonth(parseInt(payrollMonth, 10), parseInt(payrollYear, 10));
      const perDaySalary = baseSalary / monthDays;
      const grossSalary = perDaySalary * workingDays;
      const netSalary = grossSalary - deductedAdvance + incentive;
      return {
        grossSalary: parseFloat(grossSalary.toFixed(2)),
        netSalary: parseFloat(netSalary.toFixed(2)),
      };
    },
    [payrollMonth, payrollYear],
  );

  // On edit page: only show DRAFT and LOCKED employees; use loaded payroll items when available
  const displayRows = useMemo(() => {
    const mergeAdvanceFromEmployee = (row: BulkPayrollItem): BulkPayrollItem => {
      const emp = employees.find((e) => e.userId === row.userId);
      if (!emp) return row;
      return {
        ...row,
        advancePayrollDetails:
          row.advancePayrollDetails ?? emp.advancePayrollDetails ?? null,
      };
    };

    if (isEditMode && payrollItems.length > 0) {
      return payrollItems
        .filter(
          (i) =>
            i.payrollStatus === "DRAFT" || i.payrollStatus === "LOCKED",
        )
        .map(mergeAdvanceFromEmployee);
    }
    if (isEditMode) {
      return employees.filter(
        (e) =>
          e.payrollStatus === "DRAFT" || e.payrollStatus === "LOCKED",
      );
    }
    return employees;
  }, [isEditMode, payrollItems, employees]);

  // Edit mode: items from API may omit advance master fields; merge from branch employee list and align deduction + net.
  useEffect(() => {
    if (!isEditMode || !payrollId) return;
    if (!employees.length) return;

    setPayrollItems((prev) => {
      if (!prev.length) return prev;
      let changed = false;
      const next = prev.map((item) => {
        const emp = employees.find((e) => e.userId === item.userId);
        const mergedDetails =
          item.advancePayrollDetails ?? emp?.advancePayrollDetails;
        if (!mergedDetails) return item;

        const suggested = getSuggestedDeductionFromDetails(mergedDetails);
        const ded =
          Number(item.deductedAdvance) > 0
            ? Number(item.deductedAdvance)
            : suggested;

        if (
          item.advancePayrollDetails &&
          Math.abs(Number(item.deductedAdvance) - ded) < 0.01
        ) {
          return item;
        }

        const daysInMonth = getDaysInMonth(
          parseInt(payrollMonth, 10),
          parseInt(payrollYear, 10),
        );
        const { grossSalary, netSalary } = calculateSalaryByWorkingDays(
          item.baseSalary,
          item.totalWorkingDays ?? daysInMonth,
          ded,
          item.incentive ?? 0,
          daysInMonth,
        );

        changed = true;
        return {
          ...item,
          advancePayrollDetails: mergedDetails,
          deductedAdvance: ded,
          grossSalary,
          netSalary,
        };
      });
      return changed ? next : prev;
    });
  }, [
    employees,
    isEditMode,
    payrollId,
    payrollMonth,
    payrollYear,
    calculateSalaryByWorkingDays,
  ]);

  // Update payroll items when employees change
  const handleBranchChange = useCallback((branchId: string) => {
    setSelectedBranch(branchId);
    setPayrollItems([]);
  }, []);

  const ensureRowIsSelected = useCallback(
    (userId: string) => {
      const employee = employees.find((e) => e.userId === userId);
      if (!employee) return;

      const daysInMonth = getDaysInMonth(
        parseInt(payrollMonth, 10),
        parseInt(payrollYear, 10),
      );

      setPayrollItems((prev) => {
        const exists = prev.find((item) => item.userId === userId);
        if (exists) return prev;
        const { grossSalary, netSalary } = calculateSalaryByWorkingDays(
          employee.baseSalary,
          daysInMonth,
          employee.deductedAdvance ?? 0,
          employee.incentive ?? 0,
          daysInMonth,
        );
        return [
          ...prev,
          {
            ...employee,
            selected: true,
            advanceSalary: employee.takenAdvance,
            totalWorkingDays: daysInMonth,
            incentive: employee.incentive ?? 0,
            grossSalary,
            netSalary,
          },
        ];
      });
    },
    [employees, payrollMonth, payrollYear, calculateSalaryByWorkingDays],
  );

  const openRowModal = useCallback(
    (row: any) => {
      ensureRowIsSelected(row.userId);
      setActiveRowId(row.userId);
    },
    [ensureRowIsSelected],
  );

  const closeRowModal = useCallback(() => {
    setActiveRowId(null);
  }, []);

  const activeRow = useMemo(() => {
    if (!activeRowId) return null;
    return (
      payrollItems.find((item) => item.userId === activeRowId) ||
      employees.find((item) => item.userId === activeRowId) ||
      null
    );
  }, [activeRowId, payrollItems, employees]);

  // Calculate totals
  const totals = useMemo(() => {
    // Group by currency to handle mixed currencies
    const byCurrency: Record<string, any> = {};

    payrollItems.forEach((item) => {
      if (!byCurrency[item.currency]) {
        byCurrency[item.currency] = {
          grossTotal: 0,
          netTotal: 0,
          advanceTotal: 0,
          count: 0,
          paymentModes: new Set<string>(),
        };
      }
      byCurrency[item.currency].grossTotal += item.grossSalary || 0;
      byCurrency[item.currency].netTotal += item.netSalary || 0;
      byCurrency[item.currency].advanceTotal += item.deductedAdvance || 0;
      byCurrency[item.currency].count += 1;
      byCurrency[item.currency].paymentModes.add(item.paymentMode);
    });

    return {
      grossTotal: payrollItems.reduce(
        (sum, item) => sum + (item.grossSalary || 0),
        0,
      ),
      netTotal: payrollItems.reduce(
        (sum, item) => sum + (item.netSalary || 0),
        0,
      ),
      advanceTotal: payrollItems.reduce(
        (sum, item) => sum + (item.deductedAdvance || 0),
        0,
      ),
      count: payrollItems.length,
      byCurrency,
    };
  }, [payrollItems]);

  const mapItemToPayload = useCallback(
    (item: BulkPayrollItem, index: number) => ({
      userId: item.userId,
      grossSalary: item.grossSalary,
      baseSalary: item.baseSalary,
      netSalary: item.netSalary,
      currency: item.currency as any,
      paymentMode: item.paymentMode as any,
      bankAccountDetails: item.bankAccount || undefined,
      deductedAdvance: item.deductedAdvance || 0,
      totalWorkingDays: item.totalWorkingDays,
      incentive: item.incentive || 0,
      payrollId: item.payrollId || undefined,
      sequenceIndex: index,
    }),
    [],
  );

  const handleLockAction = useCallback((action: () => void) => {
    setPendingLockAction(() => action);
    setShowLockWarning(true);
  }, []);

  const confirmLock = useCallback(async () => {
    setShowLockWarning(false);
    if (pendingLockAction) {
      await pendingLockAction();
    }
    setPendingLockAction(null);
  }, [pendingLockAction]);

  const cancelLock = useCallback(() => {
    setShowLockWarning(false);
    setPendingLockAction(null);
  }, []);

  const saveRowAsDraft = useCallback(async () => {
    if (!activeRow) return;

    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }
    if (!payrollMonth || !payrollYear) {
      toast.error("Please select payroll month and year");
      return;
    }
    try {
      const mapItemToPayload = (item: (typeof payrollItems)[0]) => ({
        userId: item.userId,
        grossSalary: item.grossSalary,
        baseSalary: item.baseSalary,
        netSalary: item.netSalary,
        currency: item.currency as any,
        paymentMode: item.paymentMode as any,
        bankAccountDetails: item.bankAccount || undefined,
        deductedAdvance: item.deductedAdvance || 0,
        totalWorkingDays: item.totalWorkingDays,
        incentive: item.incentive || 0,
      });
      const items =
        isEditMode && payrollId
          ? payrollItems.map((item) =>
              item.userId === activeRow.userId
                ? mapItemToPayload(activeRow)
                : mapItemToPayload(item),
            )
          : [mapItemToPayload(activeRow)];

      const payload: CreateBulkPayrollSchema = {
        payrollMonth: parseInt(payrollMonth),
        payrollYear: parseInt(payrollYear),
        branchId: selectedBranch || undefined,
        branchName:
          availableBranches.find((b) => b._id === selectedBranch)?.branchName ||
          undefined,
        paymentMode: activeRow.paymentMode as any,
        payrollStatus: "DRAFT" as any,
        items,
      };

      setIsSavingDraftRowId(activeRow.userId);
      if (isEditMode && payrollId) {
        await PayrollService.updateBulkPayrollWithItems(payrollId, payload);
      } else {
        const response = await PayrollService.createBulkPayrollWithItems(payload);
        const createdPayrollId = response.payroll?._id;
        setPayrollItems((prev) =>
          prev.map((item) =>
            item.userId === activeRow.userId
              ? {
                  ...item,
                  payrollStatus: "DRAFT",
                  payrollId: createdPayrollId || item.payrollId,
                }
              : item,
          ),
        );
      }
      toast.success(`Payroll saved as draft for ${activeRow.fullName}`);
      refetchPayrollItems();
      closeRowModal();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save payroll as draft";
      toast.error(message);
      console.error("Payroll save draft error:", error);
    } finally {
      setIsSavingDraftRowId(null);
    }
  }, [
    activeRow,
    closeRowModal,
    payrollMonth,
    payrollYear,
    refetchPayrollItems,
    selectedBranch,
    availableBranches,
    isEditMode,
    payrollId,
    payrollItems,
  ]);

  const markRowAsLocked = useCallback(async () => {
    if (!activeRow) return;

    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }
    if (!payrollMonth || !payrollYear) {
      toast.error("Please select payroll month and year");
      return;
    }
    try {
      const mapItemToPayload = (item: (typeof payrollItems)[0]) => ({
        userId: item.userId,
        grossSalary: item.grossSalary,
        baseSalary: item.baseSalary,
        netSalary: item.netSalary,
        currency: item.currency as any,
        paymentMode: item.paymentMode as any,
        bankAccountDetails: item.bankAccount || undefined,
        deductedAdvance: item.deductedAdvance || 0,
        totalWorkingDays: item.totalWorkingDays,
        incentive: item.incentive || 0,
      });
      const items =
        isEditMode && payrollId
          ? payrollItems.map((item) =>
              item.userId === activeRow.userId
                ? mapItemToPayload(activeRow)
                : mapItemToPayload(item),
            )
          : [mapItemToPayload(activeRow)];

      const payload: CreateBulkPayrollSchema = {
        payrollMonth: parseInt(payrollMonth),
        payrollYear: parseInt(payrollYear),
        branchId: selectedBranch || undefined,
        branchName:
          availableBranches.find((b) => b._id === selectedBranch)?.branchName ||
          undefined,
        paymentMode: activeRow.paymentMode as any,
        payrollStatus: "LOCKED" as any,
        items,
      };

      if (isEditMode && payrollId) {
        await PayrollService.updateBulkPayrollWithItems(payrollId, payload);
        setPayrollItems((prev) =>
          prev.map((item) => ({ ...item, payrollStatus: "LOCKED" })),
        );
      } else {
        const response = await PayrollService.createBulkPayrollWithItems(payload);
        const createdPayrollId = Array.isArray(response)
          ? response[0]?._id
          : (response as any)?.payroll?._id;
        setPayrollItems((prev) =>
          prev.map((item) =>
            item.userId === activeRow.userId
              ? {
                  ...item,
                  payrollStatus: "LOCKED",
                  payrollId: createdPayrollId || item.payrollId,
                }
              : item,
          ),
        );
      }
      toast.success(`Payroll locked for ${activeRow.fullName}`);
      refetchPayrollItems();
      closeRowModal();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to lock payroll";
      toast.error(message);
      console.error("Payroll lock error:", error);
    }
  }, [
    activeRow,
    closeRowModal,
    payrollMonth,
    payrollYear,
    refetchPayrollItems,
    selectedBranch,
    availableBranches,
    isEditMode,
    payrollId,
    payrollItems,
  ]);

  const markRowAsPaid = useCallback(async () => {
    if (!activeRow) return;

    if (activeRow.payrollStatus !== "LOCKED") {
      toast.error("Only LOCKED payrolls can be marked as PAID");
      return;
    }

    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }
    if (!payrollMonth || !payrollYear) {
      toast.error("Please select payroll month and year");
      return;
    }

    try {
      const payload: CreateBulkPayrollSchema = {
        payrollMonth: parseInt(payrollMonth),
        payrollYear: parseInt(payrollYear),
        branchId: selectedBranch || undefined,
        branchName:
          availableBranches.find((b) => b._id === selectedBranch)?.branchName ||
          undefined,
        paymentMode: activeRow.paymentMode as any,
        payrollStatus: "PAID" as any,
        items: [
          {
            userId: activeRow.userId,
            grossSalary: activeRow.grossSalary,
            baseSalary: activeRow.baseSalary,
            netSalary: activeRow.netSalary,
            currency: activeRow.currency as any,
            paymentMode: activeRow.paymentMode as any,
            bankAccountDetails: activeRow.bankAccount || undefined,
            deductedAdvance: activeRow.deductedAdvance || 0,
            payrollId: activeRow.payrollId || undefined,
            totalWorkingDays: activeRow.totalWorkingDays,
            incentive: activeRow.incentive || 0,
          },
        ],
      };

      await PayrollService.markAsPaidBulkPayrollWithItems(payload);
      setPayrollItems((prev) =>
        prev.map((item) =>
          item.userId === activeRow.userId
            ? { ...item, payrollStatus: "PAID" }
            : item,
        ),
      );
      toast.success(`Payroll marked as paid for ${activeRow.fullName}`);
      refetchPayrollItems();
      closeRowModal();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to mark payroll as paid";
      toast.error(message);
      console.error("Payroll mark as paid error:", error);
    }
  }, [
    activeRow,
    closeRowModal,
    payrollMonth,
    payrollYear,
    refetchPayrollItems,
    selectedBranch,
    availableBranches,
  ]);

  // Add/remove employees from payroll (cannot select LOCKED or PAID)
  const toggleEmployeeSelection = useCallback(
    (userId: string) => {
      const employee = employees.find((e) => e.userId === userId)
        || displayRows.find((e) => e.userId === userId);
      if (!employee) return;
      if (employee.payrollStatus === "LOCKED" || employee.payrollStatus === "PAID")
        return;

      const daysInMonth = getDaysInMonth(
        parseInt(payrollMonth),
        parseInt(payrollYear),
      );

      setPayrollItems((prev) => {
        const exists = prev.find((item) => item.userId === userId);
        if (exists) {
          return prev.filter((item) => item.userId !== userId);
        } else {
          const { grossSalary, netSalary } = calculateSalaryByWorkingDays(
            employee.baseSalary,
            daysInMonth,
            employee.deductedAdvance ?? 0,
            employee.incentive ?? 0,
            daysInMonth,
          );
          return [
            ...prev,
            {
              ...employee,
              selected: true,
              advanceSalary: employee.takenAdvance,
              totalWorkingDays: daysInMonth,
              incentive: employee.incentive ?? 0,
              grossSalary,
              netSalary,
            },
          ];
        }
      });
    },
    [employees, displayRows, payrollMonth, payrollYear, calculateSalaryByWorkingDays],
  );

  // Select all employees (in edit mode only selectable = DRAFT/PENDING from displayRows)
  const selectAllEmployees = useCallback(() => {
    const daysInMonth = getDaysInMonth(
      parseInt(payrollMonth),
      parseInt(payrollYear),
    );
    const source = isEditMode && displayRows.length > 0
      ? displayRows.filter(
          (r) => r.payrollStatus !== "LOCKED" && r.payrollStatus !== "PAID",
        )
      : employees;
    const allSelected = source.map((emp) => {
      const wd = emp.totalWorkingDays ?? daysInMonth;
      const { grossSalary, netSalary } = calculateSalaryByWorkingDays(
        emp.baseSalary,
        wd,
        emp.deductedAdvance ?? 0,
        emp.incentive ?? 0,
        daysInMonth,
      );
      return {
        ...emp,
        selected: true,
        grossSalary,
        netSalary,
        totalWorkingDays: wd,
        advancePayrollDetails: emp.advancePayrollDetails ?? null,
      };
    });
    setPayrollItems(allSelected);
  }, [
    employees,
    displayRows,
    isEditMode,
    payrollMonth,
    payrollYear,
    calculateSalaryByWorkingDays,
  ]);

  // Deselect all employees
  const deselectAllEmployees = useCallback(() => {
    setPayrollItems([]);
  }, []);

  // Update working days and recalculate
  const updateWorkingDays = useCallback(
    (userId: string, workingDays: number) => {
      const daysInMonth = getDaysInMonth(
        parseInt(payrollMonth),
        parseInt(payrollYear),
      );
      const clampedDays = clampWorkingDays(workingDays, daysInMonth);
      setPayrollItems((prev) =>
        prev.map((item) => {
          if (item.userId === userId) {
            const { grossSalary, netSalary } = calculateSalaryByWorkingDays(
              item.baseSalary,
              clampedDays,
              item.deductedAdvance,
              item.incentive,
              daysInMonth,
            );
            return {
              ...item,
              totalWorkingDays: clampedDays,
              grossSalary,
              netSalary,
            };
          }
          return item;
        }),
      );
    },
    [calculateSalaryByWorkingDays, payrollMonth, payrollYear],
  );

  // Update deducted advance and recalculate
  const updateDeductedAdvance = useCallback(
    (userId: string, deductedAdvance: number) => {
      const daysInMonth = getDaysInMonth(
        parseInt(payrollMonth),
        parseInt(payrollYear),
      );
      setPayrollItems((prev) =>
        prev.map((item) => {
          if (item.userId === userId) {
            const { grossSalary, netSalary } = calculateSalaryByWorkingDays(
              item.baseSalary,
              item.totalWorkingDays,
              deductedAdvance,
              item.incentive,
              daysInMonth,
            );
            return {
              ...item,
              deductedAdvance,
              grossSalary,
              netSalary,
            };
          }
          return item;
        }),
      );
    },
    [calculateSalaryByWorkingDays, payrollMonth, payrollYear],
  );

  // Update incentive and recalculate
  const updateIncentive = useCallback(
    (userId: string, incentive: number) => {
      const daysInMonth = getDaysInMonth(
        parseInt(payrollMonth),
        parseInt(payrollYear),
      );
      setPayrollItems((prev) =>
        prev.map((item) => {
          if (item.userId === userId) {
            const { grossSalary, netSalary } = calculateSalaryByWorkingDays(
              item.baseSalary,
              item.totalWorkingDays,
              item.deductedAdvance,
              incentive,
              daysInMonth,
            );
            return {
              ...item,
              incentive,
              grossSalary,
              netSalary,
            };
          }
          return item;
        }),
      );
    },
    [calculateSalaryByWorkingDays, payrollMonth, payrollYear],
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }
    if (!payrollMonth || !payrollYear) {
      toast.error("Please select payroll month and year");
      return;
    }
    if (payrollItems.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    // Determine payment mode - if mixed modes, send null
    const uniquePaymentModes = Array.from(
      new Set(payrollItems.map((item) => item.paymentMode)),
    );
    const paymentMode =
      uniquePaymentModes.length > 1 ? null : uniquePaymentModes[0] || "CASH";

    // Build a single payload with all items (each item has its own paymentMode)
    const payload: CreateBulkPayrollSchema = {
      payrollMonth: parseInt(payrollMonth),
      payrollYear: parseInt(payrollYear),
      branchId: selectedBranch || undefined,
      branchName:
        availableBranches.find((b) => b._id === selectedBranch)?.branchName ||
        undefined,
      paymentMode: paymentMode as any,
      items: payrollItems.map((item, index) => ({
        userId: item.userId,
        grossSalary: item.grossSalary,
        baseSalary: item.baseSalary,
        netSalary: item.netSalary,
        currency: item.currency as any,
        paymentMode: item.paymentMode as any,
        bankAccountDetails: item.bankAccount || undefined,
        deductedAdvance: item.deductedAdvance || 0,
        totalWorkingDays: item.totalWorkingDays,
        incentive: item.incentive || 0,
        sequenceIndex: index,
      })),
    };

    try {
      if (isEditMode && payrollId) {
        await PayrollService.updateBulkPayrollWithItems(payrollId, payload);
        toast.success(
          `Payroll updated successfully for ${payrollItems.length} employees`,
        );
      } else {
        await PayrollService.createBulkPayrollWithItems(payload);
        toast.success(
          `Bulk payroll created successfully for ${payrollItems.length} employees`,
        );
      }

      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      router.push(APP_ROUTE.PAYROLL.ALL.PATH);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (isEditMode
          ? "Failed to update payroll"
          : "Failed to create bulk payroll");
      toast.error(message);
      console.error("Payroll operation error:", error);
    }
  };

  // Define columns for employee selection and payroll items
  const payrollItemsColumns: Column[] = [
    {
      id: "select",
      label: "Select",
      width: "5%",
      renderHeader: () => {
        const checkboxRef = useRef<HTMLInputElement>(null);
        const selectableRows = displayRows.filter(
          (r) =>
            r.payrollStatus !== "LOCKED" && r.payrollStatus !== "PAID",
        );
        const allSelectableSelected =
          selectableRows.length > 0 &&
          selectableRows.every((r) =>
            payrollItems.some((item) => item.userId === r.userId),
          );
        const someSelectableSelected =
          selectableRows.some((r) =>
            payrollItems.some((item) => item.userId === r.userId),
          ) && !allSelectableSelected;

        useEffect(() => {
          if (checkboxRef.current) {
            (checkboxRef.current as any).indeterminate = someSelectableSelected;
          }
        }, [someSelectableSelected]);

        return (
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={allSelectableSelected}
            onChange={(e) =>
              e.target.checked ? selectAllEmployees() : deselectAllEmployees()
            }
            className="w-4 h-4 cursor-pointer"
            title={
              allSelectableSelected
                ? "Deselect all"
                : someSelectableSelected
                  ? "Deselect some"
                  : "Select all"
            }
          />
        );
      },
      renderCell: (_: any, row: any) => {
        const isPaid = row.payrollStatus === "PAID";
        const isLocked = row.payrollStatus === "LOCKED";
        const isChecked =
          payrollItems.some((item) => item.userId === row.userId) &&
          !isLocked &&
          !isPaid;
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => toggleEmployeeSelection(row.userId)}
              onClick={(event) => event.stopPropagation()}
              disabled={isPaid || isLocked}
              className="w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        );
      },
    },
    {
      id: "fullName",
      label: "Employee",
      width: "28%",
      renderCell: (value: any, row) => (
        <span className="font-medium" title={row.email}>
          {row.fullName}
        </span>
      ),
    },
    {
      id: "payrollStatus",
      label: "Status",
      width: "12%",
      renderCell: (value: any) => (
        <Badge
          variant={
            value === "DRAFT" || value === "PENDING" ? "info" : "default"
          }
          className="text-xs"
        >
          {value || "DRAFT"}
        </Badge>
      ),
    },
    {
      id: "baseSalary",
      label: "Base",
      width: "16%",
      renderCell: (value: any, row) => {
        const symbol = currencySymbol(row.currency);
        const displayValue = formatAmountDisplay(row.baseSalary, symbol);
        return <span className="text-sm font-medium">{displayValue}</span>;
      },
    },
    {
      id: "workingDays",
      label: "Working Days",
      width: "12%",
      renderCell: (_: any, row: any) => {
        const selectedItem = payrollItems.find(
          (item) => item.userId === row.userId,
        );
        const workingDays =
          selectedItem?.totalWorkingDays ?? row.totalWorkingDays ?? 0;
        return <span className="text-sm font-medium">{workingDays}</span>;
      },
    },
    {
      id: "advance",
      label: "Loan / Deduct",
      width: "22%",
      renderCell: (_: any, row: any) => {
        const symbol = currencySymbol(row.currency);
        const selectedItem = payrollItems.find(
          (item) => item.userId === row.userId,
        );
        const d: IAdvancePayrollDetails | null | undefined =
          selectedItem?.advancePayrollDetails ?? row.advancePayrollDetails;
        const suggested = getSuggestedDeductionFromDetails(d);
        const deductThisPeriod = selectedItem
          ? Number(selectedItem.deductedAdvance ?? 0)
          : suggested;
        const balance = Number(d?.totalRemaining ?? 0);
        const loanTotal = Number(d?.totalAmount ?? 0);

        const hasLoan =
          balance > 0 ||
          loanTotal > 0 ||
          suggested > 0 ||
          deductThisPeriod > 0;

        if (!hasLoan) {
          return <span className="text-sm font-medium text-muted-foreground">—</span>;
        }

        const deductLabel = formatAmountDisplay(deductThisPeriod, symbol);
        const balanceLabel = formatAmountDisplay(balance, symbol);
        const principalLabel = formatAmountDisplay(loanTotal, symbol);

        return (
          <div className="space-y-0.5 text-left">
            <div className="text-sm font-semibold text-amber-800">
              Deduct: {deductLabel}
            </div>
            {balance > 0 && (
              <div className="text-[11px] text-muted-foreground">
                Balance: {balanceLabel}
              </div>
            )}
            {loanTotal > 0 && loanTotal !== balance && (
              <div className="text-[11px] text-muted-foreground">
                Loan total: {principalLabel}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "incentive",
      label: "Incentive",
      width: "12%",
      renderCell: (_: any, row: any) => {
        const symbol = currencySymbol(row.currency);
        const selectedItem = payrollItems.find(
          (item) => item.userId === row.userId,
        );
        const incentiveAmount = selectedItem?.incentive ?? row.incentive ?? 0;
        const displayValue = formatAmountDisplay(incentiveAmount, symbol);
        return (
          <span className="text-sm font-medium text-blue-600">
            {displayValue}
          </span>
        );
      },
    },
    {
      id: "netSalary",
      label: "Net Pay",
      width: "16%",
      renderCell: (value: any, row: any) => {
        const isSelected = payrollItems.some(
          (item) => item.userId === row.userId,
        );
        const selectedItem = payrollItems.find(
          (item) => item.userId === row.userId,
        );
        const netPay = isSelected
          ? selectedItem?.netSalary || 0
          : row.netSalary || 0;
        const symbol = currencySymbol(row.currency);
        const displayValue = formatAmountDisplay(netPay, symbol);
        return (
          <span className="text-sm font-semibold text-green-600">
            {displayValue}
          </span>
        );
      },
    },
    {
      id: "currency",
      label: "Currency",
      width: "10%",
      renderCell: (value: any) => (
        <span className="text-sm">{value || "INR"}</span>
      ),
    },
    {
      id: "paymentMode",
      label: "Mode",
      width: "12%",
      renderCell: (value: any, row: any) => (
        <Badge className="text-xs">
          {row.paymentMode || PaymentModeEnum.CASH}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Edit Payroll" : "Create Bulk Payroll"}
          </h1>
        </div>

        {/* Payroll Period Section */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="month" className="mb-2 block">
                  Payroll Month
                </Label>
                <select
                  id="month"
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1).toLocaleString("default", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="year" className="mb-2 block">
                  Payroll Year
                </Label>
                <Input
                  id="year"
                  type="number"
                  value={payrollYear}
                  onChange={(e) => setPayrollYear(e.target.value)}
                  onWheel={preventNumberInputScroll}
                  onKeyDown={preventNumberInputArrowChange}
                  min="2000"
                  max={new Date().getFullYear() + 1}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="branch" className="mb-2 block">
                  Select Branch
                </Label>
                <Combobox
                  items={availableBranches.map((branch) => ({
                    value: branch._id,
                    label: branch.branchName,
                  }))}
                  value={selectedBranch || undefined}
                  onChange={(value) => handleBranchChange(typeof value === "string" ? value : "")}
                  placeholder="Select Branch..."
                  emptyLabel="Clear branch"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="paymentMode" className="mb-2 block">
                  Payment Mode Filter
                </Label>
                <select
                  id="paymentMode"
                  value={selectedPaymentMode}
                  onChange={(e) => setSelectedPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="ALL">All Payment Modes</option>
                  <option value="CASH">Cash Only</option>
                  <option value="ACCOUNT">Account Only</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Selection Section */}
        <Card>
          <CardHeader>
            <CardTitle>Select Employees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedBranch && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Employees</h3>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const selectedUserIds = new Set(
                          payrollItems.map((item) => item.userId),
                        );
                        if (selectedUserIds.size === 0) {
                          toast.error("Please select at least one employee");
                          return;
                        }

                        // Validate inputs
                        if (!selectedBranch) {
                          toast.error("Please select a branch");
                          return;
                        }
                        if (!payrollMonth || !payrollYear) {
                          toast.error("Please select payroll month and year");
                          return;
                        }

                        // Show warning modal with pending lock action
                        handleLockAction(async () => {
                          try {
                            if (isEditMode && payrollId) {
                              // Lock only selected PENDING/DRAFT items on existing payroll (do not change LOCKED)
                              const pendingUserIds = payrollItems
                                .filter(
                                  (item) =>
                                    item.payrollStatus === "PENDING" ||
                                    item.payrollStatus === "DRAFT",
                                )
                                .map((item) => item.userId);
                              if (pendingUserIds.length === 0) {
                                toast.error(
                                  "No PENDING or DRAFT employees selected to lock",
                                );
                                return;
                              }
                              await PayrollService.lockSelectedPayrollItems(
                                payrollId,
                                pendingUserIds,
                              );
                              setPayrollItems((prev) =>
                                prev.map((item) =>
                                  pendingUserIds.includes(item.userId)
                                    ? { ...item, payrollStatus: "LOCKED" }
                                    : item,
                                ),
                              );
                              toast.success(
                                `Locked ${pendingUserIds.length} employee(s) on existing payroll`,
                              );
                            } else {
                              // Create new payroll with all selected items as LOCKED
                              const uniquePaymentModes = Array.from(
                                new Set(
                                  payrollItems.map((item) => item.paymentMode),
                                ),
                              );
                              const paymentMode =
                                uniquePaymentModes.length > 1
                                  ? null
                                  : uniquePaymentModes[0] || "CASH";
                              const payload: CreateBulkPayrollSchema = {
                                payrollMonth: parseInt(payrollMonth),
                                payrollYear: parseInt(payrollYear),
                                branchId: selectedBranch || undefined,
                                branchName:
                                  availableBranches.find(
                                    (b) => b._id === selectedBranch,
                                  )?.branchName || undefined,
                                paymentMode: paymentMode as any,
                                payrollStatus: "LOCKED" as any,
                                items: payrollItems.map((item) => ({
                                  userId: item.userId,
                                  grossSalary: item.grossSalary,
                                  baseSalary: item.baseSalary,
                                  netSalary: item.netSalary,
                                  currency: item.currency as any,
                                  paymentMode: item.paymentMode as any,
                                  bankAccountDetails:
                                    item.bankAccount || undefined,
                                  deductedAdvance: item.deductedAdvance || 0,
                                  totalWorkingDays: item.totalWorkingDays,
                                  incentive: item.incentive || 0,
                                })),
                              };
                              await PayrollService.createBulkPayrollWithItems(
                                payload,
                              );
                              toast.success(
                                `Payroll locked for ${payrollItems.length} employees`,
                              );
                            }
                            refetchPayrollItems();
                          } catch (error: any) {
                            const message =
                              error?.response?.data?.message ||
                              error?.message ||
                              "Failed to lock payroll";
                            toast.error(message);
                            console.error("Payroll lock error:", error);
                          }
                        });
                      }}
                      className="gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      LOCK ({payrollItems.length})
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const selectedUserIds = new Set(
                          payrollItems.map((item) => item.userId),
                        );
                        if (selectedUserIds.size === 0) {
                          toast.error("Please select at least one employee");
                          return;
                        }

                        // Validate inputs
                        if (!selectedBranch) {
                          toast.error("Please select a branch");
                          return;
                        }
                        if (!payrollMonth || !payrollYear) {
                          toast.error("Please select payroll month and year");
                          return;
                        }

                        try {
                          const uniquePaymentModes = Array.from(
                            new Set(
                              payrollItems.map((item) => item.paymentMode),
                            ),
                          );
                          const paymentMode =
                            uniquePaymentModes.length > 1
                              ? null
                              : uniquePaymentModes[0] || "CASH";

                          const payload: CreateBulkPayrollSchema = {
                            payrollMonth: parseInt(payrollMonth),
                            payrollYear: parseInt(payrollYear),
                            branchId: selectedBranch || undefined,
                            branchName:
                              availableBranches.find(
                                (b) => b._id === selectedBranch,
                              )?.branchName || undefined,
                            paymentMode: paymentMode as any,
                            payrollStatus: "DRAFT" as any,
                            items: payrollItems.map((item) => ({
                              userId: item.userId,
                              grossSalary: item.grossSalary,
                              baseSalary: item.baseSalary,
                              netSalary: item.netSalary,
                              currency: item.currency as any,
                              paymentMode: item.paymentMode as any,
                              bankAccountDetails: item.bankAccount || undefined,
                              deductedAdvance: item.deductedAdvance || 0,
                              totalWorkingDays: item.totalWorkingDays,
                              incentive: item.incentive || 0,
                            })),
                          };

                          setIsSavingDraftAll(true);
                          if (isEditMode && payrollId) {
                            // Add selected employees to existing payroll (append; LOCKED rows stay unchanged)
                            await PayrollService.addItemsToPayroll(
                              payrollId,
                              payload,
                            );
                            toast.success(
                              `Added ${payrollItems.length} employee(s) to existing payroll`,
                            );
                          } else {
                            await PayrollService.createBulkPayrollWithItems(
                              payload,
                            );
                            toast.success(
                              `Payroll saved as draft for ${payrollItems.length} employees`,
                            );
                          }
                          refetchPayrollItems();
                        } catch (error: any) {
                          const message =
                            error?.response?.data?.message ||
                            error?.message ||
                            "Failed to save payroll as draft";
                          toast.error(message);
                          console.error("Payroll draft save error:", error);
                        } finally {
                          setIsSavingDraftAll(false);
                        }
                      }}
                      disabled={isSavingDraftAll}
                      className="gap-2"
                    >
                      {isSavingDraftAll ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {isSavingDraftAll
                        ? "Saving Draft..."
                        : `Save as Draft (${payrollItems.length})`}
                    </Button>
                    {/* 
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        // Filter only LOCKED items
                        const lockedItems = payrollItems.filter(
                          (item) => item.payrollStatus === "LOCKED",
                        );

                        if (lockedItems.length === 0) {
                          toast.error(
                            "Please select at least one employee with LOCKED status",
                          );
                          return;
                        }

                        // Validate inputs
                        if (!selectedBranch) {
                          toast.error("Please select a branch");
                          return;
                        }
                        if (!payrollMonth || !payrollYear) {
                          toast.error("Please select payroll month and year");
                          return;
                        }

                        try {
                          const payload: CreateBulkPayrollSchema = {
                            payrollMonth: parseInt(payrollMonth),
                            payrollYear: parseInt(payrollYear),
                            branchId: selectedBranch || undefined,
                            branchName: availableBranches.find((b) => b._id === selectedBranch)?.branchName || undefined,
                            paymentMode: selectedPaymentMode as any,
                            payrollStatus: "PAID" as any,
                            items: lockedItems.map((item) => ({
                              userId: item.userId,
                              grossSalary: item.grossSalary,
                              baseSalary: item.baseSalary,
                              netSalary: item.netSalary,
                              currency: item.currency as any,
                              paymentMode: item.paymentMode as any,
                              bankAccountDetails: item.bankAccount || undefined,
                              deductedAdvance: item.deductedAdvance || 0,
                              payrollId: item.payrollId || undefined,
                              totalWorkingDays: item.totalWorkingDays,
                            })),
                          };

                          await PayrollService.markAsPaidBulkPayrollWithItems(
                            payload,
                          );
                          toast.success(
                            `Payroll marked as paid for ${lockedItems.length} employees`,
                          );
                          refetchPayrollItems();
                        } catch (error: any) {
                          const message =
                            error?.response?.data?.message ||
                            error?.message ||
                            "Failed to mark payroll as paid";
                          toast.error(message);
                          console.error("Payroll mark as paid error:", error);
                        }
                      }}
                    >
                      Mark as PAID (
                      {
                        payrollItems.filter(
                          (item) => item.payrollStatus === "LOCKED",
                        ).length
                      }
                      )
                    </Button>
                    */}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <DataTable
                    columns={payrollItemsColumns}
                    rows={displayRows}
                    isLoading={isLoadingPayrollItems || isFetchingNextPage}
                    onRowClick={openRowModal}
                  />
                </div>

                {/* Totals Summary */}
                {payrollItems.length > 0 && (
                  <div className="space-y-4 mt-4">
                    {/* Overall Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-md">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Employees
                        </p>
                        <p className="text-2xl font-bold">{totals.count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Payment Modes
                        </p>
                        <p className="text-sm font-semibold text-blue-600">
                          {Object.values(totals.byCurrency)
                            .flatMap((c) => Array.from(c.paymentModes))
                            .filter((v, i, a) => a.indexOf(v) === i)
                            .join(", ") || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Totals by Currency */}
                    {Object.entries(totals.byCurrency).map(
                      ([currency, data]) => {
                        const symbol = currencySymbol(currency);
                        return (
                          <div
                            key={currency}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-md"
                          >
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Currency ({currency})
                              </p>
                              <p className="text-sm font-semibold">
                                {currency}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Gross Total
                              </p>
                              <p className="text-lg font-bold">
                                {symbol}
                                {data.grossTotal.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Net Total
                              </p>
                              <p className="text-lg font-bold text-green-600">
                                {symbol}
                                {data.netTotal.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Deduction
                              </p>
                              <p className="text-lg font-bold">
                                {symbol}
                                {data.advanceTotal.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {/* <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || payrollItems.length === 0}
        >
          {isSubmitting ? "Creating..." : "Create Bulk Payroll"}
        </Button>
      </div> */}

        {/* Lock Warning Modal */}
        {showLockWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      Lock Payroll Warning
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Once you lock this payroll, you will not be able to edit
                      it anymore. This action is irreversible. Are you sure you
                      want to proceed?
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelLock}
                    className="min-w-[100px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={confirmLock}
                    className="min-w-[100px] gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Confirm Lock
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
      {activeRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeRowModal}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-lg shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">{activeRow.fullName}</h2>
                <div className="flex flex-col gap-1">
                  {activeRow.employeeId && (
                    <p className="text-xs font-medium text-muted-foreground">
                      ID: {activeRow.employeeId}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {activeRow.email}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  activeRow.payrollStatus === "DRAFT" ||
                  activeRow.payrollStatus === "PENDING"
                    ? "info"
                    : "default"
                }
              >
                {activeRow.payrollStatus || "DRAFT"}
              </Badge>
            </div>

            <div className="space-y-6 px-6 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="row-working-days" className="mb-1 block">
                    Working Days (out of{" "}
                    {getDaysInMonth(
                      parseInt(payrollMonth),
                      parseInt(payrollYear),
                    )}{" "}
                    days)
                  </Label>
                  <Input
                    id="row-working-days"
                    type="number"
                    min="1"
                    max={getDaysInMonth(
                      parseInt(payrollMonth),
                      parseInt(payrollYear),
                    )}
                    value={activeRow.totalWorkingDays || ""}
                    onChange={(e) =>
                      updateWorkingDays(
                        activeRow.userId,
                        clampWorkingDays(
                          parseInt(e.target.value) || 0,
                          getDaysInMonth(
                            parseInt(payrollMonth),
                            parseInt(payrollYear),
                          ),
                        ),
                      )
                    }
                    onWheel={preventNumberInputScroll}
                    onKeyDown={preventNumberInputArrowChange}
                    disabled={
                      activeRow.payrollStatus === "LOCKED" ||
                      activeRow.payrollStatus === "PAID"
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="row-base-salary" className="mb-1 block">
                    Base Salary
                  </Label>
                  <Input
                    id="row-base-salary"
                    type="number"
                    value={activeRow.baseSalary}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="row-currency" className="mb-1 block">
                    Currency
                  </Label>
                  <Input
                    id="row-currency"
                    type="text"
                    value={activeRow.currency || "INR"}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="row-taken-advance" className="mb-1 block">
                    Advance Remaining
                  </Label>
                  <Input
                    id="row-taken-advance"
                    type="number"
                    value={
                      activeRow.advancePayrollDetails?.totalRemaining ||
                      activeRow.takenAdvance ||
                      0
                    }
                    disabled
                  />
                </div>
                {(activeRow.advancePayrollDetails?.totalRemaining ||
                  activeRow.takenAdvance ||
                  0) > 0 && (
                  <div>
                    <Label
                      htmlFor="row-advance-deduction"
                      className="mb-1 block"
                    >
                      Deduction
                    </Label>
                    <Input
                      id="row-advance-deduction"
                      type="number"
                      step="0.01"
                      min="0"
                      max={
                        activeRow.advancePayrollDetails?.totalRemaining ||
                        activeRow.takenAdvance ||
                        0
                      }
                      value={
                        (activeRow.deductedAdvance ||
                          activeRow.advancePayrollDetails?.totalDeducted ||
                          0) === 0
                          ? ""
                          : activeRow.deductedAdvance ||
                            activeRow.advancePayrollDetails?.totalDeducted ||
                            0
                      }
                      onChange={(e) =>
                        updateDeductedAdvance(
                          activeRow.userId,
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value) || 0,
                        )
                      }
                      onWheel={preventNumberInputScroll}
                      onKeyDown={preventNumberInputArrowChange}
                      disabled={
                        activeRow.payrollStatus === "LOCKED" ||
                        activeRow.payrollStatus === "PAID"
                      }
                      placeholder="0"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="row-incentive" className="mb-1 block">
                    Incentive
                  </Label>
                  <Input
                    id="row-incentive"
                    type="number"
                    step="0.01"
                    min="0"
                    value={activeRow.incentive === 0 ? "" : activeRow.incentive}
                    onChange={(e) =>
                      updateIncentive(
                        activeRow.userId,
                        e.target.value === ""
                          ? 0
                          : parseFloat(e.target.value) || 0,
                      )
                    }
                    onWheel={preventNumberInputScroll}
                    onKeyDown={preventNumberInputArrowChange}
                    disabled={
                      activeRow.payrollStatus === "LOCKED" ||
                      activeRow.payrollStatus === "PAID"
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="mb-1 block">Payment Mode</Label>
                  <div className="rounded-md border px-3 py-2">
                    <Badge className="text-xs">
                      {activeRow.paymentMode || PaymentModeEnum.CASH}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label htmlFor="row-gross-salary" className="mb-1 block">
                    Gross Salary
                  </Label>
                  <Input
                    id="row-gross-salary"
                    type="number"
                    value={formatAmountDisplay(activeRow.grossSalary, currencySymbol(activeRow.currency))}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="row-net-salary" className="mb-1 block">
                    Net Salary
                  </Label>
                  <Input
                    id="row-net-salary"
                    type="number"
                    value={formatAmountDisplay(activeRow.netSalary, currencySymbol(activeRow.currency))}
                    disabled
                  />
                </div>
                {activeRow.paymentMode !== PaymentModeEnum.CASH && (
                  <div className="md:col-span-2">
                    <Label className="mb-1 block">Bank Account</Label>
                    <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                      {formatBankAccount(
                        activeRow.bankAccount as IBankAccount | string | null,
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-lg border bg-muted/40 px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  Salary Summary
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <span className="font-medium">
                    Base: {currencySymbol(activeRow.currency)}
                    {formatAmountDisplay(activeRow.baseSalary, currencySymbol(activeRow.currency))}
                  </span>
                  <span className="font-medium">
                    Gross: {currencySymbol(activeRow.currency)}
                    {formatAmountDisplay(activeRow.grossSalary, currencySymbol(activeRow.currency))}
                  </span>
                  <span className="font-medium text-green-600">
                    Net: {currencySymbol(activeRow.currency)}
                    {formatAmountDisplay(activeRow.netSalary, currencySymbol(activeRow.currency))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <Button type="button" variant="ghost" onClick={closeRowModal}>
                Close
              </Button>
              {activeRow.payrollStatus === "PAID" ? (
                <Button type="button" variant="default" disabled>
                  PAID
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={saveRowAsDraft}
                    disabled={
                      activeRow.payrollStatus === "LOCKED" ||
                      isSavingDraftRowId === activeRow.userId
                    }
                  >
                    {isSavingDraftRowId === activeRow.userId ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving Draft...
                      </>
                    ) : (
                      "Save as Draft"
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={markRowAsLocked}
                    disabled={activeRow.payrollStatus === "LOCKED"}
                  >
                    {activeRow.payrollStatus === "LOCKED"
                      ? "LOCKED"
                      : "Mark as LOCK"}
                  </Button>
                  {activeRow.payrollStatus === "LOCKED" && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={markRowAsPaid}
                    >
                      Mark as PAID
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
