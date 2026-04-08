"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import PayrollForm from "@/components/form/PayrollForm";
import { BulkPayrollForm } from "@/components/form/BulkPayrollForm";
import { usePayroll } from "@/hooks/query/usePayroll";
import { useBranches } from "@/hooks/query/useBranch";
import { usePermission } from "@/hooks";
import PageHeader from "@/components/sections/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  ChevronDown,
  Download,
  Save,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { DataTable } from "@/components/datatable";
import {
  Column,
  PaymentModeEnum,
  ModuleNameEnum,
  PermissionAction,
} from "@/types";
import { currencySymbol } from "@/lib/utils";
import {
  getPayrollExportData,
  autoGenerateLots,
  markLotPaid,
  markLotEmployeePaid,
  addEmployeeToLot,
  getPayrollItemsByBranch,
  updatePayrollMaster,
} from "@/service/payroll.service";
import { useActiveLotMasters } from "@/hooks/useLotMaster";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const roundAmount = (value?: number) => Math.round(value || 0);
const formatAmountDisplay = (value?: number, symbol?: string) => {
  const amount = Number(value || 0);
  if (amount <= 0) return "-";
  return `${symbol ?? ""}${roundAmount(amount)}`;
};

const isPersistedLotId = (value?: string) =>
  /^[a-f0-9]{24}$/i.test(String(value || ""));

const normalizePayrollStatus = (status?: string) =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const isSentToAccountant = (status?: string) => {
  const normalizedStatus = normalizePayrollStatus(status);
  return ["SENT_TO_ACCOUNTANT"].includes(normalizedStatus);
};

const getLotStatusLabel = (status?: string, isAssigned: boolean = false) => {
  const normalizedStatus = String(status || "").toUpperCase();
  if (normalizedStatus === "CLOSED") return "Closed";
  if (normalizedStatus === "PAID") return "Paid";
  if (normalizedStatus === "PARTIALLY_PAID") return "Partially Paid";
  if (normalizedStatus === "CREATED") return isAssigned ? "Sent to Accountant" : "Draft";
  if (normalizedStatus === "PROCESSING") return "Sent to Accountant";
  if (isAssigned) return "Sent to Accountant";
  return "Pending";
};

const getLotItemStatusLabel = (status?: string, isAssigned: boolean = false) => {
  const normalizedStatus = String(status || "").toUpperCase();
  if (normalizedStatus === "PAID") return "Paid";
  if (isAssigned) return "Sent to Accountant";
  return "Pending";
};

const getLotBadgeVariant = (status?: string) => {
  if (status === "Paid") return "success" as const;
  if (status === "Closed") return "default" as const;
  if (status === "Partially Paid") return "warning" as const;
  if (status === "Sent to Accountant") return "warning" as const;
  if (status === "In LOT") return "info" as const;
  return "secondary" as const;
};

const getItemBadgeVariant = (status?: string) => {
  if (status === "Paid") return "success" as const;
  if (status === "Sent to Accountant") return "warning" as const;
  if (status === "In LOT") return "info" as const;
  return "secondary" as const;
};

const normalizeLotBatches = (lotBatches: any[] = []) =>
  lotBatches.map((lotBatch) => {
    const normalizedLotBatchId = String(
      lotBatch.lotBatchId || lotBatch._id || lotBatch.disburseLotId || "",
    );
    const isPreviewLot =
      normalizedLotBatchId.startsWith("PREVIEW") ||
      normalizedLotBatchId.startsWith("LOT-");
    const persistedLotId = !isPreviewLot && isPersistedLotId(normalizedLotBatchId)
      ? normalizedLotBatchId
      : "";
    const items = (lotBatch.items || []).map((item: any) => {
      const itemPayrollItemId = String(item.payrollItemId || item._id || "");
      const itemLotBatchId = String(item.lotBatchId || "");
      const itemPersistedLotId = isPersistedLotId(itemLotBatchId)
        ? itemLotBatchId
        : persistedLotId;
      return {
        ...item,
        _id: itemPayrollItemId,
        lotId: itemPersistedLotId,
        persistedLotId: itemPersistedLotId,
        employeeId: itemPayrollItemId,
        payrollItemId: itemPayrollItemId,
        rawStatus: String(item.rawStatus || item.status || ""),
        status: getLotItemStatusLabel(item.status, true),
      };
    });
    const lotCapAmount = Number(lotBatch.lotCapAmount ?? lotBatch.limitAmount ?? 0);
    const usedAmount = Number(lotBatch.usedAmount ?? lotBatch.totalAmount ?? 0);
    const remainingAmount = Math.max(
      0,
      Number(lotBatch.remainingAmount ?? lotCapAmount - usedAmount),
    );
    const paidEmployees = Number(
      lotBatch.paidEmployees ??
        items.filter((item: any) => String(item.status || "").toUpperCase() === "PAID").length,
    );
    const unpaidEmployees = Number(
      lotBatch.unpaidEmployees ?? Math.max(items.length - paidEmployees, 0),
    );
    const disburseLotId = persistedLotId;
    const canDisburse = Boolean(persistedLotId);
    const rawStatus = String(lotBatch.lotBatchStatus || lotBatch.status || "").toUpperCase();
    const isClosed = rawStatus === "CLOSED";

    return {
      ...lotBatch,
      _id: persistedLotId,
      persistedLotId,
      lotBatchId: normalizedLotBatchId,
      disburseLotId,
      lotCapAmount,
      totalAmount: Number(lotBatch.totalAmount || 0),
      usedAmount,
      remainingAmount,
      paidEmployees,
      unpaidEmployees,
      itemCount: Number(lotBatch.itemCount ?? lotBatch.employeeCount ?? items.length),
      canDisburse: canDisburse && !isClosed && unpaidEmployees > 0,
      canAddEmployees: canDisburse && !isClosed && remainingAmount > 0,
      isClosed,
      status: getLotStatusLabel(
        lotBatch.lotBatchStatus || lotBatch.status,
        Boolean(items.length),
      ),
      items,
    };
  });

