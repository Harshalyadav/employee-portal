"use client";

import EmployeeDetailsHistoryPage from "@/components/pages/employee-details/EmployeeDetailsHistoryPage";
import EmployeeBankDetailsRouteFrame from "@/components/pages/employee-bank-details/EmployeeBankDetailsRouteFrame";

export default function EmployeeDetailsPage() {
  return (
    <EmployeeBankDetailsRouteFrame title="Employee Details">
      <EmployeeDetailsHistoryPage />
    </EmployeeBankDetailsRouteFrame>
  );
}