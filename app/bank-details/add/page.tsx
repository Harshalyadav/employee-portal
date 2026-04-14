"use client";

import BankDetailsFormPage from "@/components/pages/employee-bank-details/BankDetailsFormPage";
import EmployeeBankDetailsRouteFrame from "@/components/pages/employee-bank-details/EmployeeBankDetailsRouteFrame";

export default function AddBankDetailsRoutePage() {
  return (
    <EmployeeBankDetailsRouteFrame title="Add Bank Details">
      <BankDetailsFormPage mode="add" />
    </EmployeeBankDetailsRouteFrame>
  );
}
