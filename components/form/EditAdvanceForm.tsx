"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateAdvance } from "@/hooks/query/useAdvancePayroll";
import { CurrencyEnum, PaymentModeEnum } from "@/types";
import { IAdvancePayroll } from "@/types/advance-payroll.type";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const editAdvanceSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.nativeEnum(CurrencyEnum),
  note: z.string().optional(),
  advanceDate: z.string().optional(),
  paymentMode: z.nativeEnum(PaymentModeEnum),
});

type EditAdvanceSchema = z.infer<typeof editAdvanceSchema>;

interface EditAdvanceFormProps {
  advance: IAdvancePayroll;
  onSuccess?: () => void;
}

export function EditAdvanceForm({ advance, onSuccess }: EditAdvanceFormProps) {
  const updateMutation = useUpdateAdvance();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditAdvanceSchema>({
    resolver: zodResolver(editAdvanceSchema),
    defaultValues: {
      amount: Number(advance.amount) || 0,
      currency: (advance.currency as CurrencyEnum) || CurrencyEnum.INR,
      note: advance.notes ?? (advance as any).note ?? "",
      advanceDate: (advance as any).advanceDate
        ? new Date((advance as any).advanceDate).toISOString().slice(0, 10)
        : "",
      paymentMode: (advance.paymentMode as PaymentModeEnum) || PaymentModeEnum.CASH,
    },
  });

  const onSubmit = (data: EditAdvanceSchema) => {
    const payload = {
      amount: data.amount,
      currency: data.currency,
      note: data.note?.trim() || undefined,
      remark: data.note?.trim() || undefined,
      advanceDate: data.advanceDate ? new Date(data.advanceDate).toISOString() : undefined,
      paymentMode: data.paymentMode,
    };
    updateMutation.mutate(
      { id: advance._id, data: payload },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step={0.01}
                {...register("amount", { valueAsNumber: true })}
                className="w-full"
              />
              {errors.amount && (
                <p className="text-xs text-red-600">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Repayment (months)</Label>
              <p className="text-sm font-medium text-gray-800 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                {(advance as any).repaymentMonths ?? "—"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Installment / month</Label>
              <p className="text-sm font-medium text-gray-800 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                {(advance as any).monthlyInstallment != null
                  ? Number((advance as any).monthlyInstallment).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })
                  : "—"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                {...register("currency")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(CurrencyEnum).map(([k, v]) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <select
                id="paymentMode"
                {...register("paymentMode")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={PaymentModeEnum.CASH}>Cash</option>
                <option value={PaymentModeEnum.ACCOUNT}>Account</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="advanceDate">Advance Date</Label>
              <Input
                id="advanceDate"
                type="date"
                {...register("advanceDate")}
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Notes</Label>
            <textarea
              id="note"
              {...register("note")}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Updating..." : "Update Loan"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
