"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SidebarLogoutButton from "@/components/layout/SidebarLogoutButton";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/stores";
import { CurrencyEnum, IBankAccount, PaymentModeEnum, User } from "@/types/user.type";
import { getPayrollsByUserId } from "@/service/payroll.service";
import {
  getUserPaymentModeHistory,
  getUserBankAccountHistory,
  changeUserPaymentMode,
} from "@/service/user-payment.service";
import {
  BadgeDollarSign,
  CalendarDays,
  CreditCard,
  Download,
  Landmark,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type EmployeePayrollRow = {
  id: string;
  monthKey: string;
  monthLabel: string;
  netSalary: number;
  incentive: number;
  paymentMode: PaymentModeEnum | string;
  currency: CurrencyEnum | string;
  paidAt?: string;
};

type MonthlyBankOverride = {
  monthKey: string;
  paymentMode: PaymentModeEnum | string;
  bankAccount?: IBankAccount;
  keepExistingBank: boolean;
  updatedAt: string;
};



const sectionLinks = [
  { id: "employee-information", label: "Employee Info", icon: <UserRound className="h-5 w-5" /> },
  { id: "payroll-information", label: "Payroll", icon: <ReceiptText className="h-5 w-5" /> },
  { id: "payment-details", label: "Payment", icon: <Landmark className="h-5 w-5" /> },
  { id: "bank-update", label: "Monthly Update", icon: <CreditCard className="h-5 w-5" /> },
];

const getDesignation = (user?: User | null) => {
  const effectiveRoleName = (user as any)?.effectiveRoleName || (user as any)?.designationRoleName;
  if (typeof effectiveRoleName === "string" && effectiveRoleName.trim()) {
    return effectiveRoleName;
  }

  const designation = user?.permissions?.designation;

  if (typeof designation === "string") {
    return designation;
  }

  if (designation && typeof designation === "object") {
    const normalizedDesignation = designation as { roleName?: string; name?: string; id?: string };
    return normalizedDesignation.roleName || normalizedDesignation.name || normalizedDesignation.id || "Employee";
  }

  if (user?.role && typeof user.role === "object") {
    return user.role.roleName || "Employee";
  }

  if (typeof user?.roleId === "object" && user.roleId) {
    const roleReference = user.roleId as { roleName?: string; name?: string };
    return roleReference.roleName || roleReference.name || "Employee";
  }

  return "Employee";
};

const getMonthKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

const formatCurrency = (amount: number, currency?: CurrencyEnum | string) => {
  const resolvedCurrency = currency || CurrencyEnum.AED;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: resolvedCurrency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const createDemoPayrollHistory = (user?: User | null): EmployeePayrollRow[] => {
  const now = new Date();
  const baseSalary = Number(user?.baseSalary || 3200);
  const paymentMode = user?.paymentMode || PaymentModeEnum.ACCOUNT;
  const currency = user?.currency || CurrencyEnum.AED;

  return Array.from({ length: 4 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const incentive = index === 0 ? 250 : index === 1 ? 180 : 0;
    const monthKey = getMonthKey(date);

    return {
      id: `demo-payroll-${monthKey}`,
      monthKey,
      monthLabel: getMonthLabel(date),
      netSalary: baseSalary + incentive,
      incentive,
      paymentMode,
      currency,
      paidAt: new Date(date.getFullYear(), date.getMonth(), 28).toISOString(),
    };
  });
};

export function EmployeePortalSidebar() {
  const { isOpen } = useSidebar();

  return (
    <aside className={cn("flex h-full flex-col bg-white shadow-md transition-all duration-300", isOpen ? "w-64" : "w-16")}>
      <div className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-2">
          {sectionLinks.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="flex items-center rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-accent dark:text-slate-300 dark:hover:bg-slate-900"
                title={section.label}
              >
                <span className="flex-none">{section.icon}</span>
                {isOpen ? <span className="ml-3">{section.label}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-slate-100 p-4 dark:border-slate-800">
        <SidebarLogoutButton />
      </div>
    </aside>
  );
}

export default function EmployeePortalPage() {
  const { user } = useAppStore();
  const [payrollRows, setPayrollRows] = useState<EmployeePayrollRow[]>([]);
  const [isLoadingPayroll, setIsLoadingPayroll] = useState(true);
  const [payrollError, setPayrollError] = useState<string | null>(null);
  const [monthlyOverrides, setMonthlyOverrides] = useState<Record<string, MonthlyBankOverride>>({});
  const [isLoadingOverrides, setIsLoadingOverrides] = useState(true);
  const [paymentMode, setPaymentMode] = useState<PaymentModeEnum | string>(user?.paymentMode || PaymentModeEnum.ACCOUNT);
  const [keepExistingBank, setKeepExistingBank] = useState(true);
  const [bankForm, setBankForm] = useState<IBankAccount>({
    bankName: user?.bankAccount?.bankName || "",
    bankHolderName: user?.bankAccount?.bankHolderName || user?.fullName || "",
    accountNumber: user?.bankAccount?.accountNumber || "",
    ifsc: user?.bankAccount?.ifsc || "",
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const employeeId = user?.id || user?._id || "employee-demo";
  const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);
  const currentMonthLabel = useMemo(() => getMonthLabel(new Date()), []);

  const designation = getDesignation(user);
  const employeeCode = (user as any)?.displayEmployeeId || user?.employeeId || user?.uniqueWorkerId || `EMP-${employeeId.slice(-6).toUpperCase()}`;
  const branchReference = user?.branch as { branchName?: string; name?: string } | null | undefined;
  const branchName = branchReference?.branchName || branchReference?.name || "Main Branch";
  const baseBankAccount = user?.bankAccount;
  const currentOverride = monthlyOverrides[currentMonthKey];
  const effectivePaymentMode = currentOverride?.paymentMode || paymentMode || user?.paymentMode || PaymentModeEnum.ACCOUNT;
  const effectiveBankAccount = currentOverride?.bankAccount || baseBankAccount;
  const latestPayroll = payrollRows[0];


  // Fetch monthly overrides/history from backend
  useEffect(() => {
    let isMounted = true;
    async function fetchOverrides() {
      if (!user) return;
      setIsLoadingOverrides(true);
      try {
        // Fetch both payment mode and bank account history
        const [modeHistory, bankHistory] = await Promise.all([
          getUserPaymentModeHistory(user.id || user._id),
          getUserBankAccountHistory(user.id || user._id),
        ]);
        // Map by monthKey (YYYY-MM)
        const overrides: Record<string, MonthlyBankOverride> = {};
        (Array.isArray(modeHistory) ? modeHistory : []).forEach((mode: any) => {
          const monthKey = mode.effectiveFrom ? getMonthKey(new Date(mode.effectiveFrom)) : undefined;
          if (!monthKey) return;
          overrides[monthKey] = {
            monthKey,
            paymentMode: mode.mode,
            keepExistingBank: true, // will refine below
            updatedAt: mode.effectiveFrom || mode.updatedAt || new Date().toISOString(),
          };
        });
        (Array.isArray(bankHistory) ? bankHistory : []).forEach((bank: any) => {
          const monthKey = bank.effectiveFrom ? getMonthKey(new Date(bank.effectiveFrom)) : undefined;
          if (!monthKey) return;
          if (!overrides[monthKey]) {
            overrides[monthKey] = {
              monthKey,
              paymentMode: PaymentModeEnum.ACCOUNT,
              keepExistingBank: true,
              updatedAt: bank.effectiveFrom || bank.updatedAt || new Date().toISOString(),
            };
          }
          overrides[monthKey].bankAccount = {
            bankName: bank.bankName,
            bankHolderName: bank.bankHolderName,
            accountNumber: bank.accountNumber,
            ifsc: bank.ifsc,
          };
          // If this bank account is not linked to the current payment mode seq, mark as not keeping existing
          if (typeof bank.linkedPaymentModeSeqNo === 'number' && overrides[monthKey].paymentMode === PaymentModeEnum.ACCOUNT) {
            overrides[monthKey].keepExistingBank = false;
          }
        });
        if (isMounted) {
          setMonthlyOverrides(overrides);
          // Set form state for current month if exists
          const existingOverride = overrides[currentMonthKey];
          if (existingOverride) {
            setPaymentMode(existingOverride.paymentMode);
            setKeepExistingBank(existingOverride.keepExistingBank);
            setBankForm(existingOverride.bankAccount || {
              bankName: user?.bankAccount?.bankName || "",
              bankHolderName: user?.bankAccount?.bankHolderName || user?.fullName || "",
              accountNumber: user?.bankAccount?.accountNumber || "",
              ifsc: user?.bankAccount?.ifsc || "",
            });
          }
        }
      } catch {
        if (isMounted) setMonthlyOverrides({});
      } finally {
        if (isMounted) setIsLoadingOverrides(false);
      }
    }
    fetchOverrides();
    return () => { isMounted = false; };
  }, [user, currentMonthKey]);

  useEffect(() => {
    let isMounted = true;

    const loadPayroll = async () => {
      if (!user) {
        setPayrollRows([]);
        setIsLoadingPayroll(false);
        return;
      }

      setIsLoadingPayroll(true);
      setPayrollError(null);

      try {
        const data = await getPayrollsByUserId(user.id || user._id, 1, 6);

        if (!isMounted) {
          return;
        }

        if (Array.isArray(data) && data.length > 0) {
          const mapped = data
            .map((payroll) => ({
              id: payroll._id,
              monthKey: `${payroll.periodYear}-${String(payroll.periodMonth).padStart(2, "0")}`,
              monthLabel: new Date(payroll.periodYear, Math.max(0, payroll.periodMonth - 1), 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              }),
              netSalary: Number(payroll.amount || 0),
              incentive: 0,
              paymentMode: payroll.paymentMode || user.paymentMode || PaymentModeEnum.ACCOUNT,
              currency: payroll.currency || user.currency || CurrencyEnum.AED,
              paidAt: payroll.paidAt,
            }))
            .sort((left, right) => right.monthKey.localeCompare(left.monthKey));

          setPayrollRows(mapped);
        } else {
          setPayrollRows(createDemoPayrollHistory(user));
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setPayrollError("Showing demo payroll data until employee payroll records are available.");
        setPayrollRows(createDemoPayrollHistory(user));
      } finally {
        if (isMounted) {
          setIsLoadingPayroll(false);
        }
      }
    };

    loadPayroll();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const displayedPayrollRows = useMemo(() => {
    return payrollRows.map((row) => {
      if (row.monthKey !== currentMonthKey) {
        return row;
      }

      return {
        ...row,
        paymentMode: effectivePaymentMode,
      };
    });
  }, [currentMonthKey, effectivePaymentMode, payrollRows]);

  const handleDownloadSlip = (row: EmployeePayrollRow) => {
    const content = [
      "Employee Salary Slip",
      `Employee: ${user?.fullName || "Employee"}`,
      `Employee Code: ${employeeCode}`,
      `Month: ${row.monthLabel}`,
      `Net Salary: ${formatCurrency(row.netSalary, row.currency)}`,
      `Incentive: ${formatCurrency(row.incentive, row.currency)}`,
      `Payment Mode: ${row.paymentMode}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${employeeCode}-${row.monthKey}-salary-slip.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleMonthlyUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSaveMessage(null);
    try {
      const dto: any = {
        userId: user.id || user._id,
        mode: paymentMode,
      };
      if (paymentMode === PaymentModeEnum.ACCOUNT) {
        dto.bankAccount = keepExistingBank ? baseBankAccount : bankForm;
      }
      await changeUserPaymentMode(dto);
      setSaveMessage(`Saved payment details for ${currentMonthLabel}.`);
      // Refresh overrides from backend
      setIsLoadingOverrides(true);
      const [modeHistory, bankHistory] = await Promise.all([
        getUserPaymentModeHistory(user.id || user._id),
        getUserBankAccountHistory(user.id || user._id),
      ]);
      const overrides: Record<string, MonthlyBankOverride> = {};
      (Array.isArray(modeHistory) ? modeHistory : []).forEach((mode: any) => {
        const monthKey = mode.effectiveFrom ? getMonthKey(new Date(mode.effectiveFrom)) : undefined;
        if (!monthKey) return;
        overrides[monthKey] = {
          monthKey,
          paymentMode: mode.mode,
          keepExistingBank: true,
          updatedAt: mode.effectiveFrom || mode.updatedAt || new Date().toISOString(),
        };
      });
      (Array.isArray(bankHistory) ? bankHistory : []).forEach((bank: any) => {
        const monthKey = bank.effectiveFrom ? getMonthKey(new Date(bank.effectiveFrom)) : undefined;
        if (!monthKey) return;
        if (!overrides[monthKey]) {
          overrides[monthKey] = {
            monthKey,
            paymentMode: PaymentModeEnum.ACCOUNT,
            keepExistingBank: true,
            updatedAt: bank.effectiveFrom || bank.updatedAt || new Date().toISOString(),
          };
        }
        overrides[monthKey].bankAccount = {
          bankName: bank.bankName,
          bankHolderName: bank.bankHolderName,
          accountNumber: bank.accountNumber,
          ifsc: bank.ifsc,
        };
        if (typeof bank.linkedPaymentModeSeqNo === 'number' && overrides[monthKey].paymentMode === PaymentModeEnum.ACCOUNT) {
          overrides[monthKey].keepExistingBank = false;
        }
      });
      setMonthlyOverrides(overrides);
    } catch (err) {
      setSaveMessage("Failed to save payment details. Please try again.");
    } finally {
      setIsLoadingOverrides(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="space-y-6 p-4 sm:p-6">
        <section className="rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-600">Employee Portal</p>
              <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.fullName || "Employee"}</h1>
              <p className="max-w-2xl text-sm text-slate-600">
                View your employee details, monthly salary information, payment mode, and update bank details for each month when needed.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Employee Code</p>
                <p className="mt-1 font-semibold text-slate-900">{employeeCode}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Current Salary</p>
                <p className="mt-1 font-semibold text-slate-900">{formatCurrency(latestPayroll?.netSalary || Number(user?.baseSalary || 0), latestPayroll?.currency || user?.currency)}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Payment Mode</p>
                <p className="mt-1 font-semibold text-slate-900">{effectivePaymentMode}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="employee-information" className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <UserRound className="h-5 w-5 text-sky-600" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Employee Information</h2>
              <p className="text-sm text-slate-500">Core details available to the employee.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Employee Code</p>
              <p className="mt-2 font-semibold text-slate-900">{employeeCode}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Date of Joining</p>
              <p className="mt-2 font-semibold text-slate-900">{user?.dateOfJoining ? formatDate(user.dateOfJoining) : "Not available"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Date of Birth</p>
              <p className="mt-2 font-semibold text-slate-900">{user?.dob ? formatDate(user.dob) : "Not available"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Branch</p>
              <p className="mt-2 font-semibold text-slate-900">{branchName}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Designation</p>
              <p className="mt-2 font-semibold text-slate-900">{designation}</p>
            </div>
          </div>
        </section>

        <section id="payroll-information" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <ReceiptText className="h-5 w-5 text-sky-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Payroll Information</h2>
                <p className="text-sm text-slate-500">Incentives, salary slips, and monthly salary details.</p>
              </div>
            </div>

            {payrollError ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{payrollError}</div>
            ) : null}

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <BadgeDollarSign className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs uppercase tracking-wide">Payroll Incentive</span>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">{formatCurrency(latestPayroll?.incentive || 0, latestPayroll?.currency || user?.currency)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <CalendarDays className="h-4 w-4 text-sky-500" />
                  <span className="text-xs uppercase tracking-wide">Monthly Salary</span>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">{formatCurrency(latestPayroll?.netSalary || Number(user?.baseSalary || 0), latestPayroll?.currency || user?.currency)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Download className="h-4 w-4 text-violet-500" />
                  <span className="text-xs uppercase tracking-wide">Salary Slip</span>
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
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Incentive</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Salary Slip</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingPayroll ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Loading payroll details...</td>
                    </tr>
                  ) : displayedPayrollRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No payroll records available.</td>
                    </tr>
                  ) : (
                    displayedPayrollRows.map((row) => (
                      <tr key={row.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-medium text-slate-800">{row.monthLabel}</td>
                        <td className="px-4 py-3 text-slate-600">{formatCurrency(row.netSalary, row.currency)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatCurrency(row.incentive, row.currency)}</td>
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
          </div>

          <div id="payment-details" className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Landmark className="h-5 w-5 text-sky-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Payment Details</h2>
                <p className="text-sm text-slate-500">Bank details are visible only when salary is paid via account transfer.</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Current Month</p>
              <p className="mt-2 font-semibold text-slate-900">{currentMonthLabel}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-100 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Payment Mode</span>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{effectivePaymentMode}</span>
              </div>

              {effectivePaymentMode === PaymentModeEnum.CASH ? (
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Salary is marked as cash for this month, so bank details are not displayed.
                </div>
              ) : effectiveBankAccount ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Bank Name</p>
                    <p className="mt-2 font-semibold text-slate-900">{effectiveBankAccount.bankName || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Account Holder</p>
                    <p className="mt-2 font-semibold text-slate-900">{effectiveBankAccount.bankHolderName || user?.fullName || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Account Number</p>
                    <p className="mt-2 font-semibold text-slate-900">{effectiveBankAccount.accountNumber || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">IFSC / Routing</p>
                    <p className="mt-2 font-semibold text-slate-900">{effectiveBankAccount.ifsc || "Not set"}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No bank details are available for this month yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="bank-update" className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-sky-600" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Monthly Bank Update</h2>
              <p className="text-sm text-slate-500">Update bank details for each month, or keep the same account when nothing changes.</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleMonthlyUpdate}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Month</label>
                <Input value={currentMonthLabel} readOnly />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Payment Mode</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={paymentMode}
                  onChange={(event) => setPaymentMode(event.target.value as PaymentModeEnum)}
                >
                  <option value={PaymentModeEnum.ACCOUNT}>Bank Transfer</option>
                  <option value={PaymentModeEnum.CASH}>Cash</option>
                </select>
              </div>
            </div>

            {paymentMode === PaymentModeEnum.ACCOUNT ? (
              <>
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={keepExistingBank}
                    onChange={(event) => setKeepExistingBank(event.target.checked)}
                  />
                  Keep the same bank account for {currentMonthLabel}
                </label>

                {!keepExistingBank ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Bank Name</label>
                      <Input value={bankForm.bankName || ""} onChange={(event) => setBankForm((current) => ({ ...current, bankName: event.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Account Holder Name</label>
                      <Input value={bankForm.bankHolderName || ""} onChange={(event) => setBankForm((current) => ({ ...current, bankHolderName: event.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Account Number</label>
                      <Input value={bankForm.accountNumber || ""} onChange={(event) => setBankForm((current) => ({ ...current, accountNumber: event.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">IFSC / Routing</label>
                      <Input value={bankForm.ifsc || ""} onChange={(event) => setBankForm((current) => ({ ...current, ifsc: event.target.value }))} />
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="flex items-center gap-3">
              <Button type="submit">Save Monthly Payment Details</Button>
              {saveMessage ? <span className="text-sm text-emerald-600">{saveMessage}</span> : null}
            </div>
          </form>

          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 p-4">
            <h3 className="font-medium text-slate-900">Monthly update history</h3>
            <div className="mt-3 space-y-3">
              {isLoadingOverrides ? (
                <p className="text-sm text-slate-400">Loading monthly update history...</p>
              ) : Object.values(monthlyOverrides)
                  .sort((left, right) => right.monthKey.localeCompare(left.monthKey))
                  .slice(0, 6)
                  .map((override) => (
                    <div key={override.monthKey} className="flex flex-col gap-1 rounded-xl bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{override.monthKey}</p>
                        <p className="text-slate-500">
                          {override.paymentMode === PaymentModeEnum.CASH
                            ? "Cash payment, bank details hidden"
                            : override.keepExistingBank
                              ? "Kept the existing bank account"
                              : `Updated to ${override.bankAccount?.bankName || "new bank account"}`}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">Updated {formatDate(override.updatedAt)}</span>
                    </div>
                  ))
                }
              {!isLoadingOverrides && Object.keys(monthlyOverrides).length === 0 ? (
                <p className="text-sm text-slate-500">No monthly updates saved yet.</p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}