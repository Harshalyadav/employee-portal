"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetCompanyDetail } from "@/hooks/query/company.hook";
import { CreateCompanyForm } from "@/components/form/CreateCompanyForm";
import { EditCompanyForm } from "@/components/form/EditCompanyForm";
import PageHeader from "@/components/sections/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

const CompanyDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string;

  const isNewCompany = companyId === "new";
  const {
    data: company,
    isLoading,
    error,
  } = useGetCompanyDetail(!isNewCompany ? companyId : undefined);

  if (isLoading && !isNewCompany) {
    return (
      <div className="w-full">
        <PageHeader
          title="Company Details"
          options={
            <Button variant="outline" onClick={() => router.push("/companies")}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          }
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || (!company && !isNewCompany)) {
    return (
      <div className="w-full">
        <PageHeader
          title="Company not found"
          options={
            <Button variant="outline" onClick={() => router.push("/companies")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Companies
            </Button>
          }
        />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Company not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        title={isNewCompany ? "Create Company" : "Company Details"}
        options={
          <Button variant="outline" onClick={() => router.push("/companies")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="shadow">
        {isNewCompany ? (
          <CreateCompanyForm onSuccess={() => router.push("/companies")} />
        ) : (
          company && (
            <EditCompanyForm
              defaultValues={company}
              onSuccess={() => router.push("/companies")}
            />
          )
        )}
      </div>
    </div>
  );
};

export default CompanyDetailPage;
