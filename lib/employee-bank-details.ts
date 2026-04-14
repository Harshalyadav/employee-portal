export type BankAccountType = "SAVINGS" | "CURRENT" | "SALARY";
export type BankPaymentMode = "BANK_TRANSFER" | "UPI" | "CHEQUE";
export type BankDetailStatus = "ACTIVE" | "INACTIVE";
export type BankHistoryAction = "CREATED" | "UPDATED" | "DELETED";

export interface CancelledChequeMeta {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface EmployeeBankDetailRecord {
  id: string;
  employeeId: string;
  accountHolderName: string;
  bankName: string;
  branchName: string;
  branchAddress?: string;
  accountNumber: string;
  ifscCode: string;
  accountType: BankAccountType;
  paymentMode: BankPaymentMode;
  effectiveMonth: string;
  cancelledCheque?: CancelledChequeMeta;
  status: BankDetailStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  sourceRecordId?: string;
}

export interface EmployeeBankDetailHistoryEntry {
  id: string;
  employeeId: string;
  recordId: string;
  action: BankHistoryAction;
  effectiveMonth: string;
  message: string;
  createdAt: string;
}

export interface BankDetailFormInput {
  accountHolderName: string;
  bankName: string;
  branchName: string;
  branchAddress: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  accountType: BankAccountType;
  paymentMode: BankPaymentMode;
  effectiveMonth: string;
}

export type BankDetailFormErrors = Partial<Record<keyof BankDetailFormInput, string>>;

const BANK_DETAIL_STORAGE_PREFIX = "employee-bank-details";
const BANK_DETAIL_HISTORY_STORAGE_PREFIX = "employee-bank-details-history";

const toStorageKey = (prefix: string, employeeId: string) => `${prefix}:${employeeId}`;

const parseJson = <T,>(rawValue: string | null, fallback: T): T => {
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
};

const isBrowser = () => typeof window !== "undefined";

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `bank-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const readEmployeeBankDetails = (employeeId: string): EmployeeBankDetailRecord[] => {
  if (!isBrowser()) {
    return [];
  }

  return parseJson<EmployeeBankDetailRecord[]>(window.localStorage.getItem(toStorageKey(BANK_DETAIL_STORAGE_PREFIX, employeeId)), []);
};

export const writeEmployeeBankDetails = (employeeId: string, records: EmployeeBankDetailRecord[]) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(toStorageKey(BANK_DETAIL_STORAGE_PREFIX, employeeId), JSON.stringify(records));
};

export const readEmployeeBankDetailHistory = (employeeId: string): EmployeeBankDetailHistoryEntry[] => {
  if (!isBrowser()) {
    return [];
  }

  return parseJson<EmployeeBankDetailHistoryEntry[]>(window.localStorage.getItem(toStorageKey(BANK_DETAIL_HISTORY_STORAGE_PREFIX, employeeId)), []);
};

export const appendEmployeeBankDetailHistory = (employeeId: string, entry: EmployeeBankDetailHistoryEntry) => {
  if (!isBrowser()) {
    return;
  }

  const existingEntries = readEmployeeBankDetailHistory(employeeId);
  window.localStorage.setItem(
    toStorageKey(BANK_DETAIL_HISTORY_STORAGE_PREFIX, employeeId),
    JSON.stringify([entry, ...existingEntries].slice(0, 50)),
  );
};

export const createBankHistoryEntry = (
  employeeId: string,
  recordId: string,
  action: BankHistoryAction,
  effectiveMonth: string,
  message: string,
): EmployeeBankDetailHistoryEntry => ({
  id: createId(),
  employeeId,
  recordId,
  action,
  effectiveMonth,
  message,
  createdAt: new Date().toISOString(),
});

export const maskBankAccountNumber = (accountNumber: string) => {
  const trimmedValue = accountNumber.replace(/\s+/g, "");
  if (!trimmedValue) {
    return "Not set";
  }

  if (trimmedValue.length <= 4) {
    return trimmedValue;
  }

  return `${"X".repeat(Math.max(4, trimmedValue.length - 4))}${trimmedValue.slice(-4)}`;
};

export const getMonthLabelFromValue = (monthValue: string) => {
  const [year, month] = monthValue.split("-").map(Number);
  return new Date(year, Math.max(0, (month || 1) - 1), 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

export const getPreviousMonthValue = (monthValue: string) => {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(year, Math.max(0, (month || 1) - 1), 1);
  date.setMonth(date.getMonth() - 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}`;
};

