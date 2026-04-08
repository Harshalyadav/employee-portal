"use client";

import { useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Briefcase,
  CalendarDays,
  FileText,
  Globe,
  Hash,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  Users,
  Wallet,
} from "lucide-react";

import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingState } from "@/components/LoadingState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getAdminHeadAccessRole,
  getResolvedRoleName,
} from "@/lib/admin-head-access";
import { useAppStore } from "@/stores";
import { getCurrentUser } from "@/stores/actions/auth.action";
import type { IAddress, User as AppUser } from "@/types";

type ProfileRole = "basic" | "hr" | "visa" | "account";

function normalizeText(value?: string | null) {
  const trimmed = String(value || "").trim();
  return trimmed || undefined;
}

function humanize(value?: string | null) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;

  return normalized
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string | Date | null) {
  if (!value) return undefined;

  const parsedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return undefined;

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAddress(address?: IAddress | null) {
  if (!address) return undefined;

  const parts = [
    normalizeText(address.addressLine),
    [normalizeText(address.city), normalizeText(address.state)].filter(Boolean).join(", "),
    normalizeText(address.country),
    normalizeText(address.pincode),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function formatCurrency(amount?: number | null, currency?: string | null) {
  if (amount == null || Number.isNaN(Number(amount))) return undefined;

  const resolvedCurrency = normalizeText(currency) || "AED";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: resolvedCurrency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${resolvedCurrency} ${Number(amount).toLocaleString("en-IN")}`;
  }
}

function getProfileRole(user: AppUser | null): ProfileRole {
  const accessRole = getAdminHeadAccessRole(user);

  if (accessRole === "HR_HEAD" || accessRole === "HR_MANAGER") {
    return "hr";
  }

  if (accessRole === "VISA_HEAD" || accessRole === "VISA_MANAGER") {
    return "visa";
  }

  if (accessRole === "ACCOUNT_HEAD" || accessRole === "ACCOUNT_MANAGER") {
    return "account";
  }

  return "basic";
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: ElementType;
  label: string;
  value: string | number | undefined | null;
  className?: string;
}) {
  const resolvedValue = value == null ? "" : String(value).trim();

  if (!resolvedValue) {
    return null;
  }

  return (
    <div className={cn("flex items-start gap-3 py-2.5", className)}>
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-900">{resolvedValue}</p>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon: ElementType;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden border-slate-200/80", className)}>
      <CardHeader className="border-b border-slate-100 bg-slate-50/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
            {description ? (
              <CardDescription className="mt-0.5 text-xs text-slate-500">
                {description}
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-blue-100/80">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, error } = useAppStore();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    let isMounted = true;

    setIsRefreshing(true);
    getCurrentUser(true)
      .then((profileUser) => {
        if (!isMounted) return;
        setProfileError(profileUser ? null : "Profile data could not be found.");
      })
      .catch((cause: unknown) => {
        if (!isMounted) return;

        const message =
          cause instanceof Error ? cause.message : "Failed to load profile information.";
        setProfileError(message);
      })
      .finally(() => {
        if (isMounted) {
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, router]);

  const currentUser = user;
  const resolvedRoleName = getResolvedRoleName(currentUser) || currentUser?.role?.roleName || "Employee";
  const profileRole = getProfileRole(currentUser);
  const branch = currentUser?.branch ?? null;
  const company = currentUser?.company ?? null;
  const branchAddress = branch?.branchAddress;
  const permissionBranches = currentUser?.permissions?.branches ?? [];
  const profileMessage = profileError || error;

  const branchName = branch?.branchName || undefined;
  const branchCode = branch?.branchCode || undefined;
  const companyName = company && "legalName" in company ? company.legalName : undefined;
  const companyRegistrationNumber =
    company && "companyRegistrationNo" in company ? company.companyRegistrationNo : undefined;
  const companyTrn = company && "trn" in company ? company.trn : undefined;
  const companyAddress =
    company && "companyAddress" in company
      ? [company.companyAddress, company.city, company.state, company.country]
          .filter(Boolean)
          .join(", ")
      : undefined;
  const officeLocation =
    branch?.officeLocation?.latitude != null && branch?.officeLocation?.longitude != null
      ? `${branch.officeLocation.latitude}, ${branch.officeLocation.longitude}`
      : undefined;

  const currentAddress = formatAddress(currentUser?.currentAddress);
  const permanentAddress = formatAddress(currentUser?.permanentAddress);
  const branchAddressLine = formatAddress(branchAddress);
  const salaryLabel = formatCurrency(currentUser?.baseSalary, currentUser?.currency);
  const joinedOn = formatDate(currentUser?.dateOfJoining);
  const birthDate = formatDate(currentUser?.dob);
  const documentUpdatedOn = formatDate(currentUser?.documentSummary?.lastUpdated);
  const roleType = humanize(currentUser?.role?.roleType);
  const status = humanize(currentUser?.status);
  const profileTitle = useMemo(() => {
    if (profileRole === "hr") return "HR Profile";
    if (profileRole === "visa") return "Visa Profile";
    if (profileRole === "account") return "Finance Profile";
    return "Profile";
  }, [profileRole]);

  const documentStats = useMemo(
    () => [
      { label: "Total Documents", value: currentUser?.documentSummary?.total ?? 0 },
      { label: "Valid", value: currentUser?.documentSummary?.valid ?? 0 },
      { label: "Expiring", value: currentUser?.documentSummary?.expiring ?? 0 },
      { label: "Expired", value: currentUser?.documentSummary?.expired ?? 0 },
    ],
    [currentUser?.documentSummary],
  );

  const handleRefresh = async () => {
    setProfileError(null);
    setIsRefreshing(true);

    try {
      const refreshedUser = await getCurrentUser(true);
      if (!refreshedUser) {
        setProfileError("Profile data could not be found.");
      }
    } catch (cause) {
      setProfileError(cause instanceof Error ? cause.message : "Failed to refresh profile.");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isAuthenticated && !currentUser) {
    return <LoadingState message="Redirecting to login..." className="min-h-screen" size="lg" />;
  }

  if ((isLoading || isRefreshing) && !currentUser) {
    return <LoadingState message="Loading profile..." className="min-h-screen" size="lg" />;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <ErrorAlert
            isOpen
            title="Profile unavailable"
            message={profileMessage || "Profile data could not be loaded for the current session."}
          />
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Unable to load profile</CardTitle>
              <CardDescription>
                The session is active, but the profile response did not contain user details.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? "Refreshing..." : "Retry"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Back to dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const parentGuardian = currentUser.parentGuardianDetails;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {profileMessage ? (
          <ErrorAlert isOpen title="Profile notice" message={profileMessage} onClose={() => setProfileError(null)} />
        ) : null}

        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-600 via-blue-700 to-cyan-700 px-6 py-8 text-white shadow-xl sm:px-8 sm:py-10">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm">
                <User className="h-10 w-10" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-blue-100/80">
                  {profileTitle}
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  {currentUser.fullName || currentUser.email}
                </h1>
                <p className="mt-2 text-sm text-blue-100 sm:text-base">{currentUser.email}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 font-medium">
                    <Shield className="mr-1.5 h-3.5 w-3.5" />
                    {resolvedRoleName}
                  </span>
                  {status ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-400/15 px-3 py-1 font-medium text-emerald-50">
                      {status}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryTile label="Role View" value={profileRole.toUpperCase()} />
              <SummaryTile label="Branch Access" value={permissionBranches.length || (branchName ? 1 : 0)} />
              <SummaryTile label="Documents" value={currentUser.documentSummary?.total ?? 0} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Personal & Contact"
            description="Primary identity and contact information"
            icon={User}
          >
            <div className="divide-y divide-slate-100">
              <InfoRow icon={User} label="Full Name" value={currentUser.fullName} />
              <InfoRow icon={Hash} label="Employee ID" value={currentUser.employeeId} />
              <InfoRow icon={Hash} label="Worker ID" value={currentUser.uniqueWorkerId} />
              <InfoRow icon={Mail} label="Email" value={currentUser.email} />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={
                  currentUser.phone
                    ? `${normalizeText(currentUser.phoneCountryCode) || ""} ${currentUser.phone}`.trim()
                    : undefined
                }
              />
              <InfoRow
                icon={Phone}
                label="Emergency Contact"
                value={
                  currentUser.emergencyContact
                    ? `${normalizeText(currentUser.emergencyContactCountryCode) || ""} ${currentUser.emergencyContact}`.trim()
                    : undefined
                }
              />
              <InfoRow icon={CalendarDays} label="Date of Birth" value={birthDate} />
            </div>
          </SectionCard>

          <SectionCard
            title="Role & Organization"
            description="Role resolution, branch mapping, and company assignment"
            icon={Shield}
          >
            <div className="divide-y divide-slate-100">
              <InfoRow icon={Shield} label="Role" value={resolvedRoleName} />
              <InfoRow icon={Briefcase} label="Role Type" value={roleType} />
              <InfoRow icon={Hash} label="Role Description" value={currentUser.role?.description} />
              <InfoRow
                icon={Building2}
                label="Branch"
                value={branchName ? `${branchName}${branchCode ? ` · ${branchCode}` : ""}` : undefined}
              />
              <InfoRow icon={MapPin} label="Branch Address" value={branchAddressLine} />
              <InfoRow icon={Globe} label="Company" value={companyName} />
              <InfoRow icon={Hash} label="Registration No." value={companyRegistrationNumber} />
              <InfoRow icon={Hash} label="TRN" value={companyTrn} />
              <InfoRow icon={MapPin} label="Company Address" value={companyAddress} />
              <InfoRow icon={MapPin} label="Office Location" value={officeLocation} />
            </div>
          </SectionCard>

          {profileRole === "hr" ? (
            <>
              <SectionCard
                title="Employment Details"
                description="HR-specific employment and identity information"
                icon={Users}
              >
                <div className="divide-y divide-slate-100">
                  <InfoRow icon={CalendarDays} label="Joined On" value={joinedOn} />
                  <InfoRow icon={Globe} label="Nationality" value={currentUser.nationality} />
                  <InfoRow icon={Hash} label="Gender" value={currentUser.gender} />
                  <InfoRow icon={Hash} label="Marital Status" value={currentUser.maritalStatus} />
                  <InfoRow icon={Hash} label="Blood Group" value={currentUser.bloodGroup} />
                  <InfoRow icon={Wallet} label="Base Salary" value={salaryLabel} />
                </div>
              </SectionCard>

              <SectionCard
                title="Address & Family"
                description="Addresses, references, and guardian details"
                icon={MapPin}
              >
                <div className="divide-y divide-slate-100">
                  <InfoRow icon={MapPin} label="Current Address" value={currentAddress} />
                  <InfoRow icon={MapPin} label="Permanent Address" value={permanentAddress} />
                  <InfoRow icon={Users} label="Father Name" value={parentGuardian?.fatherName} />
                  <InfoRow icon={Users} label="Mother Name" value={parentGuardian?.motherName} />
                  <InfoRow icon={Users} label="Other Guardian" value={parentGuardian?.otherName} />
                  <InfoRow icon={Hash} label="Reference By" value={currentUser.referenceBy} />
                  <InfoRow icon={Phone} label="Reference Phone" value={currentUser.referencePhone} />
                </div>
              </SectionCard>
            </>
          ) : null}

          {profileRole === "visa" ? (
            <>
              <SectionCard
                title="Visa & Identity"
                description="Identity markers and branch assignment for visa operations"
                icon={FileText}
              >
                <div className="divide-y divide-slate-100">
                  <InfoRow icon={Hash} label="Employee ID" value={currentUser.employeeId} />
                  <InfoRow icon={Hash} label="Worker ID" value={currentUser.uniqueWorkerId} />
                  <InfoRow icon={Globe} label="Nationality" value={currentUser.nationality} />
                  <InfoRow icon={CalendarDays} label="Joined On" value={joinedOn} />
                  <InfoRow icon={MapPin} label="Current Address" value={currentAddress} />
                  <InfoRow icon={MapPin} label="Permanent Address" value={permanentAddress} />
                </div>
              </SectionCard>

              <SectionCard
                title="Document Overview"
                description="Document counts available from the current profile payload"
                icon={FileText}
              >
                <div className="grid grid-cols-2 gap-3">
                  {documentStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <InfoRow icon={CalendarDays} label="Summary Updated" value={documentUpdatedOn} />
                </div>
              </SectionCard>
            </>
          ) : null}

          {profileRole === "account" ? (
            <>
              <SectionCard
                title="Compensation"
                description="Finance-oriented payroll context for the logged-in user"
                icon={Wallet}
              >
                <div className="divide-y divide-slate-100">
                  <InfoRow icon={Wallet} label="Base Salary" value={salaryLabel} />
                  <InfoRow icon={Hash} label="Currency" value={currentUser.currency} />
                  <InfoRow icon={CalendarDays} label="Joined On" value={joinedOn} />
                  <InfoRow icon={Hash} label="Status" value={status} />
                  <InfoRow icon={Building2} label="Branch" value={branchName} />
                  <InfoRow icon={Globe} label="Company" value={companyName} />
                </div>
              </SectionCard>

              <SectionCard
                title="Payment Context"
                description="Reference and organization details used alongside payroll operations"
                icon={FileText}
              >
                <div className="divide-y divide-slate-100">
                  <InfoRow icon={Hash} label="Employee ID" value={currentUser.employeeId} />
                  <InfoRow icon={Phone} label="Contact Number" value={currentUser.phone} />
                  <InfoRow icon={Hash} label="Reference By" value={currentUser.referenceBy} />
                  <InfoRow icon={Phone} label="Reference Phone" value={currentUser.referencePhone} />
                </div>
              </SectionCard>
            </>
          ) : null}

          {profileRole !== "basic" ? (
            <SectionCard
              title="Document Summary"
              description="Shared profile metrics returned by the current profile endpoint"
              icon={FileText}
              className="xl:col-span-2"
            >
              <div className="grid gap-3 sm:grid-cols-4">
                {documentStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>

        {permissionBranches.length > 0 ? (
          <SectionCard
            title="Assigned Branch Access"
            description="Branches resolved from the current permission scope"
            icon={Building2}
            className="mt-6"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {permissionBranches.map((permissionBranch) => (
                <div
                  key={`${permissionBranch.id}-${permissionBranch.name}`}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                >
                  <p className="text-sm font-semibold text-slate-900">{permissionBranch.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                    {permissionBranch.id}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}
      </div>
    </div>
  );
}