const buildLotItemRow = (item: any, isAssigned: boolean = false) => ({
  lotId: String(item.persistedLotId || item.lotId || ""),
  persistedLotId: String(item.persistedLotId || item.lotId || ""),
  employeeId: String(item.employeeId || item.payrollItemId || item._id || ""),
  payrollItemId: String(item.payrollItemId || item._id || ""),
  rawStatus: String(item.rawStatus || item.status || ""),
  userId: String(
    item._id || item.userId || item.employeeEmail || item.email || item.employeeName || item.fullName || "-",
  ),
  fullName: item.fullName || item.employeeName || "-",
  email: item.email || item.employeeEmail || "-",
  grossSalary: Number(item.grossSalary || item.baseSalary || 0),
  netSalary: Number(item.netSalary || 0),
  deductedAdvance: Number(item.deductedAdvance || 0),
  takenAdvance: Number(item.totalAdvance || 0),
  incentive: Number(item.incentive || 0),
  currency: item.currency || "INR",
  paymentMode: item.paymentMode || PaymentModeEnum.CASH,
  branchId: item.branchId,
  branchName: item.branchName,
  paidAt: item.paidAt,
  bankAccount:
    item.bankName || item.accountNumber || item.ifsc
      ? {
          bankName: item.bankName || "",
          accountNumber: item.accountNumber || "",
          ifsc: item.ifsc || "",
        }
      : null,
  status: getLotItemStatusLabel(item.status, isAssigned || Boolean(item.lotBatchId)),
});

const mapRawPayrollItem = (item: any) => {
  const employee = typeof item.userId === "object" ? item.userId : item;
  const rawStatus = String(item.status || item.payrollStatus || "");

  return {
    payrollItemId: String(item._id || item.payrollItemId || item.userId || ""),
    rawStatus,
    lotBatchId: item.lotBatchId ? String(item.lotBatchId) : undefined,
    userId: employee._id || item.userId,
    fullName: employee.fullName || "-",
    email: employee.email || "-",
    grossSalary: Number(item.grossSalary || employee.baseSalary || 0),
    netSalary: Number(item.netSalary || employee.baseSalary || 0),
    deductedAdvance: Number(item.deductedAdvance || 0),
    takenAdvance: Number(employee.latestAdvancePayroll?.amount || 0),
    incentive: Number(item.incentive || 0),
    currency: employee.currency || item.currency || "INR",
    paymentMode: employee.paymentMode || item.paymentMode || PaymentModeEnum.CASH,
    branchId:
      typeof employee.branch === "object"
        ? employee.branch?._id
        : item.branchId,
    branchName:
      item.branchName ||
      (typeof employee.branch === "object" ? employee.branch?.branchName || employee.branch?.name : undefined),
    paidAt: item.paidAt,
    bankAccount:
      employee.bankAccount && typeof employee.bankAccount === "object"
        ? employee.bankAccount
        : typeof employee?.bankAccount === "string"
          ? {
              bankName: "",
              accountNumber: employee.bankAccount,
              ifsc: "",
            }
          : null,
    status: getLotItemStatusLabel(rawStatus, Boolean(item.lotBatchId)),
  };
};

const buildProjectedLotPlan = (items: any[], lotCapAmount: number) => {
  const projectedLots: any[] = [];
  const pendingItems: any[] = [];
  const sortedItems = [...items].sort(
    (left, right) => Number(right?.netSalary || 0) - Number(left?.netSalary || 0),
  );

  if (!lotCapAmount || lotCapAmount <= 0) {
    return {
      lots: [],
      pendingItems: sortedItems.map((item) => ({ ...item, status: "Pending" })),
    };
  }

  let currentLotItems: any[] = [];
  let currentLotTotal = 0;
  let lotNumber = 1;

  const flushProjectedLot = () => {
    if (!currentLotItems.length) return;

    projectedLots.push({
      lotBatchId: `PREVIEW-${lotNumber}`,
      disburseLotId: "",
      lotNumber,
      lotCapAmount,
      totalAmount: Number(currentLotTotal.toFixed(2)),
      usedAmount: Number(currentLotTotal.toFixed(2)),
      remainingAmount: Number(Math.max(lotCapAmount - currentLotTotal, 0).toFixed(2)),
      paidEmployees: 0,
      itemCount: currentLotItems.length,
      canDisburse: false,
      status: "In LOT",
      items: currentLotItems.map((item) => ({
        ...item,
        status: "In LOT",
      })),
    });

    lotNumber += 1;
    currentLotItems = [];
    currentLotTotal = 0;
  };

  sortedItems.forEach((item) => {
    const netSalary = Number(item.netSalary || 0);

    if (netSalary <= 0) {
      pendingItems.push({
        ...item,
        status: "Pending",
        pendingReason: "Net pay missing",
      });
      return;
    }

    if (netSalary > lotCapAmount) {
      pendingItems.push({
        ...item,
        status: "Pending",
        pendingReason: "Net pay exceeds LOT cap",
      });
      return;
    }

    if (currentLotItems.length > 0 && currentLotTotal + netSalary > lotCapAmount) {
      flushProjectedLot();
    }

    currentLotItems.push(item);
    currentLotTotal = Number((currentLotTotal + netSalary).toFixed(2));

    if (currentLotTotal >= lotCapAmount) {
      flushProjectedLot();
    }
  });

  flushProjectedLot();

  return { lots: projectedLots, pendingItems };
};

