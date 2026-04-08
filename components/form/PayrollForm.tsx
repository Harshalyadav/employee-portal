"use client";

import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/datatable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { useRoles } from "@/hooks/query/role.hook";
import { useInfiniteBranches } from "@/hooks/query/useBranch";
import { useUsersByBranch } from "@/hooks/query/user.hook";
import { getActiveLotMasters } from "@/service/lot-master.service";
import PayrollService from "@/service/payroll.service";
import {
  Column,
  CreateBulkPayrollSchema,
  CurrencyEnum,
  PaymentModeEnum,
} from "@/types";
import { LotMaster } from "@/types/lot-master.type";
import { ArrowLeft, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface PayrollFormProps {
  onSuccess?: () => void;
}

export function PayrollForm({ onSuccess }: PayrollFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedEmployeeType, setSelectedEmployeeType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [lotCapId, setLotCapId] = useState<string>("");
  const [advanceAmounts, setAdvanceAmounts] = useState<Record<string, number>>(
    {},
  );
  const [lockedEmployees, setLockedEmployees] = useState<Set<string>>(
    new Set(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lots, setLots] = useState<LotMaster[]>([]);
  const [isLoadingLots, setIsLoadingLots] = useState(false);

  // Fetch payroll LOTs from LOT Master API on component mount
  useEffect(() => {
    const fetchLots = async () => {
      try {
        setIsLoadingLots(true);
        const response = await getActiveLotMasters();
        setLots(response.data || []);
      } catch (error) {
        console.error("Failed to fetch LOTs:", error);
        toast.error("Failed to load payroll LOTs");
      } finally {
        setIsLoadingLots(false);
      }
    };

    fetchLots();
  }, []);

  // Fetch branches
  const {
    data: branchPages,
    hasNextPage: hasNextBranchPage,
    fetchNextPage: fetchNextBranchPage,
    isFetchingNextPage: isFetchingNextBranchPage,
  } = useInfiniteBranches(100);

  useEffect(() => {
    if (hasNextBranchPage && !isFetchingNextBranchPage) {
      fetchNextBranchPage();
    }
  }, [hasNextBranchPage, isFetchingNextBranchPage, fetchNextBranchPage]);

  const availableBranches = useMemo(() => {
    const raw = (branchPages?.pages || []).flatMap((p) => p.data ?? []);
    const map = new Map<string, (typeof raw)[number]>();
    for (const b of raw) {
      const key = b?._id;
      if (key && !map.has(key)) {
        map.set(key, b);
      }
    }
    return Array.from(map.values());
  }, [branchPages]);

  // Fetch employee types (roles)
  const { data: rolesData } = useRoles(1, 100);

  const availableRoles = useMemo(() => {
    return rolesData?.data || [];
  }, [rolesData]);

  // Fetch users by selected branch
  const { data: usersData, isLoading: isLoadingUsers } = useUsersByBranch(
    selectedBranch,
    1,
    100,
  );

  const employees = useMemo(() => {
    let filtered = usersData?.data || [];

    // Filter by role/employee type if selected
    if (selectedEmployeeType) {
      filtered = filtered.filter((emp) =>
        typeof emp.roleId === "string"
          ? emp.roleId === selectedEmployeeType
          : emp.roleId?._id === selectedEmployeeType,
      );
    }

    return filtered;
  }, [usersData, selectedEmployeeType]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select salary period dates");
      return;
    }

    if (!lotCapId) {
      toast.error("Please select a payroll LOT");
      return;
    }

    if (employees.length === 0) {
      toast.error("No employees available for the selected criteria");
      return;
    }

    try {
      setIsSubmitting(true);

      // Find the selected LOT to get the lotCapAmount
      const selectedLot = lots.find((lot) => lot._id === lotCapId);
      if (!selectedLot) {
        toast.error("Selected LOT not found");
        return;
      }

      // Create bulk payroll data according to CreateBulkPayrollDto schema
      const bulkPayrollData: CreateBulkPayrollSchema = {
        payrollMonth: new Date(startDate).getMonth() + 1,
        payrollYear: new Date(startDate).getFullYear(),
        lotCapAmount: selectedLot.lotCapAmount,
        lotCapId: lotCapId,
        items: employees.map((emp) => ({
          userId: emp._id,
          baseSalary: emp.baseSalary || 0,
          grossSalary: emp.baseSalary || 0,
          netSalary: emp.baseSalary || 0,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          deductedAdvance: advanceAmounts[emp._id] || 0,
          currency: emp.currency as CurrencyEnum,
          paymentMode: emp.paymentMode as PaymentModeEnum,
          bankAccountDetails: emp.bankAccount || undefined,
        })),
      };

      // Submit bulk payroll using the correct API
      await PayrollService.createBulkPayrollWithItems(bulkPayrollData);

      toast.success(`Payroll created for ${employees.length} employees`);

      queryClient.invalidateQueries({ queryKey: ["payroll"] });

      // Reset form
      setSelectedBranch("");
      setSelectedEmployeeType("");
      setStartDate("");
      setEndDate("");
      setLotCapId("");
      setAdvanceAmounts({});

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/payroll");
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create payroll";
      toast.error(message);
      console.error("Payroll creation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define table columns
  const columns: Column[] = [
    {
      id: "fullName",
      label: "Employee Name",
      width: "20%",
      renderCell: (value: any) => <span className="font-medium">{value}</span>,
    },
    {
      id: "_id",
      label: "Employee ID",
      width: "15%",
      renderCell: (value: any) => (
        <span className="text-sm text-muted-foreground">{value}</span>
      ),
    },
    {
      id: "currency",
      label: "Currency",
      width: "12%",
      renderCell: (value: any) => (
        <span className="font-semibold">{value || "AED"}</span>
      ),
    },
    {
      id: "baseSalary",
      label: "Salary",
      width: "15%",
      renderCell: (value: any) => (
        <span className="text-right font-medium">
          {value?.toFixed(2) || "0.00"}
        </span>
      ),
      align: "right",
    },
    {
      id: "advance",
      label: "Advance",
      width: "15%",
      renderCell: (_: any, row: any) => (
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={advanceAmounts[row._id] || ""}
          onChange={(e) =>
            setAdvanceAmounts((prev) => ({
              ...prev,
              [row._id]: parseFloat(e.target.value) || 0,
            }))
          }
          disabled={lockedEmployees.has(row._id)}
          className="w-[120px]"
        />
      ),
    },
    {
      id: "action",
      label: "Action",
      width: "12%",
      align: "center",
      renderCell: (_: any, row: any) => (
        <Button
          type="button"
          size="sm"
          variant={lockedEmployees.has(row._id) ? "default" : "outline"}
          onClick={() => {
            const newLocked = new Set(lockedEmployees);
            if (newLocked.has(row._id)) {
              newLocked.delete(row._id);
            } else {
              newLocked.add(row._id);
            }
            setLockedEmployees(newLocked);
          }}
          className="gap-2"
        >
          <Lock className="w-4 h-4" />
          {lockedEmployees.has(row._id) ? "Locked" : "Lock"}
        </Button>
      ),
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Create Payroll</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Payroll</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Branch Filter */}
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Combobox
                items={availableBranches.map((branch) => ({
                  value: branch._id,
                  label: branch.branchCode ? `${branch.branchCode} - ${branch.branchName}` : branch.branchName,
                }))}
                value={selectedBranch || undefined}
                onChange={(value) => {
                  const branchId = typeof value === "string" ? value : "";
                  setSelectedBranch(branchId);
                  setSelectedEmployeeType("");
                  setStartDate("");
                  setEndDate("");
                }}
                placeholder="Select a branch"
                emptyLabel="Clear branch"
                className="w-full"
              />
            </div>

            {/* Employee Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="employeeType">Employee Type</Label>
              <select
                id="employeeType"
                value={selectedEmployeeType}
                onChange={(e) => setSelectedEmployeeType(e.target.value)}
                disabled={!selectedBranch}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Types</option>
                {availableRoles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.roleName}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary From Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Salary From</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!selectedBranch}
                className="disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Salary To Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">Salary To</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={!selectedBranch}
                className="disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {/* Payroll LOT */}
            <div className="space-y-2">
              <Label htmlFor="lotCapId">Payroll LOT *</Label>
              <select
                id="lotCapId"
                value={lotCapId}
                onChange={(e) => setLotCapId(e.target.value)}
                disabled={isLoadingLots}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {isLoadingLots ? "Loading LOTs..." : "Select a LOT"}
                </option>
                {lots.map((lot) => (
                  <option key={lot._id} value={lot._id}>
                    {lot.name} - {lot.lotCapAmount.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employees Table */}
          {selectedBranch ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Employees ({employees.length})
                </h3>
              </div>

              {isLoadingUsers ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading employees...</p>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No employees found for this branch
                  </p>
                </div>
              ) : (
                <DataTable columns={columns} rows={employees} />
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Select a branch to view employees
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedBranch ||
                employees.length === 0 ||
                !lotCapId
              }
            >
              {isSubmitting ? "Creating..." : "Create Payroll"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default PayrollForm;
