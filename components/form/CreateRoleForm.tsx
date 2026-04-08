"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateRole } from "@/hooks/query/role.hook";
import { useInfinitePermissions } from "@/hooks/query/permission.hook";
import {
  createRoleSchema,
  type CreateRoleSchema,
  type CreateRoleDto,
  RoleTypeEnum,
  ModuleNameEnum,
} from "@/types";
import { ArrowLeft, Plus, Trash2, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { APP_ROUTE } from "@/routes";
import { ROLE_TEMPLATES } from "@/lib/role-templates";
import { Badge } from "@/components/ui/badge";

const ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "approve",
  "reject",
  "export",
] as const;

export function CreateRoleForm() {
  const router = useRouter();
  const { mutate: createRole, isPending } = useCreateRole();

  // Get available modules from enum
  const availableModules = useMemo(() => {
    return Object.values(ModuleNameEnum).map((module) => ({
      id: module,
      module: module,
    }));
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateRoleSchema>({
    resolver: zodResolver(createRoleSchema),
    mode: "onBlur",
    defaultValues: {
      roleName: "",
      description: "",
      roleType: RoleTypeEnum.EMPLOYEE,
      permissionMatrix: [],
    },
  });

  const [selectedPermissionId, setSelectedPermissionId] = useState<string>("");
  const [showTemplates, setShowTemplates] = useState(false);

  const loadTemplate = (templateKey: keyof typeof ROLE_TEMPLATES) => {
    const template = ROLE_TEMPLATES[templateKey];
    setValue("roleName", template.roleName);
    setValue("description", template.description || "");
    setValue("roleType", template.roleType);

    // Convert template permissions to form format
    const templatePermissions = template.permissionMatrix.map((perm) => ({
      moduleName: perm.moduleName,
      create: perm.create || false,
      read: perm.read || false,
      update: perm.update || false,
      delete: perm.delete || false,
      approve: perm.approve || false,
      reject: perm.reject || false,
      export: perm.export || false,
    }));

    setValue("permissionMatrix", templatePermissions as any);
    setShowTemplates(false);
    toast.success(`${template.roleName} template loaded`);
  };

  const onSubmit = (data: CreateRoleSchema) => {
    createRole(data, {
      onSuccess: () => {
        toast.success("Role created successfully");
        router.push(APP_ROUTE.ROLE.ALL.PATH);
      },
      onError: (err) => {
        const message = err?.response?.data?.message;

        if (message) {
          if (Array.isArray(message)) {
            toast.error(
              "Error creating role:\n" +
                message.map((msg) => `• ${msg}`).join("\n"),
            );
          } else {
            toast.error(`Error creating role: ${message}`);
          }
        }
      },
    });
  };

  const permissionMatrix = watch("permissionMatrix");

  const handleAddPermission = () => {
    if (!selectedPermissionId) return;

    const selectedPerm = availableModules.find(
      (p) => p.id === selectedPermissionId,
    );
    if (!selectedPerm) return;

    // Check if permission already exists
    const exists = permissionMatrix.some(
      (p) => p.moduleName === (selectedPermissionId as ModuleNameEnum),
    );
    if (exists) {
      alert("This permission has already been added");
      return;
    }

    const newPermission: CreateRoleSchema["permissionMatrix"][number] = {
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
    action: keyof Omit<
      CreateRoleSchema["permissionMatrix"][number],
      "moduleName"
    >,
    checked: boolean,
  ) => {
    const updated = [...permissionMatrix];
    updated[index] = { ...updated[index], [action]: checked };
    setValue("permissionMatrix", updated);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Role Templates Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quick Start with Templates</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <Copy className="w-4 h-4 mr-2" />
                {showTemplates ? "Hide" : "Show"} Templates
              </Button>
            </div>
          </CardHeader>
          {showTemplates && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(ROLE_TEMPLATES).map(([key, template]) => (
                  <Card
                    key={key}
                    className="border-2 hover:border-primary transition cursor-pointer"
                    onClick={() =>
                      loadTemplate(key as keyof typeof ROLE_TEMPLATES)
                    }
                  >
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">
                        {template.roleName}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge>{template.roleType}</Badge>
                        <span>{template.permissionMatrix.length} modules</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create New Role</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Role Details */}
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
                      {...register("roleName")}
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

              {/* Permission Matrix */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Permission Matrix</h3>
                  <span className="text-sm text-muted-foreground">
                    {permissionMatrix.length} module
                    {permissionMatrix.length !== 1 ? "s" : ""} configured
                  </span>
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
                  {isPending ? "Creating..." : "Create Role"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
