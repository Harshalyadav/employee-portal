/**
 * Role & Permissions Integration Examples
 *
 * This file contains usage examples for the role and permission system
 */

import {
  usePermissions,
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
} from "@/hooks";
import {
  ModuleNameEnum,
  PermissionAction,
  RoleTypeEnum,
  ICreateRoleRequest,
} from "@/types";
import { PermissionChecker } from "@/lib/permission-checker";
import { ROLE_TEMPLATES } from "@/lib/role-templates";

// ============================================
// Example 1: Using Permission Checker in a Component
// ============================================

export function UserManagementExample() {
  // Assume you get the current user's role from auth context
  const userRole = null; // Replace with actual role from auth
  const {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExport,
    getAccessLevel,
  } = usePermissions(userRole);

  return (
    <div>
      {canCreate(ModuleNameEnum.USERS) && <button>Create User</button>}

      {canUpdate(ModuleNameEnum.USERS) && <button>Edit User</button>}

      {canDelete(ModuleNameEnum.USERS) && <button>Delete User</button>}

      {canExport(ModuleNameEnum.USERS) && <button>Export Users</button>}

      {/* Check access level */}
      {getAccessLevel(ModuleNameEnum.DOCUMENTS) === "full" && (
        <div>Admin Features for Documents</div>
      )}
    </div>
  );
}

// ============================================
// Example 2: Using Roles Hook
// ============================================

export function RoleListExample() {
  const { data: rolesData, isLoading, error } = useRoles(1, 10);

  if (isLoading) return <div>Loading roles...</div>;
  if (error) return <div>Error loading roles</div>;

  return (
    <div>
      <h2>Total Roles: {rolesData?.total}</h2>
      <ul>
        {rolesData?.data.map((role) => (
          <li key={role._id}>
            {role.roleName} - {role.roleType}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// Example 3: Creating a Role with Template
// ============================================

// export function CreateRoleExample() {
//   const { mutate: createRole, isPending } = useCreateRole();

//   const handleCreateAdminRole = () => {
//     createRole(ROLE_TEMPLATES.ADMIN, {
//       onSuccess: (data) => {
//         console.log("Role created:", data);
//       },
//       onError: (error) => {
//         console.error("Error creating role:", error);
//       },
//     });
//   };

//   const handleCreateCustomRole = () => {
//     const customRole: ICreateRoleRequest = {
//       roleName: "Custom Manager",
//       description: "Custom role for specific needs",
//       roleType: RoleTypeEnum.EMPLOYEE,
//       permissionMatrix: [
//         {
//           moduleName: ModuleNameEnum.USERS,
//           create: true,
//           read: true,
//           update: true,
//           delete: false,
//         },
//         {
//           moduleName: ModuleNameEnum.DOCUMENTS,
//           read: true,
//           approve: true,
//           reject: true,
//         },
//       ],
//     };

//     createRole(customRole);
//   };

//   return (
//     <div>
//       <button onClick={handleCreateAdminRole} disabled={isPending}>
//         Create Admin Role
//       </button>
//       <button onClick={handleCreateCustomRole} disabled={isPending}>
//         Create Custom Role
//       </button>
//     </div>
//   );
// }

// ============================================
// Example 4: Viewing Role Details
// ============================================

export function RoleDetailsExample({ roleId }: { roleId: string }) {
  const { data: role, isLoading } = useRole(roleId);
  const permissions = usePermissions(role ?? null);

  if (isLoading) return <div>Loading...</div>;
  if (!role) return <div>Role not found</div>;

  return (
    <div>
      <h2>{role.roleName}</h2>
      <p>{role.description}</p>
      <p>Type: {role.roleType}</p>

      <h3>Permissions:</h3>
      <ul>
        {role.permissionMatrix.map((perm) => (
          <li key={perm.moduleName}>
            <strong>{perm.moduleName}</strong>:{perm.create && " Create"}
            {perm.read && " Read"}
            {perm.update && " Update"}
            {perm.delete && " Delete"}
            {perm.approve && " Approve"}
            {perm.reject && " Reject"}
            {perm.export && " Export"}
          </li>
        ))}
      </ul>

      {/* Using permission checker */}
      <div>
        <h3>Can access modules:</h3>
        <ul>
          {permissions.getReadableModules().map((module) => (
            <li key={module}>{module}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================
// Example 5: Updating Role Permissions
// ============================================

export function UpdateRoleExample({ roleId }: { roleId: string }) {
  const { mutate: updateRole } = useUpdateRole();

  const handleUpdatePermissions = () => {
    updateRole({
      id: roleId,
      data: {
        permissionMatrix: [
          {
            moduleName: ModuleNameEnum.USERS,
            create: true,
            read: true,
            update: true,
            delete: true,
            approve: true,
            reject: false,
            export: true,
          },
        ],
      },
    });
  };

  return <button onClick={handleUpdatePermissions}>Update Permissions</button>;
}

// ============================================
// Example 6: Conditional Rendering Based on Multiple Permissions
// ============================================

export function DocumentManagementExample() {
  const userRole = null; // Replace with actual role
  const { hasAllPermissions, hasAnyOfPermissions } = usePermissions(userRole);

  // Check if user has all required permissions
  const canManageDocuments = hasAllPermissions(ModuleNameEnum.DOCUMENTS, [
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.DELETE,
  ]);

  // Check if user has any of the approval permissions
  const canReviewDocuments = hasAnyOfPermissions(ModuleNameEnum.DOCUMENTS, [
    PermissionAction.APPROVE,
    PermissionAction.REJECT,
  ]);

  return (
    <div>
      {canManageDocuments && <div>Full Document Management Panel</div>}

      {canReviewDocuments && <div>Document Review Panel</div>}
    </div>
  );
}

// ============================================
// Example 7: Filter Navigation Based on Permissions
// ============================================

export function NavigationExample() {
  const userRole = null; // Replace with actual role
  const { canRead, getReadableModules } = usePermissions(userRole);

  const navigationItems = [
    { label: "Users", module: ModuleNameEnum.USERS, path: "/users" },
    { label: "Company", module: ModuleNameEnum.COMPANY, path: "/company" },
    {
      label: "Documents",
      module: ModuleNameEnum.DOCUMENTS,
      path: "/documents",
    },
    { label: "Reports", module: ModuleNameEnum.REPORTS, path: "/reports" },
    { label: "Settings", module: ModuleNameEnum.SETTINGS, path: "/settings" },
  ];

  const allowedItems = navigationItems.filter((item) => canRead(item.module));

  return (
    <nav>
      {allowedItems.map((item) => (
        <a key={item.path} href={item.path}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}

// ============================================
// Example 8: Permission Checker Direct Usage
// ============================================

export function DirectPermissionCheckerExample() {
  // Direct usage without hook
  const role = null; // Get role from somewhere

  if (role) {
    const checker = new PermissionChecker(role);

    console.log("Can create users:", checker.canCreate(ModuleNameEnum.USERS));
    console.log("Readable modules:", checker.getReadableModules());
    console.log(
      "Access level for documents:",
      checker.getAccessLevel(ModuleNameEnum.DOCUMENTS),
    );
  }

  return null;
}
