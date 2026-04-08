"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateAdvance } from "@/hooks/query/useAdvancePayroll";
import { useInfiniteBranches } from "@/hooks/query/useBranch";
import { useUsersByBranch, useUserById } from "@/hooks/query/user.hook";
import {
  createAdvanceSchema,
  type CreateAdvanceSchema,
  CurrencyEnum,
  PaymentModeEnum,
} from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function AdvancePayrollForm({ onSuccess }: { onSuccess?: () => void }) {
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { data: branchesPages } = useInfiniteBranches(100);
  const { data: usersData, isLoading: isLoadingUsers } = useUsersByBranch(
    selectedBranch,
    1,
    100,
  );
  const { data: selectedUserData, isLoading: isLoadingUserDetails } =
    useUserById(selectedUserId);
  const createAdvanceMutation = useCreateAdvance();

  const availableBranches = useMemo(() => {
    const raw = (branchesPages?.pages || []).flatMap((p) => p.data ?? []);
    const map = new Map<string, (typeof raw)[number]>();
    for (const b of raw) {
      const key = b?._id;
      if (key && !map.has(key)) {
        map.set(key, b);
      }
    }
    return Array.from(map.values());
  }, [branchesPages]);

  const employees = useMemo(() => {
    return (usersData?.data || []).map((emp) => {
      const e = emp as any;
      const displayEmpId =
        e.employeeId ||
        e.uniqueWorkerId ||
        e.displayEmployeeId ||
        (e._id ? `EMP-${String(e._id).slice(-6)}` : undefined);
      return {
      userId: emp._id,
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      employeeId: displayEmpId ?? e.employeeId,
      uniqueWorkerId: e.uniqueWorkerId,
      displayEmployeeId: e.displayEmployeeId,
      baseSalary: emp.baseSalary,
      currency: emp.currency,
      paymentMode: emp.paymentMode,
      bankAccount: emp.bankAccount,
      status: (emp as any).status,
      roleId: (emp as any).roleId,
      branchId: (emp as any).branchId,
      companyId: (emp as any).companyId,
      personalInfo: (emp as any).personalInfo,
      contactInfo: (emp as any).contactInfo,
      employmentInfo: (emp as any).employmentInfo,
      documentInfo: (emp as any).documentInfo,
      paymentModeDetails: (emp as any).paymentMode,
      refreshToken: emp.refreshToken,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
      __v: emp.__v,
      latestAdvancePayroll: emp.latestAdvancePayroll,
      advanceHistory: (emp as any).advanceHistory,
    };
    });
  }, [usersData]);

  const selectedEmployee = useMemo(() => {
    // Prefer fetched user details if available, otherwise fall back to list data
    if (selectedUserData) {
      // selectedUserData has nested structure from the API
      const userData = selectedUserData as any;
      const emp = userData.employmentInfo;
      const displayEmpId =
        emp?.employeeId ||
        emp?.uniqueWorkerId ||
        emp?.displayEmployeeId ||
        (userData._id ? `EMP-${String(userData._id).slice(-6)}` : undefined);
      return {
        userId: userData._id,
        fullName: userData.personalInfo?.fullName,
        email: userData.contactInfo?.email,
        phone: userData.contactInfo?.phone,
        employeeId: displayEmpId,
        baseSalary: userData.employmentInfo?.basicSalary,
        currency: userData.employmentInfo?.currency,
        paymentMode: userData.paymentMode?.mode,
        bankAccount: userData.paymentMode?.bankAccount,
        status: userData.status,
        roleId: userData.employmentInfo?.roleId,
        branchId: userData.employmentInfo?.branchId,
        companyId: userData.employmentInfo?.companyId,
        personalInfo: userData.personalInfo,
        contactInfo: userData.contactInfo,
        employmentInfo: userData.employmentInfo,
        documentInfo: userData.documentInfo,
        paymentModeDetails: userData.paymentMode,
        refreshToken: userData.refreshToken,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        __v: userData.__v,
        latestAdvancePayroll: userData.latestAdvancePayroll,
        advanceHistory: userData.advanceHistory,
      };
    }
    return employees.find((emp) => emp.userId === selectedUserId);
  }, [selectedUserData, employees, selectedUserId]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAdvanceSchema>({
    resolver: zodResolver(createAdvanceSchema),
    defaultValues: {
      paymentMode: PaymentModeEnum.CASH,
      currency: CurrencyEnum.INR,
      repaymentMonths: 4,
    },
  });

  const amountWatch = watch("amount");
  const monthsWatch = watch("repaymentMonths");
  const perMonthPreview = useMemo(() => {
    const amt = Number(amountWatch);
    const m = Math.max(1, Math.floor(Number(monthsWatch) || 1));
    if (!amt || !Number.isFinite(amt)) return null;
    return Math.round((amt / m) * 100) / 100;
  }, [amountWatch, monthsWatch]);

  const onSubmit = (data: CreateAdvanceSchema) => {
    if (!selectedEmployee) {
      toast.error("Please select an employee first");
      return;
    }

    // Build payload with user's default data and form inputs
    const payload: any = {
      userId: selectedEmployee.userId,
      amount: data.amount,
      repaymentMonths: data.repaymentMonths,
      currency: selectedEmployee.currency || CurrencyEnum.INR,
      paymentMode: selectedEmployee.paymentMode || PaymentModeEnum.CASH,
    };

    // Add notes if provided
    if (data.notes && data.notes.trim() !== "") {
      payload.notes = data.notes;
    }

    // Add advance date if provided
    if (data.advanceDate) {
      payload.advanceDate = data.advanceDate;
    }

    // Add bank account details if payment mode is bank-based
    const isBank =
      payload.paymentMode === PaymentModeEnum.ACCOUNT ||
      String(payload.paymentMode).toUpperCase() === "BANK";

    if (isBank && selectedEmployee.bankAccount) {
      payload.bankAccount = selectedEmployee.bankAccount;
    }

    createAdvanceMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Loan created successfully");
        onSuccess?.();
      },
      onError: (err: any) => {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create loan";
        toast.error(message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Loan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="branch">Select Branch</Label>
              <Combobox
                items={availableBranches.map((branch) => ({
                  value: branch._id,
                  label: branch.branchName,
                }))}
                value={selectedBranch || undefined}
                onChange={(value) => {
                  const branchId = typeof value === "string" ? value : "";
                  setSelectedBranch(branchId);
                  setSelectedUserId("");
                  setValue("userId", "");
                }}
                placeholder="Select Branch..."
                emptyLabel="Clear branch"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">Employee</Label>
              <select
                id="userId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={!selectedBranch || isLoadingUsers}
                {...register("userId")}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setValue("userId", e.target.value);
                }}
              >
                <option value="">Select employee...</option>
                {employees.map((emp) => (
                  <option key={emp.userId} value={emp.userId}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
              {errors.userId && (
                <p className="text-xs text-red-600">{errors.userId.message}</p>
              )}
            </div>
          </div>

          {/* User Details Section */}
          {selectedEmployee && (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-6">
              {isLoadingUserDetails && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              )}
              {!isLoadingUserDetails && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Employee Details</h3>
                    <button
                      type="button"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-sm font-bold text-blue-500 hover:text-blue-700 hover:underline transition-all active:scale-95"
                    >
                      {isExpanded ? "View Less" : "View More"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-gray-600">Employee ID</Label>
                      <p className="text-sm font-medium">
                        {selectedEmployee.employeeId ||
                          (selectedEmployee as any).uniqueWorkerId ||
                          (selectedEmployee as any).displayEmployeeId ||
                          (selectedEmployee.userId
                            ? `EMP-${String(selectedEmployee.userId).slice(-6)}`
                            : "N/A")}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-600">Currency</Label>
                      <p className="text-sm font-medium">
                        {selectedEmployee.currency || "N/A"}
                      </p>
                    </div>
                    {isExpanded && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Full Name</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.fullName || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Email</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.email || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Phone</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.phone || "N/A"}
                          </p>
                        </div>
                        {selectedEmployee.employmentInfo?.roleId && (
                          <div className="space-y-1">
                            <Label className="text-gray-600">Role</Label>
                            <p className="text-sm font-medium">
                              {typeof selectedEmployee.employmentInfo.roleId ===
                                "object"
                                ? selectedEmployee.employmentInfo.roleId.roleName
                                : "N/A"}
                            </p>
                          </div>
                        )}
                        {selectedEmployee.employmentInfo?.branchId && (
                          <div className="space-y-1">
                            <Label className="text-gray-600">Branch</Label>
                            <p className="text-sm font-medium">
                              {typeof selectedEmployee.employmentInfo.branchId ===
                                "object"
                                ? selectedEmployee.employmentInfo.branchId
                                  .branchName
                                : "N/A"}
                            </p>
                          </div>
                        )}
                        {/* {selectedEmployee.employmentInfo?.companyId && (
                      <div className="space-y-1">
                        <Label className="text-gray-600">Company</Label>
                        <p className="text-sm font-medium">
                          {typeof selectedEmployee.employmentInfo.companyId ===
                          "object"
                            ? selectedEmployee.employmentInfo.companyId
                                .legalName
                            : "N/A"}
                        </p>
                      </div>
                    )} */}
                        <div className="space-y-1">
                          <Label className="text-gray-600">Basic Salary</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.baseSalary
                              ? `${selectedEmployee.currency || "INR"} ${selectedEmployee.baseSalary.toLocaleString()}`
                              : "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Payment Mode</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.paymentMode || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Status</Label>
                          <p className="text-sm font-medium">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedEmployee.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {selectedEmployee.status?.toUpperCase() || "N/A"}
                            </span>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Account Created</Label>
                          <p className="text-sm font-medium">
                            {new Date(
                              selectedEmployee.createdAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Last Updated</Label>
                          <p className="text-sm font-medium">
                            {new Date(
                              selectedEmployee.updatedAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Personal Information Section */}
                  {isExpanded && selectedEmployee.personalInfo && (
                    <div className="pt-6 border-t border-gray-200 space-y-4">
                      <h4 className="font-semibold text-base">
                        Personal Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <Label className="text-gray-600">Date of Birth</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.personalInfo.dob
                              ? new Date(
                                selectedEmployee.personalInfo.dob,
                              ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Blood Group</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.personalInfo.bloodGroup || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Gender</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.personalInfo.gender || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Nationality</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.personalInfo.nationality || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Account Details */}
                  {isExpanded && selectedEmployee.bankAccount && (
                    <div className="pt-6 border-t border-gray-200 space-y-4">
                      <h4 className="font-semibold text-base">
                        Bank Account Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <Label className="text-gray-600">Bank Name</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.bankAccount.bankName || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">
                            Account Number
                          </Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.bankAccount.accountNumber ||
                              "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">IFSC</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.bankAccount.ifsc || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Latest Advance Payroll Section */}
                  {isExpanded && selectedEmployee.latestAdvancePayroll && (
                    <div className="pt-6 border-t border-gray-200 space-y-4">
                      <h4 className="font-semibold text-base">
                        Latest Loan Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <Label className="text-gray-600">Loan ID</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.latestAdvancePayroll._id}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Amount</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.latestAdvancePayroll.currency}{" "}
                            {selectedEmployee.latestAdvancePayroll.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Status</Label>
                          <p className="text-sm font-medium">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedEmployee.latestAdvancePayroll.status ===
                                  "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : selectedEmployee.latestAdvancePayroll
                                    .status === "APPROVED"
                                    ? "bg-green-100 text-green-800"
                                    : selectedEmployee.latestAdvancePayroll
                                      .status === "REPAID"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                            >
                              {selectedEmployee.latestAdvancePayroll.status}
                            </span>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">
                            Deduction Status
                          </Label>
                          <p className="text-sm font-medium">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedEmployee.latestAdvancePayroll
                                  .deductionStatus === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : selectedEmployee.latestAdvancePayroll
                                    .deductionStatus === "IN_PROGRESS"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                            >
                              {selectedEmployee.latestAdvancePayroll
                                .deductionStatus || "PENDING"}
                            </span>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">
                            Total Deducted Amount
                          </Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.latestAdvancePayroll.currency}{" "}
                            {(
                              selectedEmployee.latestAdvancePayroll
                                .totalDeductedAmount || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">
                            Remaining Amount
                          </Label>
                          <p className="text-sm font-medium">
                            <span
                              className={
                                selectedEmployee.latestAdvancePayroll
                                  .remainingAmount > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
                              {selectedEmployee.latestAdvancePayroll.currency}{" "}
                              {(
                                selectedEmployee.latestAdvancePayroll
                                  .remainingAmount || 0
                              ).toLocaleString()}
                            </span>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Payment Mode</Label>
                          <p className="text-sm font-medium">
                            {selectedEmployee.latestAdvancePayroll.paymentMode}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-gray-600">Created At</Label>
                          <p className="text-sm font-medium">
                            {new Date(
                              selectedEmployee.latestAdvancePayroll.createdAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {isExpanded && selectedEmployee && (
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 space-y-4">
              {/* <h4 className="font-semibold text-sm text-blue-900">
                Default Values (Auto-populated)
              </h4> */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <Label className="text-blue-700 text-xs">Currency</Label>
                  <p className="font-medium text-blue-900">
                    {selectedEmployee.currency || "INR"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-blue-700 text-xs">Payment Mode</Label>
                  <p className="font-medium text-blue-900">
                    {selectedEmployee.paymentMode || "CASH"}
                  </p>
                </div>
                {selectedEmployee.bankAccount && (
                  <div className="space-y-1">
                    <Label className="text-blue-700 text-xs">
                      Bank Account
                    </Label>
                    <p className="font-medium text-blue-900">
                      {selectedEmployee.bankAccount.bankName} -{" "}
                      {selectedEmployee.bankAccount.accountNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Enter amount"
                disabled={!selectedEmployee}
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-xs text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="repaymentMonths">
                Repayment (months) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="repaymentMonths"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 4"
                disabled={!selectedEmployee}
                {...register("repaymentMonths", { valueAsNumber: true })}
              />
              {errors.repaymentMonths && (
                <p className="text-xs text-red-600">{errors.repaymentMonths.message}</p>
              )}
              {perMonthPreview != null && selectedEmployee && (
                <p className="text-xs text-gray-600">
                  Per payroll month:{" "}
                  <span className="font-semibold text-gray-900">
                    {selectedEmployee.currency || CurrencyEnum.INR}{" "}
                    {perMonthPreview.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Remark</Label>
              <Input
                id="notes"
                type="text"
                placeholder="Optional remark"
                disabled={!selectedEmployee}
                {...register("notes")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="advanceDate">Advance Date</Label>
              <Input
                id="advanceDate"
                type="date"
                disabled={!selectedEmployee}
                {...register("advanceDate")}
              />
            </div>
            <div></div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={createAdvanceMutation.isPending || !selectedEmployee}
              >
                {createAdvanceMutation.isPending
                  ? "Creating..."
                  : "Create Advance"}
              </Button>
            </div>
          </div>

          {/* Advance History Section */}
          {selectedEmployee &&
            selectedEmployee.advanceHistory &&
            selectedEmployee.advanceHistory.length > 0 && (
              <div className="rounded-lg space-y-4">
                <h4 className="font-semibold text-lg">
                  Advance History ({selectedEmployee.advanceHistory.length})
                </h4>
                <div className="space-y-4">
                  {selectedEmployee.advanceHistory.map(
                    (advance: any, index: number) => (
                      <div
                        key={advance._id || index}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* <div className="space-y-1">
                            <Label className="text-gray-600 text-xs">
                              Advance ID
                            </Label>
                            <p className="text-sm font-medium font-mono">
                              {advance._id}
                            </p>
                          </div> */}
                          <div className="space-y-1">
                            <Label className="text-gray-600 text-xs">
                              Amount
                            </Label>
                            <p className="text-sm font-medium">
                              {advance.currency}{" "}
                              {advance.amount.toLocaleString()}
                            </p>
                          </div>
                          {/* <div className="space-y-1">
                            <Label className="text-gray-600 text-xs">
                              Status
                            </Label>
                            <p className="text-sm font-medium">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  advance.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : advance.status === "APPROVED"
                                      ? "bg-green-100 text-green-800"
                                      : advance.status === "REPAID"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-red-100 text-red-800"
                                }`}
                              >
                                {advance.status}
                              </span>
                            </p>
                          </div> */}

                          <div className="space-y-1">
                            <Label className="text-gray-600 text-xs">
                              Total Deducted
                            </Label>
                            <p className="text-sm font-medium">
                              {advance.currency}{" "}
                              {(
                                advance.totalDeductedAmount || 0
                              ).toLocaleString()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-gray-600 text-xs">
                              Remaining
                            </Label>
                            <p className="text-sm font-medium">
                              <span
                                className={
                                  advance.remainingAmount > 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {advance.currency}{" "}
                                {(
                                  advance.remainingAmount || 0
                                ).toLocaleString()}
                              </span>
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-gray-600 text-xs">
                              Deduction Status
                            </Label>
                            <p className="text-sm font-medium">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${advance.deductionStatus === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : advance.deductionStatus === "IN_PROGRESS"
                                      ? "bg-blue-100 text-blue-800"
                                      : advance.deductionStatus ===
                                        "FULLY_DEDUCTED"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                  }`}
                              >
                                {advance.deductionStatus || "PENDING"}
                              </span>
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-gray-600 text-xs">
                              Payment Mode
                            </Label>
                            <p className="text-sm font-medium">
                              {advance.paymentMode}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-gray-600 text-xs">
                              Created At
                            </Label>
                            <p className="text-sm font-medium">
                              {new Date(advance.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-gray-600 text-xs">
                              Updated At
                            </Label>
                            <p className="text-sm font-medium">
                              {new Date(advance.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </form>
  );
}
