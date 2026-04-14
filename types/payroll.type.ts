import { z } from "zod";
import { CurrencyEnum, IBankAccount, PaymentModeEnum } from "./user.type";

/**
 * Payroll Status Enum
 */
export enum PayrollStatusEnum {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
}

/**
 * Payroll Item Status Enum
 */
export enum PayrollItemStatusEnum {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  LOCKED = "LOCKED",
  PAID = "PAID",
  FAILED = "FAILED",
}

/**
 * Payroll Months Enum
 */
export enum PayrollMonthEnum {
  JANUARY = 1,
  FEBRUARY = 2,
  MARCH = 3,
  APRIL = 4,
  MAY = 5,
  JUNE = 6,
  JULY = 7,
  AUGUST = 8,
  SEPTEMBER = 9,
  OCTOBER = 10,
  NOVEMBER = 11,
  DECEMBER = 12,
}

/**
 * Payroll LOT Status Enum
 */
export enum PayrollLotStatusEnum {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  CREATED = "CREATED",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  CLOSED = "CLOSED",
}

/**
 * User reference (minimal)
 */
export interface IUserRef {
  _id: string;
  fullName: string;
  email: string;
}

/**
 * Bulk Payroll Item DTO (single employee in bulk creation)
 */
export interface BulkPayrollItemDto {
  userId: string;
  grossSalary: number;
  baseSalary: number;
  netSalary: number;
  currency: CurrencyEnum | string;
  paymentMode: PaymentModeEnum | string;
  bankAccountDetails?: IBankAccount;
  advanceId?: string;
  deductedAdvance?: number;
  totalWorkingDays?: number;
  otherDeduction?: number;
  otherDeductionRemark?: string;
  incentive?: number; // Incentive added to net salary
  payrollId?: string;
  sequenceIndex?: number;
}

/**
 * Create Bulk Payroll DTO (main request body)
 */
export interface CreateBulkPayrollDto {
  payrollMonth: number; // 1-12
  payrollYear: number;
  lotCapId?: string; // Reference to LOT Master
  lotCapAmount?: number;
  payrollStatus?: PayrollItemStatusEnum; // Optional status (PENDING or PAID)
  branchId?: string;
  branchName?: string;
  paymentMode?: PaymentModeEnum | string;
  items: BulkPayrollItemDto[];
}

/**
 * Create Payroll Master DTO (for two-step flow)
 */
export interface CreatePayrollMasterDto {
  payrollMonth: number;
  payrollYear: number;
  startDate: string;
  endDate: string;
  lotCapId: string;
}

/**
 * Payroll Entity
 */
export interface IPayroll {
  _id: string;
  lotCapAmount: number;
  userId: string | IUserRef;
  periodMonth: number; // 1-12
  periodYear: number;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  amount: number;
  currency: CurrencyEnum | string;
  paymentMode: PaymentModeEnum | string;
  bankSnapshot?: string;
  lotId?: string;
  notes?: string;
  status: PayrollStatusEnum | string;
  paidAt?: string;
  createdBy?: string | IUserRef;
  approvedBy?: string | IUserRef;
  createdAt: string;
  updatedAt: string;
}

// Payroll master (batch) with totals
export interface IPayrollMaster {
  _id: string;
  payrollMonth: number;
  payrollYear: number;
  startDate: string;
  endDate: string;
  branchId?: string | { _id: string; branchName: string };
  branchName?: string;
  paymentMode?: string;
  lotCapId: string | { _id: string; name: string; lotCapAmount: number };
  lotCapAmount: number;
  totalGrossAmount: number;
  totalNetAmount: number;
  totalEmployee: number;
  payrollStatus?: PayrollItemStatusEnum | string;
  createdAt: string;
  updatedAt: string;
}

// Payroll master item (employee row)
export interface IPayrollItem {
  _id: string;
  userId: string | IUserRef;
  payrollId: string;
  lotBatchId?: string;
  lotBatch?: Partial<IPayrollLot>;
  grossSalary: number;
  baseSalary: number;
  advanceId?: string;
  deductedAdvance: number;
  netSalary: number;
  currency: CurrencyEnum | string;
  paymentMode: PaymentModeEnum | string;
  bankAccountDetails?: IBankAccount;
  totalWorkingDays?: number;
  incentive?: number;
  status: PayrollItemStatusEnum | string;
  paidAt?: string;
  branchId?: string;
  branchName?: string;
  createdBy?: string | IUserRef;
  createdAt: string;
  updatedAt: string;
}

export interface IPayrollDetailResponse {
  payroll: IPayrollMaster;
  items: IPayrollItem[];
}

/**
 * Payroll LOT Entity
 */
