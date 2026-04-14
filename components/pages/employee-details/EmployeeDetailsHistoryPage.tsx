"use client";

import { Building2, CalendarClock, Mail, Phone, UserRound } from "lucide-react";

import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/stores";
import { CurrencyEnum, User } from "@/types/user.type";

const getDesignation = (user?: User | null) => {
  const effectiveRoleName = (user as any)?.effectiveRoleName || (user as any)?.designationRoleName;
  if (typeof effectiveRoleName === "string" && effectiveRoleName.trim()) {
    return effectiveRoleName;
  }

  const designation = user?.permissions?.designation;
  if (typeof designation === "string") {
    return designation;
  }

  if (designation && typeof designation === "object") {
    const normalizedDesignation = designation as { roleName?: string; name?: string; id?: string };
    return normalizedDesignation.roleName || normalizedDesignation.name || normalizedDesignation.id || "Employee";
  }

  if (user?.role && typeof user.role === "object") {
    return user.role.roleName || "Employee";
  }

  if (typeof user?.roleId === "object" && user.roleId) {
    const roleReference = user.roleId as { roleName?: string; name?: string };
    return roleReference.roleName || roleReference.name || "Employee";
  }

  return "Employee";
};

const formatCurrency = (amount: number, currency?: CurrencyEnum | string) => {
  const resolvedCurrency = currency || CurrencyEnum.AED;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: resolvedCurrency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export default function EmployeeDetailsHistoryPage() {
  const { user } = useAppStore();
  const employeeId = user?.id || user?._id || "";
  const employeeCode = (user as any)?.displayEmployeeId || user?.employeeId || user?.uniqueWorkerId || `EMP-${employeeId.slice(-6).toUpperCase()}`;
  const branchReference = user?.branch as { branchName?: string; name?: string } | null | undefined;
  const branchName = branchReference?.branchName || branchReference?.name || "Main Branch";
  const designation = getDesignation(user);

  const profileTimeline = [
    user?.createdAt
      ? {
          id: "created",
          title: "Profile created",
          description: `${user?.fullName || "Employee"} profile was created in HRMS.`,
          date: user.createdAt,
        }
      : null,
    user?.dateOfJoining
      ? {
          id: "joined",
          title: "Joined company",
          description: `Joined ${branchName} as ${designation}.`,
          date: user.dateOfJoining,
        }
      : null,
    user?.updatedAt
      ? {
          id: "updated",
          title: "Latest profile update",
          description: "Current employee details reflect the latest saved profile state.",
          date: user.updatedAt,
        }
      : null,
  ].filter(Boolean) as Array<{ id: string; title: string; description: string; date: string }>;

  return (
    <div className="min-h-screen bg-transparent">
      <div className="space-y-6 p-4 sm:p-6">
        <section className="rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-600">Employee Details</p>
              <h1 className="text-3xl font-bold text-slate-900">Latest Employee Details</h1>
              <p className="max-w-2xl text-sm text-slate-600">
                This page only shows employee profile details and account timestamps. Payroll, payment, and bank records are available on their own pages.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Employee Code</p>
                <p className="mt-1 font-semibold text-slate-900">{employeeCode}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Designation</p>
                <p className="mt-1 font-semibold text-slate-900">{designation}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">Branch</p>
                <p className="mt-1 font-semibold text-slate-900">{branchName}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <UserRound className="h-5 w-5 text-sky-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Employee Profile</h2>
                <p className="text-sm text-slate-500">Current employee information only.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Full Name</p>
                <p className="mt-2 font-semibold text-slate-900">{user?.fullName || "Not available"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                <p className="mt-2 font-semibold text-slate-900">{user?.email || "Not available"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Phone</p>
                <p className="mt-2 font-semibold text-slate-900">{user?.phone || "Not available"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Date Of Joining</p>
                <p className="mt-2 font-semibold text-slate-900">{user?.dateOfJoining ? formatDate(user.dateOfJoining) : "Not available"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Date Of Birth</p>
                <p className="mt-2 font-semibold text-slate-900">{user?.dob ? formatDate(user.dob) : "Not available"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Base Salary</p>
                <p className="mt-2 font-semibold text-slate-900">{formatCurrency(Number(user?.baseSalary || 0), user?.currency)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Contact Email</span>
                </div>
                <p className="mt-2 font-semibold text-slate-900">{user?.email || "Not available"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Contact Phone</span>
                </div>
                <p className="mt-2 font-semibold text-slate-900">{user?.phone || "Not available"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Branch</span>
                </div>
                <p className="mt-2 font-semibold text-slate-900">{branchName}</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-sky-600" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Profile Timeline</h2>
                  <p className="text-sm text-slate-500">Basic employee account timestamps only.</p>
                </div>
              </div>

              <div className="space-y-3">
                {profileTimeline.length === 0 ? <p className="text-sm text-slate-500">No profile timeline available yet.</p> : null}
                {profileTimeline.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    <p className="mt-3 text-xs text-slate-400">{formatDate(item.date)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <UserRound className="h-5 w-5 text-sky-600" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Account Summary</h2>
                  <p className="text-sm text-slate-500">Current employee account metadata.</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Profile Created</span>
                  <span className="font-medium text-slate-900">{user?.createdAt ? formatDate(user.createdAt) : "Not available"}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Profile Updated</span>
                  <span className="font-medium text-slate-900">{user?.updatedAt ? formatDate(user.updatedAt) : "Not available"}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Employee Code</span>
                  <span className="font-medium text-slate-900">{employeeCode}</span>
                </div>
              </div>
            </section>
          </section>
        </section>
      </div>
    </div>
  );
}