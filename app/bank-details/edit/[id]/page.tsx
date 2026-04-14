import BankDetailsFormPage from "@/components/pages/employee-bank-details/BankDetailsFormPage";
import EmployeeBankDetailsRouteFrame from "@/components/pages/employee-bank-details/EmployeeBankDetailsRouteFrame";

interface EditBankDetailsRoutePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBankDetailsRoutePage({ params }: EditBankDetailsRoutePageProps) {
  const { id } = await params;

  return (
    <EmployeeBankDetailsRouteFrame title="Edit Bank Details">
      <BankDetailsFormPage mode="edit" recordId={id} />
    </EmployeeBankDetailsRouteFrame>
  );
}