export interface IPayrollLotItem {
  _id: string;
  payrollItemId?: string;
  userId: string;
  fullName: string;
  email: string;
  employeeId?: string;
  grossSalary: number;
  baseSalary: number;
  netSalary: number;
  deductedAdvance: number;
  currency: CurrencyEnum | string;
  paymentMode: PaymentModeEnum | string;
  status: PayrollItemStatusEnum | string;
  totalWorkingDays?: number;
  lotBatchId?: string;
  branchId?: string;
  branchName?: string;
  paidAt?: string;
}

export interface IPayrollLot {
  _id: string;
  payrollId: string;
  branchId?: string;
  branchName?: string;
  lotNumber: number;
  totalAmount: number;
  lotCapAmount?: number;
  limitAmount: number;
  usedAmount?: number;
  remainingAmount?: number;
  paidEmployees?: number;
  unpaidEmployees?: number;
  availableCashAmount: number;
  remainingBalance: number;
  currency: CurrencyEnum | string;
  status: PayrollLotStatusEnum | string;
  lotBatchStatus?: string;
  payrollIds: string[];
  payrollCount: number;
  employeeCount: number;
  createdBy?: string | IUserRef;
  paymentDate?: string;
  closedAt?: string;
  notes?: string;
  items?: IPayrollLotItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Zod Schema for bulk payroll item
 */
export const bulkPayrollItemSchema = z.object({
  userId: z.string().min(1, "User is required"),
  grossSalary: z.number().min(0, "Gross salary must be non-negative"),
  baseSalary: z.number().min(0, "Base salary must be non-negative"),
  netSalary: z.number().min(0, "Net salary must be non-negative"),
  currency: z.nativeEnum(CurrencyEnum),
  paymentMode: z.nativeEnum(PaymentModeEnum),
  bankAccountDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifsc: z.string().optional(),
    bankHolderName: z.string().optional(),
    branchDetails: z.string().optional(),
  }).optional(),
  advanceId: z.string().optional(),
  deductedAdvance: z.number().min(0).optional(),
  totalWorkingDays: z.number().int().min(0).max(31).optional(),
  otherDeduction: z.number().min(0).optional(),
  otherDeductionRemark: z.string().optional(),
  incentive: z.number().min(0).optional(),
  payrollId: z.string().optional(),
  sequenceIndex: z.number().min(0).optional(),
});

/**
 * Zod Schema for creating bulk payroll
 */
export const createBulkPayrollSchema = z.object({
  payrollMonth: z.number().int().min(1).max(12, "Month must be 1-12"),
  payrollYear: z.number().int().min(2000, "Year must be 2000 or later"),
  branchId: z.string().optional(),
  branchName: z.string().optional(),
  paymentMode: z.nativeEnum(PaymentModeEnum).optional(),
  lotCapId: z.string().optional(),
  lotCapAmount: z.number().min(0, "LOT Cap Amount must be non-negative").optional(),
  payrollStatus: z.nativeEnum(PayrollItemStatusEnum).optional(),
  items: z.array(bulkPayrollItemSchema).min(1, "At least one employee is required"),
});

/**
 * Zod Schema for creating payroll master
 */
export const createPayrollMasterSchema = z.object({
  payrollMonth: z.number().int().min(1).max(12),
  payrollYear: z.number().int().min(2000),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  lotCapId: z.string().min(1, "LOT Cap Master is required"),
});

/**
 * Zod Schema for creating a single payroll
 */
export const createPayrollSchema = z.object({
  userId: z.string().min(1, "User is required"),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  amount: z.number().min(0, "Amount must be non-negative"),
  currency: z.nativeEnum(CurrencyEnum),
  paymentMode: z.nativeEnum(PaymentModeEnum),
  bankSnapshot: z.string().optional(),
  lotId: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Zod Schema for bulk creating payrolls (legacy)
 */
export const bulkCreatePayrollSchema = z.object({
  payrolls: z.array(createPayrollSchema).min(1),
});

/**
 * Zod Schema for updating payroll status
 */
export const updatePayrollStatusSchema = z.object({
  status: z.enum([
    PayrollStatusEnum.PENDING,
    PayrollStatusEnum.PAID,
    PayrollStatusEnum.FAILED,
  ]),
  paidAt: z.string().datetime().optional(),
});

/**
 * Zod Schema for creating a LOT manually
 */
export const createPayrollLotSchema = z.object({
  limitAmount: z.number().min(0, "Limit amount must be non-negative"),
  currency: z.nativeEnum(CurrencyEnum),
  notes: z.string().optional(),
});

/**
 * Zod Schema for auto-generating LOTs
 */
export const autoGenerateLotsSchema = z.object({
  payrollId: z.string().min(1, "Payroll is required"),
  branchId: z.string().optional(),
  employeeIds: z.array(z.string().min(1)).optional(),
  lotCapAmount: z.number().min(0, "LOT cap amount cannot be negative"),
});

/**
 * Zod Schema for adding payroll to LOT
 */
export const addPayrollToLotSchema = z.object({
  payrollId: z.string().min(1),
  lotId: z.string().min(1),
});

export const markLotPaidSchema = z.object({
  employeeIds: z.array(z.string().min(1)).optional(),
  markAll: z.boolean().optional(),
});

export const addEmployeeToLotSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  branchId: z.string().optional(),
});

