"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { CreateSponsorCompanyForm } from "@/components/form/CreateSponsorCompanyForm";
import { useSponsorCompanyById } from "@/hooks";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { APP_ROUTE } from "@/routes";

const shellCardClass =
  "bg-white rounded-[1.5rem] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left";

export default function EditSponsorCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, isError } = useSponsorCompanyById(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent p-3 sm:p-5">
        <div className={shellCardClass}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
            <div>
              <h1 className="text-[22px] font-bold text-[#111827]">Edit Sponsor Company</h1>
              <p className="text-[13px] text-gray-400 mt-1">Update sponsor company details</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(APP_ROUTE.SPONSOR_COMPANY.ALL.PATH)}
              className="flex items-center gap-2 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="p-6 bg-gray-50/30">
            <LoadingState message="Loading..." />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-transparent p-3 sm:p-5">
        <div className={`${shellCardClass} p-6`}>
          <p className="text-red-600">
            {isError ? "Failed to load sponsor company." : "Sponsor company not found."}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(APP_ROUTE.SPONSOR_COMPANY.ALL.PATH)}>
            Back to Sponsor Company
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <div className={shellCardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827]">Edit Sponsor Company</h1>
            <p className="text-[13px] text-gray-400 mt-1">Update sponsor company details</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(APP_ROUTE.SPONSOR_COMPANY.ALL.PATH)}
            className="flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="p-6 bg-gray-50/30">
          <CreateSponsorCompanyForm sponsorCompany={data} embeddedInPageShell />
        </div>
      </div>
    </div>
  );
}
