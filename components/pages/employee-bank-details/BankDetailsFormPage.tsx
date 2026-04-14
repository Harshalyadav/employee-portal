"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BankAccountType,
  BankDetailFormErrors,
  BankDetailFormInput,
  BankPaymentMode,
  createCancelledChequeMeta,
  getCurrentMonthValue,
  getMonthLabelFromValue,
  getPreviousMonthValue,
  sanitizeBankDetailInput,
  validateBankDetailInput,
} from "@/lib/employee-bank-details";
import { getUserBankDetailById, listUserBankDetails, upsertUserBankDetail } from "@/service/user-payment.service";
import { useAppStore } from "@/stores";

interface BankDetailsFormPageProps {
  mode: "add" | "edit";
  recordId?: string;
}

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
  cancelledCheque?: { name?: string | null; size?: number | null; type?: string | null; uploadedAt?: string | null } | null;
};

const getBankDetailItems = (response: unknown): BankDetailRecord[] => {
  const responseRecord = (response && typeof response === "object" ? response : {}) as {
    items?: unknown;
    data?: {
      items?: unknown;
    };
  };

  const rawItems = responseRecord.items ?? responseRecord.data?.items;
  return Array.isArray(rawItems) ? (rawItems as BankDetailRecord[]) : [];
};

const createDefaultFormState = (): BankDetailFormInput => ({
  accountHolderName: "",
  bankName: "",
  branchName: "",
  branchAddress: "",
  accountNumber: "",
  confirmAccountNumber: "",
  ifscCode: "",
  accountType: "SAVINGS",
  paymentMode: "BANK_TRANSFER",
  effectiveMonth: getCurrentMonthValue(),
});

const toFormState = (record: BankDetailRecord): BankDetailFormInput => ({
  accountHolderName: record.accountHolderName,
  bankName: record.bankName,
  branchName: record.branchName || "",
  branchAddress: record.branchAddress || "",
  accountNumber: record.accountNumber,
  confirmAccountNumber: record.accountNumber,
  ifscCode: record.ifscCode,
  accountType: (record.accountType as BankAccountType) || "SAVINGS",
  paymentMode: (record.paymentMode as BankPaymentMode) || "BANK_TRANSFER",
  effectiveMonth: record.effectiveMonth.slice(0, 7),
});