export type CreatePayrollSchema = z.infer<typeof createPayrollSchema>;
export type BulkCreatePayrollSchema = z.infer<typeof bulkCreatePayrollSchema>;
export type CreateBulkPayrollSchema = z.infer<typeof createBulkPayrollSchema>;
export type CreatePayrollMasterSchema = z.infer<typeof createPayrollMasterSchema>;
export type BulkPayrollItemSchema = z.infer<typeof bulkPayrollItemSchema>;
export type UpdatePayrollStatusSchema = z.infer<typeof updatePayrollStatusSchema>;
export type CreatePayrollLotSchema = z.infer<typeof createPayrollLotSchema>;
export type AutoGenerateLotsSchema = z.infer<typeof autoGenerateLotsSchema>;
export type AddPayrollToLotSchema = z.infer<typeof addPayrollToLotSchema>;
export type MarkLotPaidSchema = z.infer<typeof markLotPaidSchema>;
export type AddEmployeeToLotSchema = z.infer<typeof addEmployeeToLotSchema>;

export interface IGeneratePayrollLotsResponse {
  totalLots: number;
  distributedAmount?: number;
  pendingAmount?: number;
  lots: IPayrollLot[];
}

/**
 * API Response Types
 */
export interface IPayrollListResponse {
  data: IPayroll[];
  total: number;
  page: number;
  pages: number;
}

export interface IPayrollLotListResponse {
  data: IPayrollLot[];
  total: number;
  page: number;
  pages: number;
}

export interface IPayrollApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Payroll Items by Branch Response Types
 */
export interface IAdvancePayrollDetails {
  advanceMasterId?: string;
  advanceId?: string;
  advanceAmount?: number;
  advanceStatus?: string;
  advanceReason?: string;
  appliedDate?: string;
  totalAmount?: number;
  totalDeducted?: number;
  totalRemaining?: number;
  /** Sum of monthly installments for active loans (payroll auto-deduction). */
  monthlyInstallmentTotal?: number;
  status?: string;
  createdAt?: string;
}

export interface IBranchRef {
  _id: string;
  name?: string;
  branchName?: string;
  location?: string;
  code?: string;
}

export interface ICompanyRef {
  _id: string;
  name?: string;
  companyName?: string;
  registrationNumber?: string;
}

export interface IRoleRef {
  _id: string;
  name: string;
  type?: string;
}

export interface IPayrollUserDetails {
  _id: string;
  fullName: string;
  email: string;
  employeeId?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  branch?: IBranchRef;
  company?: ICompanyRef;
  role?: IRoleRef;
}

export interface IPayrollItemByBranch {
  userDetails: IPayrollUserDetails;
  grossSalary: number;
  netSalary: number;
  baseSalary: number | null;
  advanceSalary: number;
  advancePayrollDetails: IAdvancePayrollDetails | null;
  payrollStatus: string;
  currency: string | null;
  paymentMode: string | null;
  bankDetail: IBankAccount | null;
  payrollId: string;
  lotBatchId?: string;
  lotBatch?: Partial<IPayrollLot>;
  /** Present when a payroll item already exists for this period. */
  payrollItemId?: string;
  incentive?: number;
}

export interface IPayrollItemsByBranchResponse {
  message: string;
  data: IPayrollItemByBranch[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface IPayrollExportItem {
  payrollItemId?: string;
  employeeName: string;
  employeeEmail: string;
  grossSalary: number;
  incentive: number;
  deductedAdvance: number;
  netSalary: number;
  currency: string;
  paymentMode: string;
  status: string;
  lotBatchId?: string;
  branchName: string;
  basicSalary: number;
  totalWorkingDays: number;
  totalAdvance: number;
  bankHolderName: string;
  accountNumber: string;
  bankName: string;
  ifsc: string;
}

export interface IPayrollExportLotBatch {
  lotBatchId: string;
  lotNumber: number;
  lotCapAmount: number;
  totalAmount: number;
  usedAmount?: number;
  remainingAmount?: number;
  paidEmployees?: number;
  unpaidEmployees?: number;
  status?: string;
  lotBatchStatus?: string;
  itemCount: number;
  items: IPayrollExportItem[];
}

export interface IPayrollExportData {
  fileName: string;
  format: "pdf" | "excel";
  payroll: {
    id: string;
    payrollMonth: number;
    payrollYear: number;
    lotName: string;
    lotCapAmount: number;
    totalGrossAmount: number;
    totalNetAmount: number;
    totalEmployee: number;
    createdAt: string;
  };
  items: IPayrollExportItem[];
  lotBatches: IPayrollExportLotBatch[];
}
