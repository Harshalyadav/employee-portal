"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SidebarLogoutButton from "@/components/layout/SidebarLogoutButton";
import { useSidebar } from "@/contexts/SidebarContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/stores";
import { CurrencyEnum, employmentInfoSchema, IBankAccount, PaymentModeEnum, User } from "@/types/user.type";
import { getAllPayrolls } from "@/service/payroll.service";
import {
  getUserPaymentModeHistory,
  changeUserPaymentMode,
  listUserBankDetails,
} from "@/service/user-payment.service";
import {
  BadgeDollarSign,
  Building2,
  CalendarDays,
  CreditCard,
  Download,
  LayoutDashboard,
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
  payrollStatus?: string;
  totalEmployees?: number;
};

type PayrollMasterRecord = {
  _id: string;
  payrollMonth: number;
  payrollYear: number;
  branchId?: string | { _id?: string; branchName?: string; name?: string };
  branchName?: string;
  paymentMode?: string | null;
  totalNetAmount?: number;
  totalEmployee?: number;
  payrollStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};

type MonthlyBankOverride = {
  monthKey: string;
  paymentMode: PaymentModeEnum | string;
  bankAccount?: IBankAccount;
  keepExistingBank: boolean;
  updatedAt: string;
};

type BankFormErrors = Partial<Record<keyof IBankAccount, string>>;

type EmployeeBankDetailRecord = {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  branchAddress?: string;
  paymentMode?: string;
  effectiveMonth: string;
  updatedAt?: string;
};

type BankDetailListResponse = {
  items: EmployeeBankDetailRecord[];
};



const sectionLinks = [
  { id: "employee-overview", label: "Overview", href: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "employee-details-route", label: "Employee Details", href: "/employee-details", icon: <UserRound className="h-5 w-5" /> },
  { id: "employee-payroll-route", label: "Payroll", href: "/employee-payroll", icon: <ReceiptText className="h-5 w-5" /> },
  { id: "employee-payment-route", label: "Payment", href: "/employee-payment", icon: <Landmark className="h-5 w-5" /> },
  { id: "bank-details-route", label: "Bank Details", href: "/bank-details", icon: <Building2 className="h-5 w-5" /> },
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

const getDateFromMonthKey = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, Math.max(0, (month || 1) - 1), 1);
};

const getMonthLabelFromKey = (monthKey: string) => getMonthLabel(getDateFromMonthKey(monthKey));

const getMonthStartIso = (monthKey: string) => getDateFromMonthKey(monthKey).toISOString();

const getPreviousMonthKey = (monthKey: string) => {
  const date = getDateFromMonthKey(monthKey);
  date.setMonth(date.getMonth() - 1);
  return getMonthKey(date);
};

const maskAccountNumber = (accountNumber?: string) => {
  if (!accountNumber) {
    return "Not set";
  }

  const trimmedValue = accountNumber.replace(/\s+/g, "");
  if (trimmedValue.length <= 4) {
    return trimmedValue;
  }

  return `${"*".repeat(Math.max(4, trimmedValue.length - 4))}${trimmedValue.slice(-4)}`;
};

const buildDisplayMonthKeys = (currentMonthKey: string, payrollHistory: EmployeePayrollRow[]) => {
  const uniqueMonthKeys = Array.from(new Set([currentMonthKey, ...payrollHistory.map((row) => row.monthKey)])).sort((left, right) =>
    right.localeCompare(left),
  );

  const monthKeys = [...uniqueMonthKeys];
  let index = 1;

  while (monthKeys.length < 4) {
    const date = getDateFromMonthKey(currentMonthKey);
    date.setMonth(date.getMonth() - index);
    const monthKey = getMonthKey(date);
    if (!monthKeys.includes(monthKey)) {
      monthKeys.push(monthKey);
    }
    index += 1;
  }

  return monthKeys.sort((left, right) => right.localeCompare(left)).slice(0, 4);
};