export default function BankDetailsFormPage({ mode, recordId }: BankDetailsFormPageProps) {
  const router = useRouter();
  const { user } = useAppStore();
  const employeeId = user?.id || user?._id || "";

  const [records, setRecords] = useState<BankDetailRecord[]>([]);
  const [formState, setFormState] = useState<BankDetailFormInput>(createDefaultFormState);
  const [formErrors, setFormErrors] = useState<BankDetailFormErrors>({});
  const [selectedCheque, setSelectedCheque] = useState<File | null>(null);
  const [savedCheque, setSavedCheque] = useState<BankDetailRecord["cancelledCheque"]>(null);
  const [keepSameForMonth, setKeepSameForMonth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recordNotFound, setRecordNotFound] = useState(false);

  const selectedMonthLabel = useMemo(() => getMonthLabelFromValue(formState.effectiveMonth), [formState.effectiveMonth]);

  useEffect(() => {
    const loadRecords = async () => {
      if (!employeeId) {
        setRecords([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await listUserBankDetails(employeeId, {
          page: 1,
          limit: 100,
        });
        setRecords(getBankDetailItems(response));
      } catch (error) {
        console.error("Failed to load bank detail list", error);
        toast.error("Failed to load bank details.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadRecords();
  }, [employeeId]);

  useEffect(() => {
    const loadRecord = async () => {
      if (mode !== "edit" || !employeeId || !recordId) {
        return;
      }

      setIsLoading(true);
      try {
        const response = (await getUserBankDetailById(employeeId, recordId)) as BankDetailRecord;
        setFormState(toFormState(response));
        setSavedCheque(response.cancelledCheque || null);
        setRecordNotFound(false);
      } catch (error) {
        console.error("Failed to load bank detail", error);
        setRecordNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRecord();
  }, [employeeId, mode, recordId]);

  const handleFieldChange = (field: keyof BankDetailFormInput, value: string) => {
    const normalizedValue =
      field === "accountNumber" || field === "confirmAccountNumber"
        ? value.replace(/\D/g, "")
        : field === "ifscCode"
          ? value.toUpperCase()
          : value;

    setFormState((current) => ({
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

  const applyPreviousMonthDetails = () => {
    const previousMonthValue = getPreviousMonthValue(formState.effectiveMonth);
    const previousRecord = records.find((record) => record.effectiveMonth.startsWith(previousMonthValue));

    if (!previousRecord) {
      toast.error(`No previous month bank details found for ${getMonthLabelFromValue(previousMonthValue)}.`);
      return;
    }

    setFormState({
      accountHolderName: previousRecord.accountHolderName,
      bankName: previousRecord.bankName,
      branchName: previousRecord.branchName || "",
      branchAddress: previousRecord.branchAddress || "",
      accountNumber: previousRecord.accountNumber,
      confirmAccountNumber: previousRecord.accountNumber,
      ifscCode: previousRecord.ifscCode,
      accountType: (previousRecord.accountType as BankAccountType) || "SAVINGS",
      paymentMode: (previousRecord.paymentMode as BankPaymentMode) || "BANK_TRANSFER",
      effectiveMonth: formState.effectiveMonth,
    });
    setFormErrors({});
    toast.success(`Copied previous month details from ${getMonthLabelFromValue(previousMonthValue)}.`);
  };

  const handleSave = async () => {
    if (!employeeId) {
      toast.error("Employee information is missing.");
      return;
    }

    const sanitizedInput = sanitizeBankDetailInput(formState);
    const errors = validateBankDetailInput(sanitizedInput);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please correct the bank details form errors.");
      return;
    }

    setIsSaving(true);
    try {
      await upsertUserBankDetail({
        userId: employeeId,
        effectiveFrom: new Date(`${sanitizedInput.effectiveMonth}-01T00:00:00.000Z`).toISOString(),
        bankAccount: {
          bankName: sanitizedInput.bankName,
          accountHolderName: sanitizedInput.accountHolderName,
          accountNumber: sanitizedInput.accountNumber,
          ifsc: sanitizedInput.ifscCode,
          branchName: sanitizedInput.branchName,
          branchAddress: sanitizedInput.branchAddress,
          accountType: sanitizedInput.accountType,
          paymentMode: sanitizedInput.paymentMode,
          cancelledCheque: selectedCheque ? createCancelledChequeMeta(selectedCheque) : savedCheque,
        },
      });
      toast.success(mode === "edit" ? "Bank details updated successfully." : "Bank details saved successfully.");
      router.push("/#employee-information");
      router.refresh();
    } catch (error) {
      console.error("Failed to save bank detail", error);
      toast.error("Failed to save bank details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === "edit" && recordNotFound) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">Bank details record not found.</p>
        <Button asChild className="mt-4">
          <Link href="/bank-details">Back to Bank Details</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="space-y-6 p-4 sm:p-6">
        {/* <section className="rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-600">Employee Portal</p>
              <h1 className="text-3xl font-bold text-slate-900">{mode === "edit" ? "Edit Bank Details" : "Add Bank Details"}</h1>
              <p className="max-w-2xl text-sm text-slate-600">
                Save month-wise bank details to the backend with validation, previous-month copy support, and upsert behavior for duplicate months.
              </p>
            </div>
        
          </div>
        </section> */}

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-sky-600" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Bank Details Form</h2>
              <p className="text-sm text-slate-500">Fill in the employee bank details with monthly update support.</p>
            </div>
            <div className="mb-5 flex pl-84 gap-3">
            <Button asChild variant="outline">
              <Link href="/bank-details">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Bank Details
              </Link>
            </Button>
            </div>
          </div>

          {isLoading ? <p className="mb-4 text-sm text-slate-500">Loading bank details...</p> : null}

          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Effective Month</label>
                <Input type="month" value={formState.effectiveMonth} onChange={(event) => handleFieldChange("effectiveMonth", event.target.value)} />
                {formErrors.effectiveMonth ? <p className="mt-1 text-xs text-red-600">{formErrors.effectiveMonth}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Payment Mode</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formState.paymentMode} onChange={(event) => handleFieldChange("paymentMode", event.target.value as BankPaymentMode)}>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={keepSameForMonth} onChange={(event) => {
                  setKeepSameForMonth(event.target.checked);
                  if (event.target.checked) {
                    applyPreviousMonthDetails();
                  }
                }} />
                Keep same bank details for this month
              </label>
              <Button type="button" variant="outline" onClick={applyPreviousMonthDetails}>
                <Copy className="mr-2 h-4 w-4" />
                Copy previous month details
              </Button>
              <span className="text-sm text-slate-500">Selected month: {selectedMonthLabel}</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Account numbers are sanitized before saving and full values are only shown while editing this secure form.
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Account Holder Name</label>
                <Input value={formState.accountHolderName} onChange={(event) => handleFieldChange("accountHolderName", event.target.value)} autoComplete="name" />
                {formErrors.accountHolderName ? <p className="mt-1 text-xs text-red-600">{formErrors.accountHolderName}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Bank Name</label>
                <Input value={formState.bankName} onChange={(event) => handleFieldChange("bankName", event.target.value)} autoComplete="organization" />
                {formErrors.bankName ? <p className="mt-1 text-xs text-red-600">{formErrors.bankName}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Branch Name</label>
                <Input value={formState.branchName} onChange={(event) => handleFieldChange("branchName", event.target.value)} />
                {formErrors.branchName ? <p className="mt-1 text-xs text-red-600">{formErrors.branchName}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Account Type</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formState.accountType} onChange={(event) => handleFieldChange("accountType", event.target.value as BankAccountType)}>
                  <option value="SAVINGS">Savings</option>
                  <option value="CURRENT">Current</option>
                  <option value="SALARY">Salary</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Branch Address</label>
                <Textarea rows={3} value={formState.branchAddress} onChange={(event) => handleFieldChange("branchAddress", event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Account Number</label>
                <Input value={formState.accountNumber} onChange={(event) => handleFieldChange("accountNumber", event.target.value)} inputMode="numeric" maxLength={18} autoComplete="off" />
                {formErrors.accountNumber ? <p className="mt-1 text-xs text-red-600">{formErrors.accountNumber}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Confirm Account Number</label>
                <Input value={formState.confirmAccountNumber} onChange={(event) => handleFieldChange("confirmAccountNumber", event.target.value)} inputMode="numeric" maxLength={18} autoComplete="off" />
                {formErrors.confirmAccountNumber ? <p className="mt-1 text-xs text-red-600">{formErrors.confirmAccountNumber}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">IFSC Code</label>
                <Input value={formState.ifscCode} onChange={(event) => handleFieldChange("ifscCode", event.target.value)} maxLength={11} autoComplete="off" />
                {formErrors.ifscCode ? <p className="mt-1 text-xs text-red-600">{formErrors.ifscCode}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Upload Cancelled Cheque</label>
                <Input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setSelectedCheque(event.target.files?.[0] || null)} />
                <p className="mt-1 text-xs text-slate-500">Optional. Only file metadata is stored in this module.</p>
                {selectedCheque ? <p className="mt-1 text-xs text-slate-600">Selected: {selectedCheque.name}</p> : null}
                {!selectedCheque && savedCheque?.name ? <p className="mt-1 text-xs text-slate-600">Saved: {savedCheque.name}</p> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : mode === "edit" ? "Update Bank Details" : "Save Bank Details"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/bank-details">Cancel</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
