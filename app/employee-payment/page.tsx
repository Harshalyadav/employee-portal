"use client";

import EmployeeBankDetailsRouteFrame from "@/components/pages/employee-bank-details/EmployeeBankDetailsRouteFrame";
import EmployeePaymentPage from "@/components/pages/employee-payment/EmployeePaymentPage";

export default function EmployeePaymentRoutePage() {
  return (
    <EmployeeBankDetailsRouteFrame title="Payment">
      <EmployeePaymentPage />
    </EmployeeBankDetailsRouteFrame>
  );
}