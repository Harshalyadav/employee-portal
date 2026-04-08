import { useAppStore } from "@/stores";
import {
  ModuleNameEnum,
  PermissionAction,
  IRole,
  IPermissionMatrix,
} from "@/types";
import { useMemo, useCallback } from "react";
import { getRoleBasedPermission } from "@/lib/admin-head-access";

/**
 * Context-aware permission hook that automatically uses the current user's role
 *
 * @example
 * ```typescript
 * const { hasPermission } = usePermission();
 *
 * if (hasPermission(ModuleNameEnum.USERS, PermissionAction.CREATE)) {
 *   // Show create user button
 * }
 *
 * if (hasPermission(ModuleNameEnum.PAYROLL, PermissionAction.UPDATE)) {
 *   // Allow payroll editing
 * }
 * ```
 */
export function usePermission() {
  const { user } = useAppStore();

  // Extract role from user - roleId can be either string or IRole object
  const role = useMemo<IRole | null>(() => {
    if (!user) {
      return null;
    }

    // Check if user.role is populated as an IRole object (priority check)
    if (user.role && typeof user.role === 'object' && 'permissionMatrix' in user.role) {
      return user.role as IRole;
    }

    // Check if roleId itself is an IRole object (backend might populate roleId instead of role)
    if (user.roleId && typeof user.roleId === 'object' && user.roleId !== null && 'permissionMatrix' in user.roleId) {
      return user.roleId as IRole;
    }

    // If neither role nor roleId are populated objects, check if we even have a roleId
    if (!user.roleId && !user.role) {
      return null;
    }

    return null;
  }, [user]);

  // Get permission matrix for a specific module
  const getModulePermissions = useCallback(
    (moduleName: ModuleNameEnum): IPermissionMatrix | undefined => {
      if (!role || !role.permissionMatrix) return undefined;
      return role.permissionMatrix.find((p) => p.moduleName === moduleName);
    },
    [role],
  );

  /**
   * Check if the current user has a specific permission
   * @param moduleName - The module to check permission for
   * @param operation - The operation/action to check (create, read, update, delete, approve, reject, export)
   * @returns true if the user has permission, false otherwise
   */
  const hasPermission = useCallback(
    (moduleName: ModuleNameEnum, operation: PermissionAction): boolean => {
      const modulePermissions = getModulePermissions(moduleName);
      const fallbackPermission = modulePermissions
        ? (() => {
            switch (operation) {
              case PermissionAction.CREATE:
                return modulePermissions.create;
              case PermissionAction.READ:
                return modulePermissions.read;
              case PermissionAction.UPDATE:
                return modulePermissions.update;
              case PermissionAction.DELETE:
                return modulePermissions.delete;
              case PermissionAction.APPROVE:
                return modulePermissions.approve;
              case PermissionAction.REJECT:
                return modulePermissions.reject;
              case PermissionAction.EXPORT:
                return modulePermissions.export;
              default:
                return false;
            }
          })()
        : false;

      return getRoleBasedPermission(user, moduleName, operation, fallbackPermission);
    },
    [getModulePermissions, user],
  );

  // Individual permission check methods
  const canCreate = useCallback(
    (moduleName: ModuleNameEnum): boolean => {
      return hasPermission(moduleName, PermissionAction.CREATE);
    },
    [hasPermission],
  );

  const canRead = useCallback(
    (moduleName: ModuleNameEnum): boolean => {
      return hasPermission(moduleName, PermissionAction.READ);
    },
    [hasPermission],
  );

  const canUpdate = useCallback(
    (moduleName: ModuleNameEnum): boolean => {
      return hasPermission(moduleName, PermissionAction.UPDATE);
    },
    [hasPermission],
  );

  const canDelete = useCallback(
    (moduleName: ModuleNameEnum): boolean => {
      return hasPermission(moduleName, PermissionAction.DELETE);
    },
    [hasPermission],
  );

  const canApprove = useCallback(
    (moduleName: ModuleNameEnum): boolean => {
      return hasPermission(moduleName, PermissionAction.APPROVE);
    },
    [hasPermission],
  );

  const canReject = useCallback(
    (moduleName: ModuleNameEnum): boolean => {
      return hasPermission(moduleName, PermissionAction.REJECT);
    },
    [hasPermission],
  );

  const canExport = useCallback(
    (moduleName: ModuleNameEnum): boolean => {
      return hasPermission(moduleName, PermissionAction.EXPORT);
    },
    [hasPermission],
  );

  // Check if user has any permission for a module
  const hasAnyPermission = useCallback(
    (moduleName: ModuleNameEnum): boolean => {
      const modulePermissions = getModulePermissions(moduleName);
      if (!modulePermissions) return false;

      return (
        modulePermissions.create ||
        modulePermissions.read ||
        modulePermissions.update ||
        modulePermissions.delete ||
        modulePermissions.approve ||
        modulePermissions.reject ||
        modulePermissions.export
      );
    },
    [getModulePermissions],
  );

  // Check if user has all specified permissions for a module
  const hasAllPermissions = useCallback(
    (moduleName: ModuleNameEnum, actions: PermissionAction[]): boolean => {
      return actions.every((action) => hasPermission(moduleName, action));
    },
    [hasPermission],
  );

  // Check if user has any of the specified permissions for a module
  const hasAnyOfPermissions = useCallback(
    (moduleName: ModuleNameEnum, actions: PermissionAction[]): boolean => {
      return actions.some((action) => hasPermission(moduleName, action));
    },
    [hasPermission],
  );

  // Get access level for a module
  const getAccessLevel = useCallback(
    (
      moduleName: ModuleNameEnum,
    ): "none" | "read-only" | "write" | "admin" | "full" => {
      const modulePermissions = getModulePermissions(moduleName);
      if (!modulePermissions) return "none";

      const hasRead = modulePermissions.read;
      const hasWrite = modulePermissions.create || modulePermissions.update;
      const hasDelete = modulePermissions.delete;
      const hasApprove = modulePermissions.approve || modulePermissions.reject;
      const hasExport = modulePermissions.export;

      // Full access: all permissions
      if (hasRead && hasWrite && hasDelete && hasApprove && hasExport) {
        return "full";
      }

      // Admin: read, write, delete, and approve
      if (hasRead && hasWrite && hasDelete && hasApprove) {
        return "admin";
      }

      // Write: read and write (create/update)
      if (hasRead && hasWrite) {
        return "write";
      }

      // Read-only: only read permission
      if (hasRead) {
        return "read-only";
      }

      return "none";
    },
    [getModulePermissions],
  );

  // Get all modules the user can read
  const getReadableModules = useCallback((): ModuleNameEnum[] => {
    if (!role || !role.permissionMatrix) return [];
    return role.permissionMatrix.filter((p) => p.read).map((p) => p.moduleName);
  }, [role]);

  // Get all modules the user can create
  const getCreatableModules = useCallback((): ModuleNameEnum[] => {
    if (!role || !role.permissionMatrix) return [];
    return role.permissionMatrix
      .filter((p) => p.create)
      .map((p) => p.moduleName);
  }, [role]);

  // Get all modules the user can update
  const getUpdatableModules = useCallback((): ModuleNameEnum[] => {
    if (!role || !role.permissionMatrix) return [];
    return role.permissionMatrix
      .filter((p) => p.update)
      .map((p) => p.moduleName);
  }, [role]);

  // Get all modules the user can delete
  const getDeletableModules = useCallback((): ModuleNameEnum[] => {
    if (!role || !role.permissionMatrix) return [];
    return role.permissionMatrix
      .filter((p) => p.delete)
      .map((p) => p.moduleName);
  }, [role]);

  return {
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canApprove,
    canReject,
    canExport,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyOfPermissions,
    getAccessLevel,
    getModulePermissions,
    getReadableModules,
    getCreatableModules,
    getUpdatableModules,
    getDeletableModules,
    isReady: !!role,
    role,
  };
}
