"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, CalendarDays, Download, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAllPayrolls } from "@/service/payroll.service";
import { useAppStore } from "@/stores";
import { CurrencyEnum, PaymentModeEnum } from "@/types/user.type";

type PayrollMasterRecord = {
  _id: string;
  payrollMonth: number;
  payrollYear: number;
  paymentMode?: string | null;
  totalNetAmount?: number;
  totalEmployee?: number;
  payrollStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};

type EmployeePayrollRow = {
  id: string;
  monthKey: string;
  monthLabel: string;
  netSalary: number;
  paymentMode: string;
  currency: CurrencyEnum | string;
  payrollStatus?: string;
};

const getMonthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

const formatCurrency = (amount: number, currency?: CurrencyEnum | string) => {
  const resolvedCurrency = currency || CurrencyEnum.AED;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: resolvedCurrency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const toEmployeePayrollRows = (records: PayrollMasterRecord[], fallbackCurrency: CurrencyEnum | string): EmployeePayrollRow[] => {
  return records
    .filter((record) => record.payrollMonth && record.payrollYear)
    .map((record) => ({
      id: record._id,
      monthKey: getMonthKey(record.payrollYear, record.payrollMonth),
      monthLabel: new Date(record.payrollYear, Math.max(0, record.payrollMonth - 1), 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      netSalary: Number(record.totalNetAmount || 0),
      paymentMode: record.paymentMode || PaymentModeEnum.ACCOUNT,
      currency: fallbackCurrency || CurrencyEnum.AED,
      payrollStatus: record.payrollStatus,
    }))
    .sort((left, right) => right.monthKey.localeCompare(left.monthKey));
};

export default function EmployeePayrollPage() {
  const { user } = useAppStore();
  const branchId = String((user as any)?.branch?._id || (user as any)?.branch?.id || (user as any)?.branchId || "").trim();
  const employeeId = user?.id || user?._id || "";
  const employeeCode = (user as any)?.displayEmployeeId || user?.employeeId || user?.uniqueWorkerId || `EMP-${employeeId.slice(-6).toUpperCase()}`;

  const [payrollRows, setPayrollRows] = useState<EmployeePayrollRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPayroll = async () => {
      if (!user) {
        if (isMounted) {
          setPayrollRows([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await getAllPayrolls(1, 12, {
          branchId: branchId || undefined,
        });

        if (!isMounted) {
          return;
        }

        setPayrollRows(toEmployeePayrollRows((response.data || []) as unknown as PayrollMasterRecord[], user.currency || CurrencyEnum.AED));
      } catch {
        if (!isMounted) {
          return;
        }

        setError("Failed to load payroll details.");
        setPayrollRows([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPayroll();

    return () => {
      isMounted = false;
    };
  }, [branchId, user]);

  const latestPayroll = payrollRows[0];

  const handleDownloadSlip = (row: EmployeePayrollRow) => {
    const content = [
      "Employee Salary Slip",
      `Employee: ${user?.fullName || "Employee"}`,
      `Employee Code: ${employeeCode}`,
      `Month: ${row.monthLabel}`,
      `Net Salary: ${formatCurrency(row.netSalary, row.currency)}`,
      `Payment Mode: ${row.paymentMode}`,
      `Status: ${row.payrollStatus || "PENDING"}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${employeeCode}-${row.monthKey}-salary-slip.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalPayrolls = useMemo(() => payrollRows.length, [payrollRows]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="space-y-6 p-4 sm:p-6">
        <section className="rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-600">Payroll</p>
              <h1 className="text-3xl font-bold text-slate-900">All Payroll Details</h1>
              <p className="max-w-2xl text-sm text-slate-600">This page shows employee payroll records separately from profile, payment, and bank pages.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Payroll Records</p>
                <p className="mt-1 font-semibold text-slate-900">{totalPayrolls}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Latest Salary</p>
                <p className="mt-1 font-semibold text-slate-900">{formatCurrency(latestPayroll?.netSalary || Number(user?.baseSalary || 0), latestPayroll?.currency || user?.currency)}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Latest Status</p>
                <p className="mt-1 font-semibold text-slate-900">{latestPayroll?.payrollStatus || "Not available"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <ReceiptText className="h-5 w-5 text-sky-600" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Payroll History</h2>
              <p className="text-sm text-slate-500">Month-wise salary, payment mode, status, and slip access.</p>
            </div>
          </div>

          {error ? <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div> : null}

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <BadgeDollarSign className="h-4 w-4 text-emerald-500" />
                <span className="text-xs uppercase tracking-wide">Latest Payroll</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{formatCurrency(latestPayroll?.netSalary || 0, latestPayroll?.currency || user?.currency)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <CalendarDays className="h-4 w-4 text-sky-500" />
                <span className="text-xs uppercase tracking-wide">Latest Month</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{latestPayroll?.monthLabel || "Not available"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Download className="h-4 w-4 text-violet-500" />
                <span className="text-xs uppercase tracking-wide">Latest Salary Slip</span>
              </div>
              <Button type="button" variant="outline" className="mt-3 w-full justify-center" onClick={() => latestPayroll && handleDownloadSlip(latestPayroll)} disabled={!latestPayroll}>
                Download Latest Slip
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Month</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Net Salary</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Payment Mode</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Salary Slip</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading payroll details...</td>
                  </tr>
                ) : payrollRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No payroll records available.</td>
                  </tr>
                ) : (
                  payrollRows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.monthLabel}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(row.netSalary, row.currency)}</td>
                      <td className="px-4 py-3 text-slate-600">{row.paymentMode}</td>
                      <td className="px-4 py-3 text-slate-600">{row.payrollStatus || "PENDING"}</td>
                      <td className="px-4 py-3">
                        <Button type="button" variant="ghost" className="h-auto px-0 text-sky-600 hover:text-sky-700" onClick={() => handleDownloadSlip(row)}>
                          View salary slip
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}