const formatCurrency = (amount: number, currency?: CurrencyEnum | string) => {
  const resolvedCurrency = currency || CurrencyEnum.AED;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: resolvedCurrency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const normalizeBankDetailListResponse = (response: unknown): BankDetailListResponse => {
  const responseRecord = (response && typeof response === "object" ? response : {}) as {
    items?: unknown;
    data?: {
      items?: unknown;
    };
  };

  const rawItems = responseRecord.items ?? responseRecord.data?.items;

  return {
    items: Array.isArray(rawItems) ? (rawItems as EmployeeBankDetailRecord[]) : [],
  };
};

const mapBankDetailPaymentMode = (paymentMode?: string): PaymentModeEnum | string => {
  if (paymentMode === PaymentModeEnum.CASH) {
    return PaymentModeEnum.CASH;
  }

  if (paymentMode === PaymentModeEnum.CHEQUE || paymentMode === "CHEQUE") {
    return PaymentModeEnum.CHEQUE;
  }

  return PaymentModeEnum.ACCOUNT;
};

const mapBankDetailRecordToBankAccount = (record: EmployeeBankDetailRecord): IBankAccount => ({
  bankName: record.bankName,
  bankHolderName: record.accountHolderName,
  accountNumber: record.accountNumber,
  ifsc: record.ifscCode,
  branchDetails: record.branchName || record.branchAddress || "",
});

const sanitizeBankAccount = (bankAccount: IBankAccount): IBankAccount => ({
  bankName: bankAccount.bankName?.trim() || "",
  bankHolderName: bankAccount.bankHolderName?.trim() || "",
  accountNumber: bankAccount.accountNumber?.replace(/\D/g, "") || "",
  ifsc: bankAccount.ifsc?.trim().toUpperCase() || "",
  branchDetails: bankAccount.branchDetails?.trim() || "",
});

const getBankFormErrors = (bankAccount: IBankAccount): BankFormErrors => {
  const result = employmentInfoSchema.safeParse({
    paymentMode: PaymentModeEnum.ACCOUNT,
    bankAccount,
  });

  if (result.success) {
    return {};
  }

  const fieldErrors = result.error.flatten().fieldErrors.bankAccount;
  const fallbackMessage = fieldErrors?.[0] || "Please enter valid bank details.";
  const errors: BankFormErrors = {};

  if (!bankAccount.bankHolderName) {
    errors.bankHolderName = "Account holder name is required.";
  }
  if (!bankAccount.bankName) {
    errors.bankName = "Bank name is required.";
  }
  if (!bankAccount.accountNumber) {
    errors.accountNumber = "Account number is required.";
  } else if (!/^\d{9,18}$/.test(bankAccount.accountNumber)) {
    errors.accountNumber = "Account number must be 9 to 18 digits.";
  }
  if (!bankAccount.ifsc) {
    errors.ifsc = "IFSC code is required.";
  } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankAccount.ifsc)) {
    errors.ifsc = "Enter a valid IFSC code.";
  }
  if (!bankAccount.branchDetails) {
    errors.branchDetails = "Branch details are required.";
  }

  if (Object.keys(errors).length === 0) {
    errors.bankName = fallbackMessage;
  }

  return errors;
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

