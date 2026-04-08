"use client";

import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/query/role.hook";

import { LoadingState } from "@/components/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Shield, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ModuleNameEnum } from "@/types";
import { usePermissions, usePermission } from "@/hooks";
import { ErrorAlert } from "@/components/ErrorAlert";

interface RoleDetailsPageProps {
  roleId: string;
}

const RoleDetailsPage = ({ roleId }: RoleDetailsPageProps) => {
  const router = useRouter();
  const { canRead, canUpdate } = usePermission();
  const { data: role, isLoading, error } = useRole(roleId);

  const permissions = usePermissions(role || undefined);

  // Check if user has READ permission
  if (!canRead(ModuleNameEnum.ROLES)) {
    return (
      <ErrorAlert
        isOpen={true}
        title="Access Denied"
        message="You do not have permission to view role details."
      />
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading role details..." size="lg" />;
  }

  if (error || !role) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">Failed to load role details</p>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleData = role;
  const permissionMatrix = roleData.permissionMatrix || [];
  const roleName = roleData.roleName;
  const roleType = roleData.roleType;
  const readableModules = permissions.getReadableModules();

  return (
    <div className="container mx-auto px-6 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{roleName}</CardTitle>
                <p className="text-muted-foreground mt-1">
                  {roleData.description || "No description"}
                </p>
              </div>
            </div>
            {canUpdate(ModuleNameEnum.ROLES) && (
              <Button onClick={() => router.push(`/roles/${roleId}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Role
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role Type</p>
                <Badge variant="secondary" className="mt-1">
                  {roleType === "emp" ? "Employee" : "Non-Employee"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-semibold">
                  {roleData.updatedAt
                    ? format(new Date(roleData.updatedAt), "dd MMM, yyyy")
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-semibold">
                  {roleData.createdAt
                    ? format(new Date(roleData.createdAt), "dd MMM, yyyy")
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <p className="text-sm text-muted-foreground">
            {permissionMatrix.length} module
            {permissionMatrix.length !== 1 ? "s" : ""} configured
          </p>
        </CardHeader>
        <CardContent>
          {permissionMatrix.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold min-w-[150px]">
                        Module
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">
                        Create
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">
                        Read
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">
                        Update
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">
                        Delete
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">
                        Approve
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">
                        Reject
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">
                        Export
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">
                        Access Level
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissionMatrix.map((perm: any, index: number) => {
                      const moduleName = perm.moduleName;
                      const accessLevel = permissions.getAccessLevel(
                        moduleName as ModuleNameEnum,
                      );

                      return (
                        <tr key={index} className="border-t hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium capitalize">
                            {moduleName}
                          </td>
                          <td className="text-center py-3 px-4">
                            {perm.create ? (
                              <Badge variant="success" className="w-16">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {perm.read ? (
                              <Badge variant="success" className="w-16">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {perm.update ? (
                              <Badge variant="success" className="w-16">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {perm.delete ? (
                              <Badge variant="destructive" className="w-16">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {perm.approve ? (
                              <Badge variant="success" className="w-16">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {perm.reject ? (
                              <Badge variant="warning" className="w-16">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {perm.export ? (
                              <Badge variant="info" className="w-16">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge
                              variant={
                                accessLevel === "full"
                                  ? "success"
                                  : accessLevel === "admin"
                                    ? "info"
                                    : accessLevel === "write"
                                      ? "warning"
                                      : accessLevel === "read-only"
                                        ? "secondary"
                                        : "secondary"
                              }
                            >
                              {accessLevel}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No permissions configured for this role</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Permission Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Accessible Modules</h4>
              <div className="flex flex-wrap gap-2">
                {readableModules.length > 0 ? (
                  readableModules.map((module: ModuleNameEnum) => (
                    <Badge key={module} variant="secondary">
                      {module}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No accessible modules
                  </span>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Creatable Modules</h4>
              <div className="flex flex-wrap gap-2">
                {permissions.getCreatableModules().length > 0 ? (
                  permissions
                    .getCreatableModules()
                    .map((module: ModuleNameEnum) => (
                      <Badge key={module} variant="success">
                        {module}
                      </Badge>
                    ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No create permissions
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleDetailsPage;
