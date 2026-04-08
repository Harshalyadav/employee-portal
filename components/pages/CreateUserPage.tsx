"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CreateUserFormMultiStep } from "../form/CreateUserFormMultiStep";

interface CreateUserPageProps {
  onSuccess?: () => void;
}

export function CreateUserPage({ onSuccess }: CreateUserPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <div className="bg-white rounded-[1.5rem] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827]">Create Employee</h1>
            <p className="text-[13px] text-gray-400 mt-1">Add a new employee to the system. Fill in all required fields to complete the registration.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/users")} className="flex items-center gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="p-6 bg-gray-50/30">
          <CreateUserFormMultiStep onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
}
