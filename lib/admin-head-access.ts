import { ModuleNameEnum, PermissionAction } from "@/types/role.type";
import { User } from "@/types/user.type";

export type AdminHeadAccessRole =
  | "ACCOUNT_HEAD"
  | "HR_HEAD"
  | "VISA_HEAD"
  | "ACCOUNT_MANAGER"
  | "HR_MANAGER"
  | "VISA_MANAGER";

export type AdminHeadRole = "ACCOUNT_HEAD" | "HR_HEAD" | "VISA_HEAD";
export type AdminManagerRole = "ACCOUNT_MANAGER" | "HR_MANAGER" | "VISA_MANAGER";

const PRIVILEGED_ADMIN_ROLE_KEYS = new Set([
  "SYSTEM_ADMIN",
  "SUPERADMIN",
  "SUPER_ADMIN",
  "ADMINISTRATOR",
  "ADMIN",
]);

const TRANSFER_VIEW_ROLE_KEYS = new Set([
  "HR_HEAD",
  "HR_MANAGER",
  "BRANCH_MANAGER",
  ...PRIVILEGED_ADMIN_ROLE_KEYS,
]);

const TRANSFER_MANAGE_ROLE_KEYS = new Set([
  "HR_HEAD",
  "HR_MANAGER",
  ...PRIVILEGED_ADMIN_ROLE_KEYS,
]);

const HEAD_SIDEBAR_ITEMS: Record<AdminHeadRole, string[]> = {
  ACCOUNT_HEAD: ["dashboard", "branches", "payroll", "advance-payroll", "lot-master", "admin-users"],
  // HR Head can manage employees and branches, but sponsor-company is intentionally
  // excluded so the sidebar, route guard, and API guard all enforce the same restriction.
  HR_HEAD: ["dashboard", "users", "branches", "admin-users"],
  VISA_HEAD: ["dashboard", "branches", "visa-manager", "sponsor-company", "admin-users"],
};

const MANAGER_SIDEBAR_ITEMS: Record<AdminManagerRole, string[]> = {
  ACCOUNT_MANAGER: ["dashboard", "branches", "payroll", "advance-payroll", "lot-master"],
  HR_MANAGER: ["dashboard", "users", "branches", "sponsor-company"],
  VISA_MANAGER: ["dashboard", "branches", "visa-manager"],
};

const ADMIN_HEAD_MODULES: Record<AdminHeadAccessRole, ModuleNameEnum[]> = {
  ACCOUNT_HEAD: [ModuleNameEnum.USERS, ModuleNameEnum.BRANCH, ModuleNameEnum.PAYROLL, ModuleNameEnum.ADVANCE, ModuleNameEnum.LOT],
  HR_HEAD: [ModuleNameEnum.USERS, ModuleNameEnum.BRANCH],
  VISA_HEAD: [ModuleNameEnum.USERS, ModuleNameEnum.BRANCH, ModuleNameEnum.VISA_MANAGER],
  ACCOUNT_MANAGER: [ModuleNameEnum.BRANCH, ModuleNameEnum.PAYROLL, ModuleNameEnum.ADVANCE, ModuleNameEnum.LOT],
  HR_MANAGER: [ModuleNameEnum.USERS, ModuleNameEnum.BRANCH],
  VISA_MANAGER: [ModuleNameEnum.BRANCH, ModuleNameEnum.VISA_MANAGER],
};

const normalizeRoleKey = (value?: string | null) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const ROLE_OVERRIDE_MAP = (() => {
  const rawValue = process.env.NEXT_PUBLIC_MANAGER_ROLE_OVERRIDES || "";
  return rawValue
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, AdminHeadAccessRole>>((accumulator, entry) => {
      const [email, role] = entry.split(":").map((value) => value.trim());
      const normalizedRole = normalizeRoleKey(role) as AdminHeadAccessRole;

      if (
        email &&
        (normalizedRole === "ACCOUNT_HEAD" ||
          normalizedRole === "HR_HEAD" ||
          normalizedRole === "VISA_HEAD" ||
          normalizedRole === "ACCOUNT_MANAGER" ||
          normalizedRole === "HR_MANAGER" ||
          normalizedRole === "VISA_MANAGER")
      ) {
        accumulator[email.toLowerCase()] = normalizedRole;
      }

      return accumulator;
    }, {});
})();

export const getResolvedRoleName = (user?: User | null) => {
  if (!user) {
    return "";
  }

  const normalizedEmail = String((user as any)?.email || "").trim().toLowerCase();
  const overriddenRole = normalizedEmail ? ROLE_OVERRIDE_MAP[normalizedEmail] : undefined;

  if (overriddenRole) {
    return overriddenRole;
  }

  if (user.role?.roleName) {
    return user.role.roleName;
  }

  if (user.roleId && typeof user.roleId === "object" && "roleName" in user.roleId) {
    return user.roleId.roleName || "";
  }

  const designation = (user as any)?.permissions?.designation;

  if (typeof designation === "string") {
    return designation;
  }

  if (designation && typeof designation === "object") {
    return designation.roleName || designation.name || designation.id || "";
  }

  if (typeof user.roleId === "string") {
    return user.roleId;
  }

  return "";
};

export const getNormalizedAccessRoleKey = (user?: User | null) => normalizeRoleKey(getResolvedRoleName(user));

export const isPrivilegedAdminUser = (user?: User | null) => {
  const normalizedRole = getNormalizedAccessRoleKey(user);
  return PRIVILEGED_ADMIN_ROLE_KEYS.has(normalizedRole);
};

export const canViewTransferRequests = (user?: User | null) => {
  const normalizedRole = getNormalizedAccessRoleKey(user);
  return TRANSFER_VIEW_ROLE_KEYS.has(normalizedRole);
};

