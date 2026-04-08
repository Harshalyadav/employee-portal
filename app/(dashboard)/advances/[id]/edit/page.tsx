"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAdvance } from "@/hooks/query/useAdvancePayroll";
import { usePermission } from "@/hooks";
import { ModuleNameEnum, PermissionAction } from "@/types";
import { LoadingState } from "@/components/LoadingState";
import { EditAdvanceForm } from "@/components/form/EditAdvanceForm";

export default function EditAdvancePage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const { hasPermission } = usePermission();
  const canUpdateAdvance = hasPermission(ModuleNameEnum.ADVANCE, PermissionAction.UPDATE);
  const { data: advance, isLoading, error } = useAdvance(id);

  if (!canUpdateAdvance) {
    return (
      <div className="min-h-screen bg-transparent p-3 sm:p-5">
        <div className="bg-white rounded-[1.5rem] shadow border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-sm text-red-700 mt-1">You don't have permission to edit loans.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/advances")}>
            Back to Loans
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !advance) {
    return <LoadingState message={isLoading ? "Loading..." : "Advance not found."} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent p-3 sm:p-5">
        <div className="bg-white rounded-[1.5rem] shadow border border-gray-100 p-6">
          <p className="text-red-600">Failed to load advance.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/advances")}>
            Back to Loans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <div className="bg-white rounded-[1.5rem] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827]">Edit Loan</h1>
            <p className="text-[13px] text-gray-400 mt-1">Update loan details</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/advances")} className="flex items-center gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="p-6 bg-gray-50/30">
          <EditAdvanceForm
            advance={advance}
            onSuccess={() => {
              router.push("/advances");
              router.refresh();
            }}
          />
        </div>
      </div>
    </div>
  );
}
