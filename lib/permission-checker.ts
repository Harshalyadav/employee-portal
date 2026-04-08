import {
    IRole,
    ModuleNameEnum,
    PermissionAction,
    IPermissionMatrix,
} from "@/types";

/**
 * Permission checker class for checking permissions on a role
 * Can be used directly without React hooks
 */
export class PermissionChecker {
    private role: IRole;

    constructor(role: IRole) {
        this.role = role;
    }

    /**
     * Get permission matrix for a specific module
     */
    private getModulePermissions(
        moduleName: ModuleNameEnum
    ): IPermissionMatrix | undefined {
        if (!this.role || !this.role.permissionMatrix) return undefined;
        return this.role.permissionMatrix.find((p) => p.moduleName === moduleName);
    }

    /**
     * Check if the role has a specific permission
     */
    hasPermission(moduleName: ModuleNameEnum, action: PermissionAction): boolean {
        const modulePermissions = this.getModulePermissions(moduleName);
        if (!modulePermissions) return false;

        switch (action) {
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
    }

    /**
     * Check if role can create in a module
     */
    canCreate(moduleName: ModuleNameEnum): boolean {
        return this.hasPermission(moduleName, PermissionAction.CREATE);
    }

    /**
     * Check if role can read in a module
     */
    canRead(moduleName: ModuleNameEnum): boolean {
        return this.hasPermission(moduleName, PermissionAction.READ);
    }

    /**
     * Check if role can update in a module
     */
    canUpdate(moduleName: ModuleNameEnum): boolean {
        return this.hasPermission(moduleName, PermissionAction.UPDATE);
    }

    /**
     * Check if role can delete in a module
     */
    canDelete(moduleName: ModuleNameEnum): boolean {
        return this.hasPermission(moduleName, PermissionAction.DELETE);
    }

    /**
     * Check if role can approve in a module
     */
    canApprove(moduleName: ModuleNameEnum): boolean {
        return this.hasPermission(moduleName, PermissionAction.APPROVE);
    }

    /**
     * Check if role can reject in a module
     */
    canReject(moduleName: ModuleNameEnum): boolean {
        return this.hasPermission(moduleName, PermissionAction.REJECT);
    }

    /**
     * Check if role can export in a module
     */
    canExport(moduleName: ModuleNameEnum): boolean {
        return this.hasPermission(moduleName, PermissionAction.EXPORT);
    }

    /**
     * Check if role has any permission for a module
     */
    hasAnyPermission(moduleName: ModuleNameEnum): boolean {
        const modulePermissions = this.getModulePermissions(moduleName);
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
    }

    /**
     * Check if role has all specified permissions for a module
     */
    hasAllPermissions(
        moduleName: ModuleNameEnum,
        actions: PermissionAction[]
    ): boolean {
        return actions.every((action) => this.hasPermission(moduleName, action));
    }

    /**
     * Check if role has any of the specified permissions for a module
     */
    hasAnyOfPermissions(
        moduleName: ModuleNameEnum,
        actions: PermissionAction[]
    ): boolean {
        return actions.some((action) => this.hasPermission(moduleName, action));
    }

    /**
     * Get access level for a module
     */
    getAccessLevel(
        moduleName: ModuleNameEnum
    ): "none" | "read-only" | "write" | "admin" | "full" {
        const modulePermissions = this.getModulePermissions(moduleName);
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
    }

    /**
     * Get all modules the role can read
     */
    getReadableModules(): ModuleNameEnum[] {
        if (!this.role || !this.role.permissionMatrix) return [];
        return this.role.permissionMatrix
            .filter((p) => p.read)
            .map((p) => p.moduleName);
    }

    /**
     * Get all modules the role can create
     */
    getCreatableModules(): ModuleNameEnum[] {
        if (!this.role || !this.role.permissionMatrix) return [];
        return this.role.permissionMatrix
            .filter((p) => p.create)
            .map((p) => p.moduleName);
    }

    /**
     * Get all modules the role can update
     */
    getUpdatableModules(): ModuleNameEnum[] {
        if (!this.role || !this.role.permissionMatrix) return [];
        return this.role.permissionMatrix
            .filter((p) => p.update)
            .map((p) => p.moduleName);
    }

    /**
     * Get all modules the role can delete
     */
    getDeletableModules(): ModuleNameEnum[] {
        if (!this.role || !this.role.permissionMatrix) return [];
        return this.role.permissionMatrix
            .filter((p) => p.delete)
            .map((p) => p.moduleName);
    }

    /**
     * Get the module permissions object
     */
    getModulePermissionsObject(moduleName: ModuleNameEnum): IPermissionMatrix | undefined {
        return this.getModulePermissions(moduleName);
    }
}
