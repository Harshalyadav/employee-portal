"use client";

import { SponsorCompanyTable } from "@/components/datatable/sponsor-company/SponsorCompanyTable";
import { canAccessPathByRole } from "@/lib/admin-head-access";
import { useAppStore } from "@/stores";

const SponsorCompanyPage = () => {
  const { user } = useAppStore();
  // Reuse the shared path guard here so a single rule controls sidebar visibility,
  // client-side redirects, and the page-level access denied state.
  const canRead = canAccessPathByRole(user, "/sponsor-company");

  if (!canRead) {
    return (
      <div className="min-h-screen bg-[#f0f6ff] p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-sm text-red-700 mt-1">
            You don't have permission to view sponsor company.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <SponsorCompanyTable />
    </div>
  );
};

export default SponsorCompanyPage;
