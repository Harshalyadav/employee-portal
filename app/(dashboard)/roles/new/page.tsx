"use client";

import { CreateRoleForm } from "@/components/form/CreateRoleForm";
import { usePermission } from "@/hooks";
import { ModuleNameEnum } from "@/types/role.type";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CreateRolePage() {
  const { canCreate } = usePermission();
  const router = useRouter();

  // Check if user has CREATE permission
  if (!canCreate(ModuleNameEnum.ROLES)) {
    return (
      <div className="min-h-screen bg-transparent p-3 sm:p-5">
        <div className="bg-white rounded-[1.5rem] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
            <div>
              <h1 className="text-[22px] font-bold text-[#111827]">Create Role</h1>
              <p className="text-[13px] text-gray-400 mt-1">Access Denied</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => router.push("/roles")} className="flex items-center gap-2 shadow-sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
              <p className="text-sm text-red-700 mb-4">
                You do not have permission to create roles.
              </p>
              <button
                onClick={() => router.push("/roles")}
                className="text-sm text-red-700 hover:text-red-900 underline"
              >
                Return to Roles
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <div className="bg-white rounded-[1.5rem] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827]">Create Role</h1>
            <p className="text-[13px] text-gray-400 mt-1">Add a new role</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/roles")} className="flex items-center gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="p-6 bg-gray-50/30">
          <CreateRoleForm />
        </div>
      </div>
    </div>
  );
}