export const canManageTransferRequests = (user?: User | null) => {
  const normalizedRole = getNormalizedAccessRoleKey(user);
  return TRANSFER_MANAGE_ROLE_KEYS.has(normalizedRole);
};

export const getAdminHeadAccessRole = (user?: User | null): AdminHeadAccessRole | null => {
  if (isPrivilegedAdminUser(user)) {
    return null;
  }

  const normalizedRole = getNormalizedAccessRoleKey(user);

  if (
    normalizedRole === "ACCOUNT_HEAD" ||
    normalizedRole === "HR_HEAD" ||
    normalizedRole === "VISA_HEAD" ||
    normalizedRole === "ACCOUNT_MANAGER" ||
    normalizedRole === "HR_MANAGER" ||
    normalizedRole === "VISA_MANAGER"
  ) {
    return normalizedRole;
  }

  return null;
};

export const isHeadAccessRole = (role: AdminHeadAccessRole | null): role is AdminHeadRole => {
  return role === "HR_HEAD" || role === "VISA_HEAD" || role === "ACCOUNT_HEAD";
};

export const isManagerAccessRole = (role: AdminHeadAccessRole | null): role is AdminManagerRole => {
  return role === "HR_MANAGER" || role === "VISA_MANAGER" || role === "ACCOUNT_MANAGER";
};

export const getAllowedModulesForAdminHead = (user?: User | null): ModuleNameEnum[] | null => {
  const role = getAdminHeadAccessRole(user);
  return role ? ADMIN_HEAD_MODULES[role] : null;
};

export const canAccessAdminUsers = (user: User | null | undefined) => {
  const role = getAdminHeadAccessRole(user);

  if (!role) {
    return true;
  }

  return isHeadAccessRole(role);
};

export const canAccessSidebarItemByRole = (user: User | null | undefined, itemId?: string | null) => {
  const role = getAdminHeadAccessRole(user);

  if (!role || !itemId) {
    return true;
  }

  if (itemId === "admin-users") {
    return isHeadAccessRole(role);
  }

  if (isHeadAccessRole(role)) {
    return HEAD_SIDEBAR_ITEMS[role].includes(itemId);
  }

  if (isManagerAccessRole(role)) {
    return MANAGER_SIDEBAR_ITEMS[role].includes(itemId);
  }

  return true;
};

export const getDefaultDashboardPathForUser = (_user?: User | null) => "/";

export const canAccessPathByRole = (user: User | null | undefined, pathname?: string | null) => {
  const role = getAdminHeadAccessRole(user);
  const normalizedPath = pathname || "/";

  if (!role) {
    return true;
  }

  if (normalizedPath === "/" || normalizedPath.startsWith("/profile")) {
    return true;
  }

  if (
    normalizedPath.startsWith("/branches/new") &&
    (role === "HR_HEAD" || role === "VISA_HEAD" || role === "ACCOUNT_HEAD")
  ) {
    return false;
  }

  if (role === "ACCOUNT_HEAD") {
    return ["/branches", "/admin-users", "/payroll", "/advances", "/lot-master"].some((prefix) => normalizedPath.startsWith(prefix));
  }

  if (role === "ACCOUNT_MANAGER") {
    return ["/branches", "/payroll", "/advances", "/lot-master"].some((prefix) => normalizedPath.startsWith(prefix));
  }

  if (role === "HR_HEAD") {
    // HR Head must not reach sponsor-company via URL, even if a direct navigation or stale link is used.
    return ["/users", "/branches", "/admin-users"].some((prefix) => normalizedPath.startsWith(prefix));
  }

  if (role === "HR_MANAGER") {
    return ["/users", "/branches", "/sponsor-company"].some((prefix) => normalizedPath.startsWith(prefix));
  }

  if (role === "VISA_HEAD") {
    return ["/branches", "/visa-manager", "/admin-users", "/sponsor-company"].some((prefix) => normalizedPath.startsWith(prefix));
  }

  if (role === "VISA_MANAGER") {
    return ["/branches", "/visa-manager"].some((prefix) => normalizedPath.startsWith(prefix));
  }

  return true;
};

export const getRoleBasedPermission = (
  user: User | null | undefined,
  moduleName: ModuleNameEnum,
  action: PermissionAction,
  fallbackPermission: boolean,
) => {
  if (isPrivilegedAdminUser(user)) {
    return true;
  }

  const role = getAdminHeadAccessRole(user);

  if (!role) {
    return fallbackPermission;
  }

  const allowedModules = ADMIN_HEAD_MODULES[role];
  if (!allowedModules.includes(moduleName)) {
    return false;
  }

  if (
    moduleName === ModuleNameEnum.BRANCH &&
    action === PermissionAction.CREATE &&
    (role === "HR_HEAD" || role === "VISA_HEAD" || role === "ACCOUNT_HEAD")
  ) {
    return false;
  }

  if (
    moduleName === ModuleNameEnum.USERS &&
    action === PermissionAction.DELETE &&
    (role === "HR_HEAD" || role === "ACCOUNT_HEAD")
  ) {
    // Employee deletion stays reserved for admin-level roles; HR Head / Account Head may
    // still read the employee list, but they cannot delete records from the UI or API proxy.
    return false;
  }

  if (
    moduleName === ModuleNameEnum.USERS &&
    (action === PermissionAction.CREATE || action === PermissionAction.UPDATE) &&
    (role === "HR_HEAD" || role === "VISA_HEAD" || role === "ACCOUNT_HEAD")
  ) {
    return true;
  }

  if (action === PermissionAction.READ) {
    return true;
  }

  return fallbackPermission;
};