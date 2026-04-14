"use client";

import BankDetailsListPage from "@/components/pages/employee-bank-details/BankDetailsListPage";
import EmployeeBankDetailsRouteFrame from "@/components/pages/employee-bank-details/EmployeeBankDetailsRouteFrame";

export default function BankDetailsRoutePage() {
  return (
    <EmployeeBankDetailsRouteFrame title="Bank Details">
      <BankDetailsListPage />
    </EmployeeBankDetailsRouteFrame>
  );
}