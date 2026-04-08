import { z } from "zod";
import { CurrencyEnum, PaymentModeEnum, IBankAccount } from "./user.type";
import { IUserRef } from "./payroll.type";

export enum AdvanceStatusEnum {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REPAID = "REPAID",
    REJECTED = "REJECTED",
}

export enum DeductionStatusEnum {
    PENDING = 'pending',
    PARTIALLY_DEDUCTED = 'partially_deducted',
    FULLY_DEDUCTED = 'fully_deducted',
    CANCELLED = 'cancelled',
}

export const AdvanceStatusLabels: Record<DeductionStatusEnum, string> = {
    [DeductionStatusEnum.PENDING]: "Pending",
    [DeductionStatusEnum.CANCELLED]: "Cancelled",
    [DeductionStatusEnum.PARTIALLY_DEDUCTED]: "Partially Deducted",
    [DeductionStatusEnum.FULLY_DEDUCTED]: "Fully Deducted",
};

export interface IAdvancePayroll {
    _id: string;
    userId: string | IUserRef;
    amount: number;
    /** Loan term in months (equal installments). */
    repaymentMonths?: number;
    /** amount / repaymentMonths */
    monthlyInstallment?: number;
    currency: CurrencyEnum | string;
    paymentMode: PaymentModeEnum | string;
    bankAccount?: IBankAccount;
    notes?: string;
    status: AdvanceStatusEnum | string;
    requestedAt: string;
    approvedAt?: string;
    totalDeductedAmount?: number;
    deductionStatus?: DeductionStatusEnum | string;
    remainingAmount?: number;
    advanceDate?: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
}

export const createAdvanceSchema = z
    .object({
        userId: z.string().min(1, "User is required"),
        amount: z.number().positive("Amount must be greater than 0"),
        repaymentMonths: z
            .number({ invalid_type_error: "Repayment months is required" })
            .int("Must be a whole number")
            .min(1, "At least 1 month"),
        currency: z.nativeEnum(CurrencyEnum).default(CurrencyEnum.INR),
        paymentMode: z.nativeEnum(PaymentModeEnum).default(PaymentModeEnum.CASH),
        bankAccount: z
            .object({
                bankName: z.string().optional(),
                accountNumber: z.string().optional(),
                ifsc: z.string().optional(),
            })
            .optional(),
        notes: z.string().optional(),
        advanceDate: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        const isBank =
            data.paymentMode === PaymentModeEnum.ACCOUNT ||
            String(data.paymentMode).toUpperCase() === "BANK";
        if (isBank) {
            const acc = data.bankAccount || {};
            if (!acc.bankName || !acc.accountNumber || !acc.ifsc) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["bankAccount"],
                    message: "Bank details are required for BANK/ACCOUNT payment mode",
                });
            }
        }
    });

export type CreateAdvanceSchema = z.infer<typeof createAdvanceSchema>;

export const updateAdvanceStatusSchema = z.object({
    status: z.nativeEnum(AdvanceStatusEnum),
    notes: z.string().optional(),
});
export type UpdateAdvanceStatusSchema = z.infer<typeof updateAdvanceStatusSchema>;

export interface IPaginatedAdvancesResponse {
    success: boolean;
    statusCode?: number;
    message?: string;
    data: IAdvancePayroll[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
