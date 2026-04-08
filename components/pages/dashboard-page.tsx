"use client";

import { menuItems } from "@/config/nav-config";
import {
  Users,
  DollarSign,
  Building2,
  FileText,
  TrendingUp,
  Loader2,
  ArrowUpRight,
  Download,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, ReactNode, useMemo } from "react";
import AdvancePayrollService from "@/service/advance-payroll.service";
import { getAllLotMasters } from "@/service/lot-master.service";
import { getAllRoles } from "@/service/role.service";
import { getAllPayrolls } from "@/service/payroll.service";
import { getSponsorCompanies } from "@/service/sponsor-company.service";
import { getDashboardMetrics, getUsers } from "@/service";
import { DashboardStat, DashboardStatusMetric } from "@/types/dashboard.type";
import { User } from "@/types/user.type";
import { usePermission } from "@/hooks";
import { ModuleNameEnum } from "@/types/role.type";
import { useAppStore } from "@/stores";
import { formatDate } from "@/lib/utils";
import { getAdminHeadAccessRole } from "@/lib/admin-head-access";

// Map icon names to Lucide icon components with colors
const iconConfig: Record<
  string,
  { icon: ReactNode; color: string; textColor: string }
> = {
  Users: {
    icon: <Users className="w-4 h-4" />,
    color: "text-blue-500",
    textColor: "text-blue-500",
  },
  DollarSign: {
    icon: <DollarSign className="w-4 h-4" />,
    color: "text-red-500",
    textColor: "text-red-500",
  },
  Building2: {
    icon: <Building2 className="w-4 h-4" />,
    color: "text-purple-500",
    textColor: "text-purple-500",
  },
  FileText: {
    icon: <FileText className="w-4 h-4" />,
    color: "text-emerald-500",
    textColor: "text-emerald-500",
  },
  TrendingUp: {
    icon: <TrendingUp className="w-4 h-4" />,
    color: "text-orange-500",
    textColor: "text-orange-500",
  },
};

type DashboardTableRow = {
  id: string;
  primary: string;
  subtitle?: string;
  secondary: string;
  tertiary: string;
  tertiaryTone: "success" | "warning" | "danger" | "neutral";
  path?: string;
};

type DashboardStatusItem = {
  label: string;
  value: number;
  tone: "red" | "lightBlue" | "darkBlue" | "green" | "orange";
};

const MANAGER_STAT_ORDER: Record<string, string[]> = {
  ACCOUNT_MANAGER: ["/branches", "/payroll", "/advances", "/lot-master"],
  HR_MANAGER: ["/users", "/branches", "/sponsor-company"],
  VISA_MANAGER: ["/branches", "/visa-manager"],
};

const canViewSponsorCompanyByAccessRole = (role: string | null) => {
  return role !== "HR_HEAD" && role !== "ACCOUNT_HEAD";
};

const toneToBarClass: Record<DashboardStatusItem["tone"], string> = {
  red: "bg-red-500",
  lightBlue: "bg-blue-300",
  darkBlue: "bg-blue-800",
  green: "bg-emerald-500",
  orange: "bg-orange-500",
};

const toneToDotClass: Record<DashboardStatusItem["tone"], string> = {
  red: "bg-red-500",
  lightBlue: "bg-blue-300",
  darkBlue: "bg-blue-800",
  green: "bg-emerald-500",
  orange: "bg-orange-500",
};

const tertiaryToneClass: Record<DashboardTableRow["tertiaryTone"], string> = {
  success: "text-[#00c0aa]",
  warning: "text-orange-500",
  danger: "text-red-500",
  neutral: "text-gray-500",
};

