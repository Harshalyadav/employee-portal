import {
  IRole,
  ModuleNameEnum,
  PermissionAction,
  IPermissionMatrix,
} from "@/types";
import { useMemo, useCallback } from "react";

/**
 * Permission hook that works with a provided role (not the current user's role)
 * Useful for displaying permissions of any role, like in role details pages
 *
 * @param role - The role to check permissions for
 *
 * @example
 * ```typescript
 * const permissions = usePermissions(role);
 * const canCreate = permissions.canCreate(ModuleNameEnum.USERS);
 * const accessLevel = permissions.getAccessLevel(ModuleNameEnum.PAYROLL);
 * ```
 */
export function usePermissions(role: IRole | null | undefined) {
  // Get permission matrix for a specific module
  const getModulePermissions = useCallback(
    (moduleName: ModuleNameEnum): IPermissionMatrix | undefined => {
      if (!role || !role.permissionMatrix) return undefined;
      return role.permissionMatrix.find((p) => p.moduleName === moduleName);
    },
    [role],
  );

  /**
   * Check if the role has a specific permission
   */
  const hasPermission = useCallback(
    (moduleName: ModuleNameEnum, operation: PermissionAction): boolean => {
      const modulePermissions = getModulePermissions(moduleName);
      if (!modulePermissions) return false;

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
    },
    [getModulePermissions],
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

  // Check if role has any permission for a module
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

  // Check if role has all specified permissions for a module
  const hasAllPermissions = useCallback(
    (moduleName: ModuleNameEnum, actions: PermissionAction[]): boolean => {
      return actions.every((action) => hasPermission(moduleName, action));
    },
    [hasPermission],
  );

  // Check if role has any of the specified permissions for a module
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

  // Get all modules the role can read
  const getReadableModules = useCallback((): ModuleNameEnum[] => {
    if (!role || !role.permissionMatrix) return [];
    return role.permissionMatrix.filter((p) => p.read).map((p) => p.moduleName);
  }, [role]);

  // Get all modules the role can create
  const getCreatableModules = useCallback((): ModuleNameEnum[] => {
    if (!role || !role.permissionMatrix) return [];
    return role.permissionMatrix
      .filter((p) => p.create)
      .map((p) => p.moduleName);
  }, [role]);

  // Get all modules the role can update
  const getUpdatableModules = useCallback((): ModuleNameEnum[] => {
    if (!role || !role.permissionMatrix) return [];
    return role.permissionMatrix
      .filter((p) => p.update)
      .map((p) => p.moduleName);
  }, [role]);

  // Get all modules the role can delete
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
