"use client";

import { LoadingState } from "@/components/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRole, useUpdateRole } from "@/hooks/query/role.hook";
import { APP_ROUTE } from "@/routes";
import { ModuleNameEnum, RoleTypeEnum } from "@/types";
import { ArrowLeft, Plus, Shield, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

const ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "approve",
  "reject",
  "export",
] as const;

type PermissionMatrixItem = {
  moduleName: ModuleNameEnum;
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
  approve?: boolean;
  reject?: boolean;
  export?: boolean;
};

type FormValues = {
  roleName: string;
  description?: string;
  roleType: RoleTypeEnum;
  permissionMatrix: PermissionMatrixItem[];
};

interface EditRoleFormProps {
  roleId: string;
}

export function EditRoleForm({ roleId }: EditRoleFormProps) {
  const router = useRouter();
  const { data: role, isLoading } = useRole(roleId);
  const { mutate: updateRole, isPending } = useUpdateRole();

  // Get available modules from enum
  const availableModules = useMemo(() => {
    return Object.values(ModuleNameEnum).map((module) => ({
      id: module,
      module: module,
    }));
  }, []);

  const [selectedPermissionId, setSelectedPermissionId] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      roleName: "",
      description: "",
      roleType: RoleTypeEnum.EMPLOYEE,
      permissionMatrix: [],
    },
  });

  useEffect(() => {
    if (role) {
      const roleData = role as any;
      console.log("Role data received:", roleData);
      console.log("Role type from backend:", roleData.roleType);

      // Map backend roleType to enum value
      let roleTypeValue = RoleTypeEnum.EMPLOYEE;

      if (roleData.roleType) {
        const roleTypeStr = String(roleData.roleType).toLowerCase();
        console.log("Role type string:", roleTypeStr);

        if (roleTypeStr === "emp" || roleTypeStr === "employee") {
          roleTypeValue = RoleTypeEnum.EMPLOYEE;
        } else if (
          roleTypeStr === "non-emp" ||
          roleTypeStr === "non_employee" ||
          roleTypeStr === "non-employee"
        ) {
          roleTypeValue = RoleTypeEnum.NON_EMPLOYEE;
        } else if (
          Object.values(RoleTypeEnum).includes(
            roleData.roleType as RoleTypeEnum,
          )
        ) {
          roleTypeValue = roleData.roleType as RoleTypeEnum;
        }
      }

      console.log("Mapped role type value:", roleTypeValue);

      reset({
        roleName: roleData.roleName || "",
        description: roleData.description || "",
        roleType: roleTypeValue,
        permissionMatrix: (roleData.permissionMatrix || []).map(
          (perm: any) => ({
            moduleName: perm.moduleName,
            create: perm.create || false,
            read: perm.read || false,
            update: perm.update || false,
            delete: perm.delete || false,
            approve: perm.approve || false,
            reject: perm.reject || false,
            export: perm.export || false,
          }),
        ) as any,
      });

      // Explicitly set roleType to ensure Select component syncs properly
      setValue("roleType", roleTypeValue, {
        shouldValidate: false,
        shouldDirty: false,
      });

      console.log("RoleType after setValue:", roleTypeValue);
    }
  }, [role, reset, setValue, watch]);

  const permissionMatrix = watch("permissionMatrix");

  const handleAddPermission = () => {
    if (!selectedPermissionId) return;

    const selectedPerm = availableModules.find(
      (p) => p.id === selectedPermissionId,
    );
    if (!selectedPerm) return;

    const exists = permissionMatrix.some(
      (p) => p.moduleName === (selectedPermissionId as ModuleNameEnum),
    );
    if (exists) {
      alert("This permission has already been added");
      return;
    }

    const newPermission: FormValues["permissionMatrix"][number] = {
      moduleName: selectedPerm.id as ModuleNameEnum,
      create: false,
      read: false,
      update: false,
      delete: false,
      approve: false,
      reject: false,
      export: false,
    };

    setValue("permissionMatrix", [...permissionMatrix, newPermission]);
    setSelectedPermissionId("");
  };

  const handleRemovePermission = (index: number) => {
    const updated = permissionMatrix.filter((_, i) => i !== index);
    setValue("permissionMatrix", updated);
  };

  const handleActionChange = (
    index: number,
    action: keyof Omit<FormValues["permissionMatrix"][number], "moduleName">,
    checked: boolean,
  ) => {
    const updated = [...permissionMatrix];
    updated[index] = { ...updated[index], [action]: checked };
    setValue("permissionMatrix", updated);
  };

  const onSubmit = (data: FormValues) => {
    updateRole(
      { id: roleId, data },
      {
        onSuccess: () => router.push(APP_ROUTE.ROLE.ALL.PATH),
      },
    );
  };

  if (isLoading) {
    return <LoadingState message="Loading role data..." size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                <CardTitle>Edit Role</CardTitle>
              </div>
              {role?.roleType && (
                <Badge variant="secondary">
                  {role.roleType === "emp"
                    ? "Employee Role"
                    : "Non-Employee Role"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Role Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Role Name *
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="Enter role name"
                      {...register("roleName", {
                        required: "Role name is required",
                      })}
                    />
                    {errors.roleName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.roleName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Role Type *
                    </label>
                    {/* Hidden input to register roleType with react-hook-form */}
                    <input
                      type="hidden"
                      {...register("roleType", {
                        required: "Role type is required",
                      })}
                    />
                    <Select
                      key={`roleType-${watch("roleType")}`}
                      value={watch("roleType") || RoleTypeEnum.EMPLOYEE}
                      onValueChange={(value) =>
                        setValue("roleType", value as RoleTypeEnum, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={RoleTypeEnum.EMPLOYEE}>
                          Employee
                        </SelectItem>
                        <SelectItem value={RoleTypeEnum.NON_EMPLOYEE}>
                          Non-Employee
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.roleType && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.roleType.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-md border px-3 py-2 bg-background"
                    placeholder="Role description"
                    rows={3}
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Permissions</h3>
                </div>

                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <Select
                      value={selectedPermissionId}
                      onValueChange={setSelectedPermissionId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select permission to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModules.map((perm) => (
                          <SelectItem key={perm.id} value={perm.id}>
                            {perm.module.charAt(0).toUpperCase() +
                              perm.module.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddPermission}
                    disabled={!selectedPermissionId}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Permission
                  </Button>
                </div>

                {permissionMatrix.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold">
                            Permission
                          </th>
                          {ACTIONS.map((action) => (
                            <th
                              key={action}
                              className="text-center py-3 px-4 font-semibold text-sm"
                            >
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </th>
                          ))}
                          <th className="text-center py-3 px-4 font-semibold">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissionMatrix.map((perm, idx) => (
                          <tr key={perm.moduleName} className="border-t">
                            <td className="py-3 px-4 font-medium">
                              {perm.moduleName.charAt(0).toUpperCase() +
                                perm.moduleName.slice(1)}
                            </td>
                            {ACTIONS.map((action) => (
                              <td
                                key={`${perm.moduleName}-${action}`}
                                className="text-center py-3 px-4"
                              >
                                <input
                                  type="checkbox"
                                  checked={perm[action] || false}
                                  onChange={(e) =>
                                    handleActionChange(
                                      idx,
                                      action,
                                      e.target.checked,
                                    )
                                  }
                                  className="rounded"
                                />
                              </td>
                            ))}
                            <td className="text-center py-3 px-4">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePermission(idx)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {permissionMatrix.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    No permissions added yet. Select a permission from the
                    dropdown above.
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-end pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Updating..." : "Update Role"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