export const getCurrentMonthValue = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const sanitizeBankDetailInput = (input: BankDetailFormInput): BankDetailFormInput => ({
  accountHolderName: input.accountHolderName.trim(),
  bankName: input.bankName.trim(),
  branchName: input.branchName.trim(),
  branchAddress: input.branchAddress.trim(),
  accountNumber: input.accountNumber.replace(/\D/g, ""),
  confirmAccountNumber: input.confirmAccountNumber.replace(/\D/g, ""),
  ifscCode: input.ifscCode.trim().toUpperCase(),
  accountType: input.accountType,
  paymentMode: input.paymentMode,
  effectiveMonth: input.effectiveMonth,
});

export const validateBankDetailInput = (input: BankDetailFormInput): BankDetailFormErrors => {
  const errors: BankDetailFormErrors = {};

  if (!input.accountHolderName) {
    errors.accountHolderName = "Account holder name is required.";
  }
  if (!input.bankName) {
    errors.bankName = "Bank name is required.";
  }
  if (!input.branchName) {
    errors.branchName = "Branch name is required.";
  }
  if (!input.accountNumber) {
    errors.accountNumber = "Account number is required.";
  } else if (!/^\d{9,18}$/.test(input.accountNumber)) {
    errors.accountNumber = "Account number must be 9 to 18 digits.";
  }
  if (!input.confirmAccountNumber) {
    errors.confirmAccountNumber = "Please confirm the account number.";
  } else if (input.accountNumber !== input.confirmAccountNumber) {
    errors.confirmAccountNumber = "Confirm account number must match account number.";
  }
  if (!input.ifscCode) {
    errors.ifscCode = "IFSC code is required.";
  } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(input.ifscCode)) {
    errors.ifscCode = "IFSC code must be 11 characters in valid format.";
  }
  if (!input.effectiveMonth) {
    errors.effectiveMonth = "Effective month is required.";
  }

  return errors;
};

export const toBankDetailRecord = (
  employeeId: string,
  input: BankDetailFormInput,
  cancelledCheque?: CancelledChequeMeta,
  sourceRecordId?: string,
): EmployeeBankDetailRecord => {
  const timestamp = new Date().toISOString();

  return {
    id: createId(),
    employeeId,
    accountHolderName: input.accountHolderName,
    bankName: input.bankName,
    branchName: input.branchName,
    branchAddress: input.branchAddress || "",
    accountNumber: input.accountNumber,
    ifscCode: input.ifscCode,
    accountType: input.accountType,
    paymentMode: input.paymentMode,
    effectiveMonth: input.effectiveMonth,
    cancelledCheque,
    status: "ACTIVE",
    isDeleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    sourceRecordId,
  };
};

export const createCancelledChequeMeta = (file: File): CancelledChequeMeta => ({
  name: file.name,
  size: file.size,
  type: file.type,
  uploadedAt: new Date().toISOString(),
});

export const getLatestRecordForMonth = (records: EmployeeBankDetailRecord[], monthValue: string) =>
  [...records]
    .filter((record) => record.effectiveMonth === monthValue && !record.isDeleted)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];

export const sortBankDetailRecords = (records: EmployeeBankDetailRecord[]) =>
  [...records].sort((left, right) => {
    const monthComparison = right.effectiveMonth.localeCompare(left.effectiveMonth);
    if (monthComparison !== 0) {
      return monthComparison;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
