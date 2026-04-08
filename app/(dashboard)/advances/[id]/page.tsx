"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui";
import PageHeader from "@/components/sections/PageHeader";
import { LoadingState } from "@/components/LoadingState";
import { useAdvance } from "@/hooks/query/useAdvancePayroll";
import { usePermission } from "@/hooks";
import { DeductionStatusEnum, ModuleNameEnum, PermissionAction } from "@/types";
import { ArrowLeft } from "lucide-react";

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString() : "-";

export default function AdvanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermission();
  const id = params?.id as string;

  const canReadAdvance = hasPermission(
    ModuleNameEnum.ADVANCE,
    PermissionAction.READ,
  );

  // If user doesn't have read permission, show access denied
  if (!canReadAdvance) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Loan Details"
          options={
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          }
        />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-sm text-red-700 mb-4">
            You don't have permission to view loan details.
          </p>
          <button
            onClick={() => router.push("/advances")}
            className="text-sm text-red-700 hover:text-red-900 underline"
          >
            Return to Loans
          </button>
        </div>
      </div>
    );
  }

  const { data: advance, isLoading, error } = useAdvance(id);

  if (isLoading) {
    return <LoadingState message="Loading loan details..." />;
  }

  if (error || !advance) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Loan Details"
          options={
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          }
        />
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Failed to load loan.
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = advance.userId as any;
  const employeeName = typeof user === "object" ? user?.fullName : user;
  const employeeEmail = typeof user === "object" ? user?.email : "";
  const bank = advance.bankAccount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan Details"
        options={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <Card>
        {/* <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader> */}
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Employee</p>
            <p className="text-lg font-semibold">{employeeName || "-"}</p>
            {employeeEmail && (
              <p className="text-sm text-muted-foreground">{employeeEmail}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-lg font-semibold">
              {advance.currency ? `${advance.currency} ` : ""}
              {Number(advance.amount || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Repayment (months)</p>
            <p className="text-lg font-semibold">
              {(advance as any).repaymentMonths ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Per month (deduct)</p>
            <p className="text-lg font-semibold">
              {(advance as any).monthlyInstallment != null
                ? `${advance.currency ? `${advance.currency} ` : ""}${Number(
                    (advance as any).monthlyInstallment,
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Deducted</p>
            <p className="text-lg font-semibold">
              {advance.currency ? `${advance.currency} ` : ""}
              {Number(advance.totalDeductedAmount || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p
              className={`text-lg font-semibold ${(advance.remainingAmount || 0) > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {advance.currency ? `${advance.currency} ` : ""}
              {Number(advance.remainingAmount || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payment Mode</p>
            <Badge variant="secondary">{advance.paymentMode || "-"}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Deduction Status</p>
            {(() => {
              const value = advance.deductionStatus;
              const variant =
                value?.toLowerCase() ===
                DeductionStatusEnum.PENDING?.toLowerCase()
                  ? "warning"
                  : value?.toLowerCase() ===
                      DeductionStatusEnum.PARTIALLY_DEDUCTED?.toLowerCase()
                    ? "success"
                    : value?.toLowerCase() ===
                        DeductionStatusEnum.FULLY_DEDUCTED?.toLowerCase()
                      ? "info"
                      : value?.toLowerCase() ===
                          DeductionStatusEnum.CANCELLED?.toLowerCase()
                        ? "destructive"
                        : "secondary";
              return <Badge variant={variant as any}>{value || "-"}</Badge>;
            })()}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created At</p>
            <p className="text-sm font-medium">
              {formatDate(advance.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Updated At</p>
            <p className="text-sm font-medium">
              {formatDate(advance.updatedAt)}
            </p>
          </div>
          <div className="md:col-span-3">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="text-sm font-medium">{advance.notes || "-"}</p>
          </div>
        </CardContent>
      </Card>

      {bank && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Bank Name</p>
              <p className="text-sm font-medium">{bank.bankName || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account Number</p>
              <p className="text-sm font-medium">{bank.accountNumber || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">IFSC</p>
              <p className="text-sm font-medium">{bank.ifsc || "-"}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
