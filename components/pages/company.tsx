"use client";

import { useRouter } from "next/navigation";
import PageHeader from "../sections/PageHeader";
import CompanyTable from "@/components/datatable/company/CompanyTable";
import { Button } from "../ui/button";

const CompanyPage = () => {
  const router = useRouter();

  return (
    <div className="w-full">
      <PageHeader
        title="Companies"
        options={
          <Button onClick={() => router.push("/companies/new")}>
            Create Company
          </Button>
        }
      />
      <CompanyTable />
    </div>
  );
};

export default CompanyPage;