export default function PayrollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermission();
  const id = params?.id as string;
  const isCreate = id === "new";
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lotBatchesData, setLotBatchesData] = useState<any[]>([]);
  const [loadingLotData, setLoadingLotData] = useState(false);
  const [disbursingLotId, setDisbursingLotId] = useState<string | null>(null);
  const [markingPaidKey, setMarkingPaidKey] = useState<string | null>(null);
  const [addingEmployeeLotId, setAddingEmployeeLotId] = useState<string | null>(null);
  const [loadingEmployeesForLotId, setLoadingEmployeesForLotId] = useState<string | null>(null);
  const [employeePickerLotId, setEmployeePickerLotId] = useState<string | null>(null);
  const [selectedAssignmentBranchByLot, setSelectedAssignmentBranchByLot] = useState<Record<string, string>>({});
  const [selectedAssignmentEmployeeByLot, setSelectedAssignmentEmployeeByLot] = useState<Record<string, string>>({});
  const [employeeOptionsByLot, setEmployeeOptionsByLot] = useState<Record<string, any[]>>({});

  // LOT Cap selection state
  const [selectedLotCapId, setSelectedLotCapId] = useState<string>("");
  const [isSavingLot, setIsSavingLot] = useState(false);
  const { activeLotMasters, loading: lotLoading } = useActiveLotMasters();
  const { data: branchesResponse } = useBranches(1, 200, {
    includeAll: true,
    enabled: !isCreate,
  });

  const canReadPayroll = hasPermission(
    ModuleNameEnum.PAYROLL,
    PermissionAction.READ,
  );

  const {
    data: payrollData,
    isLoading,
    error,
    refetch: refetchPayroll,
  } = usePayroll(isCreate ? null : id);
  const detail = payrollData?.payroll;

  // Initialize selectedLotCapId from payroll data
  useEffect(() => {
    if (payrollData?.payroll) {
      const existingLotCapId =
        typeof payrollData.payroll.lotCapId === "object"
          ? (payrollData.payroll.lotCapId as any)?._id
          : payrollData.payroll.lotCapId;
      if (existingLotCapId) {
        setSelectedLotCapId(String(existingLotCapId));
      }
    }
  }, [payrollData]);

  const fetchLotData = useCallback(async () => {
    if (!isCreate && id && payrollData) {
      try {
        setLoadingLotData(true);
        const exportData = await getPayrollExportData(id, "pdf");
        setLotBatchesData(normalizeLotBatches(exportData.lotBatches || []));
      } catch (err) {
        console.error("Failed to load lot-wise data:", err);
        setLotBatchesData([]);
      } finally {
        setLoadingLotData(false);
      }
    }
  }, [id, isCreate, payrollData]);

  // Fetch lot-wise data for display
  useEffect(() => {
    fetchLotData();
  }, [fetchLotData]);

  const handleSaveLotCap = async () => {
    if (!selectedLotCapId) {
      toast.error("Please select a LOT Cap Master");
      return;
    }
    const selectedLot = activeLotMasters.find(
      (lot) => lot._id === selectedLotCapId,
    );
    if (!selectedLot) {
      toast.error("Invalid LOT Cap Master selected");
      return;
    }
    if (Number(selectedLot.lotCapAmount || 0) <= 0) {
      toast.error("LOT Cap Amount must be greater than 0 to generate LOTs");
      return;
    }
    try {
      setIsSavingLot(true);
      await updatePayrollMaster(id, {
        lotCapId: selectedLotCapId,
        lotCapAmount: selectedLot.lotCapAmount,
      });
      const rawResponse = await autoGenerateLots({
        payrollId: id,
        lotCapAmount: selectedLot.lotCapAmount,
      });
      // Backend wraps in {message, data: result}; fall back to top-level for forward-compat
      const generatedLotsResponse = (rawResponse as any).data ?? rawResponse;
      // Immediately reload from the export endpoint so persistedLotId is always populated
      await refetchPayroll();
      await fetchLotData();
      const totalLots = Number(generatedLotsResponse.totalLots ?? 0);
      toast.success(
        `${totalLots} LOT${totalLots === 1 ? "" : "s"} generated successfully`,
      );
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update LOT Cap Master";
      toast.error(message);
    } finally {
      setIsSavingLot(false);
    }
  };

  const handleDisburseLot = async (lotId: string) => {
    if (!isPersistedLotId(lotId)) {
      toast.error("Only generated LOTs can be marked as paid");
      return;
    }

    try {
      setDisbursingLotId(lotId);
      await markLotPaid(lotId, { markAll: true });
      await Promise.all([refetchPayroll(), fetchLotData()]);
      toast.success("LOT marked as paid successfully");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to mark LOT as paid";
      toast.error(message);
    } finally {
      setDisbursingLotId(null);
    }
  };

  const loadAssignableEmployees = useCallback(
    async (lotId: string, branchId: string, remainingAmount: number) => {
      if (!detail || !branchId) {
        return;
      }

      try {
        setLoadingEmployeesForLotId(lotId);
        const response = await getPayrollItemsByBranch(
          detail.payrollMonth,
          detail.payrollYear,
          branchId,
          1,
          200,
        );

        const candidates = (response.data || []).filter((item: any) => {
          const payrollItemId = String(item.payrollItemId || "");
          const salary = Number(item.netSalary || item.baseSalary || 0);
          const payrollStatus = String(item.payrollStatus || "").toUpperCase();

          return (
            Boolean(payrollItemId) &&
            !item.lotBatchId &&
            payrollStatus !== "PAID" &&
            salary > 0 &&
            salary <= remainingAmount
          );
        });

        setEmployeeOptionsByLot((current) => ({
          ...current,
          [lotId]: candidates,
        }));
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load employees for this branch";
        toast.error(message);
        setEmployeeOptionsByLot((current) => ({
          ...current,
          [lotId]: [],
        }));
      } finally {
        setLoadingEmployeesForLotId(null);
      }
    },
    [detail],
  );

  const handleAssignmentBranchChange = async (
    lotId: string,
    branchId: string,
    remainingAmount: number,
  ) => {
    setSelectedAssignmentBranchByLot((current) => ({
      ...current,
      [lotId]: branchId,
    }));
    setSelectedAssignmentEmployeeByLot((current) => ({
      ...current,
      [lotId]: "",
    }));

    if (!branchId) {
      setEmployeeOptionsByLot((current) => ({
        ...current,
        [lotId]: [],
      }));
      return;
    }

    await loadAssignableEmployees(lotId, branchId, remainingAmount);
  };

  const openEmployeePicker = async (lotBatch: any) => {
    const lotId = String(lotBatch.disburseLotId || "");
    if (!lotId || Number(lotBatch.remainingAmount || 0) <= 0) {
      return;
    }

    const defaultBranchId =
      selectedAssignmentBranchByLot[lotId] ||
      currentPayrollBranchId ||
      String(lotBatch.branchId || "");

    setEmployeePickerLotId(lotId);
    setSelectedAssignmentEmployeeByLot((current) => ({
      ...current,
      [lotId]: "",
    }));

    if (defaultBranchId) {
      await handleAssignmentBranchChange(
        lotId,
        defaultBranchId,
        Number(lotBatch.remainingAmount || 0),
      );
    }
  };

  const closeEmployeePicker = () => {
    setEmployeePickerLotId(null);
  };

  const handleMarkEmployeePaid = async (lotId: string, payrollItemId: string) => {
    if (!payrollItemId) {
      toast.error("Employee payroll item was not found");
      return;
    }

    if (!isPersistedLotId(lotId)) {
      toast.error("LOT id is missing — please refresh the page and try again");
      return;
    }

    const actionKey = `${lotId}:${payrollItemId}`;
    try {
      setMarkingPaidKey(actionKey);
      await markLotEmployeePaid(lotId, payrollItemId);
      await Promise.all([refetchPayroll(), fetchLotData()]);
      toast.success("Employee marked as paid successfully");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to mark employee as paid";
      toast.error(message);
    } finally {
      setMarkingPaidKey(null);
    }
  };

  const handleAddEmployeeToLot = async (lotBatch: any) => {
    const lotId = String(lotBatch.disburseLotId || "");
    const employeeId = selectedAssignmentEmployeeByLot[lotId];
    const branchId = selectedAssignmentBranchByLot[lotId];

    if (!lotId || !employeeId) {
      toast.error("Select a branch and employee first");
      return;
    }

    try {
      setAddingEmployeeLotId(lotId);
      await addEmployeeToLot(lotId, {
        employeeId,
        branchId: branchId || undefined,
      });
      await Promise.all([refetchPayroll(), fetchLotData()]);
      setSelectedAssignmentEmployeeByLot((current) => ({
        ...current,
        [lotId]: "",
      }));
      closeEmployeePicker();
      await loadAssignableEmployees(lotId, branchId, Number(lotBatch.remainingAmount || 0));
      toast.success("Employee added to LOT successfully");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add employee to LOT";
      toast.error(message);
    } finally {
      setAddingEmployeeLotId(null);
    }
  };

  // If user doesn't have read permission, show access denied
  if (!canReadPayroll) {
    return (
      <div>
        <PageHeader
          title="Payroll Details"
          options={
            <Button variant="outline" onClick={() => router.push("/payroll")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          }
        />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 mt-4">
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-sm text-red-700 mb-4">
            You do not have permission to view payroll details.
          </p>
          <button
            onClick={() => router.push("/payroll")}
            className="text-sm text-red-700 hover:text-red-900 underline"
          >
            Return to Payroll
          </button>
        </div>
      </div>
    );
  }

  const rawItems = payrollData?.items || [];
  const rawPayrollItems = rawItems.map((item: any) => mapRawPayrollItem(item));
  const branchOptions = branchesResponse?.data || [];
  const currentPayrollBranchId =
    detail?.branchId && typeof detail.branchId === "object"
      ? String(detail.branchId._id || "")
      : detail?.branchId
        ? String(detail.branchId)
        : "";
  const selectedLotCapMaster = activeLotMasters.find(
    (lot) => lot._id === selectedLotCapId,
  );
  const selectedLotCapAmount = Number(
    selectedLotCapMaster?.lotCapAmount ?? detail?.lotCapAmount ?? 0,
  );
  const hasValidLotCap = selectedLotCapAmount > 0;
  const validPersistedLotBatches = lotBatchesData.filter(
    (lotBatch) => Number(lotBatch.lotCapAmount || 0) > 0,
  );
  const validPersistedLotBatchIds = new Set(
    validPersistedLotBatches.map((lotBatch) =>
      String(lotBatch.disburseLotId || lotBatch.lotBatchId || ""),
    ),
  );
  // Only show a preview projection when there are NO persisted LOT batches yet.
  // Once lots exist in the DB, always display those — never replace them with a local projection.
  const shouldPreviewRecalculation =
    selectedLotCapAmount > 0 &&
    rawPayrollItems.length > 0 &&
    !lotBatchesData.length;
  const projectedPlan = shouldPreviewRecalculation
    ? buildProjectedLotPlan(rawPayrollItems, selectedLotCapAmount)
    : null;
  const displayLotBatches = projectedPlan
    ? projectedPlan.lots
    : hasValidLotCap
      ? validPersistedLotBatches
      : [];
  const pendingEmployees = projectedPlan
    ? projectedPlan.pendingItems
    : !hasValidLotCap
      ? rawPayrollItems.filter(
          (item) => String(item.status || "").toUpperCase() !== "PAID",
        )
      : rawPayrollItems.filter((item) => {
          if (String(item.status || "").toUpperCase() === "PAID") {
            return false;
          }

          const lotBatchId = item.lotBatchId ? String(item.lotBatchId) : "";
          return !lotBatchId || !validPersistedLotBatchIds.has(lotBatchId);
        });
  const totalDistributedAmount = Number(
    displayLotBatches.reduce(
      (sum: number, lotBatch: any) => sum + Number(lotBatch.totalAmount || 0),
      0,
    ).toFixed(2),
  );
  const totalRemainingAmount = Number(
    displayLotBatches.reduce(
      (sum: number, lotBatch: any) => sum + Number(lotBatch.remainingAmount || 0),
      0,
    ).toFixed(2),
  );
  const totalPaidEmployees = displayLotBatches.reduce(
    (sum: number, lotBatch: any) => sum + Number(lotBatch.paidEmployees || 0),
    0,
  );
  const totalUnpaidEmployees = displayLotBatches.reduce(
    (sum: number, lotBatch: any) => sum + Number(lotBatch.unpaidEmployees || 0),
    0,
  );
  const hasClosedLots = displayLotBatches.some((lotBatch: any) => Boolean(lotBatch.isClosed));
  const pendingAmount = !hasValidLotCap
    ? Number(Number(detail?.totalNetAmount || 0).toFixed(2))
    : Number(
        pendingEmployees.reduce(
          (sum: number, item: any) => sum + Number(item.netSalary || 0),
          0,
        ).toFixed(2),
      );
  const allocationMessage =
    !hasValidLotCap
      ? "No LOT created yet. Select LOT Cap Master to generate LOT."
      : displayLotBatches.length > 0
      ? `Total ₹${totalDistributedAmount.toLocaleString()} allocated into ${displayLotBatches.length} LOT${displayLotBatches.length === 1 ? "" : "s"}`
      : pendingEmployees.length > 0
        ? `${pendingEmployees.length} employee${pendingEmployees.length === 1 ? "" : "s"} pending LOT allocation`
        : "No LOT allocation available";
  const activeEmployeePickerLot = displayLotBatches.find(
    (lotBatch: any) => String(lotBatch.disburseLotId || "") === employeePickerLotId,
  );
  const activeEmployeePickerBranchId = employeePickerLotId
    ? selectedAssignmentBranchByLot[employeePickerLotId] || ""
    : "";
  const activeEmployeeOptions = employeePickerLotId
    ? employeeOptionsByLot[employeePickerLotId] || []
    : [];

  // Show edit form only when at least one employee is still DRAFT or PENDING; hide edit when all are LOCKED (or PAID)
  const allItemsLockedOrPaid =
    rawItems.length > 0 &&
    rawItems.every((item: any) => {
      const status = (item?.status || item?.payrollStatus || "").toUpperCase();
      return status === "LOCKED" || status === "PAID";
    });
  const hasEditableItems = !allItemsLockedOrPaid;

  const itemColumns: Column[] = [
    {
      id: "employee",
      label: "Employee",
      width: "20%",
      renderCell: (_, row) => (
        <span className="font-medium">
          {row.fullName || "-"}
          <br />
          <span className="text-xs text-muted-foreground">
            {row.email || "-"}
          </span>
        </span>
      ),
    },
    {
      id: "status",
      label: "Status",
      width: "12%",
      renderCell: (value) => (
        <Badge
          variant={getItemBadgeVariant(String(value || "Pending"))}
          className="text-xs"
        >
          {value || "Pending"}
        </Badge>
      ),
    },
    {
      id: "grossSalary",
      label: "Base",
      width: "12%",
      renderCell: (_, row) => {
        const symbol = currencySymbol(row.currency);
        const displayValue = formatAmountDisplay(row.grossSalary, symbol);
        return <span className="text-sm font-medium">{displayValue}</span>;
      },
    },
    {
      id: "advance",
      label: "Advance",
      width: "18%",
      renderCell: (_, row) => {
        const symbol = currencySymbol(row.currency);
        const takenDisplayValue = formatAmountDisplay(row.takenAdvance, symbol);
        const deductedDisplayValue = formatAmountDisplay(
          row.deductedAdvance,
          symbol,
        );
        const shouldShowSingleDash =
          takenDisplayValue === "-" && deductedDisplayValue === "-";
        if (shouldShowSingleDash) {
          return <span className="text-sm font-medium">-</span>;
        }
        return (
          <div className="space-y-1">
            <span className="text-sm font-medium">{takenDisplayValue}</span>
            <div className="text-xs text-muted-foreground">
              {deductedDisplayValue}
            </div>
          </div>
        );
      },
    },
    {
      id: "incentive",
      label: "Incentive",
      width: "12%",
      renderCell: (_, row) => {
        const symbol = currencySymbol(row.currency);
        const displayValue = formatAmountDisplay(row.incentive, symbol);
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
      renderCell: (_, row) => {
        const symbol = currencySymbol(row.currency);
        const displayValue = formatAmountDisplay(row.netSalary, symbol);
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
      renderCell: (value) => <span className="text-sm">{value || "INR"}</span>,
    },
    {
      id: "paymentMode",
      label: "Mode",
      width: "12%",
      renderCell: (value, row) => (
        <Badge className="text-xs">
          {row.paymentMode || PaymentModeEnum.CASH}
        </Badge>
      ),
    },
  ];

  const getLotItemColumns = (lotId: string): Column[] => [
    ...itemColumns,
    {
      id: "actions",
      label: "Action",
      width: "14%",
      renderCell: (_, row) => {
        const rowLotId = String(row.persistedLotId || "");
        const rowPayrollItemId = String(row.payrollItemId || "");
        const actionKey = `${rowLotId}:${rowPayrollItemId}`;
        const normalizedStatus = normalizePayrollStatus(row.status);
        const isPaid = normalizedStatus === "PAID";
        const canMarkPaid =
          isPersistedLotId(rowLotId) &&
          Boolean(rowPayrollItemId) &&
          normalizedStatus === "SENT_TO_ACCOUNTANT";

        if (!canMarkPaid) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }

        return (
          <Button
            size="sm"
            variant="default"
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={() => handleMarkEmployeePaid(rowLotId, rowPayrollItemId)}
            disabled={isPaid || markingPaidKey === actionKey || disbursingLotId === rowLotId}
          >
            {markingPaidKey === actionKey ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : isPaid ? (
              "Paid"
            ) : (
              "Mark as Paid"
            )}
          </Button>
        );
      },
    },
  ];

  const handleSuccess = () => {
    router.push("/payroll");
  };

  const handleExport = async (format: "pdf" | "excel") => {
    if (!id || isCreate || isExporting) return;

    try {
      setIsExporting(true);
      const exportData = await getPayrollExportData(id, format);

      const MONTH_NAMES = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const monthName =
        MONTH_NAMES[exportData.payroll.payrollMonth - 1] ||
        String(exportData.payroll.payrollMonth);

      if (format === "pdf") {
        const doc = new jsPDF({ orientation: "landscape" });
        const title = `Payroll Export - ${monthName}/${exportData.payroll.payrollYear}`;
        doc.setFontSize(14);
        doc.text(title, 14, 15);
        const lotBatches =
          exportData.lotBatches && exportData.lotBatches.length > 0
            ? exportData.lotBatches
            : [
                {
                  lotBatchId: "UNASSIGNED",
                  lotNumber: 1,
                  lotCapAmount: exportData.payroll.lotCapAmount,
                  totalAmount: exportData.items.reduce(
                    (sum, item) => sum + Number(item.grossSalary || 0),
                    0,
                  ),
                  itemCount: exportData.items.length,
                  items: exportData.items,
                },
              ];

        const allPdfItems: any[][] = [];
        let runningPdfIndex = 0;
        lotBatches.forEach((lotBatch) => {
          lotBatch.items.forEach((item) => {
            allPdfItems.push([
              String(++runningPdfIndex),
              `LOT ${lotBatch.lotNumber}`,
              monthName,
              String(exportData.payroll.payrollYear),
              item.branchName || "-",
              item.employeeName || "-",
              item.currency || "-",
              String(item.basicSalary ?? 0),
              String(item.totalWorkingDays ?? 0),
              String(item.grossSalary ?? 0),
              String(item.incentive ?? 0),
              String(item.totalAdvance ?? 0),
              String(item.deductedAdvance ?? 0),
              String(item.netSalary ?? 0),
              "", // Remarks
              item.paymentMode || "-",
              item.bankHolderName || "-",
              item.accountNumber || "-",
              item.bankName || "-",
              item.ifsc || "-",
            ]);
          });
        });

        autoTable(doc, {
          startY: 20,
          styles: { fontSize: 7, cellPadding: 1 },
          head: [
            [
              "S.no",
              "Lot",
              "Month",
              "Year",
              "Branch",
              "Emp name",
              "Currency",
              "Basic salary",
              "Working days",
              "Gross salary",
              "Incentive",
              "Advance (total)",
              "Deduction",
              "Net Salary",
              "Remarks",
              "Payment mode",
              "Bank Holder name",
              "Acc. no",
              "Bank name",
              "IFSC",
            ],
          ],
          body: allPdfItems,
        });

        const pdfName = exportData.fileName.endsWith(".pdf")
          ? exportData.fileName
          : `${exportData.fileName}.pdf`;
        doc.save(pdfName);
      } else {
        // Create a single sheet with all LOT data combined
        const allSheetData: any[] = [];
        const lotHeaderRows: number[] = []; // Track LOT header row indices for styling

        // Add title
        allSheetData.push([
          `Payroll Export - ${monthName}/${exportData.payroll.payrollYear}`,
        ]);
        allSheetData.push([]); // blank row

        const lotBatches =
          exportData.lotBatches && exportData.lotBatches.length > 0
            ? exportData.lotBatches
            : [
                {
                  lotBatchId: "UNASSIGNED",
                  lotNumber: 1,
                  lotCapAmount: exportData.payroll.lotCapAmount,
                  totalAmount: exportData.items.reduce(
                    (sum, item) => sum + Number(item.grossSalary || 0),
                    0,
                  ),
                  itemCount: exportData.items.length,
                  items: exportData.items,
                },
              ];

        // Column Headers
        lotHeaderRows.push(allSheetData.length); // Style the header row
        allSheetData.push([
          "S.no",
          "Lot",
          "Month",
          "Year",
          "Branch",
          "Emp name",
          "Currency",
          "Basic salary",
          "Working days",
          "Gross salary",
          "Incentive",
          "Advance (total)",
          "Deduction",
          "Net Salary",
          "Remarks",
          "Payment mode",
          "Bank Holder name",
          "Acc. no",
          "Bank name",
          "IFSC",
        ]);

        let runningExcelIndex = 0;
        lotBatches.forEach((lotBatch) => {
          // Add employee rows for this LOT
          lotBatch.items.forEach((item) => {
            allSheetData.push([
              ++runningExcelIndex,
              `LOT ${lotBatch.lotNumber}`,
              monthName,
              exportData.payroll.payrollYear,
              item.branchName || "-",
              item.employeeName || "-",
              item.currency || "-",
              item.basicSalary ?? 0,
              item.totalWorkingDays ?? 0,
              item.grossSalary ?? 0,
              item.incentive ?? 0,
              item.totalAdvance ?? 0,
              item.deductedAdvance ?? 0,
              item.netSalary ?? 0,
              "", // Remarks
              item.paymentMode || "-",
              item.bankHolderName || "-",
              item.accountNumber || "-",
              item.bankName || "-",
              item.ifsc || "-",
            ]);
          });
        });

        const sheet = XLSX.utils.aoa_to_sheet(allSheetData);

        // Apply blue styling to LOT header rows
        const blueHeaderStyle = {
          font: { bold: true, color: { rgb: "0070C0" }, sz: 12 }, // Bold blue text
          alignment: { horizontal: "left", vertical: "center" },
        };

        lotHeaderRows.forEach((rowIndex) => {
          for (let col = 0; col < 20; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: col });
            if (!sheet[cellRef]) sheet[cellRef] = {};
            sheet[cellRef].s = blueHeaderStyle;
          }
        });

        // Set column widths
        sheet["!cols"] = [
          { wch: 6 }, // S.no
          { wch: 8 }, // Lot
          { wch: 8 }, // Month
          { wch: 8 }, // Year
          { wch: 15 }, // Branch
          { wch: 20 }, // Emp name
          { wch: 10 }, // Currency
          { wch: 12 }, // Basic salary
          { wch: 12 }, // Working days
          { wch: 12 }, // Gross salary
          { wch: 12 }, // Incentive
          { wch: 14 }, // Advance (total)
          { wch: 16 }, // Deduction
          { wch: 12 }, // Net Salary
          { wch: 15 }, // Remarks
          { wch: 14 }, // Payment mode
          { wch: 20 }, // Bank Holder name
          { wch: 18 }, // Acc. no
          { wch: 18 }, // Bank name
          { wch: 12 }, // IFSC
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, sheet, "Payroll");

        const exportName = exportData.fileName.endsWith(".csv")
          ? exportData.fileName
          : `${exportData.fileName}.csv`;
        XLSX.writeFile(workbook, exportName);
      }
    } catch (exportError) {
      console.error("Failed to export payroll:", exportError);
      window.alert("Failed to export payroll. Please try again.");
    } finally {
      setIsExporting(false);
      setIsExportMenuOpen(false);
    }
  };

  const handleExportLotPdf = (lotBatch: any) => {
    if (!detail) return;

    const doc = new jsPDF({ orientation: "landscape" });
    const lotTitle = `LOT ${lotBatch.lotNumber} - ${detail.payrollMonth}/${detail.payrollYear}`;
    doc.setFontSize(14);
    doc.text(lotTitle, 14, 15);
    doc.setFontSize(10);
    doc.text(`Total Amount: ₹${Number(lotBatch.totalAmount || 0).toLocaleString()}`, 14, 24);
    doc.text(`Employees: ${Number(lotBatch.itemCount || lotBatch.items?.length || 0)}`, 90, 24);
    doc.text(`Status: ${lotBatch.status || "In LOT"}`, 150, 24);

    autoTable(doc, {
      startY: 30,
      head: [["Employee", "Email", "Net Pay", "Advance", "Payment Mode", "Status"]],
      body: (lotBatch.items || []).map((item: any) => [
        item.fullName || item.employeeName || "-",
        item.email || item.employeeEmail || "-",
        `${currencySymbol(item.currency || "INR")}${roundAmount(item.netSalary)}`,
        `${currencySymbol(item.currency || "INR")}${roundAmount(item.deductedAdvance)}`,
        item.paymentMode || PaymentModeEnum.CASH,
        item.status || "In LOT",
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
    });

    const fileName = `lot-${lotBatch.lotNumber}-${detail.payrollMonth}-${detail.payrollYear}.pdf`;
    doc.save(fileName);
  };

  // Get current lot info for display
  const currentLotCapId =
    detail &&
    (typeof detail.lotCapId === "object"
      ? (detail.lotCapId as any)?._id
      : detail.lotCapId);
  const hasLotAssigned = !!currentLotCapId && Number(detail?.lotCapAmount || 0) > 0;

  // If any employee is still DRAFT or PENDING, show edit form; when all are LOCKED/PAID, show read-only detail view
  if (!isCreate && detail && hasEditableItems) {
    return <BulkPayrollForm payrollId={id} />;
  }

  return (
    <div className="space-y-4">
      <AlertDialog open={Boolean(employeePickerLotId)} onOpenChange={(open) => !open && closeEmployeePicker()}>
        <AlertDialogContent className="sm:max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Add Employee to LOT</AlertDialogTitle>
            <AlertDialogDescription>
              {activeEmployeePickerLot
                ? `Fill the remaining balance in LOT ${activeEmployeePickerLot.lotNumber}. Select a branch, then choose a pending employee whose net pay fits the remaining amount.`
                : "Select a branch and employee to add into this LOT."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {activeEmployeePickerLot && (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-md border bg-muted/30 p-3 text-sm md:grid-cols-4">
                <div>
                  <div className="text-muted-foreground">Cap Amount</div>
                  <div className="font-semibold">₹{Number(activeEmployeePickerLot.lotCapAmount || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Used Amount</div>
                  <div className="font-semibold">₹{Number(activeEmployeePickerLot.usedAmount || activeEmployeePickerLot.totalAmount || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Remaining Amount</div>
                  <div className="font-semibold">₹{Number(activeEmployeePickerLot.remainingAmount || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Employees</div>
                  <div className="font-semibold">{Number(activeEmployeePickerLot.itemCount || 0)}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Select Branch
                  </label>
                  <select
                    value={activeEmployeePickerBranchId}
                    onChange={(e) =>
                      handleAssignmentBranchChange(
                        String(activeEmployeePickerLot.disburseLotId || ""),
                        e.target.value,
                        Number(activeEmployeePickerLot.remainingAmount || 0),
                      )
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select branch...</option>
                    {branchOptions.map((branch: any) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.branchName}
                        {String(branch._id) === currentPayrollBranchId ? " (Current Payroll Branch)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Select Employee
                  </label>
                  <select
                    value={selectedAssignmentEmployeeByLot[employeePickerLotId || ""] || ""}
                    onChange={(e) =>
                      setSelectedAssignmentEmployeeByLot((current) => ({
                        ...current,
                        [employeePickerLotId || ""]: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    disabled={
                      !activeEmployeePickerBranchId ||
                      loadingEmployeesForLotId === employeePickerLotId
                    }
                  >
                    <option value="">
                      {loadingEmployeesForLotId === employeePickerLotId
                        ? "Loading employees..."
                        : "Select employee..."}
                    </option>
                    {activeEmployeeOptions.map((item: any) => (
                      <option key={item.payrollItemId} value={item.payrollItemId}>
                        {item.userDetails?.fullName || "Employee"} - {item.currency || "INR"} {Number(item.netSalary || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-md border">
                {activeEmployeePickerBranchId && loadingEmployeesForLotId === employeePickerLotId ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading pending employees...
                  </div>
                ) : activeEmployeePickerBranchId && activeEmployeeOptions.length > 0 ? (
                  <div className="divide-y">
                    {activeEmployeeOptions.map((item: any) => {
                      const isSelected = selectedAssignmentEmployeeByLot[employeePickerLotId || ""] === item.payrollItemId;
                      return (
                        <button
                          key={item.payrollItemId}
                          type="button"
                          className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted/50 ${isSelected ? "bg-muted" : ""}`}
                          onClick={() =>
                            setSelectedAssignmentEmployeeByLot((current) => ({
                              ...current,
                              [employeePickerLotId || ""]: item.payrollItemId,
                            }))
                          }
                        >
                          <div>
                            <div className="font-medium">{item.userDetails?.fullName || "Employee"}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.userDetails?.email || "-"} | {item.userDetails?.branch?.branchName || item.userDetails?.branch?.name || "-"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {item.currency || "INR"} {Number(item.netSalary || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Pending</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : activeEmployeePickerBranchId ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No pending employees available in this branch for the remaining LOT balance. Select another branch.
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Select a branch to view pending employees.
                  </div>
                )}
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={() => activeEmployeePickerLot && handleAddEmployeeToLot(activeEmployeePickerLot)}
              disabled={
                !activeEmployeePickerLot ||
                addingEmployeeLotId === employeePickerLotId ||
                !selectedAssignmentEmployeeByLot[employeePickerLotId || ""]
              }
            >
              {addingEmployeeLotId === employeePickerLotId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Employee"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PageHeader
        title={"Payroll Details"}
        options={
          <div className="flex items-center gap-2">
            {!isCreate && canReadPayroll && (
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setIsExportMenuOpen((prev) => !prev)}
                  disabled={isExporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>

                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 min-w-44 rounded-md border bg-background shadow-md z-20">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => handleExport("pdf")}
                    >
                      Export in PDF
                    </button>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => handleExport("excel")}
                    >
                      Export in Excel
                    </button>
                  </div>
                )}
              </div>
            )}

            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        }
      />
      <p className="text-sm text-muted-foreground">
        {isCreate ? "Create a new payroll entry" : "Update payroll details."}
      </p>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          <p>Failed to load payroll: {error.message}</p>
        </div>
      )}

      {isCreate && <PayrollForm onSuccess={handleSuccess} />}

      {!isCreate && detail && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SummaryItem
                label="Period"
                value={`${detail.payrollMonth}/${detail.payrollYear}`}
              />
              <SummaryItem
                label="LOT"
                value={
                  hasLotAssigned && typeof detail.lotCapId === "object"
                    ? detail.lotCapId?.name
                    : hasLotAssigned
                      ? detail.lotCapId || "-"
                      : "-"
                }
              />
              <SummaryItem
                label="LOT Cap Amount"
                value={detail.lotCapAmount?.toLocaleString() || "-"}
              />
              <SummaryItem
                label="Total Gross"
                value={detail.totalGrossAmount?.toLocaleString()}
              />
              <SummaryItem
                label="Total Net"
                value={detail.totalNetAmount?.toLocaleString()}
              />
              <SummaryItem label="Employees" value={detail.totalEmployee} />
              <SummaryItem
                label="Created"
                value={
                  detail.createdAt
                    ? format(new Date(detail.createdAt), "dd/MM/yy HH:mm")
                    : "-"
                }
              />
              <SummaryItem label="Allocated" value={allocationMessage} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>LOT Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SummaryItem label="Total Employees" value={rawPayrollItems.length} />
              <SummaryItem label="Total LOTs" value={displayLotBatches.length} />
              <SummaryItem
                label="Distributed Amount"
                value={`₹${totalDistributedAmount.toLocaleString()}`}
              />
              <SummaryItem
                label="Remaining Balance"
                value={`₹${totalRemainingAmount.toLocaleString()}`}
              />
              <SummaryItem label="Paid Employees" value={totalPaidEmployees} />
              <SummaryItem label="Unpaid Employees" value={totalUnpaidEmployees} />
              <SummaryItem
                label="Pending Amount"
                value={`₹${pendingAmount.toLocaleString()}`}
              />
            </CardContent>
          </Card>

          {/* LOT Cap Master Assignment */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <CardTitle>
                  {hasLotAssigned
                    ? "Update LOT Cap Master"
                    : "Assign LOT Cap Master"}
                </CardTitle>
              </div>
              {!hasLotAssigned && (
                <p className="text-sm text-amber-600 mt-1">
                  No LOT Cap Master assigned yet. Select LOT Cap Master to enable automatic LOT distribution.
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block text-foreground">
                    LOT Cap Master
                  </label>
                  <select
                    value={selectedLotCapId}
                    onChange={(e) => setSelectedLotCapId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    disabled={lotLoading}
                  >
                    <option value="">Select LOT Cap Master...</option>
                    {activeLotMasters.map((lot) => (
                      <option key={lot._id} value={lot._id}>
                        {lot.name} — ₹{lot.lotCapAmount.toLocaleString()} cap
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  {selectedLotCapId && (
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        const lot = selectedLotCapMaster;
                        const totalNet = detail.totalNetAmount || 0;
                        if (!lot) return "";
                        if (lot.lotCapAmount <= 0) {
                          return "Select a LOT Cap Master with cap amount greater than 0 to generate LOTs.";
                        }
                        const requiredLots =
                          lot.lotCapAmount > 0
                            ? Math.max(
                                1,
                                Math.ceil(totalNet / lot.lotCapAmount),
                              )
                            : 1;
                        return totalNet > lot.lotCapAmount
                          ? `Total ₹${totalNet.toLocaleString()} net pay will be split into ${requiredLots} LOTs`
                          : `Fits in 1 LOT (cap ₹${lot.lotCapAmount.toLocaleString()})`;
                      })()}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{allocationMessage}</p>
                  <Button
                    onClick={handleSaveLotCap}
                    disabled={
                      hasClosedLots ||
                      isSavingLot ||
                      !selectedLotCapId ||
                      !selectedLotCapMaster ||
                      Number(selectedLotCapMaster.lotCapAmount || 0) <= 0
                    }
                    size="sm"
                  >
                    {isSavingLot ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {hasLotAssigned ? "Update LOT" : "Assign LOT"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employees by LOT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingLotData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">
                    Loading lot data...
                  </span>
                </div>
              ) : displayLotBatches && displayLotBatches.length > 0 ? (
                displayLotBatches.map((lotBatch, index) => (
                  <div
                    key={index}
                    className="border-t pt-6 first:border-t-0 first:pt-0"
                  >
                    {(() => {
                      const persistedLotId = String(
                        lotBatch.disburseLotId || lotBatch.lotBatchId || "",
                      );
                      const canMarkWholeLotPaid =
                        isPersistedLotId(persistedLotId) &&
                        lotBatch.status !== "Paid" &&
                        lotBatch.status !== "Closed" &&
                        Number(lotBatch.unpaidEmployees || 0) > 0;

                      return (
                    <div className="mb-4 rounded bg-gray-50 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-2">
                          <h3 className="font-semibold text-sm">
                            LOT {lotBatch.lotNumber} | Total:{" "}
                            {lotBatch.totalAmount?.toLocaleString()} | Cap:{" "}
                            {lotBatch.lotCapAmount?.toLocaleString()} | Used:{" "}
                            {Number(lotBatch.usedAmount || lotBatch.totalAmount || 0).toLocaleString()} | Remaining:{" "}
                            {Number(lotBatch.remainingAmount || 0).toLocaleString()} | Employees:{" "}
                            {lotBatch.itemCount} | Paid: {Number(lotBatch.paidEmployees || 0)} of {Number(lotBatch.itemCount || 0)} | Unpaid: {Number(lotBatch.unpaidEmployees || 0)}
                          </h3>
                          <div>
                            <Badge
                              variant={getLotBadgeVariant(lotBatch.status)}
                              className="text-xs"
                            >
                              {lotBatch.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportLotPdf(lotBatch)}
                          >
                            Export LOT PDF
                          </Button>
                          {canMarkWholeLotPaid && (
                            <Button
                              size="sm"
                              onClick={() => handleDisburseLot(persistedLotId)}
                              disabled={
                                disbursingLotId === persistedLotId ||
                                lotBatch.status === "Paid" ||
                                lotBatch.status === "Closed" ||
                                Number(lotBatch.unpaidEmployees || 0) <= 0
                              }
                            >
                              {disbursingLotId === persistedLotId ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Marking Paid...
                                </>
                              ) : (
                                "Mark LOT as Paid"
                              )}
                            </Button>
                          )}
                          {lotBatch.canAddEmployees && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEmployeePicker(lotBatch)}
                              disabled={Boolean(lotBatch.isClosed) || Number(lotBatch.remainingAmount || 0) <= 0}
                            >
                              Add Employee
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                      );
                    })()}
                    <DataTable
                      columns={getLotItemColumns(String(lotBatch.persistedLotId || ""))}
                      rows={lotBatch.items.map((item: any) => {
                        const rawPersistedLotId = String(
                          item.persistedLotId ||
                          item.lotBatchId ||
                          lotBatch.persistedLotId ||
                          lotBatch.lotBatchId ||
                          "",
                        );
                        const persistedLotId = isPersistedLotId(rawPersistedLotId)
                          ? rawPersistedLotId
                          : "";
                        const payrollItemId = String(
                          item.payrollItemId || item._id || "",
                        );
                        return ({
                          ...buildLotItemRow(item, true),
                          persistedLotId,
                          lotId: persistedLotId,
                          employeeId: payrollItemId,
                          payrollItemId,
                          lotBatchId: String(lotBatch.disburseLotId || lotBatch.lotBatchId || ""),
                        });
                      })}
                    />
                  </div>
                ))
              ) : !hasValidLotCap ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No LOT created yet.</p>
                  <p className="text-sm">
                    No LOT created yet. Select LOT Cap Master to generate LOT.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No LOT created yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Employees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingEmployees.length > 0 ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    {pendingEmployees.length} employee{pendingEmployees.length === 1 ? "" : "s"} remaining | Status = Pending
                  </div>
                  <DataTable
                    columns={itemColumns}
                    rows={pendingEmployees.map((item: any) => ({
                      ...item,
                      status: "Pending",
                    }))}
                  />
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pending employees remaining
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value ?? "-"}</p>
    </div>
  );
}