const toEmployeePayrollRows = (records: PayrollMasterRecord[], fallbackCurrency: CurrencyEnum | string): EmployeePayrollRow[] => {
  return records
    .filter((record) => record.payrollMonth && record.payrollYear)
    .map((record) => {
      const monthKey = `${record.payrollYear}-${String(record.payrollMonth).padStart(2, "0")}`;

      return {
        id: record._id,
        monthKey,
        monthLabel: new Date(record.payrollYear, Math.max(0, record.payrollMonth - 1), 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        netSalary: Number(record.totalNetAmount || 0),
        incentive: 0,
        paymentMode: (record.paymentMode as PaymentModeEnum | string) || PaymentModeEnum.ACCOUNT,
        currency: fallbackCurrency || CurrencyEnum.AED,
        paidAt: record.updatedAt || record.createdAt,
        payrollStatus: record.payrollStatus,
        totalEmployees: record.totalEmployee,
      };
    })
    .sort((left, right) => right.monthKey.localeCompare(left.monthKey));
};

export function EmployeePortalSidebar() {
  const { isOpen } = useSidebar();
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <aside className={cn("flex h-full flex-col bg-white shadow-md transition-all duration-300", isOpen ? "w-64" : "w-16")}>
      <div className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-2">
          {sectionLinks.map((section) => (
            <li key={section.id}>
              <Link
                href={section.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-accent dark:text-slate-300 dark:hover:bg-slate-900",
                  isActiveLink(section.href) ? "bg-sky-50 text-sky-700" : "",
                )}
                title={section.label}
              >
                <span className="flex-none">{section.icon}</span>
                {isOpen ? <span className="ml-3">{section.label}</span> : null}
              </Link>
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
    branchDetails: user?.bankAccount?.branchDetails || "",
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<BankFormErrors>({});

  const employeeId = user?.id || user?._id || "employee-demo";
  const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);
  const currentMonthLabel = useMemo(() => getMonthLabel(new Date()), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);

  const designation = getDesignation(user);
  const employeeCode = (user as any)?.displayEmployeeId || user?.employeeId || user?.uniqueWorkerId || `EMP-${employeeId.slice(-6).toUpperCase()}`;
  const branchReference = user?.branch as { branchName?: string; name?: string } | null | undefined;
  const branchName = branchReference?.branchName || branchReference?.name || "Main Branch";
  const branchId = String((user as any)?.branch?._id || (user as any)?.branch?.id || (user as any)?.branchId || "").trim();
  const baseBankAccount = user?.bankAccount;
  const currentOverride = monthlyOverrides[currentMonthKey];
  const currentPayrollRow = payrollRows.find((row) => row.monthKey === currentMonthKey);
  const effectivePaymentMode = currentOverride?.paymentMode || currentPayrollRow?.paymentMode || user?.paymentMode || PaymentModeEnum.ACCOUNT;
  const effectiveBankAccount = currentOverride?.bankAccount || baseBankAccount;
  const latestPayroll = payrollRows[0];
  const selectedMonthLabel = useMemo(() => getMonthLabelFromKey(selectedMonthKey), [selectedMonthKey]);
  const monthOptions = useMemo(() => buildDisplayMonthKeys(currentMonthKey, payrollRows), [currentMonthKey, payrollRows]);
  const monthWiseBankDetails = useMemo(
    () =>
      monthOptions.map((monthKey) => {
        const override = monthlyOverrides[monthKey];
        const payrollRow = payrollRows.find((row) => row.monthKey === monthKey);
        const resolvedPaymentMode = override?.paymentMode || payrollRow?.paymentMode || user?.paymentMode || PaymentModeEnum.ACCOUNT;
        const resolvedBankAccount = override?.bankAccount || baseBankAccount;

        return {
          monthKey,
          monthLabel: getMonthLabelFromKey(monthKey),
          paymentMode: resolvedPaymentMode,
          bankAccount: resolvedBankAccount,
          updatedAt: override?.updatedAt,
          isSelected: monthKey === selectedMonthKey,
        };
      }),
    [baseBankAccount, monthOptions, monthlyOverrides, payrollRows, selectedMonthKey, user?.paymentMode],
  );


  // Fetch monthly overrides/history from backend
  useEffect(() => {
    let isMounted = true;
    async function fetchOverrides() {
      if (!user) return;
      setIsLoadingOverrides(true);
      try {
        const [modeHistory, bankDetailListResponse] = await Promise.all([
          getUserPaymentModeHistory(user.id || user._id),
          listUserBankDetails(user.id || user._id, {
            page: 1,
            limit: 100,
          }),
        ]);
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

        normalizeBankDetailListResponse(bankDetailListResponse).items.forEach((record) => {
          const monthKey = record.effectiveMonth?.slice(0, 7);
          if (!monthKey) return;

          if (!overrides[monthKey]) {
            overrides[monthKey] = {
              monthKey,
              paymentMode: mapBankDetailPaymentMode(record.paymentMode),
              keepExistingBank: false,
              updatedAt: record.updatedAt || new Date().toISOString(),
            };
          }

          overrides[monthKey].paymentMode = mapBankDetailPaymentMode(record.paymentMode || String(overrides[monthKey].paymentMode));
          overrides[monthKey].bankAccount = mapBankDetailRecordToBankAccount(record);
          overrides[monthKey].keepExistingBank = false;
          overrides[monthKey].updatedAt = record.updatedAt || overrides[monthKey].updatedAt;
        });

        if (isMounted) {
          setMonthlyOverrides(overrides);
          const existingOverride = overrides[selectedMonthKey];
          if (existingOverride) {
            setPaymentMode(existingOverride.paymentMode);
            setKeepExistingBank(existingOverride.keepExistingBank);
            setBankForm(existingOverride.bankAccount || {
              bankName: user?.bankAccount?.bankName || "",
              bankHolderName: user?.bankAccount?.bankHolderName || user?.fullName || "",
              accountNumber: user?.bankAccount?.accountNumber || "",
              ifsc: user?.bankAccount?.ifsc || "",
              branchDetails: user?.bankAccount?.branchDetails || "",
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
  }, [user, selectedMonthKey]);

  useEffect(() => {
    const existingOverride = monthlyOverrides[selectedMonthKey];
    const payrollRow = payrollRows.find((row) => row.monthKey === selectedMonthKey);

    setPaymentMode(existingOverride?.paymentMode || payrollRow?.paymentMode || user?.paymentMode || PaymentModeEnum.ACCOUNT);
    setKeepExistingBank(existingOverride?.keepExistingBank ?? true);
    setBankForm(
      existingOverride?.bankAccount || {
        bankName: user?.bankAccount?.bankName || "",
        bankHolderName: user?.bankAccount?.bankHolderName || user?.fullName || "",
        accountNumber: user?.bankAccount?.accountNumber || "",
        ifsc: user?.bankAccount?.ifsc || "",
        branchDetails: user?.bankAccount?.branchDetails || "",
      },
    );
    setFormErrors({});
  }, [monthlyOverrides, payrollRows, selectedMonthKey, user]);

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
        const response = await getAllPayrolls(1, 6, {
          branchId: branchId || undefined,
        });

        if (!isMounted) {
          return;
        }

        const payrollMasters = Array.isArray(response?.data) ? (response.data as unknown as PayrollMasterRecord[]) : [];

        if (payrollMasters.length > 0) {
          const mapped = toEmployeePayrollRows(payrollMasters, user.currency || CurrencyEnum.AED);

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
  }, [branchId, user]);

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
    setFormErrors({});
    try {
      const dto: any = {
        userId: user.id || user._id,
        mode: paymentMode,
        effectiveFrom: getMonthStartIso(selectedMonthKey),
      };
      if (paymentMode === PaymentModeEnum.ACCOUNT) {
        const sanitizedBankAccount = sanitizeBankAccount(keepExistingBank ? (baseBankAccount || {}) : bankForm);
        const errors = getBankFormErrors(sanitizedBankAccount);

        if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          setSaveMessage("Please correct the bank details before saving.");
          return;
        }

        dto.bankAccount = sanitizedBankAccount;
        if (!keepExistingBank) {
          setBankForm(sanitizedBankAccount);
        }
      }
      await changeUserPaymentMode(dto);
      setSaveMessage(`Saved payment details for ${selectedMonthLabel}.`);
      setIsLoadingOverrides(true);
      const [modeHistory, bankDetailListResponse] = await Promise.all([
        getUserPaymentModeHistory(user.id || user._id),
        listUserBankDetails(user.id || user._id, {
          page: 1,
          limit: 100,
        }),
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

      normalizeBankDetailListResponse(bankDetailListResponse).items.forEach((record) => {
        const monthKey = record.effectiveMonth?.slice(0, 7);
        if (!monthKey) return;

        if (!overrides[monthKey]) {
          overrides[monthKey] = {
            monthKey,
            paymentMode: mapBankDetailPaymentMode(record.paymentMode),
            keepExistingBank: false,
            updatedAt: record.updatedAt || new Date().toISOString(),
          };
        }

        overrides[monthKey].paymentMode = mapBankDetailPaymentMode(record.paymentMode || String(overrides[monthKey].paymentMode));
        overrides[monthKey].bankAccount = mapBankDetailRecordToBankAccount(record);
        overrides[monthKey].keepExistingBank = false;
        overrides[monthKey].updatedAt = record.updatedAt || overrides[monthKey].updatedAt;
      });
      setMonthlyOverrides(overrides);
    } catch (err) {
      setSaveMessage("Failed to save payment details. Please try again.");
    } finally {
      setIsLoadingOverrides(false);
    }
  };

  const handleCopyPreviousMonthDetails = () => {
    const previousMonthKey = getPreviousMonthKey(selectedMonthKey);
    const previousOverride = monthlyOverrides[previousMonthKey];
    const previousBankAccount = previousOverride?.bankAccount || baseBankAccount;

    if (!previousBankAccount) {
      setSaveMessage(`No bank details found for ${getMonthLabelFromKey(previousMonthKey)}.`);
      return;
    }

    setPaymentMode(PaymentModeEnum.ACCOUNT);
    setKeepExistingBank(false);
    setBankForm({
      bankName: previousBankAccount.bankName || "",
      bankHolderName: previousBankAccount.bankHolderName || user?.fullName || "",
      accountNumber: previousBankAccount.accountNumber || "",
      ifsc: previousBankAccount.ifsc || "",
      branchDetails: previousBankAccount.branchDetails || "",
    });
    setFormErrors({});
    setSaveMessage(`Copied bank details from ${getMonthLabelFromKey(previousMonthKey)}.`);
  };

  const handleBankFormChange = (field: keyof IBankAccount, value: string) => {
    const normalizedValue = field === "ifsc" ? value.toUpperCase() : field === "accountNumber" ? value.replace(/\D/g, "") : value;

    setBankForm((current) => ({
      ...current,
      [field]: normalizedValue,
    }));

    setFormErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
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
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Salary Slip</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingPayroll ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading payroll details...</td>
                    </tr>
                  ) : displayedPayrollRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No payroll records available.</td>
                    </tr>
                  ) : (
                    displayedPayrollRows.map((row) => (
                      <tr key={row.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-medium text-slate-800">{row.monthLabel}</td>
                        <td className="px-4 py-3 text-slate-600">{formatCurrency(row.netSalary, row.currency)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatCurrency(row.incentive, row.currency)}</td>
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
                    <p className="mt-2 font-semibold text-slate-900">{maskAccountNumber(effectiveBankAccount.accountNumber)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">IFSC Code</p>
                    <p className="mt-2 font-semibold text-slate-900">{effectiveBankAccount.ifsc || "Not set"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Branch Name</p>
                    <p className="mt-2 font-semibold text-slate-900">{effectiveBankAccount.branchDetails || "Not set"}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No bank details are available for this month yet.
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-gray-100 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-slate-900">Month-wise bank details</h3>
                  <p className="text-sm text-slate-500">Recent 4 months bank details visible in the employee portal.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">3 to 4 months</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {monthWiseBankDetails.map((detail) => (
                  <button
                    key={detail.monthKey}
                    type="button"
                    onClick={() => setSelectedMonthKey(detail.monthKey)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-colors",
                      detail.isSelected ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50",
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{detail.monthLabel}</p>
                        <p className="text-xs text-slate-500">{detail.paymentMode}</p>
                      </div>
                      {detail.updatedAt ? <span className="text-xs text-slate-400">Updated {formatDate(detail.updatedAt)}</span> : null}
                    </div>

                    {detail.paymentMode === PaymentModeEnum.CASH ? (
                      <p className="text-sm text-amber-700">Cash payment selected for this month.</p>
                    ) : (
                      <div className="grid gap-2 text-sm text-slate-700">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Bank</span>
                          <span className="font-medium text-slate-900">{detail.bankAccount?.bankName || "Not set"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Account</span>
                          <span className="font-medium text-slate-900">{maskAccountNumber(detail.bankAccount?.accountNumber)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">IFSC</span>
                          <span className="font-medium text-slate-900">{detail.bankAccount?.ifsc || "Not set"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Branch Name</span>
                          <span className="font-medium text-slate-900">{detail.bankAccount?.branchDetails || "Not set"}</span>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="bank-update" className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-sky-600" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Bank Details</h2>
              <p className="text-sm text-slate-500">Employees can enter and update bank details month-wise, with validation for account number and IFSC code.</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleMonthlyUpdate}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Month</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedMonthKey}
                  onChange={(event) => setSelectedMonthKey(event.target.value)}
                >
                  {monthOptions.map((monthKey) => (
                    <option key={monthKey} value={monthKey}>
                      {getMonthLabelFromKey(monthKey)}
                    </option>
                  ))}
                </select>
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
                  Keep the same bank account for {selectedMonthLabel}
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" onClick={handleCopyPreviousMonthDetails}>
                    Copy Previous Month Details
                  </Button>
                  <span className="text-sm text-slate-500">Quickly reuse last month bank details for {selectedMonthLabel}.</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Account numbers are masked in summaries and only sanitized values are sent when the form is saved.
                </div>

                {!keepExistingBank ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Bank Name</label>
                      <Input autoComplete="organization" value={bankForm.bankName || ""} onChange={(event) => handleBankFormChange("bankName", event.target.value)} />
                      {formErrors.bankName ? <p className="mt-1 text-xs text-red-600">{formErrors.bankName}</p> : null}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Account Holder Name</label>
                      <Input autoComplete="name" value={bankForm.bankHolderName || ""} onChange={(event) => handleBankFormChange("bankHolderName", event.target.value)} />
                      {formErrors.bankHolderName ? <p className="mt-1 text-xs text-red-600">{formErrors.bankHolderName}</p> : null}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Account Number</label>
                      <Input autoComplete="off" inputMode="numeric" maxLength={18} value={bankForm.accountNumber || ""} onChange={(event) => handleBankFormChange("accountNumber", event.target.value)} />
                      {formErrors.accountNumber ? <p className="mt-1 text-xs text-red-600">{formErrors.accountNumber}</p> : null}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">IFSC / Routing</label>
                      <Input autoComplete="off" maxLength={11} value={bankForm.ifsc || ""} onChange={(event) => handleBankFormChange("ifsc", event.target.value)} />
                      {formErrors.ifsc ? <p className="mt-1 text-xs text-red-600">{formErrors.ifsc}</p> : null}
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">Branch Name</label>
                      <Input autoComplete="street-address" value={bankForm.branchDetails || ""} onChange={(event) => handleBankFormChange("branchDetails", event.target.value)} />
                      {formErrors.branchDetails ? <p className="mt-1 text-xs text-red-600">{formErrors.branchDetails}</p> : null}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="flex items-center gap-3">
              <Button type="submit">Save Bank Details</Button>
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