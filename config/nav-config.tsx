import { MenuItemConfig } from "@/types";
import { ModuleNameEnum } from "@/types/role.type";
import {
  Banknote,
  Building2,
  FileText,
  Landmark,
  LayoutDashboard,
  Package,
  Shield,
  TrendingUp,
  UserRound,
} from "lucide-react";

export const menuItems: MenuItemConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    translationKey: "dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: "/",
    // No module check for dashboard - always visible
  },
  // {
  //   id: "companies",
  //   label: "Companies",
  //   translationKey: "companies",
  //   icon: <Building2 className="w-5 h-5" />,
  //   path: "/companies",
  //   module: ModuleNameEnum.COMPANY,
  // },

  {
    id: "users",
    label: "Employees",
    translationKey: "users",
    icon: <UserRound className="w-5 h-5" />,
    path: "/users",
    module: ModuleNameEnum.USERS,
  },
  {
    id: "visa-manager",
    label: "Visa Manager",
    translationKey: "visaManager",
    icon: <FileText className="w-5 h-5" />,
    path: "/visa-manager",
    module: ModuleNameEnum.VISA_MANAGER,
  },
  {
    id: "sponsor-company",
    label: "Sponsor Company",
    translationKey: "sponsorCompany",
    icon: <FileText className="w-5 h-5" />,
    path: "/sponsor-company",
    // Final visibility is enforced by the shared role helper so sidebar config and route
    // protection stay in sync for HR Head / Account Head restrictions.
  },
  {
    id: "branches",
    label: "Branches",
    translationKey: "branches",
    icon: <Building2 className="w-5 h-5" />,
    path: "/branches",
    module: ModuleNameEnum.BRANCH,
  },


  {
    id: "payroll",
    label: "Payroll",
    translationKey: "payroll",
    path: "/payroll",
    icon: <Landmark className="h-5 w-5" />,
    module: ModuleNameEnum.PAYROLL,
  },
  {
    id: "advance-payroll",
    label: "Loan",
    translationKey: "advancePayroll",
    path: "/advances",
    icon: <Banknote className="h-5 w-5" />,
    module: ModuleNameEnum.ADVANCE,
  },
  // {
  //   id: "roles",
  //   label: "Roles",
  //   translationKey: "roles",
  //   icon: <Shield className="w-5 h-5" />,
  //   path: "/roles",
  //   module: ModuleNameEnum.ROLES,
  // },
    {
    id: "lot-master",
    label: "Lot Master",
    translationKey: "lotMaster",
     icon: <TrendingUp className="w-5 h-5" />,
 
    path: "/lot-master",
    module: ModuleNameEnum.LOT,
  },
  {
    id: "admin-users",
    label: "Admin Users",
    translationKey: "adminUsers",
    icon: <Package className="w-5 h-5" />,
    path: "/admin-users",
    module: ModuleNameEnum.USERS,
  },


  // {
  //   id: "employees",
  //   label: "Employees",
  //   translationKey: "employees",
  //   icon: <UserRound className="w-5 h-5" />,
  //   path: "/employees",
  // },
  // {
  //   id: "onboarding",
  //   label: "Onboarding & Visa",
  //   translationKey: "onboarding",
  //   icon: <Flag className="w-5 h-5" />,
  //   path: "/onboarding",
  // },

  // {
  //   id: "advance",
  //   label: "Advance Salary",
  //   translationKey: "advancesalary",
  //   path: "/advance-salary",
  //   icon: <Banknote className="h-5 w-5" />,
  // },
  // {
  //   id: "disbursement",
  //   label: "Disbursement",
  //   translationKey: "disbursement",
  //   path: "/disbursement",
  //   icon: <LucideDoorClosed className="h-5 w-5" />,
  // },
  // {
  //   id: "reports",
  //   label: "Reports",
  //   translationKey: "reports",
  //   path: "/reports",
  //   icon: <FileText className="h-5 w-5" />,
  // },
  // {
  //   id: "audit-logs",
  //   label: "Audit Logs",
  //   translationKey: "auditLogs",
  //   path: "/audit-logs",
  //   icon: <Clock className="h-5 w-5" />,
  // },
  // {
  //   id: "settings",
  //   label: "Settings",
  //   translationKey: "settings",
  //   path: "/settings",
  //   icon: <Settings className="h-5 w-5" />,
  // },
];
