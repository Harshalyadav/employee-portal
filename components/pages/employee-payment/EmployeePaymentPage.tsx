"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Landmark } from "lucide-react";

import { cn } from "@/lib";
import { formatDate } from "@/lib/utils";
import { getUserPaymentModeHistory, listUserBankDetails } from "@/service/user-payment.service";
import { useAppStore } from "@/stores";
import { IBankAccount, PaymentModeEnum } from "@/types/user.type";

type MonthlyBankOverride = {
  monthKey: string;
  paymentMode: PaymentModeEnum | string;
  bankAccount?: IBankAccount;
  updatedAt: string;
};

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

type PaymentModeHistoryRecord = {
  mode?: string;
  effectiveFrom?: string;
  updatedAt?: string;
};

const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getDateFromMonthKey = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, Math.max(0, (month || 1) - 1), 1);
};

const getMonthLabelFromKey = (monthKey: string) =>
  getDateFromMonthKey(monthKey).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

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

const normalizeBankDetailListResponse = (response: unknown): EmployeeBankDetailRecord[] => {
  const responseRecord = (response && typeof response === "object" ? response : {}) as {
    items?: unknown;
    data?: {
      items?: unknown;
    };
  };

  const rawItems = responseRecord.items ?? responseRecord.data?.items;
  return Array.isArray(rawItems) ? (rawItems as EmployeeBankDetailRecord[]) : [];
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

export default function EmployeePaymentPage() {
  const { user } = useAppStore();
  const employeeId = user?.id || user?._id || "";
  const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);
  const currentMonthLabel = useMemo(() => getMonthLabelFromKey(currentMonthKey), [currentMonthKey]);

  const [monthlyOverrides, setMonthlyOverrides] = useState<Record<string, MonthlyBankOverride>>({});
  const [paymentHistory, setPaymentHistory] = useState<PaymentModeHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);

  useEffect(() => {
    let isMounted = true;

    const loadPaymentData = async () => {
      if (!employeeId) {
        if (isMounted) {
          setMonthlyOverrides({});
          setPaymentHistory([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const [modeHistory, bankDetailListResponse] = await Promise.all([
          getUserPaymentModeHistory(employeeId),
          listUserBankDetails(employeeId, {
            page: 1,
            limit: 100,
          }),
        ]);

        if (!isMounted) {
          return;
        }

        const overrides: Record<string, MonthlyBankOverride> = {};
        (Array.isArray(modeHistory) ? modeHistory : []).forEach((mode: any) => {
          const monthKey = mode.effectiveFrom ? getMonthKey(new Date(mode.effectiveFrom)) : undefined;
          if (!monthKey) {
            return;
          }

          overrides[monthKey] = {
            monthKey,
            paymentMode: mode.mode,
            updatedAt: mode.effectiveFrom || mode.updatedAt || new Date().toISOString(),
          };
        });

        normalizeBankDetailListResponse(bankDetailListResponse).forEach((record) => {
          const monthKey = record.effectiveMonth?.slice(0, 7);
          if (!monthKey) {
            return;
          }

          if (!overrides[monthKey]) {
            overrides[monthKey] = {
              monthKey,
              paymentMode: mapBankDetailPaymentMode(record.paymentMode),
              updatedAt: record.updatedAt || new Date().toISOString(),
            };
          }

          overrides[monthKey].paymentMode = mapBankDetailPaymentMode(record.paymentMode || String(overrides[monthKey].paymentMode));
          overrides[monthKey].bankAccount = mapBankDetailRecordToBankAccount(record);
          overrides[monthKey].updatedAt = record.updatedAt || overrides[monthKey].updatedAt;
        });

        setMonthlyOverrides(overrides);
        setPaymentHistory(Array.isArray(modeHistory) ? (modeHistory as PaymentModeHistoryRecord[]) : []);
      } catch {
        if (!isMounted) {
          return;
        }

        setMonthlyOverrides({});
        setPaymentHistory([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPaymentData();

    return () => {
      isMounted = false;
    };
  }, [employeeId]);

  const monthOptions = useMemo(() => {
    const keys = Object.keys(monthlyOverrides);
    if (!keys.includes(currentMonthKey)) {
      keys.push(currentMonthKey);
    }

    return keys.sort((left, right) => right.localeCompare(left)).slice(0, 6);
  }, [currentMonthKey, monthlyOverrides]);

  const selectedOverride = monthlyOverrides[selectedMonthKey];
  const currentOverride = monthlyOverrides[currentMonthKey];
  const effectivePaymentMode = currentOverride?.paymentMode || user?.paymentMode || PaymentModeEnum.ACCOUNT;
  const effectiveBankAccount = currentOverride?.bankAccount || user?.bankAccount;

  return (
    <div className="min-h-screen bg-transparent">
      <div className="space-y-6 p-4 sm:p-6">
        <section className="rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-600">Payment</p>
              <h1 className="text-3xl font-bold text-slate-900">All Payment Details</h1>
              <p className="max-w-2xl text-sm text-slate-600">This page shows employee payment-mode history and payment-linked bank visibility separately from profile and payroll.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Current Month</p>
                <p className="mt-1 font-semibold text-slate-900">{currentMonthLabel}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Payment Mode</p>
                <p className="mt-1 font-semibold text-slate-900">{effectivePaymentMode}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">History Records</p>
                <p className="mt-1 font-semibold text-slate-900">{paymentHistory.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Landmark className="h-5 w-5 text-sky-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Current Payment Details</h2>
                <p className="text-sm text-slate-500">Bank details are shown only when salary is paid via account transfer.</p>
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
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Salary is marked as cash for this month, so bank details are not displayed.</div>
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
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No bank details are available for this month yet.</div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-sky-600" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Payment Mode History</h2>
                  <p className="text-sm text-slate-500">All payment mode changes visible to the employee.</p>
                </div>
              </div>

              <div className="space-y-3">
                {isLoading ? <p className="text-sm text-slate-400">Loading payment history...</p> : null}
                {!isLoading && paymentHistory.length === 0 ? <p className="text-sm text-slate-500">No payment mode history available.</p> : null}
                {paymentHistory.map((record, index) => (
                  <div key={`${record.effectiveFrom || record.updatedAt || index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{record.mode || PaymentModeEnum.ACCOUNT}</p>
                        <p className="mt-1 text-sm text-slate-600">Applied for employee payment processing.</p>
                      </div>
                      <span className="text-xs text-slate-400">{record.effectiveFrom || record.updatedAt ? formatDate(record.effectiveFrom || record.updatedAt || "") : "Date not available"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Landmark className="h-5 w-5 text-sky-600" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Month-wise Payment View</h2>
                  <p className="text-sm text-slate-500">Browse payment details month by month.</p>
                </div>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-2">
                {monthOptions.map((monthKey) => {
                  const detail = monthlyOverrides[monthKey];

                  return (
                    <button
                      key={monthKey}
                      type="button"
                      onClick={() => setSelectedMonthKey(monthKey)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition-colors",
                        selectedMonthKey === monthKey ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50",
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{getMonthLabelFromKey(monthKey)}</p>
                        {detail?.updatedAt ? <span className="text-xs text-slate-400">{formatDate(detail.updatedAt)}</span> : null}
                      </div>
                      <p className="text-sm text-slate-600">{detail?.paymentMode || PaymentModeEnum.ACCOUNT}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{getMonthLabelFromKey(selectedMonthKey)}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">{selectedOverride?.paymentMode || PaymentModeEnum.ACCOUNT}</span>
                </div>

                {selectedOverride?.paymentMode === PaymentModeEnum.CASH ? (
                  <p className="text-sm text-amber-700">Cash payment selected for this month.</p>
                ) : (
                  <div className="grid gap-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Bank</span>
                      <span className="font-medium text-slate-900">{selectedOverride?.bankAccount?.bankName || "Not set"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Account</span>
                      <span className="font-medium text-slate-900">{maskAccountNumber(selectedOverride?.bankAccount?.accountNumber)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">IFSC</span>
                      <span className="font-medium text-slate-900">{selectedOverride?.bankAccount?.ifsc || "Not set"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Branch</span>
                      <span className="font-medium text-slate-900">{selectedOverride?.bankAccount?.branchDetails || "Not set"}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </section>
        </section>
      </div>
    </div>
  );
}