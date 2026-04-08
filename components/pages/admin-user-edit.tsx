"use client";

import { useRouter } from "next/navigation";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AdminUserForm } from "../form/admin-user-form";
import { canAccessAdminUsers, canAccessPathByRole } from "@/lib/admin-head-access";
import { useAppStore } from "@/stores";

export function EditAdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAppStore();
  const { id } = use(params);

  if (!canAccessAdminUsers(user) || !canAccessPathByRole(user, "/admin-users")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827]">Edit Admin User</h1>
            <p className="text-[13px] text-gray-400 mt-1">Update admin user details with the same guided workflow used across employee records.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/admin-users")} className="flex items-center gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="p-6 bg-gray-50/30">
          <AdminUserForm mode="edit" userId={id} />
        </div>
      </div>
    </div>
  );
}