const formatMonthYear = (month?: number, year?: number) => {
  if (!month || !year) {
    return "—";
  }

  return new Date(year, Math.max(0, month - 1), 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const getStatOrderRank = (path: string, order: string[]) => {
  const matchedIndex = order.findIndex((prefix) => path.includes(prefix));
  return matchedIndex === -1 ? order.length + 1 : matchedIndex;
};

const upsertSyntheticStat = (stats: DashboardStat[], candidate: DashboardStat) => {
  const existing = stats.find((stat) => stat.path === candidate.path);
  if (existing) {
    return stats;
  }

  return [...stats, candidate];
};

const statusToneByKey: Record<string, DashboardStatusItem["tone"]> = {
  active: "green",
  pending: "orange",
  inactive: "lightBlue",
  suspended: "red",
  terminated: "darkBlue",
};

const mapStatusMetrics = (statusMetrics?: DashboardStatusMetric[]): DashboardStatusItem[] => {
  if (!statusMetrics?.length) {
    return [];
  }

  return statusMetrics.map((item) => ({
    label: item.label,
    value: item.value,
    tone: statusToneByKey[item.key] || "lightBlue",
  }));
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate() {
  return formatDate(new Date());
}

export function DashboardPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tableTitle, setTableTitle] = useState("Employee Status");
  const [tableHeaders, setTableHeaders] = useState<[string, string, string]>(["EMP NAME", "ROLE", "STATUS"]);
  const [tableRows, setTableRows] = useState<DashboardTableRow[]>([]);
  const [statusTitle, setStatusTitle] = useState("Employee Status");
  const [statusItems, setStatusItems] = useState<DashboardStatusItem[]>([]);
  const [extraStats, setExtraStats] = useState<DashboardStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { canRead } = usePermission();
  const accessRole = getAdminHeadAccessRole(user);

  const displayName = user?.fullName || user?.email || "Admin";
  const greeting = getGreeting();
  const formattedDate = getFormattedDate();
  const assignedBranchIds = useMemo(() => {
    const permissionBranches = Array.isArray((user as any)?.permissions?.branches)
      ? (user as any).permissions.branches
      : [];

    const branchIds = permissionBranches
      .map((branch: any) => String(branch?.id || branch?._id || "").trim())
      .filter(Boolean);

    if (branchIds.length > 0) {
      return branchIds;
    }

    const fallbackBranchId = String((user as any)?.branch?.id || (user as any)?.branchId || "").trim();
    return fallbackBranchId ? [fallbackBranchId] : [];
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (accessRole === "ACCOUNT_HEAD" || accessRole === "ACCOUNT_MANAGER") {
          const [payrollResponse, advanceResponse, lotResponse] = await Promise.all([
            getAllPayrolls(1, 100),
            AdvancePayrollService.getAllAdvances(1, 100),
            getAllLotMasters({ page: 1, limit: 100 }),
          ]);

          const branchTotal = assignedBranchIds.length;
          const payrollTotal = payrollResponse.data?.length ?? 0;
          const advanceTotal = advanceResponse.pagination?.total ?? advanceResponse.data?.length ?? 0;
          const lotTotal = lotResponse.pagination?.total ?? lotResponse.data?.length ?? 0;

          setStats([
            {
              title: "Total Branches",
              value: branchTotal,
              icon: "Building2",
              color: "purple",
              path: "/branches",
            },
            {
              title: "Payroll",
              value: payrollTotal,
              icon: "DollarSign",
              color: "red",
              path: "/payroll",
            },
            {
              title: "Loan",
              value: advanceTotal,
              icon: "TrendingUp",
              color: "orange",
              path: "/advances",
            },
            {
              title: "LOT Cap Masters",
              value: lotTotal,
              icon: "FileText",
              color: "green",
              path: "/lot-master",
            },
          ]);
          setExtraStats([]);
          setUsers([]);
          setTableTitle("Account Operations");
          setTableHeaders(["MODULE", "ACCESS", "STATUS"]);
          setTableRows([
            {
              id: "account-branches",
              primary: "Assigned Branches",
              subtitle: `${branchTotal} records`,
              secondary: "Enabled",
              tertiary: "Active",
              tertiaryTone: "success",
              path: "/branches",
            },
            {
              id: "account-payroll",
              primary: "Payroll",
              subtitle: `${payrollTotal} records`,
              secondary: "Enabled",
              tertiary: "Active",
              tertiaryTone: "success",
              path: "/payroll",
            },
            {
              id: "account-advance",
              primary: "Loan",
              subtitle: `${advanceTotal} records`,
              secondary: "Enabled",
              tertiary: "Active",
              tertiaryTone: "success",
              path: "/advances",
            },
            {
              id: "account-lot",
              primary: "LOT Cap Master",
              subtitle: `${lotTotal} records`,
              secondary: "Enabled",
              tertiary: "Active",
              tertiaryTone: "success",
              path: "/lot-master",
            },
          ]);
          setStatusTitle("Account Summary");
          setStatusItems([
            { label: "Branches", value: branchTotal, tone: "green" },
            { label: "Payroll", value: payrollTotal, tone: "red" },
            { label: "Loan", value: advanceTotal, tone: "orange" },
            { label: "LOT", value: lotTotal, tone: "lightBlue" },
          ]);
          return;
        }

        if (accessRole === "HR_HEAD" || accessRole === "HR_MANAGER") {
          const canViewSponsorCompany = canViewSponsorCompanyByAccessRole(accessRole);
          const [rolesResponse, sponsorResponse] = await Promise.all([
            getAllRoles(1, 100),
            canViewSponsorCompany ? getSponsorCompanies(1, 100) : Promise.resolve(null),
          ]);
          const employeeRole = (rolesResponse.data || []).find((role) => {
            const normalized = String(role.roleName || "")
              .trim()
              .toLowerCase()
              .replace(/[\s-]+/g, "_");
            return normalized === "employee" || normalized === "employees";
          });
          const usersResponse = await getUsers(
            1,
            1000,
            undefined,
            employeeRole?._id || employeeRole?.id,
            undefined,
            undefined,
            undefined,
            undefined,
            assignedBranchIds,
          );
          const employeeTotal = usersResponse.pagination?.total ?? usersResponse.data?.length ?? 0;
          const branchTotal = assignedBranchIds.length;
          const sponsorTotal = sponsorResponse?.pagination?.total ?? sponsorResponse?.data?.length ?? 0;

          setStats([
            {
              title: "Total Employees",
              value: employeeTotal,
              icon: "Users",
              color: "blue",
              path: "/users",
            },
            {
              title: "Total Branches",
              value: branchTotal,
              icon: "Building2",
              color: "purple",
              path: "/branches",
            },
            ...(canViewSponsorCompany
              ? [
                  {
                    title: "Sponsor Companies",
                    value: sponsorTotal,
                    icon: "FileText",
                    color: "green",
                    path: "/sponsor-company",
                  },
                ]
              : []),
          ]);
          setExtraStats([]);
          setUsers(usersResponse.data || []);
          setTableTitle("Employee Status");
          setTableHeaders(["EMP NAME", "ROLE", "STATUS"]);
          setTableRows(
            (usersResponse.data || []).slice(0, 5).map((record) => {
              const roleName =
                typeof record.roleId === "object" && record.roleId !== null
                  ? (record.roleId as any).roleName || (record.roleId as any).name || "—"
                  : record.role?.roleName || "—";
              const isActive = record.isActive !== false && record.status !== "inactive";
              return {
                id: record._id || record.email || Math.random().toString(),
                primary: record.fullName || "—",
                subtitle: record.email,
                secondary: roleName.toUpperCase() === "—" ? "EMPLOYEE" : roleName.toUpperCase(),
                tertiary: isActive ? "Active" : "Inactive",
                tertiaryTone: isActive ? "success" : "neutral",
                path: record._id ? `/users/${record._id}` : undefined,
              };
            }),
          );
          setStatusTitle("HR Summary");
          setStatusItems(
            canViewSponsorCompany
              ? [
                  { label: "Employees", value: employeeTotal, tone: "red" },
                  { label: "Branches", value: branchTotal, tone: "green" },
                  { label: "Sponsor", value: sponsorTotal, tone: "lightBlue" },
                ]
              : [
                  { label: "Employees", value: employeeTotal, tone: "red" },
                  { label: "Branches", value: branchTotal, tone: "green" },
                ],
          );
          return;
        }

        if (accessRole === "VISA_HEAD" || accessRole === "VISA_MANAGER") {
          const branchTotal = assignedBranchIds.length;
          const assignedBranches = Array.isArray((user as any)?.permissions?.branches)
            ? (user as any).permissions.branches
            : [];
          const sponsorTotal = accessRole === "VISA_HEAD"
            ? ((await getSponsorCompanies(1, 100)).pagination?.total ?? 0)
            : 0;

          setStats([
            {
              title: "Total Branches",
              value: branchTotal,
              icon: "Building2",
              color: "purple",
              path: "/branches",
            },
            {
              title: "Visa Manager",
              value: branchTotal,
              icon: "FileText",
              color: "green",
              path: "/visa-manager",
            },
            ...(accessRole === "VISA_HEAD"
              ? [{ title: "Sponsor Companies", value: sponsorTotal, icon: "FileText", color: "green", path: "/sponsor-company" }]
              : []),
          ] as DashboardStat[]);
          setExtraStats([]);
          setUsers([]);
          setTableTitle("Assigned Branches");
          setTableHeaders(["BRANCH NAME", "ACCESS", "STATUS"]);
          setTableRows(
            assignedBranches.slice(0, 5).map((branch: any) => {
              const branchId = String(branch?.id || branch?._id || "").trim();
              const branchName = String(branch?.name || branch?.branchName || "—").trim() || "—";
              return {
                id: branchId || branchName,
                primary: branchName,
                subtitle: branchId || undefined,
                secondary: accessRole === "VISA_HEAD" ? "Visa Head Access" : "Visa Manager Access",
                tertiary: "Active",
                tertiaryTone: "success",
                path: "/branches",
              };
            }),
          );
          setStatusTitle("Visa Summary");
          setStatusItems(
            accessRole === "VISA_HEAD"
              ? [
                  { label: "Branches", value: branchTotal, tone: "green" },
                  { label: "Visa", value: branchTotal, tone: "lightBlue" },
                  { label: "Sponsor", value: sponsorTotal, tone: "orange" },
                ]
              : [
                  { label: "Branches", value: branchTotal, tone: "green" },
                  { label: "Visa", value: branchTotal, tone: "lightBlue" },
                ],
          );
          return;
        }

        const [metricsRes, usersRes] = await Promise.allSettled([getDashboardMetrics(), getUsers(1, 5)]);

        if (
          metricsRes.status === "fulfilled" &&
          metricsRes.value.success &&
          metricsRes.value.data
        ) {
          setStats(metricsRes.value.data.stats);
          setStatusTitle("Employee Status");
          setStatusItems(mapStatusMetrics(metricsRes.value.data.metrics?.employeeStatusBreakdown));
        }

        if (usersRes.status === "fulfilled" && usersRes.value.data) {
          setUsers(usersRes.value.data);
          setTableTitle("Employee Status");
          setTableHeaders(["EMP NAME", "ROLE", "STATUS"]);
          setTableRows(
            usersRes.value.data.slice(0, 5).map((record) => {
              const roleName =
                typeof record.roleId === "object" && record.roleId !== null
                  ? (record.roleId as any).roleName || (record.roleId as any).name || "—"
                  : record.role?.roleName || "—";
              const isActive = record.isActive !== false && record.status !== "inactive";

              return {
                id: record._id || record.email || Math.random().toString(),
                primary: record.fullName || "—",
                subtitle: record.email,
                secondary: roleName.toUpperCase() === "—" ? "HR MANAGER" : roleName.toUpperCase(),
                tertiary: isActive ? "Active" : "Inactive",
                tertiaryTone: isActive ? "success" : "neutral",
                path: record._id ? `/users/${record._id}` : undefined,
              };
            }),
          );
        }

        setExtraStats([]);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessRole, assignedBranchIds, user]);

  // Filter stats based on permissions
  const filteredStats = useMemo(() => {
    const combinedStats = extraStats.reduce<DashboardStat[]>((accumulator, stat) => upsertSyntheticStat(accumulator, stat), [...stats]);
    const visibleStats = combinedStats.filter((stat) => {
      if (stat.path.includes("/users")) return canRead(ModuleNameEnum.USERS);
      if (stat.path.includes("/payroll")) return canRead(ModuleNameEnum.PAYROLL);
      if (stat.path.includes("/branches")) return canRead(ModuleNameEnum.BRANCH);
      if (stat.path.includes("/advances")) return canRead(ModuleNameEnum.ADVANCE);
      if (stat.path.includes("/lot-master")) return canRead(ModuleNameEnum.LOT);
      if (stat.path.includes("/visa-manager")) return canRead(ModuleNameEnum.VISA_MANAGER);
      return true;
    });

    const preferredOrder = accessRole ? MANAGER_STAT_ORDER[accessRole] || [] : [];
    return visibleStats.sort((left, right) => getStatOrderRank(left.path, preferredOrder) - getStatOrderRank(right.path, preferredOrder));
  }, [stats, extraStats, canRead, accessRole]);

  // Limit to only 5 recent employees
  const recentEmployees = useMemo<DashboardTableRow[]>(() => {
    return tableRows.length > 0
      ? tableRows
      : users.slice(0, 5).map((record) => ({
          id: record._id || record.email || Math.random().toString(),
          primary: record.fullName || "—",
          subtitle: record.email,
          secondary:
            typeof record.roleId === "object" && record.roleId !== null
              ? (record.roleId as any).roleName || (record.roleId as any).name || "—"
              : record.role?.roleName || "—",
          tertiary: record.isActive !== false && record.status !== "inactive" ? "Active" : "Inactive",
          tertiaryTone: record.isActive !== false && record.status !== "inactive" ? "success" : "neutral",
          path: record._id ? `/users/${record._id}` : undefined,
        }));
  }, [tableRows, users]);

  const statusTotal = statusItems.reduce((sum, item) => sum + item.value, 0);
  const showSecondaryAsBadge = tableHeaders[1] === "ROLE";

  return (
    <div className="min-h-screen bg-transparent">
      <div className="p-3 sm:p-5 space-y-5">

        {/* ── Loading / Error states ── */}
        {loading && (
          <div className="flex items-center justify-center py-12 bg-white rounded-2xl shadow-sm">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500">Loading dashboard…</span>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Top Big Header + Stats Card ── */}
        {!loading && filteredStats.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100/50">
            {/* Top row: Greeting + Export Controls with faint blue gradient at the top edge */}
            <div className="relative px-6 py-6 pb-5 bg-linear-to-br from-blue-50/50 via-white to-white flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#111827]">
                  {greeting}, {displayName}!
                </h1>
                <p className="text-[13px] text-gray-500 mt-1">
                  It's {formattedDate}
                </p>
              </div>

            </div>

            {/* Separator line */}
            <div className="h-px w-full bg-gray-100" />

            {/* Bottom Row: The stats map */}
            <div className="px-6 py-6 grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
              {filteredStats.slice(0, 4).map((stat, index) => {
                const cfg = iconConfig[stat.icon] || iconConfig["Users"];

                // Format employee count nicely
                const isEmployee = stat.title.toLowerCase().includes("employee");
                const statValue = isEmployee ? `0${stat.value}` : stat.value;

                return (
                  <div
                    key={index}
                    onClick={() => router.push(stat.path)}
                    className="pl-6 px-6 first:pl-0 last:pr-0 cursor-pointer group"
                  >
                    {/* Icon + title */}
                    <div className={`flex items-center gap-2 text-sm font-medium mb-1 ${cfg.color}`}>
                      {cfg.icon}
                      <span className="text-gray-600">{stat.title}</span>
                    </div>

                    {/* Content Row: Big number */}
                    <div className="flex items-baseline gap-3 mt-1">
                      <p className={`text-[42px] font-bold ${cfg.textColor} leading-none tracking-tight`}>
                        {statValue}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Bottom two columns ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          {/* Left: Employee Status table */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100/50 flex flex-col">
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {tableTitle}
              </h2>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pl-6 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {tableHeaders[0]}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {tableHeaders[1]}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {tableHeaders[2]}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : recentEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-400 text-sm">
                      No records found
                    </td>
                  </tr>
                ) : (
                  recentEmployees.map((row) => {
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-gray-50/80 transition-colors ${row.path ? "cursor-pointer" : "cursor-default"}`}
                        onClick={() => {
                          if (row.path) {
                            router.push(row.path);
                          }
                        }}
                      >
                        <td className="pl-6 px-3 py-3.5">
                          <p className="font-bold text-[#111827] text-sm">
                            {row.primary}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{row.subtitle || "—"}</p>
                        </td>
                        <td className="px-3 py-3.5">
                          {showSecondaryAsBadge ? (
                            <span className="inline-flex items-center gap-1.5 border border-purple-200 text-purple-600 bg-purple-50 rounded-full text-[11px] font-bold px-3 py-1 tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                              {row.secondary}
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-gray-700">{row.secondary}</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span
                            className={`${tertiaryToneClass[row.tertiaryTone]} font-bold text-sm`}
                          >
                            {row.tertiary}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Right column: Employment Status chart + Queries card */}
          <div className="flex flex-col gap-5">
            {/* Employment Status card */}
            <div className="bg-white rounded-3xl border border-gray-100/50 shadow-sm p-6 flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                {statusTitle}
              </h2>

              {/* Status distribution */}
              <div className="flex items-center gap-0.5 h-3 w-full mb-2 overflow-hidden rounded-[2px]">
                {statusItems.map((item) => {
                  const width = statusTotal > 0
                    ? (item.value / statusTotal) * 100
                    : (statusItems.length ? 100 / statusItems.length : 0);
                  return (
                    <div
                      key={item.label}
                      className={`h-full ${toneToBarClass[item.tone]}`}
                      style={{ width: `${width}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs font-medium text-gray-400 mb-8 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>

              {/* Legend row */}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {statusItems.map((item, index) => {
                  const percentage = statusTotal > 0 ? Math.round((item.value / statusTotal) * 100) : 0;

                  return (
                    <div key={item.label} className={index === 0 ? "" : "pl-2 border-l border-gray-100"}>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
                        <span className={`w-2.5 h-2.5 rounded-sm inline-block flex-none ${toneToDotClass[item.tone]}`} />
                        {item.label}
                      </div>
                      <p className="text-[28px] font-bold text-gray-900 leading-none mb-1">
                        {item.value}
                      </p>
                      <p className="text-[13px] text-gray-400">{percentage}%</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Have any queries card */}
            <div className="relative overflow-hidden rounded-3xl shadow-sm p-6 bg-linear-to-r from-[#1a8cff] to-[#0062cc] text-white flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Decorative wave background element */}
              <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-linear-to-l from-white/10 to-transparent pointer-events-none transform -skew-x-12 translate-x-10" />

              <div className="relative z-10 w-full md:w-auto text-left">
                <p className="text-[22px] font-bold leading-tight tracking-tight">
                  Have any Queries?
                </p>
                <p className="text-sm text-blue-100 mt-1">
                  Reach out to us below
                </p>
              </div>
              <button className="relative z-10 w-full md:w-auto flex-none bg-white text-blue-600 font-bold text-sm px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
