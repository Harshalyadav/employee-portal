"use client";

import EmployeeBankDetailsRouteFrame from "@/components/pages/employee-bank-details/EmployeeBankDetailsRouteFrame";
import EmployeePayrollPage from "@/components/pages/employee-payroll/EmployeePayrollPage";

export default function EmployeePayrollRoutePage() {
  return (
    <EmployeeBankDetailsRouteFrame title="Payroll">
      <EmployeePayrollPage />
    </EmployeeBankDetailsRouteFrame>
  );
}